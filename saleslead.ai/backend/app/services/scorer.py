"""Post-call Gemini scorer — receives full transcript, returns structured JSON."""

import json
from typing import Any

import google.generativeai as genai

from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel(
    "gemini-2.5-flash-lite",
    generation_config={
        "temperature": 0.3,
        "response_mime_type": "application/json",
    },
)

ALL_5_OBJECTIONS = [
    "I'm already with another broker",
    "I don't have enough contacts",
    "What if my clients face issues — who handles support?",
    "Is Rupeezy trustworthy?",
    "I'll think about it / call me later",
]

_SCORER_SYSTEM = """\
Analyse a Rupeezy AP-program sales call. Output ONLY this JSON, no prose, no markdown.

Rupeezy AP offers: zero joining fee, 100% brokerage, daily payouts.

Scoring (0-10):
- interest: 1-3 dismissive/cold, 4-5 polite, 6-7 engaged/asking, 8-10 excited/ready
- readiness: 1-3 no network/not ready, 4-5 hesitant, 6-7 open, 8-10 ready to sign up
- network_size: small (<10), medium (10-50), large (50+); infer if not stated

Classification:
- Hot = interest >= 7 AND readiness >= 6
- Warm = interest >= 5 OR readiness >= 4
- Cold = otherwise

Standard objection labels (use exactly):
"I'm already with another broker", "I don't have enough contacts",
"What if my clients face issues — who handles support?", "Is Rupeezy trustworthy?",
"I'll think about it / call me later"

Schema:
{
  "interest_score": <0-10>,
  "readiness_score": <0-10>,
  "network_size": "small"|"medium"|"large",
  "interest_evidence": ["<short quote>"],
  "readiness_evidence": ["<short quote>"],
  "network_evidence": ["<short quote>"],
  "classification": "Hot"|"Warm"|"Cold",
  "cta_outcome": "signed_up"|"rm_scheduled"|"whatsapp_sent"|"no_action",
  "benefits_covered": [],
  "objections": [{"type":"<exact label above>","raised_at_turn":<int>,"resolution_status":"resolved"|"partial"|"unresolved"}],
  "summary": "<2 sentences>",
  "recommended_next_action": "<short>",
  "recommended_opening_line": "<RM opener or 'N/A'>",
  "language_used": "<Hindi|English|Hinglish|Tamil|Telugu|Kannada|Marathi|Gujarati|Bengali>"
}
"""


async def score_call(transcript: list[dict[str, str]], lead_name: str) -> dict[str, Any]:
    if not transcript:
        return _empty_score()

    transcript_text = "\n".join(
        f"Turn {i+1} [{t['speaker'].upper()}]: {t['text']}"
        for i, t in enumerate(transcript)
    )

    prompt = (
        f"{_SCORER_SYSTEM}"
        f"\n\nLead name: {lead_name}"
        f"\nTotal turns: {len(transcript)}"
        f"\n\nFull Transcript:\n{transcript_text}"
    )

    response = _model.generate_content(prompt)
    raw = response.text.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip().rstrip("```").strip()

    return json.loads(raw)


def _empty_score() -> dict[str, Any]:
    return {
        "interest_score": 1.0,
        "readiness_score": 1.0,
        "network_size": "small",
        "network_evidence": [],
        "interest_evidence": [],
        "readiness_evidence": [],
        "classification": "Cold",
        "cta_outcome": "no_action",
        "benefits_covered": [],
        "objections": [],
        "summary": "Call ended without any conversation.",
        "recommended_next_action": "Re-engage after 60 days.",
        "recommended_opening_line": "N/A",
        "language_used": "Hindi",
    }
