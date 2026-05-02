# PRD: AI Voice Agent for Rupeezy Partner Lead Conversion

**Version:** 1.0
**Owner:** Hackathon Team — AI for Bharath
**Status:** Round 1 Submission Draft

---

## 1. Problem Understanding

Rupeezy's Authorized Partner (AP) program has a strong product — zero joining fee, 100% brokerage share, daily payouts via the RISE Portal — yet only **18% of incoming leads convert**. The gap is not the offer; it is the human-bandwidth layer between lead arrival and first contact.

Three structural failures repeat across every campaign:

1. **Timing decay.** Leads arriving outside business hours wait 12–60 hours before an RM dials. Industry data: a 5-minute response window converts ~9× better than 30 minutes. Most leads are cold before they ring.
2. **Language mismatch.** RMs cover 1–2 languages. India's partner-eligible audience speaks 8+. A Hindi-first lead given an English pitch disconnects in seconds.
3. **Capacity ceiling.** One RM = one call. A 200-lead overnight batch takes 3+ days to clear. By call #200, the lead has forgotten they signed up.

The 82% who don't convert are not rejecting the offer — most never hear it in a form they can act on. **An AI voice agent that is instant, multilingual, and infinitely parallel directly attacks all three failures.** The target is to lift conversion from 18% toward 40%+ by ensuring every lead receives a contextual, in-language pitch within minutes of arrival, with hot leads handed to RMs already pre-qualified.

---

## 2. Goals & Success Metrics

### Product Goals
- Contact 100% of new leads within **5 minutes** of arrival, 24/7.
- Conduct the call in the lead's preferred language with natural code-switching.
- Qualify and route leads (Hot / Warm / Cold) with full conversation context.
- Free RM time to focus exclusively on Hot leads.

### Success Metrics (North Star → Supporting)
| Metric | Baseline | Target |
|---|---|---|
| Lead → AP conversion rate | 18% | 40%+ |
| Median time-to-first-contact | 12+ hrs | <5 min |
| % leads contacted in preferred language | <40% | >90% |
| RM time spent on cold leads | High | ~0 |
| Hot lead → sign-up close rate | — | >50% |

### Demo-Day Success (Round 2)
A judge can: (1) trigger a simulated lead, (2) hear the agent open in the right language, (3) hear it handle 2–3 objections naturally, (4) see a Hot/Warm/Cold classification with evidence quotes, (5) see the RM dashboard populate with handoff context, (6) see a WhatsApp link generated for a Warm lead.

---

## 3. Users & Personas

- **The Lead** — an MFD, financial advisor, insurance agent, or finance influencer. Receives the call. Speaks Hindi/English/Hinglish or a regional language. May be skeptical, busy, or already with a competitor.
- **The Relationship Manager (RM)** — Rupeezy employee. Picks up Hot lead handoffs. Needs context fast: who called, what was discussed, which objections were raised, what to open with.
- **The Admin / Growth Lead** — uploads lead batches, monitors funnel health, reviews call summaries to improve the agent.

---

## 4. Functional Requirements

### 4.1 Lead Ingestion
- Bulk CSV upload (name, phone, language preference if known, source).
- Single lead form for ad-hoc adds.
- Auto-trigger agent within minutes of ingestion.

### 4.2 Voice Conversation (core)
- Real-time, two-way, streaming voice (browser-based for hackathon — clear migration path to telephony).
- Sub-second response latency to feel human.
- Interruption handling ("barge-in") — agent stops talking when lead speaks.
- Graceful turn-taking with natural pauses.

### 4.3 Multilingual Handling
- **Tier 1 (must-have):** Hindi, English, Hinglish.
- **Tier 2 (bonus):** Tamil, Telugu, Marathi, Gujarati, Bengali.
- Auto-detect language from the lead's first response; switch immediately.
- Mid-conversation switching: if lead changes language, agent follows within one turn.
- Code-mixing tolerance: a Hinglish lead saying "haan main interested hoon but commission kya hai?" gets a Hinglish response, not a forced single-language reply.

### 4.4 Sales Script Adherence (Appendix A)
- Open with the scripted hook in the lead's language.
- Cover the three core benefits: zero joining fee, 100% brokerage share, daily payouts.
- Use scripted rebuttals as **tonal references**, not verbatim — agent adapts wording to what the lead actually said.
- Close with a clear CTA: sign up now, schedule RM call, or receive WhatsApp link.

