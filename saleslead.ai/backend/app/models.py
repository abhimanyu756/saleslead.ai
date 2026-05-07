import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(200))
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    language_pref: Mapped[str] = mapped_column(String(20), default="Hindi")
    source: Mapped[Optional[str]] = mapped_column(String(100))
    broker_affiliation: Mapped[Optional[str]] = mapped_column(String(200))
    current_classification: Mapped[str] = mapped_column(String(20), default="Uncalled")
    next_call_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))  # for Cold lead re-engagement
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    calls: Mapped[list["Call"]] = relationship("Call", back_populates="lead", order_by="Call.started_at.desc()")


class Call(Base):
    __tablename__ = "calls"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    lead_id: Mapped[str] = mapped_column(ForeignKey("leads.id"), index=True)
    elevenlabs_conversation_id: Mapped[Optional[str]] = mapped_column(String(200), unique=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    duration_s: Mapped[int] = mapped_column(Integer, default=0)
    language_used: Mapped[str] = mapped_column(String(20), default="Hindi")

    classification: Mapped[str] = mapped_column(String(20), default="Cold")
    cta_outcome: Mapped[str] = mapped_column(String(50), default="no_action")

    summary: Mapped[Optional[str]] = mapped_column(Text)
    recommended_next_action: Mapped[Optional[str]] = mapped_column(Text)
    recommended_opening_line: Mapped[Optional[str]] = mapped_column(Text)
    benefits_covered: Mapped[list] = mapped_column(JSONB, default=list)
    transcript: Mapped[list] = mapped_column(JSONB, default=list)
    audio_path: Mapped[Optional[str]] = mapped_column(String(500))  # local relative path for playback

    processed: Mapped[bool] = mapped_column(Boolean, default=False)

    lead: Mapped["Lead"] = relationship("Lead", back_populates="calls")
    score: Mapped[Optional["CallScore"]] = relationship("CallScore", back_populates="call", uselist=False)
    objections: Mapped[list["Objection"]] = relationship("Objection", back_populates="call")
    whatsapp: Mapped[Optional["WhatsAppMessage"]] = relationship("WhatsAppMessage", back_populates="call", uselist=False)
    rm_handoff: Mapped[Optional["RMHandoff"]] = relationship("RMHandoff", back_populates="call", uselist=False)


class CallScore(Base):
    __tablename__ = "call_scores"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    call_id: Mapped[str] = mapped_column(ForeignKey("calls.id"), unique=True)

    interest_score: Mapped[float] = mapped_column(Float)
    readiness_score: Mapped[float] = mapped_column(Float)
    network_size: Mapped[str] = mapped_column(String(20))
    network_evidence: Mapped[list] = mapped_column(JSONB, default=list)
    interest_evidence: Mapped[list] = mapped_column(JSONB, default=list)
    readiness_evidence: Mapped[list] = mapped_column(JSONB, default=list)

    call: Mapped["Call"] = relationship("Call", back_populates="score")


class Objection(Base):
    __tablename__ = "objections"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    call_id: Mapped[str] = mapped_column(ForeignKey("calls.id"), index=True)

    type: Mapped[str] = mapped_column(String(200))
    raised_at_turn: Mapped[int] = mapped_column(Integer)
    resolution_status: Mapped[str] = mapped_column(String(20))

    call: Mapped["Call"] = relationship("Call", back_populates="objections")


class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    call_id: Mapped[str] = mapped_column(ForeignKey("calls.id"), unique=True)

    message_text: Mapped[str] = mapped_column(Text)
    link: Mapped[str] = mapped_column(String(500))
    language: Mapped[str] = mapped_column(String(20))
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    replied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    clicked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    twilio_sid: Mapped[Optional[str]] = mapped_column(String(100))  # holds WhatsApp message id

    call: Mapped["Call"] = relationship("Call", back_populates="whatsapp")


class RMHandoff(Base):
    __tablename__ = "rm_handoffs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=new_uuid)
    call_id: Mapped[str] = mapped_column(ForeignKey("calls.id"), unique=True)

    brief: Mapped[str] = mapped_column(Text)
    interest_score: Mapped[float] = mapped_column(Float)
    readiness_score: Mapped[float] = mapped_column(Float)
    recommended_opening_line: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    call: Mapped["Call"] = relationship("Call", back_populates="rm_handoff")
