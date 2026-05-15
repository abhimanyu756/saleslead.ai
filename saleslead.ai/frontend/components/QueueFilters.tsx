"use client";

import { Filter, X } from "lucide-react";

export type DateRange = "today" | "yesterday" | "7d" | "30d" | "all";

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

export interface QueueFiltersProps {
  dateRange: DateRange;
  setDateRange: (v: DateRange) => void;
  language: string;
  setLanguage: (v: string) => void;
  source: string;
  setSource: (v: string) => void;
  broker: string;
  setBroker: (v: string) => void;
  availableLanguages: string[];
  availableSources: string[];
  availableBrokers: string[];
  totalCount: number;
  filteredCount: number;
}

export function QueueFilters({
  dateRange,
  setDateRange,
  language,
  setLanguage,
  source,
  setSource,
  broker,
  setBroker,
  availableLanguages,
  availableSources,
  availableBrokers,
  totalCount,
  filteredCount,
}: QueueFiltersProps) {
  const hasActiveFilters =
    dateRange !== "all" || language !== "all" || source !== "all" || broker !== "all";

  function clearAll() {
    setDateRange("all");
    setLanguage("all");
    setSource("all");
    setBroker("all");
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter size={13} />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <span className="text-slate-400">
              · showing {filteredCount} of {totalCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 font-medium"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Date range chips */}
        <div className="flex items-center gap-1">
          {DATE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                dateRange === opt.value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="w-px bg-slate-200 h-6 mx-1" />

        {/* Language */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">All languages</option>
          {availableLanguages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {/* Source (treated as "Location/Campaign") */}
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">All sources</option>
          {availableSources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Broker affiliation */}
        <select
          value={broker}
          onChange={(e) => setBroker(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="all">All brokers</option>
          <option value="__none__">No prior broker</option>
          {availableBrokers.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Helper: returns true if `iso` (call started_at) is within the selected date range. */
export function withinDateRange(iso: string, range: DateRange): boolean {
  if (range === "all") return true;
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "today") {
    return d >= start;
  }
  if (range === "yesterday") {
    const y = new Date(start);
    y.setDate(start.getDate() - 1);
    return d >= y && d < start;
  }
  if (range === "7d") {
    const w = new Date(start);
    w.setDate(start.getDate() - 7);
    return d >= w;
  }
  if (range === "30d") {
    const m = new Date(start);
    m.setDate(start.getDate() - 30);
    return d >= m;
  }
  return true;
}
