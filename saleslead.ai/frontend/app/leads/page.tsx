"use client";

import { useState } from "react";
import { Upload, Plus, Search, Filter, X } from "lucide-react";
import { MOCK_LEADS, Lead, Language } from "@/lib/mock-data";
import Link from "next/link";

const LANGUAGES: Language[] = ["Hindi", "English", "Hinglish", "Tamil", "Telugu", "Marathi"];
const SOURCES = ["Google Ads", "LinkedIn Campaign", "Facebook Ads", "Referral", "Webinar", "Organic"];

function classificationBadge(c: string | null) {
  if (c === "Hot") return "bg-amber-100 text-amber-700";
  if (c === "Warm") return "bg-indigo-100 text-indigo-700";
  if (c === "Cold") return "bg-slate-100 text-slate-500";
  return "bg-slate-100 text-slate-400";
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    ingested: "bg-blue-50 text-blue-600",
    contacted: "bg-purple-50 text-purple-600",
    qualified: "bg-indigo-50 text-indigo-600",
    handed_off: "bg-amber-50 text-amber-600",
    signed_up: "bg-emerald-50 text-emerald-600",
  };
  return map[s] ?? "bg-slate-50 text-slate-500";
}

const defaultForm = { name: "", phone: "", language_pref: "Hindi" as Language, source: "Google Ads" };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [search, setSearch] = useState("");
  const [filterClassification, setFilterClassification] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [dragOver, setDragOver] = useState(false);
  const [csvUploaded, setCsvUploaded] = useState(false);

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    const matchClass =
      filterClassification === "all" || l.current_classification === filterClassification || (filterClassification === "pending" && !l.current_classification);
    return matchSearch && matchClass;
  });

  function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    const newLead: Lead = {
      id: `L${String(leads.length + 1).padStart(3, "0")}`,
      name: form.name,
      phone: form.phone,
      language_pref: form.language_pref,
      source: form.source,
      status: "ingested",
      created_at: new Date().toISOString(),
      last_call_at: null,
      current_classification: null,
      calls: [],
    };
    setLeads([newLead, ...leads]);
    setForm(defaultForm);
    setShowForm(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) {
      setCsvUploaded(true);
      setTimeout(() => setCsvUploaded(false), 3000);
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">{leads.length} total leads</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} />
          Add Lead
        </button>
      </div>

      {/* CSV Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white"
        }`}
      >
        {csvUploaded ? (
          <p className="text-sm font-medium text-emerald-600">CSV uploaded — leads queued for calling</p>
        ) : (
          <>
            <Upload size={20} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">Drop a CSV file to bulk import leads</p>
            <p className="text-xs text-slate-400 mt-1">Columns: name, phone, language_pref, source</p>
            <label className="mt-3 inline-block cursor-pointer text-xs text-indigo-600 hover:underline">
              or browse to upload
              <input type="file" accept=".csv" className="hidden" onChange={() => { setCsvUploaded(true); setTimeout(() => setCsvUploaded(false), 3000); }} />
            </label>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-slate-400" />
          {["all", "Hot", "Warm", "Cold", "pending"].map((c) => (
            <button
              key={c}
              onClick={() => setFilterClassification(c)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filterClassification === c
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {c === "all" ? "All" : c === "pending" ? "Not Called" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Language</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Classification</th>
              <th className="px-4 py-3 font-medium">Calls</th>
              <th className="px-4 py-3 font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {lead.calls[0] ? (
                    <Link href={`/calls/${lead.calls[0].id}`} className="hover:text-indigo-600">
                      {lead.name}
                    </Link>
                  ) : (
                    lead.name
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{lead.phone}</td>
                <td className="px-4 py-3 text-slate-500">{lead.language_pref}</td>
                <td className="px-4 py-3 text-slate-500">{lead.source}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(lead.status)}`}>
                    {lead.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {lead.current_classification ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classificationBadge(lead.current_classification)}`}>
                      {lead.current_classification}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 text-center">{lead.calls.length}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                  No leads match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900">Add New Lead</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Phone *</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Language</label>
                  <select
                    value={form.language_pref}
                    onChange={(e) => setForm({ ...form, language_pref: e.target.value as Language })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
                    {SOURCES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Add & Queue Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
