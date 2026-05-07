"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Flame,
  MessageCircle,
  Snowflake,
  PhoneCall,
  Mic,
  Zap,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/hot-queue", label: "Hot Queue", icon: Flame },
  { href: "/warm-queue", label: "Warm Queue", icon: MessageCircle },
  { href: "/cold-queue", label: "Cold Queue", icon: Snowflake },
  { href: "/calls", label: "All Calls", icon: PhoneCall },
  { href: "/voice", label: "Voice Demo", icon: Mic },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    router.push("/login");
  }

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">SalesLead.ai</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Rupeezy AP Program</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-100 space-y-3">
        <div className="text-[11px] text-slate-400">
          <p className="font-medium text-slate-500">Conversion Rate</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
              <div className="h-full w-[30%] bg-emerald-500 rounded-full" />
            </div>
            <span className="text-emerald-600 font-semibold">30%</span>
          </div>
          <p className="mt-1 text-slate-400">Target: 40%+</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
