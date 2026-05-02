from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import calls, dashboard, leads, voice

app = FastAPI(title="SalesLead.ai", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router)
app.include_router(calls.router)
app.include_router(dashboard.router)
app.include_router(voice.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
