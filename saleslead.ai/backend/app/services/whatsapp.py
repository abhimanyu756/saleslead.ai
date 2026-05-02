"""Twilio WhatsApp dispatcher for warm lead follow-up."""

from twilio.rest import Client

from app.config import settings

_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

TEMPLATES = {
    "Hindi": (
        "नमस्ते {name}! 🙏\n\n"
        "अभी-अभी हमारी बात हुई — Rupeezy AP Program के बारे में।\n\n"
        "Zero joining fee, 100% brokerage share, और daily payouts.\n\n"
        "नीचे link से अभी sign up करें — बस 2 मिनट लगेगा:\n{link}\n\n"
        "कोई सवाल हो तो बताइए! 😊"
    ),
    "English": (
        "Hi {name}! 👋\n\n"
        "Great speaking with you just now about the Rupeezy AP Program.\n\n"
        "Zero joining fee · 100% brokerage share · Daily payouts.\n\n"
        "Sign up in 2 minutes here:\n{link}\n\n"
        "Feel free to reply if you have any questions!"
    ),
    "Hinglish": (
        "Hi {name}! 😊\n\n"
        "Abhi baat hui thi — Rupeezy AP Program ke baare mein.\n\n"
        "Zero joining fee, 100% brokerage, aur daily payouts.\n\n"
        "2 minute mein sign up karo:\n{link}\n\n"
        "Koi sawaal ho toh batao!"
    ),
}


def build_signup_link(lead_id: str) -> str:
    return f"{settings.RUPEEZY_SIGNUP_BASE_URL}{lead_id}"


def send_warm_followup(phone: str, name: str, language: str, lead_id: str) -> dict:
    link = build_signup_link(lead_id)
    template = TEMPLATES.get(language, TEMPLATES["Hindi"])
    body = template.format(name=name, link=link)

    message = _client.messages.create(
        from_=settings.TWILIO_WHATSAPP_FROM,
        to=f"whatsapp:{phone}",
        body=body,
    )

    return {
        "message_text": body,
        "link": link,
        "language": language,
        "twilio_sid": message.sid,
    }
