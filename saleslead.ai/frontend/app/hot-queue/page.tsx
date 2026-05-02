"use client";

import { useState } from "react";
import { Flame, ChevronDown, ChevronUp, Phone, MessageCircle, User, Clock, Network } from "lucide-react";
import { MOCK_LEADS } from "@/lib/mock-data";
import Link from "next/link";

const HOT_LEADS = MOCK_LEADS.filter((l) => l.current_classification === "Hot");

function ScoreDot({ score }: { score: number }) {
  const color = score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-slate-300";
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-sm font-bold text-slate-900">{score}/10</span>
    </div>
  );
}

function ObjectionPill({ type, status }: { type: string; status: string }) {
  const color =
    status === "resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
    status === "partial" ? "bg-amber-50 text-amber-700 border-amber-100" :
    "bg-red-50 text-red-600 border-red-100";
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${color}`}>
      {type} · {status}
    </span>
  );
}

export default function HotQueuePage() {
  const [expanded, setExpanded] = useState<string | null>(HOT_LEADS[0]?.id ?? null);
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set());

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900">Hot Queue</h1>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
              {HOT_LEADS.length} leads
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">High-intent leads ready for RM follow-up</p>
        </div>
      </div>

      {HOT_LEADS.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Flame size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No hot leads right now. Check back soon.</p>
        </div>
      )}

      <div className="space-y-4">
        {HOT_LEADS.map((lead) => {
          const call = lead.calls[0];
          if (!call) return null;
          const isExpanded = expanded === lead.id;
          const isCalled = calledIds.has(lead.id);

          return (
            <div key={lead.id} className={`bg-white rounded-xl border transition-shadow ${isExpanded ? "border-amber-200 shadow-md" : "border-slate-100 hover:border-slate-200"}`}>
              {/* Header row */}
              <button
                className="w-full text-left px-5 py-4"
                onClick={() => setExpanded(isExpanded ? null : lead.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <User size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.phone} · {lead.language_pref} · {lead.broker_affiliation ?? "No prior broker"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Interest</p>
                      <ScoreDot score={call.score.interest_score} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Readiness</p>
                      <ScoreDot score={call.score.readiness_score} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Network</p>
                      <span className="text-sm font-bold text-slate-900 capitalize">{call.score.network_size}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      {Math.floor(call.duration_s / 60)}m {call.duration_s % 60}s
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>
              </button>

              {/* Expanded brief */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-5 border-t border-slate-100 pt-4">
                  {/* Summary */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">30-second Summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{call.summary}</p>
                  </div>

                  {/* Evidence */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-2">Interest Evidence</p>
                      <ul className="space-y-1">
                        {call.score.interest_evidence.map((e, i) => (
                          <li key={i} className="text-xs text-emerald-800 flex gap-1.5">
                            <span className="mt-0.5">›</span>{e}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-2">Readiness Evidence</p>
                      <ul className="space-y-1">
                        {call.score.readiness_evidence.map((e, i) => (
                          <li key={i} className="text-xs text-blue-800 flex gap-1.5">
                            <span className="mt-0.5">›</span>{e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Objections */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Objections Raised</p>
                    <div className="flex flex-wrap gap-2">
                      {call.objections.map((o, i) => (
                        <ObjectionPill key={i} type={o.type} status={o.resolution_status} />
                      ))}
                    </div>
                  </div>

                  {/* Network */}
                  <div className="flex items-start gap-2">
                    <Network size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Network Evidence</p>
                      {call.score.network_evidence.map((e, i) => (
                        <p key={i} className="text-xs text-slate-600">{e}</p>
                      ))}
                    </div>
                  </div>

                  {/* Recommended opening line */}
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Recommended Opening Line for RM</p>
                    <p className="text-sm text-amber-900 italic">"{call.recommended_opening_line}"</p>
                  </div>

                  {/* Next action */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Recommended Next Action</p>
                    <p className="text-sm text-slate-700">{call.recommended_next_action}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setCalledIds(new Set([...calledIds, lead.id]))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isCalled
                          ? "bg-emerald-100 text-emerald-700 cursor-default"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      <Phone size={14} />
                      {isCalled ? "Called ✓" : "Call Lead"}
                    </button>
                    <Link
                      href={`/calls/${call.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <MessageCircle size={14} />
                      View Full Transcript
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
