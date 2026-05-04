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
You are an expert sales call analyser for Rupeezy's Authorized Partner (AP) program.
Analyse the transcript carefully and output ONLY valid JSON. No markdown, no explanation.

## Context
Rupeezy AP program offers: Zero joining fee, 100% brokerage share, Daily payouts.
The agent's job is to pitch this program, handle objections, and close with a CTA.

## Scoring Guidelines

### Interest Score (1-10)
1-3: Lead was clearly not interested, dismissive, or cut the call short
4-5: Lead listened politely but showed minimal engagement
6-7: Lead asked questions, showed curiosity, engaged meaningfully
8-9: Lead was excited, asked about next steps, very positive
10: Lead agreed to sign up immediately

### Readiness Score (1-10)
1-3: Lead has no contacts or is not at all ready to join
4-5: Lead has some contacts but is hesitant
6-7: Lead has a decent network and is open to joining
8-9: Lead is ready to sign up, just needs a nudge
10: Lead signed up during the call

### Network Size
- small: 0-10 contacts mentioned
- medium: 10-50 contacts mentioned
- large: 50+ contacts mentioned
- If not mentioned, infer from context (profession, experience)

### Classification Rules
- Hot  = interest_score >= 7 AND readiness_score >= 6
- Warm = interest_score >= 5 OR readiness_score >= 4
- Cold = everything else

## Summary Guidelines
Write a detailed 3-4 sentence summary covering:
1. How the call went overall (tone, engagement level)
2. Key points discussed and lead's reaction
3. Objections raised and how they were handled
4. What was agreed at the end (CTA outcome)

## Schema
{
  "interest_score": <1-10 float>,
  "readiness_score": <1-10 float>,
  "network_size": "small" | "medium" | "large",
  "network_evidence": ["<exact quote from transcript showing network size>"],
  "interest_evidence": ["<exact quote showing interest level>"],
  "readiness_evidence": ["<exact quote showing readiness>"],
  "classification": "Hot" | "Warm" | "Cold",
  "cta_outcome": "signed_up" | "rm_scheduled" | "whatsapp_sent" | "no_action",
  "benefits_covered": ["Zero joining fee", "100% brokerage share", "Daily payouts"],
  "objections": [
    {
      "type": "<one of the 5 standard objection strings>",
      "raised_at_turn": <int, 1-indexed turn number>,
      "resolution_status": "resolved" | "partial" | "unresolved"
    }
  ],
  "summary": "<detailed 3-4 sentence summary of the full call>",
  "recommended_next_action": "<specific actionable next step — e.g. 'RM to call within 2 hours', 'Send WhatsApp and follow up in 24h', 'Re-engage after 60 days'>",
  "recommended_opening_line": "<personalised opening line for RM based on call context, or 'N/A — signed up' if lead signed up>",
  "language_used": "<primary language used in the call — Hindi/English/Hinglish/Tamil/Telugu/Kannada/Marathi/Gujarati/Bengali>"
}

## Standard Objection Types (use exactly these strings)
1. "I'm already with another broker"
2. "I don't have enough contacts"
3. "What if my clients face issues — who handles support?"
4. "Is Rupeezy trustworthy?"
5. "I'll think about it / call me later"

Only include objections that were actually raised in the transcript.
If an objection was raised in a different language, still map it to the closest standard type.
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
