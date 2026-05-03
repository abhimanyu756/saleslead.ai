"""Meta WhatsApp Cloud API dispatcher for warm lead follow-up.

Strategy:
  1. Try freeform — works inside the 24h service window (lead messaged us recently).
  2. Fall back to approved template — required for business-initiated messages
     outside the 24h window. Template name + lang come from settings.
"""

import httpx

from app.config import settings

GRAPH_BASE = "https://graph.facebook.com/v22.0"

TEMPLATES = {
    "Hindi": (
        "नमस्ते {name} 🙏\n\n"
        "अभी-अभी हमारी बात हुई — Rupeezy AP Program के बारे में।\n\n"
        "Zero joining fee, 100% brokerage share, और daily payouts.\n\n"
        "नीचे link से अभी sign up करें — बस 2 मिनट लगेगा:\n{link}\n\n"
        "कोई सवाल हो तो बताइए! 😊"
    ),
    "English": (
        "Hi {name} 👋\n\n"
        "Great speaking with you just now about the Rupeezy AP Program.\n\n"
        "Zero joining fee · 100% brokerage share · Daily payouts.\n\n"
        "Sign up in 2 minutes: {link}\n\n"
        "Reply if you have any questions!"
    ),
    "Hinglish": (
        "Hi {name} 😊\n\n"
        "Abhi baat hui thi — Rupeezy AP Program ke baare mein.\n\n"
        "Zero joining fee, 100% brokerage, aur daily payouts.\n\n"
        "2 minute mein sign up karo: {link}\n\n"
        "Koi sawaal ho toh batao!"
    ),
}


def build_signup_link(lead_id: str) -> str:
    """Click-tracked link. Hits our /r/{lead_id} endpoint, which logs the
    click and 302-redirects to the real Rupeezy signup URL."""
    return f"{settings.NGROK_URL}/r/{lead_id}"


def _normalize_phone(phone: str) -> str:
    """Cloud API expects '918102652783' — no '+', no 'whatsapp:' prefix."""
    return phone.lstrip("+").replace(" ", "").replace("-", "")


def _send_freeform(to: str, body: str) -> str:
    """Send a freeform text message. Only works inside the 24h service window."""
    url = f"{GRAPH_BASE}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": body, "preview_url": True},
    }
    with httpx.Client(timeout=15) as c:
        r = c.post(url, headers=headers, json=payload)
        r.raise_for_status()
        return r.json()["messages"][0]["id"]


def _send_template(to: str, name: str, lang: str, name_param: str, link_id: str) -> str:
    """Send an approved template — required for business-initiated messages
    outside the 24h service window.

    Expects a template named `name` with:
      - body component with one variable ({{1}} = lead name)
      - URL button at index 0 with one dynamic param ({{1}} = lead_id)
    """
    url = f"{GRAPH_BASE}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": name,
            "language": {"code": lang},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": name_param}],
                },
                {
                    "type": "button",
                    "sub_type": "url",
                    "index": "0",
                    "parameters": [{"type": "text", "text": link_id}],
                },
            ],
        },
    }
    with httpx.Client(timeout=15) as c:
        r = c.post(url, headers=headers, json=payload)
        r.raise_for_status()
        return r.json()["messages"][0]["id"]


def send_warm_followup(phone: str, name: str, language: str, lead_id: str) -> dict:
    link = build_signup_link(lead_id)
    body = TEMPLATES.get(language, TEMPLATES["Hindi"]).format(name=name, link=link)
    to = _normalize_phone(phone)

    try:
        wa_id = _send_freeform(to, body)
    except httpx.HTTPStatusError:
        # 24h window closed — fall back to approved template
        wa_id = _send_template(
            to=to,
            name=settings.WHATSAPP_TEMPLATE_NAME,
            lang=settings.WHATSAPP_TEMPLATE_LANG,
            name_param=name,
            link_id=lead_id,
        )

    return {
        "message_text": body,
        "link": link,
        "language": language,
        "twilio_sid": wa_id,  # column kept its name; reuse for WhatsApp message id
    }
