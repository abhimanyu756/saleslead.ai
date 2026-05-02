"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from "recharts";
import { TrendingUp, Users, Flame, PhoneCall, CheckCircle, Clock } from "lucide-react";
import { MOCK_LEADS, FUNNEL_DATA, DAILY_ACTIVITY } from "@/lib/mock-data";
import Link from "next/link";

const STAT_CARDS = [
  { label: "Total Leads", value: "48", sub: "+6 today", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Calls Made", value: "41", sub: "85% contact rate", icon: PhoneCall, color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Hot Leads", value: "12", sub: "RM queue", icon: Flame, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Signed Up", value: "7", sub: "30% conversion", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Avg Response", value: "3.2m", sub: "vs 12hr baseline", icon: Clock, color: "text-sky-600", bg: "bg-sky-50" },
  { label: "Conversion Lift", value: "+12%", sub: "18% → 30%", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
];

const HOT_LEADS = MOCK_LEADS.filter((l) => l.current_classification === "Hot");
const WARM_LEADS = MOCK_LEADS.filter((l) => l.current_classification === "Warm");
const COLD_LEADS = MOCK_LEADS.filter((l) => l.current_classification === "Cold");

const CLASSIFICATION_DATA = [
  { name: "Hot", value: HOT_LEADS.length, fill: "#f59e0b" },
  { name: "Warm", value: WARM_LEADS.length, fill: "#6366f1" },
  { name: "Cold", value: COLD_LEADS.length, fill: "#94a3b8" },
];

function classificationBadge(c: string | null) {
  if (c === "Hot") return "bg-amber-100 text-amber-700";
  if (c === "Warm") return "bg-indigo-100 text-indigo-700";
  if (c === "Cold") return "bg-slate-100 text-slate-500";
  return "bg-slate-100 text-slate-400";
}

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Rupeezy AP Program — Live Conversion Funnel</p>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
          Live · May 2, 2026
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">
        {STAT_CARDS.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 space-y-2">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={15} className={color} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <div>
              <p className="text-xs font-medium text-slate-700">{label}</p>
              <p className="text-[11px] text-slate-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Funnel chart */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Conversion Funnel</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={FUNNEL_DATA} layout="vertical" barSize={22}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: "#64748b" }} width={80} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                formatter={(v) => [v, "Leads"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {FUNNEL_DATA.map((entry) => (
                  <rect key={entry.stage} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Classification breakdown */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Lead Classification</h2>
          <div className="space-y-3">
            {CLASSIFICATION_DATA.map(({ name, value, fill }) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{name}</span>
                  <span className="text-slate-500">{value} leads</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(value / 6) * 100}%`, backgroundColor: fill }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-900">Today's Pending</p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">4 Hot in queue</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">3 WhatsApp sent</span>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">1 pending call</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily activity */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Daily Activity</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={DAILY_ACTIVITY} barGap={3}>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Bar dataKey="leads" name="Leads" fill="#e0e7ff" radius={[3, 3, 0, 0]} />
            <Bar dataKey="calls" name="Calls" fill="#818cf8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="hot" name="Hot" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent leads table */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Leads</h2>
          <Link href="/leads" className="text-xs text-indigo-600 hover:underline">View all</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Language</th>
              <th className="pb-2 font-medium">Source</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Classification</th>
              <th className="pb-2 font-medium">Last Call</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_LEADS.slice(0, 5).map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="py-2.5 font-medium text-slate-900">
                  <Link href={`/calls/${lead.calls[0]?.id ?? ""}`} className="hover:text-indigo-600">
                    {lead.name}
                  </Link>
                </td>
                <td className="py-2.5 text-slate-500">{lead.language_pref}</td>
                <td className="py-2.5 text-slate-500">{lead.source}</td>
                <td className="py-2.5 capitalize text-slate-500">{lead.status.replace("_", " ")}</td>
                <td className="py-2.5">
                  {lead.current_classification ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classificationBadge(lead.current_classification)}`}>
                      {lead.current_classification}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="py-2.5 text-slate-400 text-xs">
                  {lead.last_call_at ? new Date(lead.last_call_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
