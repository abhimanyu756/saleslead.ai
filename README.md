# AI Voice Agent for Rupeezy Partner Lead Conversion

An AI voice agent that contacts Rupeezy's incoming partner leads instantly, pitches the AP program in their language, handles objections, qualifies interest, and hands off Hot leads to human RMs — built for the AI for Bharath hackathon.

## The Problem

Only 18% of Rupeezy's partner leads convert today. The product is strong (zero joining fee, 100% brokerage share, daily payouts) — the gap is structural: leads sit untouched after-hours, RMs cover only 1–2 languages, and one RM handles one call at a time. We're targeting a lift to 40%+ by removing all three bottlenecks.

## What It Does

- Calls every new lead within 5 minutes, 24/7
- Speaks Hindi, English, Hinglish (+ Tamil, Telugu, Marathi, Gujarati, Bengali as bonus)
- Handles the 5 core objections contextually, not from a script
- Scores leads as Hot / Warm / Cold with evidence quotes
- Hands off Hot leads to RMs with a one-screen briefing
- Sends WhatsApp sign-up links to Warm leads automatically

## Stack

| Layer | Choice |
|---|---|
| Voice spine | ElevenLabs Conversational AI |
| LLM | Claude Sonnet 4.6 (with prompt caching) |
| Regional STT/TTS | Sarvam AI (Saarika + Bulbul) |
| Backend | FastAPI (Python) |
| Frontend | Next.js + Tailwind |
| DB / Queue | Postgres + Redis |
| WhatsApp | Twilio WhatsApp Sandbox |

## Project Status

**Round 1** — written solution submission. See [prd.md](prd.md) for the full design.

**Round 2** — implementation. 4-day plan outlined in the PRD §13.

## Repo Layout

```
.
├── prd.md          # Full product requirements doc
└── README.md       # You are here
```

## Team

AI for Bharath hackathon — 2–4 members.
