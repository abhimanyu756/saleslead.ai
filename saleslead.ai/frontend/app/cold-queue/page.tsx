"use client";

import { useEffect, useState } from "react";
import { Snowflake, ChevronDown, ChevronUp, MessageCircle, User, Clock, RotateCw } from "lucide-react";
import { api, Lead, Call } from "@/lib/api";
import Link from "next/link";

type ColdItem = { lead: Lead; call: Call };

function reasonFromCall(c: Call): string {
  const turns = c.transcript?.length ?? 0;
  if (turns <= 2) return "Cut call without conversation";
  const interest = c.score?.interest_score ?? 0;
  if (interest <= 3) return "Clearly not interested";
  if (interest <= 5) return "Polite but disengaged";
  return "Low readiness — no network or not ready to commit";
}

export default function ColdQueuePage() {
  const [items, setItems] = useState<ColdItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getLeads(), api.getCalls()])
      .then(([leads, calls]) => {
        const coldCalls = calls.filter((c) => c.classification === "Cold");
        const result: ColdItem[] = [];
        for (const call of coldCalls) {
          const lead = leads.find((l) => l.id === call.lead_id);
          if (lead) result.push({ lead, call });
        }
        // Sort: shortest calls (no engagement) first
        result.sort((a, b) => (a.call.duration_s || 0) - (b.call.duration_s || 0));
        setItems(result);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Snowflake size={18} className="text-slate-400" />
            <h1 className="text-xl font-bold text-slate-900">Cold Queue</h1>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
              {items.length} leads
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Leads who hung up early or showed no interest. Re-engage after 30/60/90 days.
          </p>
        </div>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Snowflake size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No cold leads yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map(({ lead, call }) => {
          const isExpanded = expanded === call.id;
          const reason = reasonFromCall(call);
          const turns = call.transcript?.length ?? 0;

          return (
            <div
              key={call.id}
              className={`bg-white rounded-xl border transition-shadow ${
                isExpanded ? "border-slate-300 shadow-sm" : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <button
                className="w-full text-left px-5 py-4"
                onClick={() => setExpanded(isExpanded ? null : call.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <User size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-500">
                        {lead.phone} · {lead.language_pref} ·{" "}
                        {lead.broker_affiliation ?? "No prior broker"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Reason</p>
                      <span className="text-xs text-slate-700">{reason}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      {Math.floor(call.duration_s / 60)}m {call.duration_s % 60}s
                      <span className="ml-2">· {turns} turns</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={16} className="text-slate-400" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Summary
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {call.summary ?? "Processing…"}
                    </p>
                  </div>

                  {call.score && (call.score.interest_score > 0 || call.score.readiness_score > 0) && (
                    <div className="flex gap-6">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                          Interest
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {call.score.interest_score}/10
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                          Readiness
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {call.score.readiness_score}/10
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                          Network
                        </p>
                        <p className="text-sm font-bold text-slate-700 capitalize">
                          {call.score.network_size}
                        </p>
                      </div>
                    </div>
                  )}

                  {call.recommended_next_action && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        <RotateCw size={10} className="inline mr-1" />
                        Re-engagement Plan
                      </p>
                      <p className="text-sm text-slate-700">
                        {call.recommended_next_action}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Link
                      href={`/calls/${call.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <MessageCircle size={14} /> View Full Transcript
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
