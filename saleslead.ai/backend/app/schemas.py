from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


# ── Lead ──────────────────────────────────────────────────────────────────────

class LeadCreate(BaseModel):
    name: str
    phone: str
    language_pref: str = "Hindi"
    source: Optional[str] = None
    broker_affiliation: Optional[str] = None


class LeadOut(BaseModel):
    id: str
    name: str
    phone: str
    language_pref: str
    source: Optional[str]
    broker_affiliation: Optional[str]
    current_classification: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Score ─────────────────────────────────────────────────────────────────────

class ScoreOut(BaseModel):
    interest_score: float
    readiness_score: float
    network_size: str
    network_evidence: list[str]
    interest_evidence: list[str]
    readiness_evidence: list[str]

    model_config = {"from_attributes": True}


# ── Objection ─────────────────────────────────────────────────────────────────

class ObjectionOut(BaseModel):
    type: str
    raised_at_turn: int
    resolution_status: str

    model_config = {"from_attributes": True}


# ── WhatsApp ──────────────────────────────────────────────────────────────────

class WhatsAppOut(BaseModel):
    message_text: str
    link: str
    language: str
    sent_at: datetime
    clicked_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ── Call ──────────────────────────────────────────────────────────────────────

class CallOut(BaseModel):
    id: str
    lead_id: str
    started_at: datetime
    ended_at: Optional[datetime]
    duration_s: int
    language_used: str
    classification: str
    cta_outcome: str
    summary: Optional[str]
    recommended_next_action: Optional[str]
    recommended_opening_line: Optional[str]
    benefits_covered: list[str]
    transcript: list[dict]
    score: Optional[ScoreOut]
    objections: list[ObjectionOut]
    whatsapp: Optional[WhatsAppOut]

    model_config = {"from_attributes": True}


# ── ElevenLabs webhook ────────────────────────────────────────────────────────

class TranscriptTurn(BaseModel):
    role: str  # "agent" | "user"
    message: str


class ElevenLabsLLMRequest(BaseModel):
    conversation_id: str
    agent_id: str
    history: list[TranscriptTurn]
    # variables injected by ElevenLabs dynamic variables
    lead_id: Optional[str] = None
    lead_name: Optional[str] = None
    language: Optional[str] = None


class ElevenLabsPostCallWebhook(BaseModel):
    conversation_id: str
    agent_id: str
    status: str
    transcript: list[TranscriptTurn]
    metadata: dict = {}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_leads: int
    calls_made: int
    hot_leads: int
    warm_leads: int
    cold_leads: int
    signed_up: int
    conversion_rate: float
    funnel: list[dict]
    daily_activity: list[dict]


# ── WhatsApp click tracking ───────────────────────────────────────────────────

class ClickTrack(BaseModel):
    lead_id: str
