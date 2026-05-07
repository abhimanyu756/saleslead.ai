"""Meta WhatsApp Cloud API dispatcher for warm lead follow-up."""

import httpx

from app.config import settings

GRAPH_BASE = "https://graph.facebook.com/v22.0"

TEMPLATES = {
    "English": (
        "Hi {name}, this is Priya from Rupeezy. Thanks for taking my call earlier — really appreciated the time. "
        "Just sending a quick note so you have my number — feel free to reply here if anything comes up "
        "or if you'd like me to share the partner details. Have a good day."
    ),
    "Hindi": (
        "Namaste {name} ji, main Priya bol rahi hoon Rupeezy se. Aapse abhi baat hui thi — time dene ke liye shukriya. "
        "Bas yeh chhota sa note bhej rahi hoon ki mera number aapke paas rahe. "
        "Koi sawaal ho ya partner details chahiye toh yahin reply kar dijiye."
    ),
    "Hinglish": (
        "Hi {name}, Priya here from Rupeezy. Abhi jo baat hui uske liye thanks. "
        "Bas yeh message bhej rahi hoon taaki mera number aapke paas rahe. "
        "Koi doubt ho ya partner details chahiye toh yahin reply kar dijiye."
    ),
    "Tamil": (
        "வணக்கம் {name}, நான் Priya, Rupeezy-லிருந்து. சற்றுமுன் பேசியதற்கு நன்றி. "
        "என் number உங்களிடம் இருக்கட்டும் என்று ஒரு சிறிய message அனுப்புகிறேன். "
        "கேள்விகள் இருந்தால் அல்லது partner details வேண்டுமென்றால் இங்கேயே reply பண்ணுங்க."
    ),
    "Telugu": (
        "నమస్కారం {name}, నేను Priya, Rupeezy నుండి. ఇప్పుడే మాట్లాడినందుకు ధన్యవాదాలు. "
        "నా number మీ దగ్గర ఉండాలని ఈ చిన్న message పంపుతున్నాను. "
        "ఏదైనా doubt ఉన్నా లేదా partner details కావాలంటే ఇక్కడే reply చేయండి."
    ),
    "Kannada": (
        "ನಮಸ್ಕಾರ {name}, ನಾನು Priya, Rupeezy ನಿಂದ. ಸ್ವಲ್ಪ ಸಮಯದ ಹಿಂದೆ ಮಾತನಾಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. "
        "ನನ್ನ number ನಿಮ್ಮ ಬಳಿ ಇರಲಿ ಎಂದು ಈ ಸಣ್ಣ message ಕಳಿಸುತ್ತಿದ್ದೇನೆ. "
        "ಯಾವುದೇ ಪ್ರಶ್ನೆ ಇದ್ದರೆ ಅಥವಾ partner details ಬೇಕಾದರೆ ಇಲ್ಲೇ reply ಮಾಡಿ."
    ),
    "Marathi": (
        "नमस्कार {name}, मी Priya, Rupeezy कडून. आत्ता बोललो त्याबद्दल धन्यवाद. "
        "माझा number तुमच्याकडे राहावा म्हणून हा छोटा message पाठवत आहे. "
        "काही प्रश्न असेल किंवा partner details हवे असतील तर इथेच reply करा."
    ),
    "Gujarati": (
        "નમસ્તે {name}, હું Priya, Rupeezy થી. હમણાં વાત કરી તે બદલ આભાર. "
        "મારો number તમારી પાસે રહે એ માટે આ નાનો message મોકલી રહી છું. "
        "કોઈ સવાલ હોય કે partner details જોઈએ તો અહીં જ reply કરજો."
    ),
    "Bengali": (
        "নমস্কার {name}, আমি Priya, Rupeezy থেকে। একটু আগে কথা বলার জন্য ধন্যবাদ। "
        "শুধু এই ছোট্ট message পাঠাচ্ছি যাতে আমার number আপনার কাছে থাকে। "
        "কোনো প্রশ্ন থাকলে বা partner details দরকার হলে এখানেই reply করবেন।"
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
