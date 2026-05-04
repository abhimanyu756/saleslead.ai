from datetime import datetime, timezone

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Call, WhatsAppMessage
from app.routers import auth, calls, dashboard, leads, voice, whatsapp

app = FastAPI(title="SalesLead.ai", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
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
async def public_redirect(lead_id: str, db: AsyncSession = Depends(get_db)):
    """Public click-tracking redirect for WhatsApp links.
    Best-effort logs the click, always redirects to the Rupeezy signup URL."""
    target = f"{settings.RUPEEZY_SIGNUP_BASE_URL}{lead_id}"
    try:
        result = await db.execute(
            select(WhatsAppMessage)
            .join(Call)
            .where(Call.lead_id == lead_id)
            .order_by(WhatsAppMessage.sent_at.desc())
        )
        wa = result.scalars().first()
        if wa and not wa.clicked_at:
            wa.clicked_at = datetime.now(timezone.utc)
            await db.commit()
    except Exception:
        # Invalid UUID / DB hiccup — still redirect so the lead reaches signup
        await db.rollback()
    return RedirectResponse(url=target, status_code=302)
