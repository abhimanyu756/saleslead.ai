"""ElevenLabs integration endpoints.

Two webhooks:
  POST /voice/llm   — custom LLM hook, called by ElevenLabs mid-call
  POST /voice/post-call — called by ElevenLabs when call ends
"""

from datetime import datetime, timezone

import google.generativeai as genai
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Call, Lead
from app.prompts.system_prompt import build_system_prompt
from app.schemas import ElevenLabsLLMRequest, ElevenLabsPostCallWebhook
from app.workers.tasks import process_call

router = APIRouter(prefix="/voice", tags=["voice"])

genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-1.5-flash")


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
    body: ElevenLabsPostCallWebhook,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """ElevenLabs sends this after the call ends."""
    lead_id = body.metadata.get("lead_id")
    if not lead_id:
        raise HTTPException(400, "lead_id missing in metadata")

    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")

    transcript = [
        {"speaker": "agent" if t.role == "agent" else "lead", "text": t.message, "timestamp": ""}
        for t in body.transcript
    ]

    call = Call(
        lead_id=lead_id,
        elevenlabs_conversation_id=body.conversation_id,
        ended_at=datetime.now(timezone.utc),
        transcript=transcript,
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    background_tasks.add_task(_enqueue_processing, call.id)
    return {"call_id": call.id, "status": "queued"}


def _enqueue_processing(call_id: str) -> None:
    from redis import Redis
    from rq import Queue

    q = Queue(connection=Redis.from_url(settings.REDIS_URL))
    q.enqueue(process_call, call_id)
