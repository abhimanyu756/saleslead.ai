"""Demo seed data for populating Hot + Warm + Cold queues without making real calls.

Inserts 6 realistic-looking leads (2 Hot + 2 Warm + 2 Cold) with full call
records, scores, objections, WhatsApp messages, and RM handoffs (for Hot).
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Call, CallScore, EmailMessage, Lead, Objection, RMHandoff, WhatsAppMessage


HOT_LEADS: list[dict[str, Any]] = [
    {
        "name": "Rajesh Kumar",
        "phone": "+919876543210",
        "email": "rajesh.kumar@example.com",
        "language_pref": "Hindi",
        "source": "LinkedIn",
        "broker_affiliation": None,
        "transcript": [
            ("agent", "Namaste Rajesh ji, main Priya bol rahi hoon Rupeezy se. Do minute baat kar sakte hain?"),
            ("lead", "Haan haan bilkul, batao."),
            ("agent", "Hamara AP program hai — zero joining fee, 100% brokerage share, aur daily payouts via RISE portal. Most brokers 60-70% pe cap karte hain, hum 100% dete hain."),
            ("lead", "Yeh interesting hai. Mere paas approximately 80 clients hain Pune mein. Kitne mein onboarding hota hai?"),
            ("agent", "Bahut badhiya network hai aapka. Onboarding 24-48 hours mein ho jaata hai. KYC + agreement bas."),
            ("lead", "Daily payout exact kab milta hai?"),
            ("agent", "T+1 settlement hai — aaj clients trade karte hain, kal subah aapke account mein. RISE portal pe real-time track bhi kar sakte hain."),
            ("lead", "Theek hai, mujhe sign up karna hai. Kaise karoon?"),
            ("agent", "Bahut badhiya — main abhi WhatsApp pe sign-up link bhej rahi hoon, aur hamare RM aapko 1-2 ghante mein call karke poora setup kar denge."),
            ("lead", "Perfect, jaldi karwa do."),
        ],
        "interest": 9.0,
        "readiness": 8.5,
        "network_size": "large",
        "interest_evidence": [
            "asked specific questions about onboarding time",
            "asked about daily payout settlement",
            "explicitly said 'mujhe sign up karna hai'",
        ],
        "readiness_evidence": [
            "said 'jaldi karwa do' — wants RM contact ASAP",
            "asked 'kaise karoon' — ready to act",
        ],
        "network_evidence": ["mentioned 80 clients in Pune"],
        "summary": "Rajesh has ~80 clients in Pune and is highly engaged. Asked specific operational questions about onboarding and daily payouts. Explicitly stated intent to sign up and wants RM contact ASAP. Strong Hot lead.",
        "objections": [],
        "next_action": "RM call within 1 hour. Lead is ready to onboard today.",
        "opening_line": "Namaste Rajesh ji, main Vikrant from Rupeezy RM team — Priya ne aapse abhi baat ki thi about the AP program. Mainne notes dekha — chaliye onboarding shuru karte hain.",
        "duration_s": 142,
    },
    {
        "name": "Priya Mehta",
        "phone": "+919765431200",
        "email": "priya.mehta@example.com",
        "language_pref": "Hinglish",
        "source": "Instagram Ad",
        "broker_affiliation": "Zerodha",
        "transcript": [
            ("agent", "Hi Priya, Priya here from Rupeezy. 2 minute mil sakta hai?"),
            ("lead", "Haan haan boliye, namesakes!"),
            ("agent", "(laughs) Haan! So we have an AP program — zero joining fee, 100% brokerage, daily payouts. Most brokers 60-70% pe cap karte hain."),
            ("lead", "I'm a finance influencer on Instagram, 50k followers. Currently with Zerodha but they pay 70% monthly."),
            ("agent", "30% extra plus daily cashflow change — woh aapke business ke liye game-changer ho sakta hai. Lock-in bhi nahi hai, dono rakh sakti hain."),
            ("lead", "Exactly what I was looking for. How fast can I start?"),
            ("agent", "24-48 hours mein onboarding ho jaata hai. KYC complete karke RISE portal access mil jaata hai immediately."),
            ("lead", "Send me the link. I want to do this today."),
            ("agent", "Perfect — main abhi WhatsApp pe sign-up link bhej rahi hoon, aur hamare RM aapko 1-2 ghante mein call karke setup kar denge."),
            ("lead", "Awesome, looking forward."),
        ],
        "interest": 9.5,
        "readiness": 9.0,
        "network_size": "large",
        "interest_evidence": [
            "shared influencer credentials and current broker rate",
            "said 'exactly what I was looking for'",
            "asked 'how fast can I start'",
        ],
        "readiness_evidence": [
            "said 'I want to do this today'",
            "explicit sign-up intent twice",
        ],
        "network_evidence": ["50k Instagram followers, finance influencer"],
        "summary": "Priya is a finance influencer with 50k Instagram followers, currently a Zerodha partner at 70%. Sees Rupeezy's 100% + daily payout as a clear upgrade. Explicit same-day sign-up intent. Highest priority Hot lead.",
        "objections": [{"type": "I'm already with another broker", "raised_at_turn": 4, "resolution_status": "resolved"}],
        "next_action": "RM call within 30 min. High-value influencer profile — assign to senior RM.",
        "opening_line": "Hi Priya, Vikrant from Rupeezy RM team — Priya from sales mentioned you're keen to start today. Let's get you set up — quick KYC walkthrough?",
        "duration_s": 168,
    },
]


WARM_LEADS: list[dict[str, Any]] = [
    {
        "name": "Arjun Iyer",
        "phone": "+919845671234",
        "email": "arjun.iyer@example.com",
        "language_pref": "English",
        "source": "LinkedIn",
        "broker_affiliation": "Groww",
        "transcript": [
            ("agent", "Hi Arjun, this is Priya from Rupeezy. Hope I'm not catching you at a bad time? Just a quick 2-minute chat about something that might interest you."),
            ("lead", "Sure, go ahead."),
            ("agent", "So we have something quite unique — zero joining fee, you keep 100% of the brokerage your clients generate, and payouts happen daily, not monthly. Does that sound interesting?"),
            ("lead", "Hmm, sounds interesting. Tell me more about how the daily payouts work."),
            ("agent", "Daily T+1 settlement via the RISE Portal. So whatever your clients trade today, you get the brokerage tomorrow morning. Most brokers cap at 60-70% and pay monthly — we're 100% and daily."),
            ("lead", "Okay, I'm with Groww right now. Is there a lock-in?"),
            ("agent", "No lock-in at all. Many of our top partners keep both — there's no exclusivity. Question is just whether the extra income is worth your time."),
            ("lead", "Let me think about it. Send me details on WhatsApp."),
            ("agent", "Of course — sending now. No pressure, look at it whenever you have a moment."),
        ],
        "interest": 6.5,
        "readiness": 5.0,
        "network_size": "medium",
        "interest_evidence": ["asked specifics about daily payouts", "asked about lock-in"],
        "readiness_evidence": ["said 'let me think about it'"],
        "network_evidence": ["mentioned currently with Groww"],
        "summary": "Arjun engaged well after the opener and asked specific questions about daily payouts and lock-in. Currently with Groww but open. Asked for WhatsApp details to review at his pace.",
        "objections": [{"type": "I'm already with another broker", "raised_at_turn": 6, "resolution_status": "resolved"},
                       {"type": "I'll think about it / call me later", "raised_at_turn": 8, "resolution_status": "partial"}],
        "next_action": "Send WhatsApp follow-up. Check in 48h if no click.",
        "opening_line": "Hi Arjun, Priya here. Did you get a chance to look at the details I sent over WhatsApp?",
        "duration_s": 92,
    },
    {
        "name": "Sneha Reddy",
        "phone": "+919812345670",
        "email": "sneha.reddy@example.com",
        "language_pref": "Telugu",
        "source": "Facebook Ads",
        "broker_affiliation": None,
        "transcript": [
            ("agent", "Namaskaram Sneha garu, nenu Priya, Rupeezy nundi. 2 minutes time undaa?"),
            ("lead", "Cheppandi."),
            ("agent", "Mana program lo zero joining fee, 100% brokerage share, daily payouts. Most brokers 60-70% cap chestaaru."),
            ("lead", "Interesting. Naaku 20-25 clients unnaru."),
            ("agent", "Bagundi, that's a great start. Quality matters. Mee clients ki support ki dedicated AP desk untundi."),
            ("lead", "Okay, but I want to discuss with my partner first."),
            ("agent", "Bilkul, no rush. WhatsApp lo details pampistanu — mee time lo chudandi."),
        ],
        "interest": 6.0,
        "readiness": 4.5,
        "network_size": "medium",
        "interest_evidence": ["asked about specifics", "shared client count"],
        "readiness_evidence": ["wants to discuss with partner"],
        "network_evidence": ["mentioned 20-25 clients"],
        "summary": "Sneha responded in Telugu, engaged with the program, shared she has 20-25 clients. Wants to discuss with a partner before deciding. Receptive to WhatsApp follow-up.",
        "objections": [{"type": "I'll think about it / call me later", "raised_at_turn": 6, "resolution_status": "partial"}],
        "next_action": "WhatsApp sent. Re-engage in 3 days if no response.",
        "opening_line": "Namaskaram Sneha garu, Priya — partner tho discuss aindaa? Any questions?",
        "duration_s": 76,
    },
]


COLD_LEADS: list[dict[str, Any]] = [
    {
        "name": "Karthik Subramaniam",
        "phone": "+919876512345",
        "language_pref": "Tamil",
        "source": "YouTube Ad",
        "broker_affiliation": "Upstox",
        "transcript": [
            ("agent", "Vanakkam Karthik, naan Priya, Rupeezy-l irundhu. 2 minute pesalama?"),
            ("lead", "Naan busy aa irukken, vendaam."),
            ("agent", "Bilkul saru, WhatsApp-la details anuppurain, parungo unga time-la."),
            ("lead", "Okay, bye."),
        ],
        "interest": 2.0,
        "readiness": 1.5,
        "network_size": "small",
        "interest_evidence": ["said busy, declined"],
        "readiness_evidence": ["abrupt exit"],
        "network_evidence": [],
        "summary": "Karthik was busy and declined immediately. Brief, polite exit. No engagement with the program.",
        "objections": [{"type": "I'll think about it / call me later", "raised_at_turn": 2, "resolution_status": "unresolved"}],
        "next_action": "Re-engage after 60 days. Try evening calls.",
        "opening_line": "N/A",
        "duration_s": 18,
    },
    {
        "name": "Rohan Verma",
        "phone": "+919877665544",
        "language_pref": "Hindi",
        "source": "Facebook Ads",
        "broker_affiliation": None,
        "transcript": [
            ("agent", "Namaste Rohan ji, main Priya bol rahi hoon Rupeezy se. 2 minute baat kar sakte hain?"),
            ("lead", "Haan ji bolye."),
        ],
        "interest": 1.0,
        "readiness": 0.5,
        "network_size": "small",
        "interest_evidence": ["call cut after agent's hello"],
        "readiness_evidence": [],
        "network_evidence": [],
        "summary": "Call disconnected after only 2 turns. No conversation actually happened. Likely accidental drop or hung up.",
        "objections": [],
        "next_action": "Retry once after 7 days, then re-engage in 90 days if still no response.",
        "opening_line": "N/A",
        "duration_s": 5,
    },
]


def _build_call(
    lead_id: str, data: dict, classification: str
) -> tuple[Call, CallScore, list[Objection], WhatsAppMessage | None, EmailMessage | None, RMHandoff | None]:
    started_at = datetime.now(timezone.utc) - timedelta(hours=2, minutes=abs(hash(data["phone"])) % 600)
    duration_s = data["duration_s"]

    transcript_jsonb = [
        {"speaker": speaker, "text": text, "timestamp": ""}
        for speaker, text in data["transcript"]
    ]

    if classification == "Hot":
        cta = "rm_scheduled"
    elif classification == "Warm":
        cta = "whatsapp_sent"
    else:
        cta = "no_action"

    call = Call(
        lead_id=lead_id,
        elevenlabs_conversation_id=f"demo_{data['phone'].lstrip('+')}",
        started_at=started_at,
        ended_at=started_at + timedelta(seconds=duration_s),
        duration_s=duration_s,
        language_used=data["language_pref"],
        classification=classification,
        cta_outcome=cta,
        summary=data["summary"],
        recommended_next_action=data["next_action"],
        recommended_opening_line=data["opening_line"],
        benefits_covered=(
            ["Zero joining fee", "100% brokerage share", "Daily payouts"]
            if classification in ("Hot", "Warm")
            else []
        ),
        transcript=transcript_jsonb,
        processed=True,
    )

    score = CallScore(
        call_id=None,
        interest_score=data["interest"],
        readiness_score=data["readiness"],
        network_size=data["network_size"],
        interest_evidence=data["interest_evidence"],
        readiness_evidence=data["readiness_evidence"],
        network_evidence=data["network_evidence"],
    )

    objections = [
        Objection(
            type=o["type"],
            raised_at_turn=o["raised_at_turn"],
            resolution_status=o["resolution_status"],
        )
        for o in data["objections"]
    ]

    # Hot AND Warm both get a WhatsApp record (Hot leads also get a follow-up message)
    whatsapp = None
    if classification in ("Hot", "Warm"):
        link = f"{settings.RUPEEZY_SIGNUP_BASE_URL}{lead_id}"
        body = (
            f"Hi {data['name']}, this is Priya from Rupeezy. Thanks for taking my call earlier — really appreciated the time. "
            "Just sending a quick note so you have my number — feel free to reply here if anything comes up "
            "or if you'd like me to share the partner details. Have a good day."
        )
        whatsapp = WhatsAppMessage(
            message_text=body,
            link=link,
            language=data["language_pref"],
            sent_at=started_at + timedelta(seconds=duration_s + 30),
            delivered_at=started_at + timedelta(seconds=duration_s + 35),
            read_at=started_at + timedelta(minutes=15) if abs(hash(data["phone"])) % 2 == 0 else None,
            twilio_sid=f"wamid.demo.{data['phone'].lstrip('+')}",
        )

    # Hot AND Warm: also produce an Email record if the lead has an email
    email_msg = None
    if classification in ("Hot", "Warm") and data.get("email"):
        email_link = f"{settings.RUPEEZY_SIGNUP_BASE_URL}{lead_id}?channel=email"
        subject = f"Quick note about the Rupeezy Partner Program — Priya"
        body = (
            f"Hi {data['name']},\n\n"
            "This is Priya from Rupeezy. Thanks for the call earlier — really appreciated your time.\n\n"
            "Here's the partner sign-up link whenever you have a moment:\n"
            f"{email_link}\n\n"
            "Reply if you have any questions, happy to help.\n\n"
            "Best,\nPriya\nRupeezy AP Program"
        )
        email_msg = EmailMessage(
            to_email=data["email"],
            subject=subject,
            body=body,
            link=email_link,
            language=data["language_pref"],
            sent_at=started_at + timedelta(seconds=duration_s + 45),
            clicked_at=started_at + timedelta(minutes=20) if abs(hash(data["phone"])) % 3 == 0 else None,
        )

    # Hot leads get an RM handoff brief
    handoff = None
    if classification == "Hot":
        brief = (
            f"Hot lead: {data['name']} ({data['phone']})\n"
            f"Interest: {data['interest']}/10 · Readiness: {data['readiness']}/10\n"
            f"Network: {data['network_size']}\n"
            f"Summary: {data['summary']}\n"
            f"Next action: {data['next_action']}"
        )
        handoff = RMHandoff(
            brief=brief,
            interest_score=data["interest"],
            readiness_score=data["readiness"],
            recommended_opening_line=data["opening_line"],
        )

    return call, score, objections, whatsapp, email_msg, handoff


async def seed_demo(db: AsyncSession) -> dict[str, int]:
    """Insert demo Hot + Warm + Cold leads (2 each). Idempotent — skips phones that already exist."""
    created_hot = 0
    created_warm = 0
    created_cold = 0
    skipped = 0
    now = datetime.now(timezone.utc)

    for batch, classification in [
        (HOT_LEADS, "Hot"),
        (WARM_LEADS, "Warm"),
        (COLD_LEADS, "Cold"),
    ]:
        for d in batch:
            existing = await db.execute(select(Lead).where(Lead.phone == d["phone"]))
            if existing.scalar_one_or_none():
                skipped += 1
                continue

            next_call_at = None
            if classification == "Cold":
                turns = len(d["transcript"])
                if turns <= 2:
                    next_call_at = now + timedelta(days=90)
                elif d["interest"] <= 3:
                    next_call_at = now + timedelta(days=60)
                else:
                    next_call_at = now + timedelta(days=30)

            lead = Lead(
                name=d["name"],
                phone=d["phone"],
                email=d.get("email"),
                language_pref=d["language_pref"],
                source=d["source"],
                broker_affiliation=d["broker_affiliation"],
                current_classification=classification,
                next_call_at=next_call_at,
            )
            db.add(lead)
            await db.flush()

            call, score, objections, whatsapp, email_msg, handoff = _build_call(lead.id, d, classification)
            db.add(call)
            await db.flush()

            score.call_id = call.id
            db.add(score)
            for obj in objections:
                obj.call_id = call.id
                db.add(obj)
            if whatsapp is not None:
                whatsapp.call_id = call.id
                db.add(whatsapp)
            if email_msg is not None:
                email_msg.call_id = call.id
                db.add(email_msg)
            if handoff is not None:
                handoff.call_id = call.id
                db.add(handoff)

            if classification == "Hot":
                created_hot += 1
            elif classification == "Warm":
                created_warm += 1
            else:
                created_cold += 1

    await db.commit()
    return {
        "hot_created": created_hot,
        "warm_created": created_warm,
        "cold_created": created_cold,
        "skipped": skipped,
    }
