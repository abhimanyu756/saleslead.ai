"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "leads",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False, unique=True),
        sa.Column("language_pref", sa.String(20), nullable=False, server_default="Hindi"),
        sa.Column("source", sa.String(100)),
        sa.Column("broker_affiliation", sa.String(200)),
        sa.Column("current_classification", sa.String(20), nullable=False, server_default="Uncalled"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_leads_phone", "leads", ["phone"])

    op.create_table(
        "calls",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("lead_id", UUID(as_uuid=False), sa.ForeignKey("leads.id"), nullable=False),
        sa.Column("elevenlabs_conversation_id", sa.String(200), unique=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column("duration_s", sa.Integer, nullable=False, server_default="0"),
        sa.Column("language_used", sa.String(20), nullable=False, server_default="Hindi"),
        sa.Column("classification", sa.String(20), nullable=False, server_default="Cold"),
        sa.Column("cta_outcome", sa.String(50), nullable=False, server_default="no_action"),
        sa.Column("summary", sa.Text),
        sa.Column("recommended_next_action", sa.Text),
        sa.Column("recommended_opening_line", sa.Text),
        sa.Column("benefits_covered", JSONB, nullable=False, server_default="[]"),
        sa.Column("transcript", JSONB, nullable=False, server_default="[]"),
        sa.Column("processed", sa.Boolean, nullable=False, server_default="false"),
    )
    op.create_index("ix_calls_lead_id", "calls", ["lead_id"])

    op.create_table(
        "call_scores",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("call_id", UUID(as_uuid=False), sa.ForeignKey("calls.id"), nullable=False, unique=True),
        sa.Column("interest_score", sa.Float, nullable=False),
        sa.Column("readiness_score", sa.Float, nullable=False),
        sa.Column("network_size", sa.String(20), nullable=False),
        sa.Column("network_evidence", JSONB, nullable=False, server_default="[]"),
        sa.Column("interest_evidence", JSONB, nullable=False, server_default="[]"),
        sa.Column("readiness_evidence", JSONB, nullable=False, server_default="[]"),
    )

    op.create_table(
        "objections",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("call_id", UUID(as_uuid=False), sa.ForeignKey("calls.id"), nullable=False),
        sa.Column("type", sa.String(200), nullable=False),
        sa.Column("raised_at_turn", sa.Integer, nullable=False),
        sa.Column("resolution_status", sa.String(20), nullable=False),
    )
    op.create_index("ix_objections_call_id", "objections", ["call_id"])

    op.create_table(
        "whatsapp_messages",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("call_id", UUID(as_uuid=False), sa.ForeignKey("calls.id"), nullable=False, unique=True),
        sa.Column("message_text", sa.Text, nullable=False),
        sa.Column("link", sa.String(500), nullable=False),
        sa.Column("language", sa.String(20), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("clicked_at", sa.DateTime(timezone=True)),
        sa.Column("twilio_sid", sa.String(100)),
    )

    op.create_table(
        "rm_handoffs",
        sa.Column("id", UUID(as_uuid=False), primary_key=True),
        sa.Column("call_id", UUID(as_uuid=False), sa.ForeignKey("calls.id"), nullable=False, unique=True),
        sa.Column("brief", sa.Text, nullable=False),
        sa.Column("interest_score", sa.Float, nullable=False),
        sa.Column("readiness_score", sa.Float, nullable=False),
        sa.Column("recommended_opening_line", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("rm_handoffs")
    op.drop_table("whatsapp_messages")
    op.drop_table("objections")
    op.drop_table("call_scores")
    op.drop_table("calls")
    op.drop_table("leads")
