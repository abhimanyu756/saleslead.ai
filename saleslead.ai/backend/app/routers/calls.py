"""Call endpoints + WhatsApp click-tracking."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Call, Lead, WhatsAppMessage
from app.schemas import CallOut, ClickTrack

router = APIRouter(prefix="/calls", tags=["calls"])


async def _load_call(call_id: str, db: AsyncSession) -> Call:
    result = await db.execute(
        select(Call)
        .options(
            selectinload(Call.score),
            selectinload(Call.objections),
            selectinload(Call.whatsapp),
        )
        .where(Call.id == call_id)
    )
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(404, "Call not found")
    return call


@router.get("/", response_model=list[CallOut])
async def list_calls(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Call)
        .options(
            selectinload(Call.score),
            selectinload(Call.objections),
            selectinload(Call.whatsapp),
        )
        .order_by(Call.started_at.desc())
    )
    return result.scalars().all()


@router.get("/{call_id}", response_model=CallOut)
async def get_call(call_id: str, db: AsyncSession = Depends(get_db)):
    return await _load_call(call_id, db)


@router.post("/track-click", response_model=dict)
async def track_whatsapp_click(body: ClickTrack, db: AsyncSession = Depends(get_db)):
    """Called when the lead clicks the WhatsApp sign-up link."""
    result = await db.execute(
        select(WhatsAppMessage)
        .join(Call)
        .join(Lead)
        .where(Lead.id == body.lead_id)
        .order_by(WhatsAppMessage.sent_at.desc())
    )
    wa = result.scalar_one_or_none()
    if not wa:
        raise HTTPException(404, "No WhatsApp message found for this lead")
    if not wa.clicked_at:
        wa.clicked_at = datetime.now(timezone.utc)
        await db.commit()
    return {"status": "recorded"}
