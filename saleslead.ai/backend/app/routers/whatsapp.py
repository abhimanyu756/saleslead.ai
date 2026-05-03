"""Meta WhatsApp Cloud API webhook for delivery/read/reply status."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models import Call, Lead, WhatsAppMessage

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


@router.get("/webhook")
async def verify(
    mode: str = Query(..., alias="hub.mode"),
    token: str = Query(..., alias="hub.verify_token"),
    challenge: str = Query(..., alias="hub.challenge"),
):
    """Meta calls this once to verify webhook ownership."""
    if mode == "subscribe" and token == settings.META_VERIFY_TOKEN:
        return int(challenge)
    return {"error": "verify token mismatch"}


@router.post("/webhook")
async def receive(req: Request, db: AsyncSession = Depends(get_db)):
    """Meta calls this whenever a status changes (sent/delivered/read/failed)
    or when a user sends an inbound message to our WhatsApp number."""
    body = await req.json()
    now = datetime.now(timezone.utc)

    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})

            # ── Status updates: sent / delivered / read / failed ──────────────
            for status in value.get("statuses", []):
                wa_id = status.get("id")
                state = status.get("status")
                if not wa_id:
                    continue
                res = await db.execute(
                    select(WhatsAppMessage).where(WhatsAppMessage.twilio_sid == wa_id)
                )
                wa = res.scalar_one_or_none()
                if not wa:
                    continue
                if state == "delivered" and not wa.delivered_at:
                    wa.delivered_at = now
                elif state == "read" and not wa.read_at:
                    wa.read_at = now
                await db.commit()

            # ── Inbound messages: lead replied ────────────────────────────────
            for msg in value.get("messages", []):
                from_phone = msg.get("from", "")
                if not from_phone:
                    continue
                # Match the most recent WA message we sent to a lead with this phone
                res = await db.execute(
                    select(WhatsAppMessage)
                    .options(selectinload(WhatsAppMessage.call).selectinload(Call.lead))
                    .join(Call, WhatsAppMessage.call_id == Call.id)
                    .join(Lead, Call.lead_id == Lead.id)
                    .where(Lead.phone.like(f"%{from_phone}"))
                    .order_by(WhatsAppMessage.sent_at.desc())
                )
                wa = res.scalars().first()
                if wa and not wa.replied_at:
                    wa.replied_at = now
                    await db.commit()

    return {"ok": True}
