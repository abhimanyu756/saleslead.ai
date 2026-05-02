"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Flame, PhoneCall, CheckCircle, Clock } from "lucide-react";
import { api, DashboardStats, Lead } from "@/lib/api";
import Link from "next/link";

function classificationBadge(c: string | null) {
  if (c === "Hot") return "bg-amber-100 text-amber-700";
  if (c === "Warm") return "bg-indigo-100 text-indigo-700";
  if (c === "Cold") return "bg-slate-100 text-slate-500";
  return "bg-slate-100 text-slate-400";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    api.getDashboard().then(setStats).catch(console.error);
    api.getLeads().then(setLeads).catch(console.error);
  }, []);

  if (!stats) {
    return <div className="p-6 text-sm text-slate-400">Loading...</div>;
  }

  const classificationData = [
    { name: "Hot", value: stats.hot_leads, fill: "#f59e0b" },
    { name: "Warm", value: stats.warm_leads, fill: "#6366f1" },
    { name: "Cold", value: stats.cold_leads, fill: "#94a3b8" },
  ];

  const statCards = [
    { label: "Total Leads", value: stats.total_leads, sub: "all time", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Calls Made", value: stats.calls_made, sub: "total calls", icon: PhoneCall, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Hot Leads", value: stats.hot_leads, sub: "RM queue", icon: Flame, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Signed Up", value: stats.signed_up, sub: `${stats.conversion_rate}% conversion`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Warm Leads", value: stats.warm_leads, sub: "WhatsApp sent", icon: Clock, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Conversion", value: `${stats.conversion_rate}%`, sub: "target: 40%+", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Rupeezy AP Program — Live Conversion Funnel</p>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
          Live · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
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
            <BarChart data={stats.funnel} layout="vertical" barSize={22}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: "#64748b" }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} formatter={(v) => [v, "Leads"]} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Classification breakdown */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Lead Classification</h2>
          <div className="space-y-3">
            {classificationData.map(({ name, value, fill }) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{name}</span>
                  <span className="text-slate-500">{value} leads</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${stats.total_leads ? (value / stats.total_leads) * 100 : 0}%`, backgroundColor: fill }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-900">Queue Status</p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{stats.hot_leads} Hot in queue</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{stats.warm_leads} WhatsApp sent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily activity */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Daily Activity</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={stats.daily_activity} barGap={3}>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Bar dataKey="calls" name="Calls" fill="#818cf8" radius={[3, 3, 0, 0]} />
            <Bar dataKey="hot" name="Hot" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Leads</h2>
          <Link href="/leads" className="text-xs text-indigo-600 hover:underline">View all</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Phone</th>
              <th className="pb-2 font-medium">Language</th>
              <th className="pb-2 font-medium">Classification</th>
              <th className="pb-2 font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {leads.slice(0, 5).map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="py-2.5 font-medium text-slate-900">{lead.name}</td>
                <td className="py-2.5 text-slate-500">{lead.phone}</td>
                <td className="py-2.5 text-slate-500">{lead.language_pref}</td>
                <td className="py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classificationBadge(lead.current_classification)}`}>
                    {lead.current_classification}
                  </span>
                </td>
                <td className="py-2.5 text-slate-400 text-xs">
                  {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
