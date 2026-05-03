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

    # Public URL for webhooks + click tracking (set this to your ngrok URL)
    NGROK_URL: str = "http://localhost:8000"

    RUPEEZY_SIGNUP_BASE_URL: str = "https://rupeezy.in/ap?ref="
    FRONTEND_URL: str = "http://localhost:3000"


settings = Settings()
