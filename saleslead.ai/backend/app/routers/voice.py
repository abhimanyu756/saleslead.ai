"""ElevenLabs integration endpoints.

Two webhooks:
  POST /voice/llm   — custom LLM hook, called by ElevenLabs mid-call
  POST /voice/post-call — called by ElevenLabs when call ends (HMAC-signed)
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

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
    if not signature_header:
        log.warning("[post-call] no signature header in request")
        return False
    try:
        parts = dict(p.split("=", 1) for p in signature_header.split(","))
        ts = int(parts["t"])
        sig = parts["v0"]
    except (ValueError, KeyError):
        log.warning(f"[post-call] malformed signature header: {signature_header[:80]!r}")
        return False
    if abs(time.time() - ts) > max_age_s:
        log.warning(f"[post-call] signature timestamp out of window: {ts}")
        return False
    expected = hmac.new(
        secret.encode(),
        f"{ts}.{body.decode()}".encode(),
        hashlib.sha256,
    ).hexdigest()
    ok = hmac.compare_digest(expected, sig)
    if not ok:
        log.warning(
            f"[post-call] HMAC mismatch | secret_len={len(secret)} secret_start={secret[:6]!r} | "
            f"got_sig={sig[:16]}... expected={expected[:16]}... | ts={ts} body_len={len(body)}"
        )
    return ok


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

    event_type = envelope.get("type", "")
    data = envelope.get("data", envelope)
    conversation_id = data.get("conversation_id")

    # ElevenLabs sends TWO webhooks per call: transcription + audio.
    # Handle the audio one separately — match Call by conversation_id and save mp3 file.
    if event_type == "post_call_audio":
        b64 = data.get("full_audio")
        if not b64 or not conversation_id:
            log.info("[post-call/audio] missing audio or conversation_id, skipping")
            return {"status": "ignored", "reason": "audio webhook missing fields"}

        AUDIO_DIR = Path("/app/audio_files")
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        try:
            audio_bytes = base64.b64decode(b64)
        except Exception as e:
            log.warning(f"[post-call/audio] base64 decode failed: {e}")
            return {"status": "ignored", "reason": "decode failed"}

        filename = f"{conversation_id}.mp3"
        filepath = AUDIO_DIR / filename
        filepath.write_bytes(audio_bytes)

        # Attach to existing Call (transcription webhook usually arrives first)
        result = await db.execute(
            select(Call).where(Call.elevenlabs_conversation_id == conversation_id)
        )
        call = result.scalar_one_or_none()
        if call:
            call.audio_path = f"/audio/{filename}"
            await db.commit()
            log.info(f"[post-call/audio] saved {len(audio_bytes)} bytes for call {call.id}")
        else:
            log.info(f"[post-call/audio] call not yet saved for {conversation_id}, audio file exists at {filepath}")
        return {"status": "ok", "audio_path": f"/audio/{filename}"}

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

    # Compute call duration. ElevenLabs gives us either:
    #   - data.metadata.call_duration_secs (preferred, exact)
    #   - data.metadata.start_time_unix_secs + envelope.event_timestamp (fallback)
    duration_s = int(metadata.get("call_duration_secs") or 0)
    if not duration_s:
        start_ts = metadata.get("start_time_unix_secs")
        end_ts = envelope.get("event_timestamp") or int(time.time())
        if start_ts:
            duration_s = max(0, int(end_ts) - int(start_ts))

    # Compute started_at and ended_at from the same data so the dashboard timeline is accurate
    start_ts = metadata.get("start_time_unix_secs")
    if start_ts:
        started_at = datetime.fromtimestamp(int(start_ts), tz=timezone.utc)
    else:
        started_at = datetime.now(timezone.utc) - timedelta(seconds=duration_s)
    ended_at = started_at + timedelta(seconds=duration_s) if duration_s else datetime.now(timezone.utc)

    # Check if audio already arrived (rare, but possible)
    audio_filename = f"{conversation_id}.mp3"
    audio_path = (
        f"/audio/{audio_filename}"
        if (Path("/app/audio_files") / audio_filename).exists()
        else None
    )

    call = Call(
        lead_id=lead_id,
        elevenlabs_conversation_id=conversation_id,
        started_at=started_at,
        ended_at=ended_at,
        duration_s=duration_s,
        transcript=transcript,
        audio_path=audio_path,
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    log.info(f"[post-call] saved call {call.id} ({duration_s}s), enqueueing for processing")
    background_tasks.add_task(_enqueue_processing, call.id)
    return {"call_id": call.id, "status": "queued"}


def _enqueue_processing(call_id: str) -> None:
    from redis import Redis
    from rq import Queue

    q = Queue(connection=Redis.from_url(settings.REDIS_URL))
    q.enqueue(process_call, call_id)
