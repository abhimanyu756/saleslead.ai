"""Lead ingestion: single POST + CSV bulk upload."""

import csv
import io
import logging

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Call, CallScore, Lead, Objection, RMHandoff, WhatsAppMessage
from app.schemas import LeadCreate, LeadOut

log = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/leads", tags=["leads"])


async def _trigger_outbound_call(
    phone: str,
    lead_id: str,
    lead_name: str,
    language: str,
    broker_affiliation: str | None = None,
):
    """Fire an ElevenLabs outbound call for a lead. Logs result so issues are visible."""
    if not settings.ELEVENLABS_PHONE_NUMBER_ID:
        log.warning("[outbound_call] SKIP — ELEVENLABS_PHONE_NUMBER_ID not configured")
        return
    if not settings.ELEVENLABS_AGENT_ID:
        log.warning("[outbound_call] SKIP — ELEVENLABS_AGENT_ID not configured")
        return

    payload = {
        "agent_id": settings.ELEVENLABS_AGENT_ID,
        "agent_phone_number_id": settings.ELEVENLABS_PHONE_NUMBER_ID,
        "to_number": phone,
        "conversation_initiation_client_data": {
            "dynamic_variables": {
                # ElevenLabs RELIABLY echoes these back in post-call webhook
                "lead_id": lead_id,
                "lead_name": lead_name,
                "language": language,
                "broker_affiliation": broker_affiliation or "",
            },
            "metadata": {
                "lead_id": lead_id,
                "lead_name": lead_name,
                "language": language,
            },
        },
    }

    log.info(f"[outbound_call] Calling {phone} (lead_id={lead_id})")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
                headers={"xi-api-key": settings.ELEVENLABS_API_KEY},
                json=payload,
            )
            log.info(f"[outbound_call] ElevenLabs returned {r.status_code}: {r.text[:300]}")
            r.raise_for_status()
    except httpx.HTTPStatusError as e:
        log.error(f"[outbound_call] FAILED for {phone}: {e.response.status_code} — {e.response.text[:500]}")
    except Exception as e:
        log.error(f"[outbound_call] EXCEPTION for {phone}: {type(e).__name__}: {e}")


@router.get("/", response_model=list[LeadOut])
async def list_leads(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).order_by(Lead.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=LeadOut, status_code=201)
async def create_lead(body: LeadCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Lead).where(Lead.phone == body.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Lead with this phone already exists")
    lead = Lead(**body.model_dump())
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.post("/upload-csv", response_model=dict, status_code=201)
async def upload_csv(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))

    created, skipped = 0, 0
    new_leads: list[Lead] = []

    for row in reader:
        phone = row.get("phone", "").strip()
        if not phone:
            skipped += 1
            continue
        existing = await db.execute(select(Lead).where(Lead.phone == phone))
        if existing.scalar_one_or_none():
            skipped += 1
            continue
        lead = Lead(
            name=row.get("name", "").strip() or "Unknown",
            phone=phone,
            language_pref=row.get("language_pref", "Hindi").strip(),
            source=row.get("source", "csv").strip() or "csv",
            broker_affiliation=row.get("broker_affiliation", "").strip() or None,
        )
        db.add(lead)
        new_leads.append(lead)
        created += 1

    await db.commit()

    # Refresh all new leads to get their generated IDs, then trigger outbound calls
    for lead in new_leads:
        await db.refresh(lead)
        background_tasks.add_task(
            _trigger_outbound_call,
            lead.phone,
            str(lead.id),
            lead.name,
            lead.language_pref,
            lead.broker_affiliation,
        )

    return {"created": created, "skipped": skipped}


@router.delete("/all", status_code=200)
async def delete_all_leads(db: AsyncSession = Depends(get_db)):
    """Wipe all leads + all related records. Useful for resetting between tests."""
    # Order matters: child tables first
    await db.execute(delete(RMHandoff))
    await db.execute(delete(WhatsAppMessage))
    await db.execute(delete(Objection))
    await db.execute(delete(CallScore))
    await db.execute(delete(Call))
    result = await db.execute(delete(Lead))
    await db.commit()
    return {"deleted": result.rowcount}


@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead


@router.delete("/{lead_id}", status_code=200)
async def delete_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a single lead and all its calls, scores, objections, WhatsApp records, handoffs."""
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")

    # Find all calls for this lead, then cascade
    call_ids = (await db.execute(select(Call.id).where(Call.lead_id == lead_id))).scalars().all()
    if call_ids:
        await db.execute(delete(RMHandoff).where(RMHandoff.call_id.in_(call_ids)))
        await db.execute(delete(WhatsAppMessage).where(WhatsAppMessage.call_id.in_(call_ids)))
        await db.execute(delete(Objection).where(Objection.call_id.in_(call_ids)))
        await db.execute(delete(CallScore).where(CallScore.call_id.in_(call_ids)))
        await db.execute(delete(Call).where(Call.id.in_(call_ids)))

    await db.execute(delete(Lead).where(Lead.id == lead_id))
    await db.commit()
    return {"deleted": lead_id}
