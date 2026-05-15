from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://saleslead:saleslead@localhost:5432/saleslead"
    REDIS_URL: str = "redis://localhost:6379"

    GEMINI_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_AGENT_ID: str = ""
    ELEVENLABS_PHONE_NUMBER_ID: str = ""  # from ElevenLabs dashboard → Phone Numbers
    ELEVENLABS_WEBHOOK_SECRET: str = ""  # from ElevenLabs Settings → Webhooks (HMAC secret)

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    # Meta WhatsApp Cloud API
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_TEMPLATE_NAME: str = "rupeezy_ap_signup"
    WHATSAPP_TEMPLATE_LANG: str = "en"
    META_VERIFY_TOKEN: str = "rupeezy-verify-2026"

    # Gmail SMTP for sending signup-link emails
    GMAIL_USER: str = ""            # your gmail address
    GMAIL_APP_PASSWORD: str = ""    # 16-char app password from myaccount.google.com → Security → App passwords
    GMAIL_FROM_NAME: str = "Priya from Rupeezy"

    # Public URL for webhooks + click tracking (set this to your ngrok URL)
    NGROK_URL: str = "http://localhost:8000"

    RUPEEZY_SIGNUP_BASE_URL: str = "https://rupeezy.in/authorized-person"
    FRONTEND_URL: str = "http://localhost:3000"
    JWT_SECRET: str = "saleslead-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24


settings = Settings()
