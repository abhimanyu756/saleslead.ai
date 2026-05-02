"""Lead ingestion: single POST + CSV bulk upload."""

import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Lead
from app.schemas import LeadCreate, LeadOut

router = APIRouter(prefix="/leads", tags=["leads"])


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
async def upload_csv(file: UploadFile, db: AsyncSession = Depends(get_db)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))

    created, skipped = 0, 0
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
        created += 1

    await db.commit()
    return {"created": created, "skipped": skipped}


@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead
