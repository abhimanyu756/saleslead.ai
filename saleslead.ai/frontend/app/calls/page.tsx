"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Call, Lead } from "@/lib/api";
import Link from "next/link";
import { Clock, PhoneCall } from "lucide-react";
import { QueueFilters, DateRange, withinDateRange } from "@/components/QueueFilters";

function classificationBadge(c: string) {
  if (c === "Hot") return "bg-amber-100 text-amber-700";
  if (c === "Warm") return "bg-indigo-100 text-indigo-700";
  return "bg-slate-100 text-slate-500";
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [language, setLanguage] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [broker, setBroker] = useState<string>("all");
  const [classification, setClassification] = useState<string>("all");

  useEffect(() => {
    Promise.all([api.getCalls(), api.getLeads()])
      .then(([c, l]) => {
        setCalls(c);
        setLeads(l);
      })
      .catch(console.error);
  }, []);

  const leadById = useMemo(() => {
    const m = new Map<string, Lead>();
    for (const l of leads) m.set(l.id, l);
    return m;
  }, [leads]);

  const availableLanguages = useMemo(
    () => Array.from(new Set(calls.map((c) => c.language_used).filter(Boolean))).sort(),
    [calls]
  );
  const availableSources = useMemo(
    () => Array.from(new Set(leads.map((l) => l.source).filter(Boolean) as string[])).sort(),
    [leads]
  );
  const availableBrokers = useMemo(
    () => Array.from(new Set(leads.map((l) => l.broker_affiliation).filter(Boolean) as string[])).sort(),
    [leads]
  );

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      const lead = leadById.get(call.lead_id);
      if (!withinDateRange(call.started_at, dateRange)) return false;
      if (classification !== "all" && call.classification !== classification) return false;
      if (language !== "all" && call.language_used !== language) return false;
      if (source !== "all" && lead?.source !== source) return false;
      if (broker !== "all") {
        if (broker === "__none__" && lead?.broker_affiliation) return false;
        if (broker !== "__none__" && lead?.broker_affiliation !== broker) return false;
      }
      return true;
    });
  }, [calls, leadById, dateRange, classification, language, source, broker]);

  return (
    <div className="p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <PhoneCall size={18} className="text-slate-500" />
          <h1 className="text-xl font-bold text-slate-900">All Calls</h1>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{filteredCalls.length} calls</span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">All processed calls with scores</p>
      </div>

      <QueueFilters
        dateRange={dateRange} setDateRange={setDateRange}
        language={language} setLanguage={setLanguage}
        source={source} setSource={setSource}
        broker={broker} setBroker={setBroker}
        availableLanguages={availableLanguages}
        availableSources={availableSources}
        availableBrokers={availableBrokers}
        totalCount={calls.length}
        filteredCount={filteredCalls.length}
      />

      {/* Classification chips — calls page only */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium">Classification:</span>
        {["all", "Hot", "Warm", "Cold"].map((c) => (
          <button
            key={c}
            onClick={() => setClassification(c)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              classification === c
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Classification</th>
              <th className="px-4 py-3 font-medium">Interest</th>
              <th className="px-4 py-3 font-medium">Readiness</th>
              <th className="px-4 py-3 font-medium">Objections</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCalls.map((call) => {
              const lead = leadById.get(call.lead_id);
              return (
              <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{lead?.name ?? "Unknown lead"}</p>
                  <p className="text-xs text-slate-400 font-mono">{lead?.phone ?? call.lead_id}</p>
                </td>
                <td className="px-4 py-3 text-slate-500">{call.language_used}</td>
                <td className="px-4 py-3 text-slate-500 flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  {Math.floor(call.duration_s / 60)}m {call.duration_s % 60}s
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classificationBadge(call.classification)}`}>
                    {call.classification}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700 font-semibold">{call.score?.interest_score ?? "—"}/10</td>
                <td className="px-4 py-3 text-slate-700 font-semibold">{call.score?.readiness_score ?? "—"}/10</td>
                <td className="px-4 py-3 text-slate-500">{call.objections.length}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(call.started_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/calls/${call.id}`} className="text-xs text-indigo-600 hover:underline">View</Link>
                </td>
              </tr>
              );
            })}
            {filteredCalls.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                  {calls.length === 0 ? "No calls yet. Complete a voice call to see data here." : "No calls match the current filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