### 4.5 Objection Handling
The 5 core objections from Appendix A, each handled contextually:
1. "I'm already with another broker."
2. "I don't have enough contacts."
3. "What if my clients face issues — who handles support?"
4. "Is Rupeezy trustworthy?"
5. "I'll think about it / call me later."

The agent must:
- Acknowledge the objection in the lead's words.
- Reframe with a specific benefit (e.g., commission gap, support model, regulator licensing).
- Ask a follow-up question to keep the conversation moving, not just deliver a rebuttal and stop.

### 4.6 Lead Qualification & Scoring
At end of call, the agent emits a structured score across three dimensions:
- **Interest** (0–10): verbal cues — "tell me more", "kitna milega", asking concrete questions.
- **Readiness** (0–10): "I can sign up today" vs. "let me think" vs. "maybe next quarter".
- **Network size** (small / medium / large): based on stated client count or distribution reach.

Each score must include **evidence quotes** from the transcript. This is what makes the RM handoff useful.

**Classification thresholds:**
- **Hot:** Interest ≥7 AND Readiness ≥6 → RM handoff.
- **Warm:** Interest ≥5 OR Readiness ≥4 → WhatsApp sign-up link + nurture queue.
- **Cold:** below both → log for later re-engagement.

### 4.7 Multi-Turn Memory (Across Calls)
- Each lead has a persistent profile: prior call summaries, prior objections, prior score.
- On a follow-up call, the agent opens with awareness: *"Pichli baar aapne pucha tha support ke baare mein — main aaj usi pe clarify karna chahta hoon."*
- Prevents re-pitching the same script and signals respect for the lead's time.

