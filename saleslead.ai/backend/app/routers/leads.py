"""Lead ingestion: single POST + CSV bulk upload."""

import csv
import io

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Lead
from app.schemas import LeadCreate, LeadOut

router = APIRouter(prefix="/leads", tags=["leads"])


async def _trigger_outbound_call(
    phone: str,
    lead_id: str,
    lead_name: str,
    language: str,
    broker_affiliation: str | None = None,
):
    """Fire an ElevenLabs outbound call for a lead. Silently skips if phone number not configured."""
    if not settings.ELEVENLABS_PHONE_NUMBER_ID:
        return

    async with httpx.AsyncClient(timeout=15) as client:
        await client.post(
            "https://api.elevenlabs.io/v1/convai/conversations/outbound_call",
            headers={"xi-api-key": settings.ELEVENLABS_API_KEY},
            json={
                "agent_id": settings.ELEVENLABS_AGENT_ID,
                "agent_phone_number_id": settings.ELEVENLABS_PHONE_NUMBER_ID,
                "to_number": phone,
                "metadata": {
                    "lead_id": lead_id,
                    "lead_name": lead_name,
                    "language": language,
                },
                "dynamic_variables": {
                    "lead_name": lead_name,
                    "language": language,
                    "broker_affiliation": broker_affiliation or "",
                },
            },
        )


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


@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead
