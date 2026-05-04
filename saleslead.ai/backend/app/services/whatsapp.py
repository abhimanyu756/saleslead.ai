"""Meta WhatsApp Cloud API dispatcher for warm lead follow-up."""

import httpx

from app.config import settings

GRAPH_BASE = "https://graph.facebook.com/v22.0"

TEMPLATES = {
    "Hindi": (
        "नमस्ते {name} जी 🙏\n\n"
        "अभी-अभी आपसे Rupeezy AP Program के बारे में बात हुई।\n\n"
        "✅ *Zero joining fee* — कोई upfront cost नहीं\n"
        "✅ *100% brokerage share* — जो कमाओ, वो पूरा तुम्हारा\n"
        "✅ *Daily payouts* — हर रोज़ payment, monthly नहीं\n\n"
        "👇 अभी sign up करें — बस 2 मिनट लगेगा:\n"
        "{link}\n\n"
        "कोई सवाल हो तो यहीं reply करें, main help करूंगी! 😊"
    ),
    "English": (
        "Hi {name} 👋\n\n"
        "Great speaking with you about the *Rupeezy Authorized Partner Program*!\n\n"
        "Here's a quick recap of what we offer:\n"
        "✅ *Zero joining fee* — no upfront cost\n"
        "✅ *100% brokerage share* — you keep everything you earn\n"
        "✅ *Daily payouts* — get paid every day, not monthly\n\n"
        "👇 Sign up in just 2 minutes:\n"
        "{link}\n\n"
        "Reply here if you have any questions — happy to help! 😊"
    ),
    "Hinglish": (
        "Hi {name} 😊\n\n"
        "Abhi baat hui thi Rupeezy AP Program ke baare mein!\n\n"
        "✅ *Zero joining fee* — koi cost nahi\n"
        "✅ *100% brokerage* — poora aapka\n"
        "✅ *Daily payouts* — roz milega, monthly nahi\n\n"
        "👇 2 minute mein sign up karo:\n"
        "{link}\n\n"
        "Koi bhi sawaal ho toh yahan reply karo! 🙌"
    ),
    "Tamil": (
        "வணக்கம் {name} 🙏\n\n"
        "Rupeezy AP Program பற்றி பேசினோம்!\n\n"
        "✅ *Zero joining fee*\n"
        "✅ *100% brokerage share*\n"
        "✅ *Daily payouts*\n\n"
        "👇 Sign up செய்யுங்கள் — 2 நிமிடம் மட்டுமே:\n"
        "{link}\n\n"
        "கேள்விகள் இருந்தால் இங்கே reply செய்யுங்கள்! 😊"
    ),
    "Telugu": (
        "నమస్కారం {name} 🙏\n\n"
        "Rupeezy AP Program గురించి మాట్లాడాము!\n\n"
        "✅ *Zero joining fee*\n"
        "✅ *100% brokerage share*\n"
        "✅ *Daily payouts*\n\n"
        "👇 Sign up చేయండి — కేవలం 2 నిమిషాలు:\n"
        "{link}\n\n"
        "ఏమైనా అడగాలంటే ఇక్కడ reply చేయండి! 😊"
    ),
    "Kannada": (
        "ನಮಸ್ಕಾರ {name} 🙏\n\n"
        "Rupeezy AP Program ಬಗ್ಗೆ ಮಾತನಾಡಿದೆವು!\n\n"
        "✅ *Zero joining fee*\n"
        "✅ *100% brokerage share*\n"
        "✅ *Daily payouts*\n\n"
        "👇 Sign up ಮಾಡಿ — ಕೇವಲ 2 ನಿಮಿಷ:\n"
        "{link}\n\n"
        "ಯಾವುದೇ ಪ್ರಶ್ನೆ ಇದ್ದರೆ ಇಲ್ಲಿ reply ಮಾಡಿ! 😊"
    ),
    "Marathi": (
        "नमस्कार {name} 🙏\n\n"
        "Rupeezy AP Program बद्दल बोललो आपण!\n\n"
        "✅ *Zero joining fee*\n"
        "✅ *100% brokerage share*\n"
        "✅ *Daily payouts*\n\n"
        "👇 Sign up करा — फक्त 2 मिनिटे:\n"
        "{link}\n\n"
        "काही प्रश्न असतील तर इथे reply करा! 😊"
    ),
    "Gujarati": (
        "નમસ્તે {name} 🙏\n\n"
        "Rupeezy AP Program વિશે વાત થઈ!\n\n"
        "✅ *Zero joining fee*\n"
        "✅ *100% brokerage share*\n"
        "✅ *Daily payouts*\n\n"
        "👇 Sign up કરો — માત્ર 2 મિનિટ:\n"
        "{link}\n\n"
        "કોઈ સવાલ હોય તો અહીં reply કરો! 😊"
    ),
}


def build_signup_link(lead_id: str) -> str:
    """Direct Rupeezy signup link with lead_id as referral — no ngrok dependency."""
    return f"{settings.RUPEEZY_SIGNUP_BASE_URL}{lead_id}"


def _normalize_phone(phone: str) -> str:
    return phone.lstrip("+").replace(" ", "").replace("-", "")


def _send_freeform(to: str, body: str) -> str:
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
    template = TEMPLATES.get(language, TEMPLATES["Hindi"])
    body = template.format(name=name, link=link)
    to = _normalize_phone(phone)

    try:
        wa_id = _send_freeform(to, body)
    except httpx.HTTPStatusError:
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
        "twilio_sid": wa_id,
    }