### 4.8 RM Handoff
When a lead is classified Hot:
- Lead enters the **RM Hot Queue** in the dashboard.
- RM sees a one-screen brief:
  - 30-second summary in plain language.
  - Lead profile (broker affiliation, network size, language).
  - Objections raised + how the agent resolved them (or didn't).
  - Recommended opening line for the human call.
  - Full transcript available on demand (collapsed by default).
- A simulated "warm transfer" is acceptable for Round 2 (live transfer is a production feature).

### 4.9 WhatsApp Fallback
- Warm leads receive an auto-sent WhatsApp message with a personalized sign-up link within 60 seconds of call end.
- Message is in the lead's language and references the conversation: *"Thanks for the chat, Rajesh ji. Yahan se sign up kar sakte hain — zero joining fee, daily payout."*
- Hackathon: simulate via WhatsApp Business API sandbox or Twilio.

### 4.10 Post-Call Summary
For every conversation, persisted to DB and viewable in dashboard:
- Lead ID, timestamp, duration.
- Language(s) used.
- Topics covered (benefits, eligibility, payouts, etc.).
- Objections raised + resolution status.
- Interest / Readiness / Network scores + evidence.
- Final classification (Hot / Warm / Cold).
- Recommended next action.
- Full transcript (collapsible).

### 4.11 Admin Dashboard
- Funnel view: Ingested → Contacted → Qualified → Handed-off → Signed-up.
- Hot/Warm/Cold breakdown with drill-in to call summaries.
- Filter by date, language, source, RM.
- Search transcripts.

---

## 5. Multilingual Conversation Approach

**Detection:** The agent opens in the lead's **declared** language preference (from CSV) if available; otherwise opens with a bilingual Hindi+English greeting and detects from the first response. Detection runs on every turn, not just turn 1.

**Switching:** Language is a per-turn decision, not a session-locked setting. If the lead drops into Hinglish mid-call, the agent follows. The system prompt explicitly instructs Claude: *"Match the lead's language and register on every turn. If they code-mix, code-mix back."*

**Code-mixing:** This is the hardest case. Pure Hindi STTs mis-segment Hinglish. Approach:
- Use ElevenLabs Scribe or Sarvam's multilingual mode (handles Devanagari + romanized Hindi + English in one pass).
- Pass raw transcripts to Claude, which is robust to mixed scripts and produces natural Hinglish responses.
- For TTS, use a multilingual voice that handles English words inside Hindi sentences without sounding broken.

**Regional languages (bonus):** Add Sarvam TTS as a routing layer for Tamil/Telugu/Marathi/Gujarati/Bengali calls — Sarvam is purpose-built for these and out-performs ElevenLabs on Indian-language naturalness.

---

## 6. Objection Handling Approach

The trap is treating Appendix A as a script-retrieval database — the agent ends up reading rebuttals verbatim and sounds like a robocaller.

**Our approach:** Appendix A goes into Claude's **system prompt** as labeled few-shot examples with explicit framing:

> These are tonal references, not lines to read. For each objection, the example shows the *kind* of response — acknowledge, reframe with a specific benefit, ask a follow-up. Adapt the wording to what the lead actually said. Never read these verbatim.

Each objection in the prompt has:
- Trigger phrases (in Hindi, English, Hinglish).
- The reframe angle (e.g., "I'm with another broker" → commission gap + daily payout differentiator).
- A follow-up question template ("kya aapko 100% brokerage milta hai abhi?").

**Adaptive behavior** comes from the LLM, not a state machine. Claude sees the full conversation history every turn and can:
- Reference earlier statements ("aapne kaha tha 50 clients hain — uske liye monthly payout matter karta hai, daily payout aapka cash flow change karega").
- Skip objections already addressed.
- Escalate or soften based on lead tone (frustration → more empathetic; excitement → push for sign-up).

**Prompt caching** keeps Appendix A + system prompt in Anthropic's cache between turns — turn latency drops ~80% and cost drops accordingly.

---

## 7. Lead Qualification Model

**Design principle:** Don't train a classifier. Use Claude as a structured scorer at end of call.

### Inputs
- Full call transcript.
- Conversation duration.
- Number of agent turns vs. lead turns (engagement signal).
- Objections raised and resolution status.
- Stated facts about the lead (current broker, client count, sign-up timeline).

### Output (structured JSON)
```json
{
  "interest_score": 8,
  "interest_evidence": ["asked about commission rates twice", "asked how to sign up"],
  "readiness_score": 7,
  "readiness_evidence": ["said 'main aaj sign up kar sakta hoon'"],
  "network_size": "medium",
  "network_evidence": ["mentioned ~80 clients in Pune"],
  "classification": "Hot",
  "recommended_next_action": "RM call within 2 hours, open with payout structure",
  "language_preference": "Hinglish"
}
```

### Why evidence quotes matter
The RM doesn't just see "Hot" — they see *why*. This converts handoff from a label into a briefing. A skeptical RM will trust the system if they can audit the reasoning in 10 seconds.

### Calibration
Thresholds are tunable in config. We start with the values in §4.6 and re-calibrate from Round 2 demo data and any sample lead data Rupeezy provides.

### Multi-turn memory
Lead profile in Postgres carries prior call data forward. On follow-up calls, the prior summary is injected into the system prompt as context. The agent acknowledges history rather than restarting.

---

## 8. Handoff Design

### Hot Lead → RM
Trigger: classification = Hot.
1. Lead enters RM Hot Queue (sorted by score, then recency).
2. Push notification / dashboard badge to assigned RM.
3. RM clicks the lead → sees the **handoff brief**:
   - Header: name, phone, language, score.
   - 30-second summary (Claude-generated, plain prose).
   - "Why this lead is Hot" — the evidence quotes.
   - Objections raised + status (resolved / partial / open).
   - **Recommended opening line** for the RM's first call.
   - Collapsed transcript with timestamps.
4. RM clicks "Call Lead" — for hackathon, simulated; in production, click-to-dial.

### Warm Lead → WhatsApp
Trigger: classification = Warm.
1. WhatsApp message auto-sent within 60s of call end.
2. Personalized: language matches, references the conversation, includes a unique sign-up link tied to the lead ID.
3. Link opens the AP onboarding flow (mocked for hackathon).
4. Nurture queue re-engages after 48h if no click.

### Cold Lead
Logged with full summary. Re-engagement scheduled at 30/60/90 days based on stated reason for declining.

### WhatsApp Follow-up (also for Hot, post-RM-close)
After RM closes a Hot lead, an auto-WhatsApp goes to the *end customer* (the lead's downstream client) with onboarding info — this is the production-facing piece mentioned in the brief.

---

## 9. Architecture Overview

```
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  Lead Source     │────▶│  Lead Ingestion    │────▶│  Job Queue       │
│  (CSV / form)    │     │  (FastAPI)         │     │  (Redis / RQ)    │
└──────────────────┘     └────────────────────┘     └──────────────────┘
                                                              │
                                                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Voice Agent Orchestrator                          │
│                                                                      │
│   Browser (WebRTC) ◀──▶  ElevenLabs Conversational AI                │
│                          ├─ Streaming STT (Scribe)                   │
│                          ├─ Turn-taking + barge-in                   │
│                          ├─ Streaming TTS (multilingual v2)          │
│                          └─ LLM hook ──▶ Claude Sonnet 4.6           │
│                                          (system prompt = Appendix A │
│                                           + lead profile + memory)   │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Post-Call Pipeline                                │
│  Transcript ──▶ Claude (summarize + score) ──▶ Postgres              │
│                                                  │                   │
│                            ┌─────────────────────┼──────────────┐    │
│                            ▼                     ▼              ▼    │
│                      Hot → RM Queue        Warm → WhatsApp  Cold→Log │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Admin Dashboard (Next.js)                               │
│   Funnel · Hot Queue · Call Summaries · Transcripts · Filters        │
└──────────────────────────────────────────────────────────────────────┘
```

### Components
- **Frontend**: Next.js — admin dashboard + lead-side voice page (WebRTC mic).
- **Voice spine**: ElevenLabs Conversational AI — bundles STT + turn-taking + TTS. Custom LLM hook routes to Claude.
- **LLM**: Claude Sonnet 4.6 via Anthropic SDK with prompt caching enabled.
- **Backend**: FastAPI (Python) — ingestion, job queue, dashboard API, post-call pipeline.
- **DB**: Postgres — leads, calls, transcripts, summaries, scores.
- **Queue**: Redis + RQ — async post-call processing and WhatsApp dispatch.
- **WhatsApp**: Twilio WhatsApp API (sandbox for hackathon).

---

## 10. Technology Choices & Rationale

| Layer | Choice | Why |
|---|---|---|
| LLM | **Claude Sonnet 4.6** | Strongest instruction-following for "use script as guide, not verbatim". Excellent multilingual including Hindi/Hinglish. Prompt caching slashes per-turn latency and cost. |
| Voice spine | **ElevenLabs Conversational AI** | Solves turn-taking, barge-in, sub-1s latency out of the box — saves ~50% of build time vs. wiring STT/LLM/TTS by hand. Bring-your-own-LLM lets us still use Claude. |
| STT | ElevenLabs Scribe (default), **Sarvam Saarika** (regional bonus) | Scribe handles Hindi/Hinglish acceptably; Sarvam is best-in-class for Indian regional. |
| TTS | ElevenLabs Multilingual v2 (default), **Sarvam Bulbul** (regional bonus) | ElevenLabs sounds natural for Hindi+English; Sarvam's Bulbul is more native-sounding for Tamil/Telugu/etc. |
| Backend | **FastAPI (Python)** | Clean async streaming, fast to ship, ecosystem fits Anthropic + ElevenLabs SDKs. |
| Frontend | **Next.js + Tailwind** | Fast scaffolding, server actions for the API, judge-friendly polish. |
| DB | **Postgres** | Relational fits leads/calls/scores cleanly; JSONB for transcripts and structured scores. |
| Queue | **Redis + RQ** | Lightweight, sufficient for hackathon scale. |
| WhatsApp | **Twilio WhatsApp Sandbox** | Free tier, instant setup, demo-ready. |
| Hosting | **Railway / Render** | Single-click deploy, Postgres + Redis included. |

### Rejected alternatives
- *Building voice pipeline from scratch (Deepgram + LLM + Cartesia)*: 2× the engineering for marginal latency gains. Skip for hackathon, revisit for production cost optimization.
- *Vector DB for Appendix A*: script is small enough for system prompt; RAG adds latency and complexity for no gain.
- *Fine-tuned classifier for scoring*: Claude with structured output + evidence quotes is faster to build and more interpretable.

---

## 11. Data Model (sketch)

```
leads
  id, name, phone, language_pref, source, created_at,
  current_classification, last_call_at

calls
  id, lead_id, started_at, ended_at, duration_s,
  language_used, transcript_jsonb, summary_text,
  interest_score, readiness_score, network_size,
  classification, evidence_jsonb, recommended_action

objections
  id, call_id, type (one of 5), raised_at_turn,
  resolution_status (resolved/partial/open)

handoffs
  id, lead_id, call_id, rm_id, status, handed_off_at, picked_up_at

whatsapp_messages
  id, lead_id, message_text, link, sent_at, clicked_at
```

---

## 12. Risks & Tradeoffs

| Risk | Impact | Mitigation |
|---|---|---|
| **Voice latency >1s breaks the illusion** | High | ElevenLabs Conv AI handles streaming; prompt caching keeps LLM turn under 400ms; test under realistic network early. |
| **Hinglish STT mis-segmentation** | Medium | Test Scribe + Sarvam on 20 sample utterances day 1. Pick the better one. Pass raw transcripts to Claude — it tolerates noise. |
| **Agent sounds scripted / robotic** | High | Few-shot framing in system prompt, not retrieval. Explicit instruction: "never read the example verbatim." Test with adversarial prompts. |
| **Live demo fails on stage** | Existential | Build text-chat parity from day 1. Pre-record a fallback voice demo. Have local-network deployment as backup to cloud. |
| **Lead privacy / consent** | Medium (production) | Out of scope for hackathon, but flag in roadmap: consent capture, recording disclosure, DPDP Act compliance. |
| **Hallucinated facts** (e.g., wrong commission rates) | High | System prompt locks in canonical facts from Appendix A; Claude tool-call to fetch current rates if they ever change. Add a fact-check pass on summaries before RM handoff. |
| **Cost at scale** | Medium | ElevenLabs Conv AI is ~$0.08/min; Claude with caching ~$0.02/min. ~$0.10/min × 5min avg call = $0.50/lead. Acceptable at current conversion math. |
| **RM trust in AI scoring** | Medium | Always show evidence quotes. Let RM override classification — feedback loop for tuning thresholds. |

---

## 13. Round 2 Implementation Plan

Assuming Appendix A and sample lead data are provided at Round 2 kickoff.

### Day 1 — Foundation (8 hrs)
- Repo scaffold: FastAPI + Next.js + Postgres in Docker Compose.
- ElevenLabs Conv AI agent provisioned, Claude wired as LLM backend.
- Appendix A → system prompt with structured objection few-shots.
- Hello-world voice loop: browser → agent → Claude → response in Hindi & English.
- **Milestone:** can hold a 1-minute conversation in two languages.

### Day 2 — Conversation Quality (8 hrs)
- Full objection prompt design + adversarial testing on all 5.
- Hinglish + code-mixing tests; tune system prompt language instructions.
- Lead profile injection into system prompt (multi-turn memory groundwork).
- Interruption handling verified.
- **Milestone:** agent handles all 5 objections naturally in 3 languages.

### Day 3 — Scoring & Handoff (8 hrs)
- Post-call pipeline: transcript → Claude scorer → Postgres.
- RM handoff brief UI in Next.js dashboard.
- WhatsApp dispatcher (Twilio sandbox) with templated messages.
- Funnel dashboard with Hot/Warm/Cold breakdown.
- **Milestone:** end-to-end demo from lead upload → call → classification → handoff or WhatsApp.

### Day 4 — Polish & Demo (8 hrs)
- Regional language bonus: route Tamil/Telugu calls through Sarvam.
- Multi-call memory: second call to same lead acknowledges prior conversation.
- Dashboard polish: filters, search, transcript viewer.
- Demo script + 3 pre-loaded lead personas (engaged Hindi MFD, skeptical English advisor, busy Hinglish influencer).
- Pre-recorded fallback video.
- **Milestone:** judge-ready demo with 3 live scenarios.

### Stretch
- Live click-to-dial RM handoff via Twilio Voice.
- Sentiment heat-map on transcript.
- A/B test two opening hooks and report which converts better.

---

## 14. Out of Scope (Hackathon)

- Live PSTN telephony integration (browser voice is sufficient per brief).
- Production-grade authentication / RBAC.
- DPDP / consent recording compliance flow.
- CRM integrations (Salesforce, HubSpot).
- Real WhatsApp Business API approval (sandbox is fine).
- Native mobile RM app.

These are flagged for a production roadmap, not built during the hackathon.

---

## 15. Open Questions

1. Will Rupeezy share real anonymized call recordings for prompt tuning?
2. What is the canonical brokerage rate / payout schedule to lock into the prompt?
3. Are RM language coverage and shift schedules available, to calibrate when AI must take over vs. queue for a human?
4. WhatsApp template approval — is there a pre-approved AP onboarding template, or do we draft new ones?
