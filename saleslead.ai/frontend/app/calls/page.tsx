"use client";

import { MOCK_LEADS } from "@/lib/mock-data";
import Link from "next/link";
import { PhoneCall, Clock } from "lucide-react";

const ALL_CALLS = MOCK_LEADS.flatMap((l) =>
  l.calls.map((c) => ({ ...c, lead_name: l.name, lead_phone: l.phone, lead_language: l.language_pref }))
).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

function classificationBadge(c: string) {
  if (c === "Hot") return "bg-amber-100 text-amber-700";
  if (c === "Warm") return "bg-indigo-100 text-indigo-700";
  return "bg-slate-100 text-slate-500";
}

export default function CallsPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">All Calls</h1>
        <p className="text-sm text-slate-500">{ALL_CALLS.length} calls recorded</p>
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
            {ALL_CALLS.map((call) => (
              <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{call.lead_name}</td>
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
                <td className="px-4 py-3 text-slate-700 font-semibold">{call.score.interest_score}/10</td>
                <td className="px-4 py-3 text-slate-700 font-semibold">{call.score.readiness_score}/10</td>
                <td className="px-4 py-3 text-slate-500">{call.objections.length}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(call.started_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/calls/${call.id}`} className="text-xs text-indigo-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
