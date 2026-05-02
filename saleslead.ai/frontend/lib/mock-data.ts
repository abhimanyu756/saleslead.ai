export type Classification = "Hot" | "Warm" | "Cold";
export type Language = "Hindi" | "English" | "Hinglish" | "Tamil" | "Telugu" | "Marathi";
export type ObjectionStatus = "resolved" | "partial" | "open";
export type LeadStatus = "ingested" | "contacted" | "qualified" | "handed_off" | "signed_up";

export interface Objection {
  type: string;
  raised_at_turn: number;
  resolution_status: ObjectionStatus;
}

export interface Score {
  interest_score: number;
  interest_evidence: string[];
  readiness_score: number;
  readiness_evidence: string[];
  network_size: "small" | "medium" | "large";
  network_evidence: string[];
}

export interface TranscriptTurn {
  speaker: "agent" | "lead";
  text: string;
  timestamp: string;
}

export interface WhatsAppMessage {
  id: string;
  lead_id: string;
  message_text: string;
  link: string;
  sent_at: string;
  clicked_at: string | null;
  language: Language;
}

export interface Call {
  id: string;
  lead_id: string;
  started_at: string;
  duration_s: number;
  language_used: Language;
  classification: Classification;
  summary: string;
  recommended_next_action: string;
  recommended_opening_line: string;
  cta_outcome: "signed_up" | "rm_scheduled" | "whatsapp_sent" | "no_action";
  benefits_covered: string[];
  score: Score;
  objections: Objection[];
  transcript: TranscriptTurn[];
  whatsapp?: WhatsAppMessage;
}

export const ALL_5_OBJECTIONS = [
  "I'm already with another broker",
  "I don't have enough contacts",
  "What if my clients face issues — who handles support?",
  "Is Rupeezy trustworthy?",
  "I'll think about it / call me later",
];

export interface Lead {
  id: string;
  name: string;
  phone: string;
  language_pref: Language;
  source: string;
  status: LeadStatus;
  created_at: string;
  last_call_at: string | null;
  current_classification: Classification | null;
  broker_affiliation?: string | null;
  calls: Call[];
}

