"""Lead ingestion: single POST + CSV bulk upload + batch calling."""

import asyncio
import csv
import io
import logging

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Call, CallScore, EmailMessage, Lead, Objection, RMHandoff, WhatsAppMessage
from app.schemas import LeadCreate, LeadOut
from app.services.demo_seed import seed_demo

log = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/leads", tags=["leads"])

# Max concurrent outbound calls at a time
CALL_CONCURRENCY = 1  # ElevenLabs free/starter plans cap concurrent agent conversations; serial is safest


async def _trigger_outbound_call(
    phone: str,
    lead_id: str,
    lead_name: str,
    language: str,
    broker_affiliation: str | None = None,
):
    """Fire an ElevenLabs outbound call for a lead."""
    if not settings.ELEVENLABS_PHONE_NUMBER_ID:
        log.warning("[outbound_call] SKIP — ELEVENLABS_PHONE_NUMBER_ID not configured")
        return
    if not settings.ELEVENLABS_AGENT_ID:
        log.warning("[outbound_call] SKIP — ELEVENLABS_AGENT_ID not configured")
        return

    # Map our language labels → ElevenLabs ISO language codes for preset selection
    lang_code_map = {
        "Hindi": "hi",
        "English": "en",
        "Hinglish": "hi",  # ElevenLabs treats Hinglish under Hindi preset
        "Kannada": "kn",
        "Tamil": "ta",
        "Telugu": "te",
        "Marathi": "mr",
        "Gujarati": "gu",
        "Bengali": "bn",
    }
    lang_code = lang_code_map.get(language, "hi")

    payload = {
        "agent_id": settings.ELEVENLABS_AGENT_ID,
        "agent_phone_number_id": settings.ELEVENLABS_PHONE_NUMBER_ID,
        "to_number": phone,
        "conversation_initiation_client_data": {
            "conversation_config_override": {
                "agent": {
                    "language": lang_code,  # picks the matching first-message preset
                },
            },
            "dynamic_variables": {
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


async def _batch_call(leads: list[Lead], delay_seconds: float = 5.0):
    """Call multiple leads concurrently with a semaphore to limit concurrency."""
    semaphore = asyncio.Semaphore(CALL_CONCURRENCY)

    async def _call_with_semaphore(lead: Lead):
        async with semaphore:
            await _trigger_outbound_call(
                lead.phone,
                str(lead.id),
                lead.name,
                lead.language_pref,
                lead.broker_affiliation,
            )
            await asyncio.sleep(delay_seconds)

    log.info(f"[batch_call] Starting batch of {len(leads)} leads (concurrency={CALL_CONCURRENCY})")
    await asyncio.gather(*[_call_with_semaphore(lead) for lead in leads])
    log.info(f"[batch_call] Batch complete — {len(leads)} leads called")


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
            name=(row.get("name") or "").strip() or "Unknown",
            phone=phone,
            email=(row.get("email") or "").strip() or None,
            language_pref=(row.get("language_pref") or "Hindi").strip(),
            source=(row.get("source") or "csv").strip() or "csv",
            broker_affiliation=(row.get("broker_affiliation") or "").strip() or None,
        )
        db.add(lead)
        new_leads.append(lead)
        created += 1

    await db.commit()

    for lead in new_leads:
        await db.refresh(lead)

    # Calls are triggered separately by the frontend via /leads/batch-call
    # to keep CSV upload non-blocking and avoid double-firing.
    return {"created": created, "skipped": skipped}


@router.post("/batch-call", response_model=dict)
async def batch_call_uncalled(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Trigger outbound calls for all leads that haven't been called yet."""
    result = await db.execute(
        select(Lead).where(Lead.current_classification == "Uncalled")
    )
    uncalled_leads = result.scalars().all()

    if not uncalled_leads:
        return {"message": "No uncalled leads found", "triggered": 0}

    background_tasks.add_task(_batch_call, uncalled_leads)
    return {"message": f"Batch call started", "triggered": len(uncalled_leads)}


class RecallRequest(BaseModel):
    lead_ids: list[str]


@router.post("/recall", status_code=200)
async def recall_leads(
    body: RecallRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Re-trigger outbound calls for selected leads (typically from Cold Queue).
    Resets each lead to Uncalled and clears any scheduled re-engagement."""
    triggered = 0
    skipped = 0
    for lead_id in body.lead_ids:
        result = await db.execute(select(Lead).where(Lead.id == lead_id))
        lead = result.scalar_one_or_none()
        if not lead:
            skipped += 1
            continue
        lead.current_classification = "Uncalled"
        lead.next_call_at = None
        background_tasks.add_task(
            _trigger_outbound_call,
            lead.phone,
            str(lead.id),
            lead.name,
            lead.language_pref,
            lead.broker_affiliation,
        )
        triggered += 1
    await db.commit()
    log.info(f"[recall] triggered {triggered} re-calls, skipped {skipped}")
    return {"triggered": triggered, "skipped": skipped}


@router.post("/seed-demo", status_code=201)
async def seed_demo_leads(db: AsyncSession = Depends(get_db)):
    """Insert demo Warm + Cold leads (no Hot) for dashboard demo purposes.
    Idempotent — phones that already exist are skipped."""
    return await seed_demo(db)


@router.delete("/all", status_code=200)
async def delete_all_leads(db: AsyncSession = Depends(get_db)):
    """Wipe all leads + all related records."""
    await db.execute(delete(RMHandoff))
    await db.execute(delete(WhatsAppMessage))
    await db.execute(delete(EmailMessage))
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
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")

    call_ids = (await db.execute(select(Call.id).where(Call.lead_id == lead_id))).scalars().all()
    if call_ids:
        await db.execute(delete(RMHandoff).where(RMHandoff.call_id.in_(call_ids)))
        await db.execute(delete(WhatsAppMessage).where(WhatsAppMessage.call_id.in_(call_ids)))
        await db.execute(delete(EmailMessage).where(EmailMessage.call_id.in_(call_ids)))
        await db.execute(delete(Objection).where(Objection.call_id.in_(call_ids)))
        await db.execute(delete(CallScore).where(CallScore.call_id.in_(call_ids)))
        await db.execute(delete(Call).where(Call.id.in_(call_ids)))

    await db.execute(delete(Lead).where(Lead.id == lead_id))
    await db.commit()
    return {"deleted": lead_id}
