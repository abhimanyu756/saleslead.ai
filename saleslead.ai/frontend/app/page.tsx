"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, Phone, Globe, Flame, MessageCircle, Snowflake, Mail,
  Brain, Clock, BarChart3, Layers, Headphones, ArrowRight,
  CheckCircle2, Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  // Auto-redirect logged-in users to dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Top nav ───────────────────────────────────────────────────────── */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">SalesLead.ai</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Rupeezy AP Program</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
            >
              Get started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-white to-white -z-10" />
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <Sparkles size={12} /> AI Voice Agent for Partner Lead Conversion
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight max-w-3xl mx-auto">
            Convert 40% of your leads — without scaling your RM team.
          </h1>
          <p className="mt-6 text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            An AI voice agent that calls every new lead within seconds, pitches your partner
            program in their language, qualifies interest, and hands hot leads to RMs with
            full conversation context.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              Get started <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm hover:border-indigo-300 transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { num: "18% → 40%+", label: "Target conversion lift" },
              { num: "9", label: "Indian languages" },
              { num: "< 5 min", label: "Lead-to-call SLA" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-indigo-600">{s.num}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem ──────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-600 tracking-widest uppercase">The problem</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">
              82% of partner leads never convert — and it's not the product.
            </h2>
            <p className="mt-3 text-sm text-slate-600 max-w-2xl mx-auto">
              Three structural bottlenecks in the RM-driven process: timing, language, capacity.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Clock,
                title: "Timing",
                body: "Leads arriving after hours sit untouched until next business day. 5-minute response wins 9× more than 30 minutes.",
              },
              {
                icon: Globe,
                title: "Language",
                body: "India has 20+ major languages. A Hindi lead given an English pitch hangs up in 15 seconds. RMs cover 1-2 languages.",
              },
              {
                icon: Layers,
                title: "Capacity",
                body: "One RM = one call at a time. A 200-lead overnight batch backs up for days. Lead #200 has forgotten they signed up.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white border border-slate-100 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-rose-500" />
                </div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-600 tracking-widest uppercase">What it does</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">
              The full pipeline, end to end.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Phone,
                color: "bg-emerald-50 text-emerald-600",
                title: "Instant outreach",
                body: "AI agent dials every new lead within seconds of CSV upload. 24/7, no queue, no weekends gap.",
              },
              {
                icon: Globe,
                color: "bg-sky-50 text-sky-600",
                title: "9 languages",
                body: "Hindi, English, Hinglish, Tamil, Telugu, Kannada, Marathi, Gujarati, Bengali — code-mixing included.",
              },
              {
                icon: Brain,
                color: "bg-violet-50 text-violet-600",
                title: "Smart objection handling",
                body: "Acknowledges, reframes, and moves forward — adapting to what the lead actually said, not a static script.",
              },
              {
                icon: Flame,
                color: "bg-amber-50 text-amber-600",
                title: "Hot / Warm / Cold scoring",
                body: "Every call scored on interest, readiness, and network size. Evidence quotes from the transcript.",
              },
              {
                icon: Headphones,
                color: "bg-indigo-50 text-indigo-600",
                title: "RM handoff brief",
                body: "Hot leads land in the RM queue with a 30-second summary, recommended opening line, and full audio replay.",
              },
              {
                icon: MessageCircle,
                color: "bg-emerald-50 text-emerald-600",
                title: "WhatsApp follow-up",
                body: "Personal-feeling message goes to Warm leads with the sign-up link. Click and delivery tracked.",
              },
              {
                icon: Mail,
                color: "bg-rose-50 text-rose-600",
                title: "Email signup link",
                body: "HTML email with clean CTA button to Hot/Warm leads. Tracks open status via Gmail SMTP.",
              },
              {
                icon: Snowflake,
                color: "bg-slate-100 text-slate-500",
                title: "Cold lead nurture",
                body: "Auto-scheduled re-engagement at 30/60/90 days. Bulk re-call from a filtered view.",
              },
              {
                icon: BarChart3,
                color: "bg-violet-50 text-violet-600",
                title: "Real-time dashboard",
                body: "Funnel breakdown, transcript viewer, scoring evidence, conversion by language and source.",
              },
            ].map(({ icon: Icon, color, title, body }) => (
              <div key={title} className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-slate-200 hover:shadow-sm transition-all">
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-4`}>
                  <Icon size={18} />
                </div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-600 tracking-widest uppercase">How it works</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">
              From upload to closed sign-up.
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                step: "01",
                title: "Upload leads",
                body: "Drop a CSV or add leads one by one. Phone, language preference, email — that's all you need.",
              },
              {
                step: "02",
                title: "AI agent calls each lead",
                body: "Within seconds, every lead gets a call in their language. The agent pitches naturally, handles objections, and qualifies interest.",
              },
              {
                step: "03",
                title: "Hot leads land in the RM queue",
                body: "Full transcript, summary, suggested opening line, and audio replay. RM picks up the phone already knowing the lead.",
              },
              {
                step: "04",
                title: "Warm + Cold leads auto-nurture",
                body: "Warm gets a WhatsApp + email follow-up with sign-up link. Cold gets auto-scheduled for re-engagement at 30/60/90 days.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-5 bg-white border border-slate-100 rounded-2xl p-6">
                <div className="text-2xl font-bold text-indigo-200 shrink-0 w-12">{step}</div>
                <div>
                  <p className="font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ──────────────────────────────────────────────────── */}
      <section>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="text-xs font-semibold text-indigo-600 tracking-widest uppercase">Built on</p>
          <h2 className="mt-2 text-xl md:text-2xl font-bold text-slate-900">
            Production-grade stack.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              "ElevenLabs Conversational AI",
              "Gemini 2.5 Flash",
              "FastAPI",
              "Next.js 16",
              "PostgreSQL",
              "Redis + RQ",
              "Meta WhatsApp Cloud API",
              "Gmail SMTP",
              "Twilio Voice",
              "HMAC-verified webhooks",
            ].map((t) => (
              <span
                key={t}
                className="text-xs bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA + footer ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Stop losing leads to delay, language, and queue overflow.
          </h2>
          <p className="mt-4 text-indigo-100 text-base max-w-2xl mx-auto">
            Spin up the dashboard, drop a CSV, and watch your funnel fill up by lunchtime.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-50 shadow-lg transition-all flex items-center gap-2"
            >
              Create your account <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="bg-indigo-500/30 hover:bg-indigo-500/40 text-white border border-indigo-400/40 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-indigo-100">
            {["No credit card", "Demo data preloaded", "Setup in minutes"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 size={12} /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
            <span className="font-semibold text-slate-700">SalesLead.ai</span>
            <span>·</span>
            <span>Built for the AI for Bharath hackathon</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Solving the Rupeezy AP partner conversion problem.
          </p>
        </div>
      </footer>
    </div>
  );
}