export const MOCK_LEADS: Lead[] = [
  {
    id: "L001",
    name: "Rajesh Sharma",
    phone: "+91 98765 43210",
    language_pref: "Hinglish",
    source: "Google Ads",
    status: "handed_off",
    created_at: "2026-05-02T08:14:00Z",
    last_call_at: "2026-05-02T08:19:00Z",
    current_classification: "Hot",
    broker_affiliation: "Zerodha",
    calls: [
      {
        id: "C001",
        lead_id: "L001",
        started_at: "2026-05-02T08:19:00Z",
        duration_s: 342,
        language_used: "Hinglish",
        classification: "Hot",
        summary:
          "Rajesh is an MFD currently with Zerodha. He's open to switching because Zerodha holds back 30% brokerage. He asked about commission rates twice and confirmed he can sign up today. Network of ~80 clients in Pune. Main concern was about client support SLA — agent addressed it with Rupeezy's dedicated RM model.",
        recommended_next_action: "RM call within 2 hours, open with payout structure comparison vs Zerodha",
        recommended_opening_line:
          "Rajesh ji, maine suna hai aap abhi Zerodha ke saath hain — hum unse kitna alag hain, woh main clearly explain karna chahta hoon. Aapka 100% brokerage aaj se shuru ho sakta hai.",
        score: {
          interest_score: 8,
          interest_evidence: ["Asked about commission rates twice", "Asked 'sign up kaise karu'"],
          readiness_score: 7,
          readiness_evidence: ["Said 'main aaj sign up kar sakta hoon'", "Asked for sign-up link"],
          network_size: "medium",
          network_evidence: ["Mentioned ~80 clients in Pune", "Said he runs a small advisory firm"],
        },
        cta_outcome: "rm_scheduled",
        benefits_covered: ["Zero joining fee", "100% brokerage share", "Daily payouts"],
        objections: [
          { type: "I'm already with another broker", raised_at_turn: 3, resolution_status: "resolved" },
          { type: "What if my clients face issues — who handles support?", raised_at_turn: 7, resolution_status: "resolved" },
        ],
        transcript: [
          { speaker: "agent", text: "Namaste Rajesh ji! Main Priya hoon, Rupeezy ki taraf se. Kya aapke paas 2 minute hain?", timestamp: "00:00" },
          { speaker: "lead", text: "Haan bolo, kya hai?", timestamp: "00:08" },
          { speaker: "agent", text: "Rajesh ji, main aapko Rupeezy ke Authorized Partner program ke baare mein batana chahti hoon — zero joining fee, 100% brokerage share, aur daily payouts. Aap already kisi broker ke saath hain?", timestamp: "00:12" },
          { speaker: "lead", text: "Haan, main Zerodha ke saath hoon already. Koi nayi baat hai kya?", timestamp: "00:28" },
          { speaker: "agent", text: "Zerodha mein aapko kitna brokerage milta hai? Most partners told me 60-70%. Rupeezy mein 100% milta hai — daily aapke account mein. Koi cut nahi, koi delay nahi.", timestamp: "00:35" },
          { speaker: "lead", text: "100%? Matlab Rupeezy kuch nahi leta? Commission kya hai exactly?", timestamp: "00:52" },
          { speaker: "agent", text: "Bilkul sahi samjhe. Rupeezy zero joining fee leta hai, aur brokerage ka 100% aapko milta hai. Platform ka revenue model alag hai — aap sirf pure earn karte hain. Aapke 80 clients hain, toh monthly difference significant hoga.", timestamp: "00:58" },
          { speaker: "lead", text: "Theek hai interesting hai. But agar mere client ko koi issue aaye toh kaun handle karega?", timestamp: "01:22" },
          { speaker: "agent", text: "Great question. Rupeezy ka dedicated support model hai — har partner ko ek dedicated RM milta hai, plus client-facing helpline 9 to 9 available hai. Aur app issues mostly T+1 resolve hote hain. Aapke current broker mein yeh kya hai?", timestamp: "01:28" },
          { speaker: "lead", text: "Zerodha mein toh ticket dalo aur wait karo. Haan, yeh better lagta hai. Sign up kaise karte hain?", timestamp: "01:52" },
          { speaker: "agent", text: "Main aapko abhi WhatsApp pe link bhejti hoon. 5 minute mein complete ho jaata hai. Ek RM bhi aapko call karega aaj ke andar.", timestamp: "02:01" },
        ],
      },
    ],
  },
  {
    id: "L002",
    name: "Meera Iyer",
    phone: "+91 87654 32109",
    language_pref: "English",
    source: "LinkedIn Campaign",
    status: "qualified",
    created_at: "2026-05-02T09:30:00Z",
    last_call_at: "2026-05-02T09:35:00Z",
    current_classification: "Warm",
    broker_affiliation: null,
    calls: [
      {
        id: "C002",
        lead_id: "L002",
        started_at: "2026-05-02T09:35:00Z",
        duration_s: 198,
        language_used: "English",
        classification: "Warm",
        summary:
          "Meera is an insurance advisor looking to diversify into mutual funds. She's interested in the zero joining fee but unsure about her network size — she mentioned 'maybe 20-30 people'. She raised the trustworthiness objection and was partially convinced. Wants 48 hours to research Rupeezy's SEBI registration.",
        recommended_next_action: "Send WhatsApp link + SEBI registration doc. Follow up in 48 hours.",
        recommended_opening_line: "Meera, I shared the SEBI registration details — did you get a chance to look? Happy to walk you through any questions.",
        score: {
          interest_score: 6,
          interest_evidence: ["Asked about onboarding timeline", "Said 'this sounds different from what I've heard before'"],
          readiness_score: 4,
          readiness_evidence: ["Said 'give me 2 days to check'", "Asked for documentation first"],
          network_size: "small",
          network_evidence: ["Mentioned 20-30 contacts", "Insurance-focused network, not brokerage-first"],
        },
        cta_outcome: "whatsapp_sent",
        benefits_covered: ["Zero joining fee", "100% brokerage share", "Daily payouts"],
        objections: [
          { type: "Is Rupeezy trustworthy?", raised_at_turn: 5, resolution_status: "partial" },
          { type: "I don't have enough contacts", raised_at_turn: 8, resolution_status: "resolved" },
        ],
        whatsapp: {
          id: "WA001",
          lead_id: "L002",
          message_text: "Hi Meera! Thanks for the chat today. Here's your sign-up link for Rupeezy's AP program — zero joining fee, 100% brokerage share, daily payouts. Takes 5 minutes to complete.",
          link: "https://rupeezy.in/partner/signup?ref=L002",
          sent_at: "2026-05-02T09:38:00Z",
          clicked_at: null,
          language: "English",
        },
        transcript: [
          { speaker: "agent", text: "Hi Meera! I'm calling from Rupeezy about our Authorized Partner program. Do you have a couple of minutes?", timestamp: "00:00" },
          { speaker: "lead", text: "Sure, what's this about?", timestamp: "00:10" },
          { speaker: "agent", text: "We're looking for financial advisors to join as partners — zero joining fee, 100% brokerage share, daily payouts. You're currently in insurance, right?", timestamp: "00:13" },
          { speaker: "lead", text: "Yes, I do insurance. I've been thinking about adding mutual funds. But honestly, I haven't heard of Rupeezy. Is this a legit company?", timestamp: "00:28" },
          { speaker: "agent", text: "Totally fair question. Rupeezy is SEBI-registered, operational for 4+ years, and part of the Arihant Capital group. I can send you the registration details right now. What matters for you is that payouts are daily and verifiable — not monthly promises.", timestamp: "00:40" },
          { speaker: "lead", text: "Okay... I'd want to verify that before committing to anything.", timestamp: "01:05" },
          { speaker: "agent", text: "Absolutely. What's your WhatsApp — I'll send the SEBI doc and our partner page right now. One more thing — you mentioned insurance clients. Even 20 clients who invest ₹50k each adds up fast at 100% brokerage.", timestamp: "01:10" },
          { speaker: "lead", text: "I probably have 20-30 people who'd be open to it. It's not a huge network.", timestamp: "01:32" },
          { speaker: "agent", text: "That's actually a strong starting point. Most successful partners started with under 30 clients. The zero joining fee means zero risk to try. Can I send you the link?", timestamp: "01:38" },
          { speaker: "lead", text: "Sure, send it. Give me 2 days to check and I'll get back.", timestamp: "01:55" },
        ],
      },
    ],
  },
  {
    id: "L003",
    name: "Vikram Patel",
    phone: "+91 76543 21098",
    language_pref: "Hindi",
    source: "Referral",
    status: "contacted",
    created_at: "2026-05-02T10:00:00Z",
    last_call_at: "2026-05-02T10:05:00Z",
    current_classification: "Cold",
    broker_affiliation: "Angel Broking",
    calls: [
      {
        id: "C003",
        lead_id: "L003",
        started_at: "2026-05-02T10:05:00Z",
        duration_s: 87,
        language_used: "Hindi",
        classification: "Cold",
        summary:
          "Vikram is happy with Angel Broking and showed no interest in switching. He raised the 'I'll think about it' objection early and ended the call within 90 seconds. No questions about the product. Re-engage in 60 days.",
        recommended_next_action: "Schedule re-engagement at 60 days. Do not call before then.",
        recommended_opening_line: "Vikram ji, pichli baar aapne suna tha par interest nahi tha — sirf ek update dena chahta tha: daily payout feature ab active hai.",
        score: {
          interest_score: 2,
          interest_evidence: ["No questions asked", "Cut the call short"],
          readiness_score: 1,
          readiness_evidence: ["Said 'abhi nahi, baad mein sochta hoon'"],
          network_size: "small",
          network_evidence: ["No information provided"],
        },
        cta_outcome: "no_action",
        benefits_covered: ["Zero joining fee"],
        objections: [
          { type: "I'll think about it / call me later", raised_at_turn: 2, resolution_status: "open" },
        ],
        transcript: [
          { speaker: "agent", text: "Namaste Vikram ji! Main Rupeezy ki taraf se bol raha hoon — Authorized Partner program ke baare mein baat karna chahta tha. Kya 2 minute hain?", timestamp: "00:00" },
          { speaker: "lead", text: "Nahi bhai, abhi busy hoon. Baad mein call karo.", timestamp: "00:12" },
          { speaker: "agent", text: "Bilkul Vikram ji, ek second — sirf itna batana tha ki zero joining fee hai aur daily payout milta hai. Kabhi suna hai aisa kisi broker se?", timestamp: "00:18" },
          { speaker: "lead", text: "Haan sab bolte hain yeh sab. Main Angel Broking se khush hoon. Abhi nahi chahiye.", timestamp: "00:30" },
          { speaker: "agent", text: "Theek hai Vikram ji. Main aapko ek WhatsApp message bhejta hoon — jab time mile dekh lena. Koi force nahi hai.", timestamp: "00:40" },
          { speaker: "lead", text: "Theek hai.", timestamp: "00:48" },
        ],
      },
    ],
  },
  {
    id: "L004",
    name: "Ananya Krishnan",
    phone: "+91 65432 10987",
    language_pref: "Tamil",
    source: "Facebook Ads",
    status: "ingested",
    created_at: "2026-05-02T11:00:00Z",
    last_call_at: null,
    current_classification: null,
    calls: [],
  },
  {
    id: "L005",
    name: "Suresh Agarwal",
    phone: "+91 54321 09876",
    language_pref: "Hindi",
    source: "Google Ads",
    status: "signed_up",
    created_at: "2026-05-01T14:00:00Z",
    last_call_at: "2026-05-01T14:06:00Z",
    current_classification: "Hot",
    broker_affiliation: "IIFL",
    calls: [
      {
        id: "C004",
        lead_id: "L005",
        started_at: "2026-05-01T14:06:00Z",
        duration_s: 415,
        language_used: "Hindi",
        classification: "Hot",
        summary:
          "Suresh signed up immediately after the call. He's an IIFL sub-broker with 150+ clients and was frustrated with delayed payouts. Agent addressed the payout cadence and the zero fee model. He's already completed onboarding.",
        recommended_next_action: "Completed — lead signed up.",
        recommended_opening_line: "N/A — signed up.",
        score: {
          interest_score: 9,
          interest_evidence: ["Asked about onboarding steps", "Said 'yeh toh bahut achha hai'", "Asked how soon he can start"],
          readiness_score: 9,
          readiness_evidence: ["Signed up during the call", "Provided all details immediately"],
          network_size: "large",
          network_evidence: ["Mentioned 150+ clients", "IIFL sub-broker with 4 years experience"],
        },
        cta_outcome: "signed_up",
        benefits_covered: ["Zero joining fee", "100% brokerage share", "Daily payouts"],
        objections: [
          { type: "I'm already with another broker", raised_at_turn: 2, resolution_status: "resolved" },
        ],
        transcript: [
          { speaker: "agent", text: "Namaste Suresh ji! Rupeezy ke Authorized Partner program ke baare mein baat karna chahta hoon. Kya time hai?", timestamp: "00:00" },
          { speaker: "lead", text: "Haan bolo.", timestamp: "00:08" },
        ],
      },
    ],
  },
  {
    id: "L006",
    name: "Priya Nair",
    phone: "+91 43210 98765",
    language_pref: "English",
    source: "Webinar",
    status: "qualified",
    created_at: "2026-05-02T07:00:00Z",
    last_call_at: "2026-05-02T07:08:00Z",
    current_classification: "Warm",
    calls: [
      {
        id: "C005",
        lead_id: "L006",
        started_at: "2026-05-02T07:08:00Z",
        duration_s: 265,
        language_used: "English",
        classification: "Warm",
        summary: "Priya attended a webinar and is aware of Rupeezy. Interested in the daily payout model but concerned about client support. Wants to try with 10 clients first before committing fully.",
        recommended_next_action: "Send sign-up link + pilot program details. Follow up in 24 hours.",
        recommended_opening_line: "Priya, I've sent the pilot partner details — you can start with just 5 clients to test the support model.",
        score: {
          interest_score: 6,
          interest_evidence: ["Already attended a Rupeezy webinar", "Asked about client onboarding flow"],
          readiness_score: 5,
          readiness_evidence: ["Said 'I want to pilot with 10 clients first'"],
          network_size: "medium",
          network_evidence: ["Mentioned 60+ clients across MF and insurance"],
        },
        cta_outcome: "whatsapp_sent",
        benefits_covered: ["Zero joining fee", "100% brokerage share", "Daily payouts"],
        objections: [
          { type: "What if my clients face issues — who handles support?", raised_at_turn: 4, resolution_status: "resolved" },
        ],
        whatsapp: {
          id: "WA002",
          lead_id: "L006",
          message_text: "Hi Priya! Great speaking with you. Here's the pilot partner sign-up link — start with just 5 clients, zero commitment. Daily payouts from day one.",
          link: "https://rupeezy.in/partner/signup?ref=L006",
          sent_at: "2026-05-02T07:13:00Z",
          clicked_at: "2026-05-02T07:41:00Z",
          language: "English",
        },
        transcript: [
          { speaker: "agent", text: "Hi Priya! Calling from Rupeezy — you attended our webinar last week. Did you get a chance to review the partner program?", timestamp: "00:00" },
          { speaker: "lead", text: "Yes I did, actually. The daily payout thing caught my attention.", timestamp: "00:12" },
        ],
      },
    ],
  },
];

export const FUNNEL_DATA = [
  { stage: "Ingested", count: 48, fill: "#6366f1" },
  { stage: "Contacted", count: 41, fill: "#8b5cf6" },
  { stage: "Qualified", count: 28, fill: "#a78bfa" },
  { stage: "Handed Off", count: 12, fill: "#f59e0b" },
  { stage: "Signed Up", count: 7, fill: "#10b981" },
];

export const DAILY_ACTIVITY = [
  { date: "Apr 27", leads: 8, calls: 7, hot: 2 },
  { date: "Apr 28", leads: 12, calls: 11, hot: 3 },
  { date: "Apr 29", leads: 6, calls: 6, hot: 1 },
  { date: "Apr 30", leads: 9, calls: 8, hot: 2 },
  { date: "May 1", leads: 7, calls: 7, hot: 3 },
  { date: "May 2", leads: 6, calls: 2, hot: 1 },
];
