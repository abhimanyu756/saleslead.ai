"use client";

import { useEffect, useState } from "react";
import { Upload, Plus, Search, Filter, X, Trash2, PhoneCall } from "lucide-react";
import { api, Lead, LeadCreate } from "@/lib/api";

const LANGUAGES = ["Hindi", "English", "Hinglish", "Tamil", "Telugu", "Marathi"];
const SOURCES = ["Google Ads", "LinkedIn Campaign", "Facebook Ads", "Referral", "Webinar", "Organic", "csv"];

function classificationBadge(c: string | null) {
  if (c === "Hot") return "bg-amber-100 text-amber-700";
  if (c === "Warm") return "bg-indigo-100 text-indigo-700";
  if (c === "Cold") return "bg-slate-100 text-slate-500";
  return "bg-slate-100 text-slate-400";
}

const defaultForm: LeadCreate = { name: "", phone: "", language_pref: "Hindi", source: "Google Ads" };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [filterClassification, setFilterClassification] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LeadCreate>(defaultForm);
  const [dragOver, setDragOver] = useState(false);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [batchCalling, setBatchCalling] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = () => api.getLeads().then(setLeads).catch(console.error);
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const filtered = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchClass = filterClassification === "all" || l.current_classification === filterClassification ||
      (filterClassification === "pending" && l.current_classification === "Uncalled");
    return matchSearch && matchClass;
  });

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.createLead(form);
      setLeads([created, ...leads]);
      setForm(defaultForm);
      setShowForm(false);
    } catch (err) {
      alert("Failed to add lead. Phone may already exist.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCsvUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/leads/upload-csv`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
        body: formData,
      });
      const data = await res.json();
      setCsvStatus(`✓ ${data.created} leads added, ${data.skipped} skipped`);
      const updated = await api.getLeads();
      setLeads(updated);
    } catch {
      setCsvStatus("Upload failed");
    }
    setTimeout(() => setCsvStatus(null), 4000);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleCsvUpload(file);
  }

  async function handleDeleteLead(id: string, name: string) {
    if (!confirm(`Delete ${name}? This also removes their calls, transcripts, and WhatsApp records.`)) return;
    try {
      await api.deleteLead(id);
      setLeads(leads.filter((l) => l.id !== id));
    } catch {
      alert("Delete failed.");
    }
  }

  async function handleBatchCall() {
    const uncalled = leads.filter((l) => l.current_classification === "Uncalled");
    if (uncalled.length === 0) { alert("No uncalled leads found."); return; }
    if (!confirm(`Start batch calls for ${uncalled.length} uncalled leads?`)) return;
    setBatchCalling(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/leads/batch-call`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const data = await res.json();
      setBatchStatus(`✓ Calling ${data.triggered} leads`);
    } catch {
      setBatchStatus("Batch call failed");
    } finally {
      setBatchCalling(false);
      setTimeout(() => setBatchStatus(null), 4000);
    }
  }

  async function handleDeleteAll() {
    if (!confirm(`Delete ALL ${leads.length} leads and every related call/transcript/WhatsApp record? This cannot be undone.`)) return;
    try {
      await api.deleteAllLeads();
      setLeads([]);
    } catch {
      alert("Bulk delete failed.");
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">{leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          {batchStatus && <span className="text-sm text-emerald-600 font-medium">{batchStatus}</span>}
          {leads.some((l) => l.current_classification === "Uncalled") && (
            <button
              onClick={handleBatchCall}
              disabled={batchCalling}
              className="flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <PhoneCall size={15} /> {batchCalling ? "Calling..." : "Call All Uncalled"}
            </button>
          )}
          {leads.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 bg-white text-rose-600 border border-rose-200 text-sm font-medium px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={15} /> Delete All
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* CSV Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white"}`}
      >
        {csvStatus ? (
          <p className="text-sm font-medium text-emerald-600">{csvStatus}</p>
        ) : (
          <>
            <Upload size={20} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">Drop a CSV file to bulk import leads</p>
            <p className="text-xs text-slate-400 mt-1">Columns: name, phone, language_pref, source</p>
            <label className="mt-3 inline-block cursor-pointer text-xs text-indigo-600 hover:underline">
              or browse to upload
              <input type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleCsvUpload(e.target.files[0]); }} />
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
                filterClassification === c ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
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
              <th className="px-4 py-3 font-medium">Classification</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3 font-medium text-slate-900">{lead.name}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{lead.phone}</td>
                <td className="px-4 py-3 text-slate-500">{lead.language_pref}</td>
                <td className="px-4 py-3 text-slate-500">{lead.source ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classificationBadge(lead.current_classification)}`}>
                    {lead.current_classification}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeleteLead(lead.id, lead.name)}
                    className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete lead"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No leads found.</td>
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
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Full Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Phone *</label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Language</label>
                  <select value={form.language_pref} onChange={(e) => setForm({ ...form, language_pref: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Source</label>
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    {SOURCES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                  {saving ? "Saving…" : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
