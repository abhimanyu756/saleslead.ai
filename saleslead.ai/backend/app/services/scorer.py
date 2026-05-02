"""Post-call Claude scorer — receives full transcript, returns structured JSON."""

import json
from typing import Any

import anthropic

from app.config import settings

_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

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
  "benefits_covered": ["Zero joining fee", "100% brokerage share", "Daily payouts"],  // only those actually mentioned
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

    response = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": _SCORER_SYSTEM,
                "cache_control": {"type": "ephemeral"},  # prompt caching
            }
        ],
        messages=[
            {
                "role": "user",
                "content": f"Lead name: {lead_name}\n\nTranscript:\n{transcript_text}",
            }
        ],
    )

    raw = response.content[0].text.strip()
    return json.loads(raw)
