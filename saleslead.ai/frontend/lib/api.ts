const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  // Leads
  getLeads: () => get<Lead[]>("/leads/"),
  getLead: (id: string) => get<Lead>(`/leads/${id}`),
  createLead: (data: LeadCreate) => post<Lead>("/leads/", data),

  // Calls
  getCalls: () => get<Call[]>("/calls/"),
  getCall: (id: string) => get<Call>(`/calls/${id}`),

  // Dashboard
  getDashboard: () => get<DashboardStats>("/dashboard/"),
};

// ── Types (mirroring backend schemas) ─────────────────────────────────────────

export interface Lead {
  id: string;
  name: string;
  phone: string;
  language_pref: string;
  source: string | null;
  broker_affiliation: string | null;
  current_classification: string;
  created_at: string;
}

export interface LeadCreate {
  name: string;
  phone: string;
  language_pref: string;
  source?: string;
  broker_affiliation?: string;
}

export interface Score {
  interest_score: number;
  readiness_score: number;
  network_size: string;
  network_evidence: string[];
  interest_evidence: string[];
  readiness_evidence: string[];
}

export interface Objection {
  type: string;
  raised_at_turn: number;
  resolution_status: string;
}

export interface WhatsApp {
  message_text: string;
  link: string;
  language: string;
  sent_at: string;
  clicked_at: string | null;
}

export interface Call {
  id: string;
  lead_id: string;
  started_at: string;
  ended_at: string | null;
  duration_s: number;
  language_used: string;
  classification: string;
  cta_outcome: string;
  summary: string | null;
  recommended_next_action: string | null;
  recommended_opening_line: string | null;
  benefits_covered: string[];
  transcript: { speaker: string; text: string; timestamp: string }[];
  score: Score | null;
  objections: Objection[];
  whatsapp: WhatsApp | null;
}

export interface DashboardStats {
  total_leads: number;
  calls_made: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  signed_up: number;
  conversion_rate: number;
  funnel: { stage: string; value: number }[];
  daily_activity: { date: string; calls: number; hot: number }[];
}
