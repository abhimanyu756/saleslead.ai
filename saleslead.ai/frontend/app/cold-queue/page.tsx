"use client";

import { useEffect, useMemo, useState } from "react";
import { Snowflake, ChevronDown, ChevronUp, MessageCircle, User, Clock, RotateCw, Phone, X } from "lucide-react";
import { api, Lead, Call } from "@/lib/api";
import Link from "next/link";
import { QueueFilters, DateRange, withinDateRange } from "@/components/QueueFilters";

type ColdItem = { lead: Lead; call: Call };

function reasonFromCall(c: Call): string {
  const turns = c.transcript?.length ?? 0;
  if (turns <= 2) return "Cut call without conversation";
  const interest = c.score?.interest_score ?? 0;
  if (interest <= 3) return "Clearly not interested";
  if (interest <= 5) return "Polite but disengaged";
  return "Low readiness — no network or not ready to commit";
}

function daysSince(iso: string): number {
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function LastCalledBadge({ startedAt }: { startedAt: string }) {
  const days = daysSince(startedAt);
  let color = "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (days < 7) color = "bg-rose-50 text-rose-700 border-rose-100";
  else if (days < 30) color = "bg-amber-50 text-amber-700 border-amber-100";
  const label =
    days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${color}`}>
      Last call: {label}
    </span>
  );
}

export default function ColdQueuePage() {
  const [items, setItems] = useState<ColdItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [recalling, setRecalling] = useState(false);
  const [recallStatus, setRecallStatus] = useState<string | null>(null);

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

  useEffect(() => {
    const load = () =>
      Promise.all([api.getLeads(), api.getCalls()])
        .then(([leads, calls]) => {
          const coldCalls = calls.filter((c) => c.classification === "Cold");
          const result: ColdItem[] = [];
          for (const call of coldCalls) {
            const lead = leads.find((l) => l.id === call.lead_id);
            if (lead) result.push({ lead, call });
          }
          result.sort((a, b) => (a.call.duration_s || 0) - (b.call.duration_s || 0));
          setItems(result);
        })
        .catch(console.error);
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  function toggleSelect(leadId: string) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }

  function selectAll() {
    setSelectedLeadIds(new Set(filteredItems.map((i) => i.lead.id)));
  }

  function clearSelection() {
    setSelectedLeadIds(new Set());
  }

  async function handleRecall() {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;

    // Spam guard: warn if any selected lead was called <7 days ago
    const recent = items.filter(
      (i) => selectedLeadIds.has(i.lead.id) && daysSince(i.call.started_at) < 7
    );
    if (recent.length > 0) {
      const proceed = window.confirm(
        `${recent.length} of these were called in the last 7 days. Re-calling may feel like spam to the lead.\n\nContinue anyway?`
      );
      if (!proceed) return;
    }

    setRecalling(true);
    setRecallStatus(null);
    try {
      const res = await api.recallLeads(ids);
      setRecallStatus(`✓ Re-calling ${res.triggered} lead${res.triggered === 1 ? "" : "s"}`);
      setSelectedLeadIds(new Set());
      // Optimistically remove these from the cold list — they'll repopulate based on next call's classification
      setItems((prev) => prev.filter((i) => !ids.includes(i.lead.id)));
    } catch {
      setRecallStatus("Re-call failed. Check backend logs.");
    } finally {
      setRecalling(false);
      setTimeout(() => setRecallStatus(null), 5000);
    }
  }

  const selectedCount = selectedLeadIds.size;
  const allSelected = filteredItems.length > 0 && selectedCount >= filteredItems.length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Snowflake size={18} className="text-slate-400" />
            <h1 className="text-xl font-bold text-slate-900">Cold Queue</h1>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
              {filteredItems.length} leads
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Leads who hung up early or showed no interest. Re-engage after 30/60/90 days.
          </p>
        </div>
        {filteredItems.length > 0 && (
          <button
            onClick={allSelected ? clearSelection : selectAll}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        )}
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

      {/* Sticky action bar */}
      {selectedCount > 0 && (
        <div className="sticky top-2 z-10 bg-indigo-600 text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-md">
          <p className="text-sm font-medium">
            {selectedCount} lead{selectedCount === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            {recallStatus && (
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">{recallStatus}</span>
            )}
            <button
              onClick={handleRecall}
              disabled={recalling}
              className="flex items-center gap-1.5 bg-white text-indigo-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-indigo-50 disabled:opacity-60 transition-colors"
            >
              <Phone size={13} />
              {recalling ? "Triggering…" : "Re-call now"}
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              title="Clear selection"
            >
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Snowflake size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">{items.length === 0 ? "No cold leads yet." : "No leads match the current filters."}</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredItems.map(({ lead, call }) => {
          const isExpanded = expanded === call.id;
          const reason = reasonFromCall(call);
          const turns = call.transcript?.length ?? 0;
          const isSelected = selectedLeadIds.has(lead.id);

          return (
            <div
              key={call.id}
              className={`bg-white rounded-xl border transition-shadow ${
                isSelected
                  ? "border-indigo-300 shadow-sm ring-2 ring-indigo-100"
                  : isExpanded
                  ? "border-slate-300 shadow-sm"
                  : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="px-5 py-4 flex items-center gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(lead.id)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer shrink-0"
                  aria-label={`Select ${lead.name}`}
                />

                {/* Row content (click to expand) */}
                <button
                  className="flex-1 text-left"
                  onClick={() => setExpanded(isExpanded ? null : call.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <User size={16} className="text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{lead.name}</p>
                          <LastCalledBadge startedAt={call.started_at} />
                        </div>
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
              </div>

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
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Interest</p>
                        <p className="text-sm font-bold text-slate-700">{call.score.interest_score}/10</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Readiness</p>
                        <p className="text-sm font-bold text-slate-700">{call.score.readiness_score}/10</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">Network</p>
                        <p className="text-sm font-bold text-slate-700 capitalize">{call.score.network_size}</p>
                      </div>
                    </div>
                  )}

                  {call.recommended_next_action && (
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        <RotateCw size={10} className="inline mr-1" />
                        Re-engagement Plan
                      </p>
                      <p className="text-sm text-slate-700">{call.recommended_next_action}</p>
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
