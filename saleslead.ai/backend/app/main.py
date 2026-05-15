from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Call, EmailMessage, WhatsAppMessage
from app.routers import auth, calls, dashboard, leads, voice, whatsapp

# Ensure audio dir exists before mounting
AUDIO_DIR = Path("/app/audio_files")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SalesLead.ai", version="1.0.0")
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(calls.router)
app.include_router(dashboard.router)
app.include_router(voice.router)
app.include_router(whatsapp.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/r/{lead_id}")
async def public_redirect(
    lead_id: str,
    channel: str = "whatsapp",
    db: AsyncSession = Depends(get_db),
):
    """Public click-tracking redirect. ?channel=email or whatsapp (default).
    Best-effort logs the click on the matching channel, always redirects to Rupeezy signup."""
    target = settings.RUPEEZY_SIGNUP_BASE_URL  # clean URL — Rupeezy doesn't consume our lead_id
    now = datetime.now(timezone.utc)
    try:
        if channel == "email":
            result = await db.execute(
                select(EmailMessage)
                .join(Call)
                .where(Call.lead_id == lead_id)
                .order_by(EmailMessage.sent_at.desc())
            )
            em = result.scalars().first()
            if em and not em.clicked_at:
                em.clicked_at = now
                await db.commit()
        else:
            result = await db.execute(
                select(WhatsAppMessage)
                .join(Call)
                .where(Call.lead_id == lead_id)
                .order_by(WhatsAppMessage.sent_at.desc())
            )
            wa = result.scalars().first()
            if wa and not wa.clicked_at:
                wa.clicked_at = now
                await db.commit()
    except Exception:
        await db.rollback()
    return RedirectResponse(url=target, status_code=302)
