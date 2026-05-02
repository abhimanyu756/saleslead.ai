"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle, Clock, ExternalLink, ChevronDown, ChevronUp, Send, User } from "lucide-react";
import { MOCK_LEADS } from "@/lib/mock-data";
import Link from "next/link";

const WARM_LEADS = MOCK_LEADS.filter((l) => l.current_classification === "Warm");

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function WarmQueuePage() {
  const [expanded, setExpanded] = useState<string | null>(WARM_LEADS[0]?.id ?? null);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-indigo-500" />
            <h1 className="text-xl font-bold text-slate-900">Warm Queue</h1>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
              {WARM_LEADS.length} leads
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">WhatsApp follow-up sent — awaiting sign-up or nurture</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "WhatsApp Sent", value: WARM_LEADS.filter(l => l.calls[0]?.whatsapp).length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Link Clicked", value: WARM_LEADS.filter(l => l.calls[0]?.whatsapp?.clicked_at).length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Awaiting Response", value: WARM_LEADS.filter(l => l.calls[0]?.whatsapp && !l.calls[0]?.whatsapp?.clicked_at).length, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {WARM_LEADS.map((lead) => {
          const call = lead.calls[0];
          if (!call) return null;
          const wa = call.whatsapp;
          const isExpanded = expanded === lead.id;

          return (
            <div
              key={lead.id}
              className={`bg-white rounded-xl border transition-shadow ${isExpanded ? "border-indigo-200 shadow-md" : "border-slate-100 hover:border-slate-200"}`}
            >
              {/* Header */}
              <button
                className="w-full text-left px-5 py-4"
                onClick={() => setExpanded(isExpanded ? null : lead.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.phone} · {lead.language_pref}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Interest</p>
                      <p className="text-sm font-bold text-slate-900">{call.score.interest_score}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Readiness</p>
                      <p className="text-sm font-bold text-slate-900">{call.score.readiness_score}/10</p>
                    </div>
                    {/* WhatsApp status pill */}
                    {wa ? (
                      wa.clicked_at ? (
                        <span className="flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                          <CheckCircle size={11} /> Link Clicked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-medium">
                          <Send size={11} /> Sent {timeSince(wa.sent_at)}
                        </span>
                      )
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-5 border-t border-slate-100 pt-4">
                  {/* Call summary */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Call Summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{call.summary}</p>
                  </div>

                  {/* WhatsApp message preview */}
                  {wa && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">WhatsApp Message</p>
                      <div className="bg-[#e9fbe8] rounded-2xl rounded-tl-none p-4 max-w-sm border border-[#c3f0c0] relative">
                        <div className="absolute -top-2 -left-1 w-4 h-4 bg-[#e9fbe8] border-l border-t border-[#c3f0c0] rounded-tl-sm" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
                        <p className="text-sm text-slate-800 leading-relaxed">{wa.message_text}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <a
                            href={wa.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 font-medium"
                          >
                            <ExternalLink size={11} />
                            Sign Up Link
                          </a>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Sent {new Date(wa.sent_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                          {wa.clicked_at ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle size={10} /> Clicked {timeSince(wa.clicked_at)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Not yet clicked</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No WhatsApp yet */}
                  {!wa && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 flex items-center gap-3">
                      <Clock size={16} className="text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">WhatsApp pending</p>
                        <p className="text-xs text-amber-600">Message will be sent automatically within 60 seconds of classification</p>
                      </div>
                    </div>
                  )}

                  {/* Recommended next action */}
                  <div className="bg-slate-50 rounded-lg px-4 py-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Next Action</p>
                    <p className="text-sm text-slate-700">{call.recommended_next_action}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {!wa && (
                      <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                        <Send size={13} /> Send WhatsApp Now
                      </button>
                    )}
                    <Link
                      href={`/calls/${call.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <MessageCircle size={13} /> View Transcript
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
