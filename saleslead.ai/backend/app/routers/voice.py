"""ElevenLabs integration endpoints.

Two webhooks:
  POST /voice/llm   — custom LLM hook, called by ElevenLabs mid-call
  POST /voice/post-call — called by ElevenLabs when call ends (HMAC-signed)
"""

import hashlib
import hmac
import json
import logging
import time
from datetime import datetime, timezone

import google.generativeai as genai
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Call, Lead
from app.prompts.system_prompt import build_system_prompt
from app.schemas import ElevenLabsLLMRequest
from app.workers.tasks import process_call

router = APIRouter(prefix="/voice", tags=["voice"])
log = logging.getLogger("uvicorn.error")

genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-2.5-flash")


def _verify_elevenlabs_signature(body: bytes, signature_header: str, secret: str, max_age_s: int = 1800) -> bool:
    """Verify ElevenLabs HMAC-SHA256 signature.
    Header format: 't=<unix_ts>,v0=<hex_signature>'
    Signed payload: '<unix_ts>.<raw_body>'
    """
    try:
        parts = dict(p.split("=", 1) for p in signature_header.split(","))
        ts = int(parts["t"])
        sig = parts["v0"]
    except (ValueError, KeyError):
        return False
    if abs(time.time() - ts) > max_age_s:
        log.warning(f"[post-call] signature timestamp out of window: {ts}")
        return False
    expected = hmac.new(
        secret.encode(),
        f"{ts}.{body.decode()}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, sig)


@router.post("/llm")
async def elevenlabs_llm_hook(body: ElevenLabsLLMRequest, db: AsyncSession = Depends(get_db)):
    """
    ElevenLabs calls this endpoint instead of Gemini directly.
    We receive the conversation history and stream back the agent's reply.
    """
    lead_name = body.lead_name or "there"
    language = body.language or "Hindi"

    broker = None
    prior_summary = None
    prior_objections = None
    prior_classification = None

    if body.lead_id:
        result = await db.execute(select(Lead).where(Lead.id == body.lead_id))
        lead = result.scalar_one_or_none()
        if lead:
            broker = lead.broker_affiliation
            # Fetch most recent processed call for multi-turn memory
            from sqlalchemy.orm import selectinload
            prior_result = await db.execute(
                select(Call)
                .options(selectinload(Call.objections))
                .where(Call.lead_id == body.lead_id, Call.processed == True)
                .order_by(Call.started_at.desc())
            )
            prior_call = prior_result.scalars().first()
            if prior_call:
                prior_summary = prior_call.summary
                prior_objections = [o.type for o in prior_call.objections]
                prior_classification = prior_call.classification

    system_prompt = build_system_prompt(
        lead_name, language, broker,
        prior_call_summary=prior_summary,
        prior_objections=prior_objections,
        prior_classification=prior_classification,
    )

    # Build Gemini chat history
    history = []
    for t in body.history[:-1]:
        history.append({
            "role": "user" if t.role == "user" else "model",
            "parts": [t.message],
        })

    last_message = body.history[-1].message if body.history else ""
    if not last_message:
        raise HTTPException(400, "Empty history")

    def generate():
        chat = _model.start_chat(history=history)
        full_prompt = f"{system_prompt}\n\n{last_message}"
        response = chat.send_message(full_prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text

    return StreamingResponse(generate(), media_type="text/plain")


@router.post("/post-call")
async def post_call_webhook(
    req: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """ElevenLabs sends this after the call ends.
    Payload is HMAC-signed and wraps actual data under `data`."""
    raw = await req.body()

    # Verify HMAC signature
    if settings.ELEVENLABS_WEBHOOK_SECRET:
        sig = req.headers.get("ElevenLabs-Signature") or req.headers.get("elevenlabs-signature") or ""
        if not _verify_elevenlabs_signature(raw, sig, settings.ELEVENLABS_WEBHOOK_SECRET):
            log.warning("[post-call] HMAC signature invalid, rejecting")
            raise HTTPException(401, "Invalid signature")

    # Parse ElevenLabs payload (data is nested under `data`)
    try:
        envelope = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON")
    data = envelope.get("data", envelope)  # tolerate either nested or flat

    conversation_id = data.get("conversation_id")
    metadata = data.get("metadata", {}) or {}
    transcript_raw = data.get("transcript", []) or []

    log.info(f"[post-call] received conversation_id={conversation_id} turns={len(transcript_raw)}")

    # ElevenLabs may pass our identifiers in several places depending on API version
    cicd = data.get("conversation_initiation_client_data") or {}
    dyn = cicd.get("dynamic_variables") or data.get("dynamic_variables") or {}
    cicd_meta = cicd.get("metadata") or {}
    analysis = data.get("analysis") or {}
    analysis_data = analysis.get("data_collection_results") or {}

    lead_id = (
        metadata.get("lead_id")
        or cicd_meta.get("lead_id")
        or dyn.get("lead_id")
        or analysis_data.get("lead_id")
    )
    if not lead_id:
        # Dump full envelope so we can see the actual shape ElevenLabs is sending
        log.warning(f"[post-call] lead_id missing — full envelope: {json.dumps(envelope)[:2000]}")
        raise HTTPException(400, "lead_id missing in metadata")

    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")

    transcript = [
        {
            "speaker": "agent" if t.get("role") == "agent" else "lead",
            "text": t.get("message") or t.get("text", ""),
            "timestamp": "",
        }
        for t in transcript_raw
    ]

    call = Call(
        lead_id=lead_id,
        elevenlabs_conversation_id=conversation_id,
        ended_at=datetime.now(timezone.utc),
        transcript=transcript,
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    log.info(f"[post-call] saved call {call.id}, enqueueing for processing")
    background_tasks.add_task(_enqueue_processing, call.id)
    return {"call_id": call.id, "status": "queued"}


def _enqueue_processing(call_id: str) -> None:
    from redis import Redis
    from rq import Queue

    q = Queue(connection=Redis.from_url(settings.REDIS_URL))
    q.enqueue(process_call, call_id)
