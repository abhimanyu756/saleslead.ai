"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Zap, Globe, CheckCircle, Send, ExternalLink, UserCheck } from "lucide-react";

type CallState = "idle" | "connecting" | "active" | "ended";

const DEMO_LEADS = [
  {
    name: "Rajesh Sharma",
    language: "Hinglish" as const,
    description: "MFD · 80 clients · currently with Zerodha",
    expectedCTA: "rm_scheduled" as const,
    classification: "Hot" as const,
  },
  {
    name: "Meera Iyer",
    language: "English" as const,
    description: "Insurance advisor · 20-30 contacts",
    expectedCTA: "whatsapp_sent" as const,
    classification: "Warm" as const,
  },
  {
    name: "Vikram Patel",
    language: "Hindi" as const,
    description: "Financial advisor · happy with Angel Broking",
    expectedCTA: "no_action" as const,
    classification: "Cold" as const,
  },
];

const LANGUAGE_DETECTION_STEPS: Record<string, { detected: string; confidence: number }[]> = {
  Hinglish: [
    { detected: "Detecting…", confidence: 0 },
    { detected: "Hindi", confidence: 60 },
    { detected: "Hinglish", confidence: 94 },
  ],
  English: [
    { detected: "Detecting…", confidence: 0 },
    { detected: "English", confidence: 98 },
  ],
  Hindi: [
    { detected: "Detecting…", confidence: 0 },
    { detected: "Hindi", confidence: 96 },
  ],
};

const TRANSCRIPT_BY_LEAD: Record<string, { speaker: "agent" | "lead"; text: string; benefit?: string; objection?: string }[]> = {
  "Rajesh Sharma": [
    { speaker: "agent", text: "Namaste Rajesh ji! Main Priya hoon, Rupeezy ki taraf se. Kya aapke paas 2 minute hain?" },
    { speaker: "lead", text: "Haan bolo, kya hai?" },
    { speaker: "agent", text: "Aapko Rupeezy ke Authorized Partner program ke baare mein batana chahti hoon — zero joining fee, 100% brokerage share, aur daily payouts.", benefit: "Zero joining fee · 100% brokerage · Daily payouts" },
    { speaker: "lead", text: "Main Zerodha ke saath hoon already. Koi nayi baat hai kya?", objection: "I'm already with another broker" },
    { speaker: "agent", text: "Zerodha mein aapko kitna brokerage milta hai? Rupeezy mein 100% milta hai — daily aapke account mein. Koi cut nahi." },
    { speaker: "lead", text: "100%? Commission kya hai exactly?" },
    { speaker: "agent", text: "Zero joining fee, aur brokerage ka 100% aapko milta hai. Aapke 80 clients hain, toh monthly difference significant hoga." },
    { speaker: "lead", text: "Sign up kaise karte hain?" },
    { speaker: "agent", text: "Ek RM aapko aaj ke andar call karega. Main aapka number confirm karta hoon." },
  ],
  "Meera Iyer": [
    { speaker: "agent", text: "Hi Meera! Calling from Rupeezy about our Authorized Partner program. Do you have a couple of minutes?" },
    { speaker: "lead", text: "Sure, what's this about?" },
    { speaker: "agent", text: "Zero joining fee, 100% brokerage share, daily payouts — we're looking for financial advisors to join as partners.", benefit: "Zero joining fee · 100% brokerage · Daily payouts" },
    { speaker: "lead", text: "I haven't heard of Rupeezy. Is this a legit company?", objection: "Is Rupeezy trustworthy?" },
    { speaker: "agent", text: "Rupeezy is SEBI-registered, operational 4+ years, part of Arihant Capital. I'll send you the registration details on WhatsApp right now." },
    { speaker: "lead", text: "I probably have 20-30 people who'd be open to it.", objection: "I don't have enough contacts" },
    { speaker: "agent", text: "That's a strong starting point. Most successful partners started with under 30 clients. Zero fee means zero risk." },
    { speaker: "lead", text: "Send me the link. Give me 2 days to check." },
    { speaker: "agent", text: "Sending you the WhatsApp link now — takes 5 minutes to sign up. I'll follow up in 48 hours." },
  ],
  "Vikram Patel": [
    { speaker: "agent", text: "Namaste Vikram ji! Rupeezy ke Authorized Partner program ke baare mein baat karna chahta tha. Kya 2 minute hain?" },
    { speaker: "lead", text: "Nahi bhai, abhi busy hoon. Baad mein call karo.", objection: "I'll think about it / call me later" },
    { speaker: "agent", text: "Bilkul Vikram ji — sirf itna: zero joining fee hai aur daily payout milta hai. Kabhi suna hai aisa?", benefit: "Zero joining fee" },
    { speaker: "lead", text: "Main Angel Broking se khush hoon. Abhi nahi chahiye.", objection: "I'm already with another broker" },
    { speaker: "agent", text: "Theek hai Vikram ji. WhatsApp pe details bhejta hoon — jab time mile dekh lena." },
  ],
};

