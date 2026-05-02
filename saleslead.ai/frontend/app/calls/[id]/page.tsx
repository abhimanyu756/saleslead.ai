"use client";

import { use, useEffect, useState } from "react";
import { api, Lead, Call } from "@/lib/api";
import { ArrowLeft, Clock, Globe, User, ChevronDown, ChevronUp, CheckCircle, AlertCircle, MinusCircle, Circle, MessageCircle, Send, ExternalLink, Zap } from "lucide-react";
import Link from "next/link";

const ALL_5_OBJECTIONS = [
  "I'm already with another broker",
  "I don't have enough contacts",
  "What if my clients face issues — who handles support?",
  "Is Rupeezy trustworthy?",
  "I'll think about it / call me later",
];

function classificationBadge(c: string) {
  if (c === "Hot") return "bg-amber-100 text-amber-700 border-amber-200";
  if (c === "Warm") return "bg-indigo-100 text-indigo-700 border-indigo-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

function ctaBadge(cta: string) {
  if (cta === "signed_up") return { label: "Signed Up", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle };
  if (cta === "rm_scheduled") return { label: "RM Scheduled", cls: "bg-amber-100 text-amber-700", icon: Zap };
  if (cta === "whatsapp_sent") return { label: "WhatsApp Sent", cls: "bg-indigo-100 text-indigo-700", icon: Send };
  return { label: "No Action", cls: "bg-slate-100 text-slate-500", icon: MinusCircle };
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-400" : "bg-slate-300";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold text-slate-900">{score}/10</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score * 10}%` }} />
      </div>
    </div>
  );
}

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [call, setCall] = useState<Call | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(true);

  useEffect(() => {
    api.getCall(id)
      .then(async (c) => {
        setCall(c);
        const l = await api.getLead(c.lead_id);
        setLead(l);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-400">Loading...</div>
    );
  }

  if (!call || !lead) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Call not found.</p>
        <Link href="/calls" className="text-sm text-indigo-600 hover:underline mt-2 block">← Back to calls</Link>
      </div>
    );
  }

  const cta = ctaBadge(call.cta_outcome);
  const CtaIcon = cta.icon;
  const raisedObjections = new Map(call.objections.map((o) => [o.type, o]));

  return (
    <div className="p-6 space-y-6">
      <Link href="/calls" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={14} /> Back to Calls
      </Link>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={20} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{lead.name}</h1>
              <p className="text-sm text-slate-500">{lead.phone} · {lead.broker_affiliation ?? "No prior broker"}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Globe size={11} /> {call.language_used}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={11} /> {Math.floor(call.duration_s / 60)}m {call.duration_s % 60}s
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(call.started_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cta.cls}`}>
              <CtaIcon size={12} /> {cta.label}
            </span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full border ${classificationBadge(call.classification)}`}>
              {call.classification}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Call Summary</p>
          <p className="text-sm text-slate-700 leading-relaxed">{call.summary ?? "Processing..."}</p>
        </div>

        {call.benefits_covered.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Benefits Pitched</p>
            <div className="flex gap-2 flex-wrap">
              {["Zero joining fee", "100% brokerage share", "Daily payouts"].map((b) => {
                const covered = call.benefits_covered.includes(b);
                return (
                  <span key={b} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${covered ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400 line-through"}`}>
                    {covered ? <CheckCircle size={10} /> : <Circle size={10} />}
                    {b}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {call.recommended_next_action && (
          <div className="mt-4 bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Next Action</p>
            <p className="text-sm text-slate-700">{call.recommended_next_action}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Scores */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Lead Scores</h2>
          {call.score ? (
            <>
              <ScoreBar score={call.score.interest_score} label="Interest" />
              <ScoreBar score={call.score.readiness_score} label="Readiness" />

              <div className="pt-1">
                <p className="text-xs text-slate-500 font-medium mb-1">Network Size</p>
                <span className="capitalize text-sm font-bold text-slate-900">{call.score.network_size}</span>
                <ul className="mt-1 space-y-0.5">
                  {call.score.network_evidence.map((e, i) => (
                    <li key={i} className="text-xs text-slate-500 flex gap-1.5"><span>›</span>{e}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Interest Evidence</p>
                  {call.score.interest_evidence.map((e, i) => (
                    <p key={i} className="text-xs text-slate-600 flex gap-1.5 mb-0.5"><span className="text-emerald-500">›</span>{e}</p>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Readiness Evidence</p>
                  {call.score.readiness_evidence.map((e, i) => (
                    <p key={i} className="text-xs text-slate-600 flex gap-1.5 mb-0.5"><span className="text-blue-500">›</span>{e}</p>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Scores processing...</p>
          )}
        </div>

        {/* Objections */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Objection Handling</h2>
            <span className="text-xs text-slate-400">{call.objections.length} of 5 raised</span>
          </div>
          <div className="space-y-2.5">
            {ALL_5_OBJECTIONS.map((objText, i) => {
              const raised = raisedObjections.get(objText);
              if (!raised) {
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 opacity-50">
                    <Circle size={15} className="text-slate-300 shrink-0" />
                    <p className="text-xs text-slate-500 flex-1">"{objText}"</p>
                    <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">not raised</span>
                  </div>
                );
              }
              const icon =
                raised.resolution_status === "resolved" ? <CheckCircle size={15} className="text-emerald-500 shrink-0" /> :
                raised.resolution_status === "partial" ? <AlertCircle size={15} className="text-amber-500 shrink-0" /> :
                <MinusCircle size={15} className="text-red-400 shrink-0" />;
              const rowBg =
                raised.resolution_status === "resolved" ? "bg-emerald-50 border border-emerald-100" :
                raised.resolution_status === "partial" ? "bg-amber-50 border border-amber-100" :
                "bg-red-50 border border-red-100";
              const statusColor =
                raised.resolution_status === "resolved" ? "text-emerald-700 bg-emerald-100" :
                raised.resolution_status === "partial" ? "text-amber-700 bg-amber-100" :
                "text-red-600 bg-red-100";
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${rowBg}`}>
                  {icon}
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-800">"{objText}"</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Raised at turn {raised.raised_at_turn}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusColor}`}>
                    {raised.resolution_status}
                  </span>
                </div>
              );
            })}
          </div>

          {call.recommended_opening_line && call.recommended_opening_line !== "N/A — signed up." && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Recommended RM Opening Line</p>
              <p className="text-sm text-amber-800 italic bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                "{call.recommended_opening_line}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp panel */}
      {call.whatsapp && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={16} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">WhatsApp Follow-up</h2>
            {call.whatsapp.clicked_at ? (
              <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium ml-auto">
                <CheckCircle size={10} /> Link Clicked
              </span>
            ) : (
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium ml-auto">
                Sent · Not clicked yet
              </span>
            )}
          </div>
          <div className="flex gap-6 items-start">
            <div className="bg-[#e9fbe8] rounded-2xl rounded-tl-none p-4 max-w-sm border border-[#c3f0c0]">
              <p className="text-sm text-slate-800 leading-relaxed">{call.whatsapp.message_text}</p>
              <div className="mt-3">
                <a
                  href={call.whatsapp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 font-medium w-fit"
                >
                  <ExternalLink size={11} /> Sign Up Link
                </a>
              </div>
              <div className="mt-3 flex gap-4 text-[10px] text-slate-400">
                <span>Sent {new Date(call.whatsapp.sent_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                <span>Language: {call.whatsapp.language}</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700">Personalised for {lead.name}</p>
              <p>› Sent in lead's language ({call.whatsapp.language})</p>
              <p>› References the call conversation</p>
              <p>› Unique sign-up link tied to lead ID</p>
              {call.whatsapp.clicked_at && (
                <p className="text-emerald-600 font-medium">› Clicked at {new Date(call.whatsapp.clicked_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
          onClick={() => setTranscriptOpen(!transcriptOpen)}
        >
          <h2 className="text-sm font-semibold text-slate-900">Full Transcript</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {call.transcript.length} turns
            {transcriptOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {transcriptOpen && (
          <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
            {call.transcript.length === 0 && (
              <p className="text-sm text-slate-400">No transcript available.</p>
            )}
            {call.transcript.map((turn, i) => (
              <div key={i} className={`flex gap-3 ${turn.speaker === "lead" ? "flex-row-reverse" : ""}`}>
                <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                  turn.speaker === "agent" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                }`}>
                  {turn.speaker === "agent" ? "AI" : lead.name[0]}
                </div>
                <div className={`max-w-[75%] space-y-0.5 ${turn.speaker === "lead" ? "flex flex-col items-end" : ""}`}>
                  <div className={`text-xs font-medium ${turn.speaker === "agent" ? "text-indigo-500" : "text-slate-500"}`}>
                    {turn.speaker === "agent" ? "Agent" : lead.name} · {turn.timestamp}
                  </div>
                  <div className={`text-sm px-3 py-2 rounded-xl leading-relaxed ${
                    turn.speaker === "agent" ? "bg-indigo-50 text-slate-800" : "bg-slate-100 text-slate-800"
                  }`}>
                    {turn.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
