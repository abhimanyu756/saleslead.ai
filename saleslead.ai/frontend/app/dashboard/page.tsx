"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Flame, PhoneCall, CheckCircle, Clock, Globe, Megaphone, Snowflake } from "lucide-react";
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
    const load = () => {
      api.getDashboard().then(setStats).catch(console.error);
      api.getLeads().then(setLeads).catch(console.error);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
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
    { label: "Total Leads", value: stats.total_leads, sub: "all time", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", href: "/leads" },
    { label: "Calls Made", value: stats.calls_made, sub: "total calls", icon: PhoneCall, color: "text-violet-600", bg: "bg-violet-50", href: "/calls" },
    { label: "Hot Leads", value: stats.hot_leads, sub: "RM queue", icon: Flame, color: "text-amber-600", bg: "bg-amber-50", href: "/hot-queue" },
    { label: "Signed Up", value: stats.signed_up, sub: `${stats.conversion_rate}% conversion`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", href: null },
    { label: "Warm Leads", value: stats.warm_leads, sub: "WhatsApp sent", icon: Clock, color: "text-sky-600", bg: "bg-sky-50", href: "/warm-queue" },
    { label: "Conversion", value: `${stats.conversion_rate}%`, sub: "target: 40%+", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50", href: null },
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
        {statCards.map(({ label, value, sub, icon: Icon, color, bg, href }) => {
          const inner = (
            <>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={15} className={color} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <div>
                <p className="text-xs font-medium text-slate-700">{label}</p>
                <p className="text-[11px] text-slate-400">{sub}</p>
              </div>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="bg-white rounded-xl border border-slate-100 p-4 space-y-2 hover:border-slate-300 hover:shadow-sm transition-all">
              {inner}
            </Link>
          ) : (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-4 space-y-2">
              {inner}
            </div>
          );
        })}
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

      {/* Conversion analytics */}
      <div className="grid grid-cols-3 gap-4">
        {/* By Source */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone size={15} className="text-violet-600" />
            <h2 className="text-sm font-semibold text-slate-900">Conversion by Source</h2>
          </div>
          {stats.by_source.length === 0 ? (
            <p className="text-xs text-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.by_source.slice(0, 6).map((s) => (
                <div key={s.source}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 truncate">{s.source}</span>
                    <span className="text-slate-500">
                      {s.hot}/{s.total}
                      <span className="ml-1.5 text-emerald-600 font-semibold">{s.hot_rate}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${Math.min(100, s.hot_rate)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Language */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={15} className="text-sky-600" />
            <h2 className="text-sm font-semibold text-slate-900">Conversion by Language</h2>
          </div>
          {stats.by_language.length === 0 ? (
            <p className="text-xs text-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.by_language.slice(0, 6).map((l) => (
                <div key={l.language}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{l.language}</span>
                    <span className="text-slate-500">
                      {l.hot}/{l.total}
                      <span className="ml-1.5 text-emerald-600 font-semibold">{l.hot_rate}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${Math.min(100, l.hot_rate)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Re-engagement */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Snowflake size={15} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Cold Re-engagement</h2>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.upcoming_reengagement}</p>
          <p className="text-xs text-slate-500 mt-0.5">cold leads due within 7 days</p>
          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            Cold leads are auto-scheduled for follow-up at 30/60/90 days based on their drop-off pattern.
          </p>
          <Link href="/cold-queue" className="mt-3 inline-block text-xs text-indigo-600 hover:underline">
            View cold queue →
          </Link>
        </div>
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
