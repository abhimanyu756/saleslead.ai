"""ElevenLabs integration endpoints.

Two webhooks:
  POST /voice/llm   — custom LLM hook, called by ElevenLabs mid-call
  POST /voice/post-call — called by ElevenLabs when call ends
"""

import json
from datetime import datetime, timezone

import anthropic
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

_anthropic = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


@router.post("/llm")
async def elevenlabs_llm_hook(body: ElevenLabsLLMRequest, db: AsyncSession = Depends(get_db)):
    """
    ElevenLabs calls this endpoint instead of Claude directly.
    We receive the conversation history and stream back the agent's reply.
    """
    lead_name = body.lead_name or "there"
    language = body.language or "Hindi"

    # Fetch broker affiliation if lead_id is known
    broker = None
    if body.lead_id:
        result = await db.execute(select(Lead).where(Lead.id == body.lead_id))
        lead = result.scalar_one_or_none()
        if lead:
            broker = lead.broker_affiliation

    system_prompt = build_system_prompt(lead_name, language, broker)

    messages = [
        {"role": "user" if t.role == "user" else "assistant", "content": t.message}
        for t in body.history
    ]
    # ElevenLabs expects the last message from the user
    if not messages or messages[-1]["role"] != "user":
        raise HTTPException(400, "Last history turn must be from user")

    def generate():
        with _anthropic.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=200,
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                yield text

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

    # Convert ElevenLabs transcript format to our internal format
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