const CTA_OUTCOMES: Record<string, { label: string; cls: string; icon: React.ElementType; detail: string }> = {
  rm_scheduled: {
    label: "RM Scheduled",
    cls: "bg-amber-50 border-amber-200",
    icon: UserCheck,
    detail: "Lead added to Hot Queue — RM will call within 2 hours with full briefing.",
  },
  whatsapp_sent: {
    label: "WhatsApp Sent",
    cls: "bg-[#e9fbe8] border-[#c3f0c0]",
    icon: Send,
    detail: "Personalised WhatsApp link sent in lead's language within 60 seconds.",
  },
  no_action: {
    label: "Cold — Re-engage in 60 days",
    cls: "bg-slate-50 border-slate-200",
    icon: PhoneOff,
    detail: "Lead logged. Re-engagement scheduled at 60 days based on stated reason.",
  },
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  Hot: "bg-amber-100 text-amber-700",
  Warm: "bg-indigo-100 text-indigo-700",
  Cold: "bg-slate-100 text-slate-500",
};

export default function VoicePage() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [selectedLead, setSelectedLead] = useState(0);
  const [muted, setMuted] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState<typeof TRANSCRIPT_BY_LEAD["Rajesh Sharma"]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [langStep, setLangStep] = useState(0);
  const [benefitsPitched, setBenefitsPitched] = useState<string[]>([]);
  const [objectionsRaised, setObjectionsRaised] = useState<string[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const lead = DEMO_LEADS[selectedLead];
  const lines = TRANSCRIPT_BY_LEAD[lead.name];
  const langSteps = LANGUAGE_DETECTION_STEPS[lead.language];
  const currentLang = langSteps[Math.min(langStep, langSteps.length - 1)];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState === "active") {
      interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Language detection animation
  useEffect(() => {
    if (callState !== "active") return;
    if (langStep >= langSteps.length - 1) return;
    const timeout = setTimeout(() => setLangStep((s) => s + 1), langStep === 0 ? 1200 : 2000);
    return () => clearTimeout(timeout);
  }, [callState, langStep, langSteps.length]);

  // Transcript replay
  useEffect(() => {
    if (callState !== "active") return;
    if (lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    const delay = lineIndex === 0 ? 900 : 2200;
    const timeout = setTimeout(() => {
      setAgentSpeaking(line.speaker === "agent");
      setTranscriptLines((prev) => [...prev, line]);
      if (line.benefit) setBenefitsPitched((prev) => [...new Set([...prev, line.benefit!])]);
      if (line.objection) setObjectionsRaised((prev) => [...new Set([...prev, line.objection!])]);
      setLineIndex((i) => i + 1);
      setTimeout(() => setAgentSpeaking(false), 1600);
    }, delay);
    return () => clearTimeout(timeout);
  }, [callState, lineIndex, lines]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptLines]);

  function startCall() {
    setCallState("connecting");
    setTranscriptLines([]);
    setLineIndex(0);
    setCallDuration(0);
    setAgentSpeaking(false);
    setLangStep(0);
    setBenefitsPitched([]);
    setObjectionsRaised([]);
    setTimeout(() => setCallState("active"), 1500);
  }

  function endCall() {
    setCallState("ended");
    setAgentSpeaking(false);
  }

  function formatDuration(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  const cta = CTA_OUTCOMES[lead.expectedCTA];
  const CtaIcon = cta.icon;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Voice Demo</h1>
        <p className="text-sm text-slate-500">Simulate a live agent call — ElevenLabs + Claude Sonnet 4.6 in production</p>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Left panel */}
        <div className="col-span-2 space-y-4">
          {/* Lead selector */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Select Demo Lead</p>
            <div className="space-y-2">
              {DEMO_LEADS.map((l, i) => (
                <button
                  key={i}
                  disabled={callState === "active" || callState === "connecting"}
                  onClick={() => setSelectedLead(i)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                    selectedLead === i
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{l.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${CLASSIFICATION_COLORS[l.classification]}`}>
                      {l.classification}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{l.language} · {l.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Call control */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 text-center">
            {/* Waveform */}
            <div className="flex items-center justify-center gap-1 h-12 mb-3">
              {callState === "active" && agentSpeaking ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-indigo-500 rounded-full animate-bounce"
                    style={{ height: `${10 + (i % 3) * 10}px`, animationDelay: `${i * 70}ms` }}
                  />
                ))
              ) : callState === "active" ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="w-1.5 bg-slate-200 rounded-full" style={{ height: "6px" }} />
                ))
              ) : callState === "connecting" ? (
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Mic size={20} className="text-slate-400" />
                </div>
              )}
            </div>

            <p className="text-xs font-medium text-slate-500 mb-1">
              {callState === "idle" && "Ready to call"}
              {callState === "connecting" && `Connecting to ${lead.name}…`}
              {callState === "active" && (agentSpeaking ? "Agent speaking" : "Listening…")}
              {callState === "ended" && "Call ended"}
            </p>
            {callState === "active" && (
              <p className="text-2xl font-mono font-bold text-slate-900">{formatDuration(callDuration)}</p>
            )}

            {/* Language detection */}
            {(callState === "active" || callState === "ended") && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <Globe size={12} className="text-slate-400" />
                <span className={`text-xs font-medium transition-colors ${currentLang.confidence >= 90 ? "text-emerald-600" : "text-slate-500"}`}>
                  {currentLang.detected}
                </span>
                {currentLang.confidence > 0 && (
                  <span className="text-[10px] text-slate-400">{currentLang.confidence}% confidence</span>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-center gap-3 mt-4">
              {callState === "active" && (
                <>
                  <button
                    onClick={() => setMuted(!muted)}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                      muted ? "bg-red-50 border-red-200 text-red-500" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    {muted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <button className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center">
                    <Volume2 size={16} />
                  </button>
                </>
              )}
              {(callState === "idle" || callState === "ended") && (
                <button
                  onClick={startCall}
                  className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  <Phone size={15} />
                  {callState === "ended" ? "New Call" : "Start Call"}
                </button>
              )}
              {callState === "connecting" && (
                <button onClick={() => setCallState("idle")} className="bg-slate-200 text-slate-600 px-5 py-2.5 rounded-full text-sm font-medium">
                  Cancel
                </button>
              )}
              {callState === "active" && (
                <button
                  onClick={endCall}
                  className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  <PhoneOff size={15} /> End Call
                </button>
              )}
            </div>
          </div>

          {/* Live call stats */}
          {(callState === "active" || callState === "ended") && (
            <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Stats</p>
              <div>
                <p className="text-[10px] text-slate-400 mb-1.5">Benefits Pitched</p>
                {["Zero joining fee", "100% brokerage share", "Daily payouts"].map((b) => {
                  const covered = benefitsPitched.some((p) => p.includes(b.split(" ")[0]));
                  return (
                    <div key={b} className={`flex items-center gap-2 text-xs mb-1 ${covered ? "text-emerald-700" : "text-slate-400"}`}>
                      <CheckCircle size={11} className={covered ? "text-emerald-500" : "text-slate-200"} />
                      {b}
                    </div>
                  );
                })}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1.5">Objections Handled</p>
                {objectionsRaised.length === 0 ? (
                  <p className="text-xs text-slate-400">None yet</p>
                ) : (
                  objectionsRaised.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-amber-700 mb-1">
                      <CheckCircle size={11} className="text-amber-500 shrink-0" />
                      <span className="truncate">{o}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Stack info */}
          <div className="bg-slate-900 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Production Stack</p>
            {[
              { label: "Voice", value: "ElevenLabs Conv AI" },
              { label: "LLM", value: "Claude Sonnet 4.6" },
              { label: "STT", value: "ElevenLabs Scribe" },
              { label: "Regional", value: "Sarvam AI (Bulbul)" },
              { label: "Latency", value: "<400ms / turn" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — transcript + post-call */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Transcript */}
          <div className="bg-white rounded-xl border border-slate-100 flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Live Transcript</h2>
              {callState === "active" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                </span>
              )}
            </div>

            <div ref={transcriptRef} className="flex-1 p-5 overflow-y-auto space-y-3 min-h-[300px] max-h-[380px]">
              {callState === "idle" && (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                    <Zap size={22} className="text-indigo-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Select a lead and start the call</p>
                  <p className="text-xs text-slate-400 mt-1">The AI opens in the lead's language and adapts in real-time</p>
                </div>
              )}
              {callState === "connecting" && (
                <div className="h-full flex items-center justify-center py-10">
                  <p className="text-sm text-slate-400 animate-pulse">Connecting to {lead.name}…</p>
                </div>
              )}
              {(callState === "active" || callState === "ended") && transcriptLines.map((line, i) => (
                <div key={i} className={`flex gap-3 ${line.speaker === "lead" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                    line.speaker === "agent" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    {line.speaker === "agent" ? "AI" : lead.name[0]}
                  </div>
                  <div className={`max-w-[80%] space-y-0.5 ${line.speaker === "lead" ? "flex flex-col items-end" : ""}`}>
                    <p className={`text-[10px] font-medium ${line.speaker === "agent" ? "text-indigo-400" : "text-slate-400"}`}>
                      {line.speaker === "agent" ? "AI Agent" : lead.name}
                    </p>
                    <div className={`text-sm px-3 py-2 rounded-xl leading-relaxed ${
                      line.speaker === "agent" ? "bg-indigo-50 text-slate-800" : "bg-slate-100 text-slate-800"
                    }`}>
                      {line.text}
                    </div>
                    {line.objection && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                        Objection: {line.objection}
                      </span>
                    )}
                    {line.benefit && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">
                        ✓ Pitched: {line.benefit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Post-call outcome — shown after call ends */}
          {callState === "ended" && (
            <div className={`rounded-xl border p-5 space-y-4 ${cta.cls}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CtaIcon size={18} className="text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">Call Outcome: {cta.label}</h3>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CLASSIFICATION_COLORS[lead.classification]}`}>
                  {lead.classification}
                </span>
              </div>

              <p className="text-sm text-slate-700">{cta.detail}</p>

              {/* CTA action */}
              {lead.expectedCTA === "rm_scheduled" && (
                <div className="bg-white rounded-lg border border-amber-200 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">RM Handoff Brief Generated</p>
                  <p className="text-xs text-slate-600">Interest: 8/10 · Readiness: 7/10 · Network: Medium (~80 clients)</p>
                  <p className="text-xs text-slate-500 mt-1 italic">Opening: "Rajesh ji, Zerodha se alag kya milega — main clearly batata hoon."</p>
                </div>
              )}

              {lead.expectedCTA === "whatsapp_sent" && (
                <div className="bg-[#e9fbe8] rounded-lg border border-[#c3f0c0] p-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">WhatsApp Sent</p>
                  <p className="text-xs text-slate-700">
                    Hi {lead.name}! Thanks for the chat today. Here's your sign-up link for Rupeezy's AP program — zero joining fee, 100% brokerage, daily payouts.
                  </p>
                  <div className="mt-2">
                    <a
                      href="#"
                      className="flex items-center gap-1.5 text-xs text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg font-medium w-fit"
                    >
                      <ExternalLink size={10} /> rupeezy.in/partner/signup
                    </a>
                  </div>
                </div>
              )}

              {lead.expectedCTA === "no_action" && (
                <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Re-engagement Scheduled</p>
                  <p className="text-xs text-slate-500">Next contact: ~60 days · Reason: satisfied with current broker</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                <span>Duration: {formatDuration(callDuration)}</span>
                <span>·</span>
                <span>Language: {lead.language}</span>
                <span>·</span>
                <span>Benefits pitched: {benefitsPitched.length > 0 ? benefitsPitched.join(", ") : "Partial"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
