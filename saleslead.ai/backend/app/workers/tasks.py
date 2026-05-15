"""RQ async post-call pipeline: score → classify → store → route."""

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Call, CallScore, EmailMessage, Lead, Objection, RMHandoff, WhatsAppMessage
from app.services.email import build_signup_link as build_email_link, send_signup_email
from app.services.scorer import score_call
from app.services.whatsapp import send_warm_followup


def process_call(call_id: str) -> None:
    """Entry point for RQ worker — runs the async pipeline synchronously."""
    asyncio.run(_process_call_async(call_id))


async def _process_call_async(call_id: str) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Call).where(Call.id == call_id)
        )
        call = result.scalar_one_or_none()
        if not call or call.processed:
            return

        result = await db.execute(select(Lead).where(Lead.id == call.lead_id))
        lead = result.scalar_one_or_none()
        if not lead:
            return

        scored = await score_call(call.transcript, lead.name)

        # Persist score
        score_row = CallScore(
            call_id=call_id,
            interest_score=scored["interest_score"],
            readiness_score=scored["readiness_score"],
            network_size=scored["network_size"],
            network_evidence=scored["network_evidence"],
            interest_evidence=scored["interest_evidence"],
            readiness_evidence=scored["readiness_evidence"],
        )
        db.add(score_row)

        # Persist objections
        for obj in scored.get("objections", []):
            db.add(Objection(
                call_id=call_id,
                type=obj["type"],
                raised_at_turn=obj["raised_at_turn"],
                resolution_status=obj["resolution_status"],
            ))

        # Update call fields
        call.classification = scored["classification"]
        call.cta_outcome = scored["cta_outcome"]
        call.summary = scored["summary"]
        call.recommended_next_action = scored["recommended_next_action"]
        call.recommended_opening_line = scored.get("recommended_opening_line")
        call.benefits_covered = scored.get("benefits_covered", [])
        call.language_used = scored.get("language_used", lead.language_pref)
        call.processed = True

        # Update lead classification + schedule re-engagement for Cold leads
        lead.current_classification = scored["classification"]
        if scored["classification"] == "Cold":
            # Auto-schedule re-engagement: 30 days for "polite but disengaged",
            # 60 days for "clearly not interested", 90 days for "cut call"
            interest = scored.get("interest_score", 0)
            turns = len(call.transcript or [])
            if turns <= 2:
                delta = timedelta(days=90)  # cut call early — leave alone longer
            elif interest <= 3:
                delta = timedelta(days=60)  # clearly not interested
            else:
                delta = timedelta(days=30)  # polite but disengaged
            lead.next_call_at = datetime.now(timezone.utc) + delta
        else:
            lead.next_call_at = None  # not Cold; clear any stale schedule

        await db.commit()

        # Route based on classification
        if scored["classification"] == "Hot":
            await _create_rm_handoff(db, call, lead, scored)
            await _send_whatsapp(db, call, lead)  # also send WhatsApp for Hot (testing convenience)
            await _send_email(db, call, lead)
        elif scored["classification"] == "Warm":
            await _send_whatsapp(db, call, lead)
            await _send_email(db, call, lead)

        await db.commit()


async def _create_rm_handoff(db, call: Call, lead: Lead, scored: dict) -> None:
    brief = (
        f"Hot lead: {lead.name} ({lead.phone})\n"
        f"Interest: {scored['interest_score']}/10 · Readiness: {scored['readiness_score']}/10\n"
        f"Network: {scored['network_size']}\n"
        f"Summary: {scored['summary']}\n"
        f"Next action: {scored['recommended_next_action']}"
    )
    db.add(RMHandoff(
        call_id=call.id,
        brief=brief,
        interest_score=scored["interest_score"],
        readiness_score=scored["readiness_score"],
        recommended_opening_line=scored.get("recommended_opening_line"),
    ))


async def _send_whatsapp(db, call: Call, lead: Lead) -> None:
    result = send_warm_followup(
        phone=lead.phone,
        name=lead.name,
        language=call.language_used,
        lead_id=lead.id,
    )
    db.add(WhatsAppMessage(
        call_id=call.id,
        message_text=result["message_text"],
        link=result["link"],
        language=result["language"],
        twilio_sid=result["twilio_sid"],
    ))


async def _send_email(db, call: Call, lead: Lead) -> None:
    """Send signup-link email if lead has an email address."""
    if not lead.email:
        return
    link = build_email_link(lead.id)
    result = send_signup_email(
        to_email=lead.email,
        name=lead.name,
        language=call.language_used,
        link=link,
    )
    db.add(EmailMessage(
        call_id=call.id,
        to_email=lead.email,
        subject=result["subject"],
        body=result["body"],
        link=link,
        language=call.language_used,
        error=result.get("error"),
    ))
