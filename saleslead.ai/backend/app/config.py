from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://saleslead:saleslead@localhost:5432/saleslead"
    REDIS_URL: str = "redis://localhost:6379"

    ANTHROPIC_API_KEY: str = ""
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_AGENT_ID: str = ""

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    RUPEEZY_SIGNUP_BASE_URL: str = "https://rupeezy.in/ap?ref="
    FRONTEND_URL: str = "http://localhost:3000"


settings = Settings()
