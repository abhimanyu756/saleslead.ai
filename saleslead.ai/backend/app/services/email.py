"""Gmail SMTP sender for Hot/Warm lead signup-link emails."""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

log = logging.getLogger("uvicorn.error")


SUBJECTS = {
    "English": "Quick note about the Rupeezy Partner Program — Priya",
    "Hindi": "Rupeezy Partner Program — Priya",
    "Hinglish": "Rupeezy Partner Program ke baare mein",
    "Kannada": "Rupeezy Partner Program bagge",
    "Tamil": "Rupeezy Partner Program patri",
    "Telugu": "Rupeezy Partner Program gurinchi",
    "Marathi": "Rupeezy Partner Program baddal",
    "Gujarati": "Rupeezy Partner Program vishe",
    "Bengali": "Rupeezy Partner Program shomporke",
}


def _build_body(name: str, language: str, link: str) -> tuple[str, str]:
    """Returns (plain_text_body, html_body) for a multipart email.
    HTML version hides the ugly tracking URL behind clean anchor text + button."""
    intros = {
        "English": (
            f"Hi {name},",
            "This is Priya from Rupeezy. Thanks for the call earlier — really appreciated your time.",
            "Here's the partner sign-up link whenever you have a moment:",
            "It takes about 2 minutes. Reply to this email if you have any questions, happy to help.",
        ),
        "Hindi": (
            f"Namaste {name} ji,",
            "Main Priya bol rahi hoon Rupeezy se. Aapse abhi baat hui thi — time dene ke liye shukriya.",
            "Jaisa bataya tha, partner sign-up link yeh raha — fursat se dekh lijiyega:",
            "2 minute mein ho jaata hai. Koi sawaal ho toh reply kar dijiye.",
        ),
        "Hinglish": (
            f"Hi {name},",
            "Priya here from Rupeezy. Abhi jo baat hui uske liye thanks.",
            "Yeh raha partner sign-up link, jab time mile dekh lijiye:",
            "2 minute mein ho jaayega. Koi doubt ho toh reply kar dijiye.",
        ),
    }
    greet, intro, lead_in, outro = intros.get(language, intros["English"])

    # Plain-text fallback (some clients show this if HTML is disabled)
    plain = (
        f"{greet}\n\n"
        f"{intro}\n\n"
        f"{lead_in}\n"
        f"Sign up here: {link}\n\n"
        f"{outro}\n\n"
        "Best,\nPriya\nRupeezy AP Program"
    )

    # HTML version with button — link URL is hidden behind anchor text
    html = f"""\
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px; line-height: 1.6;">
  <p style="margin: 0 0 16px;">{greet}</p>
  <p style="margin: 0 0 16px;">{intro}</p>
  <p style="margin: 0 0 16px;">{lead_in}</p>
  <p style="margin: 24px 0;">
    <a href="{link}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600;">Sign up here</a>
  </p>
  <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">{outro}</p>
  <p style="margin: 24px 0 4px;">Best,</p>
  <p style="margin: 0;"><strong>Priya</strong></p>
  <p style="margin: 0; color: #6b7280; font-size: 13px;">Rupeezy AP Program</p>
</body>
</html>"""
    return plain, html


def send_signup_email(to_email: str, name: str, language: str, link: str) -> dict:
    """Send signup-link email via Gmail SMTP as multipart (plain + HTML).
    Returns {ok: bool, error: str|None, subject, body}.
    """
    subject = SUBJECTS.get(language, SUBJECTS["English"])
    plain_body, html_body = _build_body(name, language, link)

    if not settings.GMAIL_USER or not settings.GMAIL_APP_PASSWORD:
        log.warning("[email] SKIP — GMAIL_USER or GMAIL_APP_PASSWORD not configured")
        return {"ok": False, "error": "Gmail credentials not configured", "subject": subject, "body": plain_body}

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.GMAIL_FROM_NAME} <{settings.GMAIL_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    # Order matters: plain first, HTML second — clients display the LAST part they can render
    msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_USER, [to_email], msg.as_string())
        log.info(f"[email] sent to {to_email}")
        return {"ok": True, "error": None, "subject": subject, "body": plain_body}
    except Exception as e:
        err = f"{type(e).__name__}: {e}"
        log.error(f"[email] FAILED to {to_email}: {err}")
        return {"ok": False, "error": err, "subject": subject, "body": plain_body}


def build_signup_link(lead_id: str) -> str:
    """Direct Rupeezy URL — no query params (Rupeezy's signup page doesn't consume ?ref).
    Trade-off: email-channel click tracking is lost since we skip our /r/{lead_id} redirect."""
    return settings.RUPEEZY_SIGNUP_BASE_URL
