"""Post-call Gemini scorer — receives full transcript, returns structured JSON."""

import json
from typing import Any

import google.generativeai as genai

from app.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-2.5-flash")

ALL_5_OBJECTIONS = [
    "I'm already with another broker",
    "I don't have enough contacts",
    "What if my clients face issues — who handles support?",
    "Is Rupeezy trustworthy?",
    "I'll think about it / call me later",
]

_SCORER_SYSTEM = """\
You are a sales-call analyser for Rupeezy's AP program.
Given a full call transcript, output ONLY valid JSON matching the schema below.
No markdown, no explanation — just JSON.

Schema:
{
  "interest_score": <1-10 float>,
  "readiness_score": <1-10 float>,
  "network_size": "small" | "medium" | "large",
  "network_evidence": ["<quote from transcript>", ...],
  "interest_evidence": ["<quote>", ...],
  "readiness_evidence": ["<quote>", ...],
  "classification": "Hot" | "Warm" | "Cold",
  "cta_outcome": "signed_up" | "rm_scheduled" | "whatsapp_sent" | "no_action",
  "benefits_covered": ["Zero joining fee", "100% brokerage share", "Daily payouts"],
  "objections": [
    {
      "type": "<one of the 5 standard objection strings>",
      "raised_at_turn": <int>,
      "resolution_status": "resolved" | "partial" | "unresolved"
    }
  ],
  "summary": "<2-3 sentence plain-English summary of the call>",
  "recommended_next_action": "<specific next step for RM or system>",
  "recommended_opening_line": "<personalised RM opening line, or N/A — signed up.>",
  "language_used": "<primary language detected>"
}

Classification rules:
- Hot  = interest_score >= 7 AND readiness_score >= 6
- Warm = interest_score >= 5 OR  readiness_score >= 4
- Cold = everything else
"""


async def score_call(transcript: list[dict[str, str]], lead_name: str) -> dict[str, Any]:
    transcript_text = "\n".join(
        f"[{t['speaker'].upper()}]: {t['text']}" for t in transcript
    )

    prompt = (
        _SCORER_SYSTEM
        + f"\n\nLead name: {lead_name}\n\nTranscript:\n{transcript_text}"
    )

    response = _model.generate_content(prompt)
    raw = response.text.strip()

    # Strip markdown code fences if Gemini adds them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    return json.loads(raw)
