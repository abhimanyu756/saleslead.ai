"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, CheckCircle, Clock, ExternalLink, ChevronDown, ChevronUp, Send, User, Phone, PhoneCall, Mail, MailCheck, AlertCircle } from "lucide-react";
import { api, Lead, Call } from "@/lib/api";
import Link from "next/link";
import { QueueFilters, DateRange, withinDateRange } from "@/components/QueueFilters";

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

type WarmItem = { lead: Lead; call: Call };

export default function WarmQueuePage() {
  const [items, setItems] = useState<WarmItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const load = () =>
      Promise.all([api.getLeads(), api.getCalls()])
        .then(([leads, calls]) => {
          const warmCalls = calls.filter((c) => c.classification === "Warm");
          const result: WarmItem[] = [];
          for (const call of warmCalls) {
            const lead = leads.find((l) => l.id === call.lead_id);
            if (lead) result.push({ lead, call });
          }
          setItems(result);
          setExpanded((prev) => prev ?? result[0]?.call.id ?? null);
        })
        .catch(console.error);
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const waSent = filteredItems.filter((i) => i.call.whatsapp).length;
  const waClicked = filteredItems.filter((i) => i.call.whatsapp?.clicked_at).length;
  const waPending = filteredItems.filter((i) => i.call.whatsapp && !i.call.whatsapp.clicked_at).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-indigo-500" />
            <h1 className="text-xl font-bold text-slate-900">Warm Queue</h1>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{filteredItems.length} leads</span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">WhatsApp follow-up sent — awaiting sign-up or nurture</p>
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

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "WhatsApp Sent", value: waSent, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Link Clicked", value: waClicked, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Awaiting Response", value: waPending, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <MessageCircle size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">{items.length === 0 ? "No warm leads yet. Complete a voice call to see data here." : "No leads match the current filters."}</p>
        </div>
      )}

      <div className="space-y-4">
        {filteredItems.map(({ lead, call }) => {
          const wa = call.whatsapp;
          const isExpanded = expanded === call.id;

          return (
            <div key={call.id} className={`bg-white rounded-xl border transition-shadow ${isExpanded ? "border-indigo-200 shadow-md" : "border-slate-100 hover:border-slate-200"}`}>
              <button className="w-full text-left px-5 py-4" onClick={() => setExpanded(isExpanded ? null : call.id)}>
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
                      <p className="text-sm font-bold text-slate-900">{call.score?.interest_score ?? "—"}/10</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Readiness</p>
                      <p className="text-sm font-bold text-slate-900">{call.score?.readiness_score ?? "—"}/10</p>
                    </div>
                    {wa ? (
                      wa.clicked_at ? (
                        <span className="flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium" title="WhatsApp link clicked">
                          <CheckCircle size={11} /> WA Clicked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-medium" title="WhatsApp sent">
                          <Send size={11} /> WA {timeSince(wa.sent_at)}
                        </span>
                      )
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                        <Clock size={11} /> WA Pending
                      </span>
                    )}
                    {(() => {
                      const em = call.email;
                      if (!em) return null;
                      if (em.error) return (
                        <span className="flex items-center gap-1.5 text-xs bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1 rounded-full font-medium" title={em.error}>
                          <AlertCircle size={11} /> Email failed
                        </span>
                      );
                      if (em.clicked_at) return (
                        <span className="flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium" title="Email link clicked">
                          <MailCheck size={11} /> Email Clicked
                        </span>
                      );
                      return (
                        <span className="flex items-center gap-1.5 text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded-full font-medium" title="Email sent">
                          <Mail size={11} /> Email Sent
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
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Call Summary</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{call.summary ?? "Processing..."}</p>
                  </div>

                  {wa && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">WhatsApp Message</p>
                      <div className="bg-[#e9fbe8] rounded-2xl rounded-tl-none p-4 max-w-sm border border-[#c3f0c0]">
                        <p className="text-sm text-slate-800 leading-relaxed">{wa.message_text}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <a href={wa.link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 font-medium">
                            <ExternalLink size={11} /> Sign Up Link
                          </a>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Sent {new Date(wa.sent_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                          {wa.clicked_at ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle size={10} /> Clicked {timeSince(wa.clicked_at)}
                            </span>
                          ) : (
                            <span>Not yet clicked</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!wa && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 flex items-center gap-3">
                      <Clock size={16} className="text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">WhatsApp pending</p>
                        <p className="text-xs text-amber-600">Message will be sent automatically within 60 seconds of classification</p>
                      </div>
                    </div>
                  )}

                  {call.recommended_next_action && (
                    <div className="bg-slate-50 rounded-lg px-4 py-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Next Action</p>
                      <p className="text-sm text-slate-700">{call.recommended_next_action}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCallLead(call.id, lead.name, lead.phone, call.recommended_opening_line)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        calledIds.has(call.id)
                          ? "bg-emerald-100 text-emerald-700 cursor-default"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
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
                    <Link href={`/calls/${call.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
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
