"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, ChevronDown, ChevronUp, MessageCircle, User, Clock, Network, CheckCircle, XCircle, RefreshCw, Phone, PhoneCall, Mail, MailCheck, AlertCircle } from "lucide-react";
import { api, Lead, Call } from "@/lib/api";
import Link from "next/link";
import { QueueFilters, DateRange, withinDateRange } from "@/components/QueueFilters";

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

type HotItem = { lead: Lead; call: Call };

export default function HotQueuePage() {
  const [items, setItems] = useState<HotItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingOutcome, setSavingOutcome] = useState<string | null>(null);
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set());

  // Filter state
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [language, setLanguage] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [broker, setBroker] = useState<string>("all");

  const availableLanguages = useMemo(
    () => Array.from(new Set(items.map((i) => i.lead.language_pref).filter(Boolean))).sort(),
    [items]
  );
  const availableSources = useMemo(
    () => Array.from(new Set(items.map((i) => i.lead.source).filter(Boolean) as string[])).sort(),
    [items]
  );
  const availableBrokers = useMemo(
    () => Array.from(new Set(items.map((i) => i.lead.broker_affiliation).filter(Boolean) as string[])).sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter(({ lead, call }) => {
      if (!withinDateRange(call.started_at, dateRange)) return false;
      if (language !== "all" && lead.language_pref !== language) return false;
      if (source !== "all" && lead.source !== source) return false;
      if (broker !== "all") {
        if (broker === "__none__" && lead.broker_affiliation) return false;
        if (broker !== "__none__" && lead.broker_affiliation !== broker) return false;
      }
      return true;
    });
  }, [items, dateRange, language, source, broker]);

  function handleCallLead(callId: string, leadName: string, phone: string, openingLine: string | null) {
    const opener = openingLine && openingLine !== "N/A" && openingLine !== "N/A — signed up."
      ? `\n\nSuggested opening line:\n"${openingLine}"`
      : "";
    const proceed = window.confirm(`📞 Dialing ${leadName}\n${phone}${opener}\n\n(Demo: no real call placed)`);
    if (proceed) {
      setCalledIds((prev) => new Set(prev).add(callId));
    }
  }

  async function loadData() {
    try {
      const [leads, calls] = await Promise.all([api.getLeads(), api.getCalls()]);
      const hotCalls = calls.filter((c) => c.classification === "Hot");
      const result: HotItem[] = [];
      for (const call of hotCalls) {
        const lead = leads.find((l) => l.id === call.lead_id);
        if (lead) result.push({ lead, call });
      }
      setItems(result);
      setExpanded((prev) => prev ?? result[0]?.call.id ?? null);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 5000);
    return () => clearInterval(id);
  }, []);

  async function setOutcome(callId: string, outcome: string) {
    setSavingOutcome(callId);
    try {
      await api.updateCallOutcome(callId, outcome);
      setItems((prev) =>
        prev.map((it) =>
          it.call.id === callId ? { ...it, call: { ...it.call, cta_outcome: outcome } } : it
        )
      );
    } catch (e) {
      alert("Failed to update outcome");
    } finally {
      setSavingOutcome(null);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900">Hot Queue</h1>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
              {filteredItems.length} leads
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">High-intent leads ready for RM follow-up</p>
        </div>
      </div>

      <QueueFilters
        dateRange={dateRange} setDateRange={setDateRange}
        language={language} setLanguage={setLanguage}
        source={source} setSource={setSource}
        broker={broker} setBroker={setBroker}
        availableLanguages={availableLanguages}
        availableSources={availableSources}
        availableBrokers={availableBrokers}
        totalCount={items.length}
        filteredCount={filteredItems.length}
      />

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Flame size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">{items.length === 0 ? "No hot leads right now. Complete a voice call to see data here." : "No leads match the current filters."}</p>
        </div>
      )}

      <div className="space-y-4">
        {filteredItems.map(({ lead, call }) => {
          const isExpanded = expanded === call.id;

          return (
            <div key={call.id} className={`bg-white rounded-xl border transition-shadow ${isExpanded ? "border-amber-200 shadow-md" : "border-slate-100 hover:border-slate-200"}`}>
              <button className="w-full text-left px-5 py-4" onClick={() => setExpanded(isExpanded ? null : call.id)}>
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
                      <ScoreDot score={call.score?.interest_score ?? 0} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Readiness</p>
                      <ScoreDot score={call.score?.readiness_score ?? 0} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Network</p>
                      <span className="text-sm font-bold text-slate-900 capitalize">{call.score?.network_size ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      {Math.floor(call.duration_s / 60)}m {call.duration_s % 60}s
                    </div>
                    {(() => {
                      const em = call.email;
                      if (!em) return null;
                      if (em.error) return (
                        <span className="flex items-center gap-1.5 text-[11px] bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-full font-medium" title={em.error}>
                          <AlertCircle size={11} /> Email failed
                        </span>
                      );
                      if (em.clicked_at) return (
                        <span className="flex items-center gap-1.5 text-[11px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium" title="Email link clicked">
                          <MailCheck size={11} /> Email clicked
                        </span>
                      );
                      return (
                        <span className="flex items-center gap-1.5 text-[11px] bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full font-medium" title="Email sent">
                          <Mail size={11} /> Email sent
                        </span>
                      );
                    })()}
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-5 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">30-second Summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{call.summary ?? "Processing..."}</p>
                  </div>

                  {call.score && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-2">Interest Evidence</p>
                        <ul className="space-y-1">
                          {call.score.interest_evidence.map((e, i) => (
                            <li key={i} className="text-xs text-emerald-800 flex gap-1.5"><span>›</span>{e}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-2">Readiness Evidence</p>
                        <ul className="space-y-1">
                          {call.score.readiness_evidence.map((e, i) => (
                            <li key={i} className="text-xs text-blue-800 flex gap-1.5"><span>›</span>{e}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {call.objections.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Objections Raised</p>
                      <div className="flex flex-wrap gap-2">
                        {call.objections.map((o, i) => <ObjectionPill key={i} type={o.type} status={o.resolution_status} />)}
                      </div>
                    </div>
                  )}

                  {(call.score?.network_evidence?.length ?? 0) > 0 && (
                    <div className="flex items-start gap-2">
                      <Network size={14} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Network Evidence</p>
                        {call.score?.network_evidence.map((e, i) => <p key={i} className="text-xs text-slate-600">{e}</p>)}
                      </div>
                    </div>
                  )}

                  {call.recommended_opening_line && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">Recommended Opening Line for RM</p>
                      <p className="text-sm text-amber-900 italic">"{call.recommended_opening_line}"</p>
                    </div>
                  )}

                  {call.recommended_next_action && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Recommended Next Action</p>
                      <p className="text-sm text-slate-700">{call.recommended_next_action}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">RM Action</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => handleCallLead(call.id, lead.name, lead.phone, call.recommended_opening_line)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          calledIds.has(call.id)
                            ? "bg-emerald-100 text-emerald-700 cursor-default"
                            : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                        }`}
                      >
                        {calledIds.has(call.id) ? (
                          <>
                            <PhoneCall size={13} /> Called ✓
                          </>
                        ) : (
                          <>
                            <Phone size={13} /> Call Lead
                          </>
                        )}
                      </button>
                      <span className="w-px bg-slate-200 mx-1" />
                      <button
                        onClick={() => setOutcome(call.id, "signed_up")}
                        disabled={savingOutcome === call.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          call.cta_outcome === "signed_up"
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        <CheckCircle size={13} /> Signed Up
                      </button>
                      <button
                        onClick={() => setOutcome(call.id, "follow_up")}
                        disabled={savingOutcome === call.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          call.cta_outcome === "follow_up"
                            ? "bg-amber-500 text-white"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                        }`}
                      >
                        <RefreshCw size={13} /> Follow Up
                      </button>
                      <button
                        onClick={() => setOutcome(call.id, "lost")}
                        disabled={savingOutcome === call.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          call.cta_outcome === "lost"
                            ? "bg-rose-600 text-white"
                            : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                        }`}
                      >
                        <XCircle size={13} /> Lost
                      </button>
                      <Link
                        href={`/calls/${call.id}`}
                        className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <MessageCircle size={13} /> Full Transcript
                      </Link>
                    </div>
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
