"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Send,
  Clock,
  Users,
  BarChart3,
  Settings
} from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { useEffect, useState } from "react";
import { getLeads } from "@/services/leadStorage";

interface NavLinkItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badgeKey?: "verify" | "warming" | "dmApproval" | "followUps";
}

function computeCounts() {
  const leads = typeof window !== "undefined" ? getLeads() : [];
  const now = new Date();
  return {
    verify: leads.filter(l => l.status === "Discovered").length,
    warming: leads.filter(l => l.status === "Approved for Warming" || l.status === "Waiting 24 Hours").length,
    dmApproval: leads.filter(l => l.status === "DM Ready" || l.status === "DM Approved").length,
    followUps: leads.filter(l => {
      if (l.status === "Follow-up Due") return true;
      if (l.status === "DM Sent" && l.follow_up_date && new Date(l.follow_up_date) <= now) return true;
      return false;
    }).length
  };
}

export function Sidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState(computeCounts);

  useEffect(() => {
    const updateCounts = () => {
      setCounts(computeCounts());
    };

    const interval = setInterval(updateCounts, 4000);
    return () => clearInterval(interval);
  }, []);

  const navItems: NavLinkItem[] = [
    { href: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { href: "/upload", icon: <UserPlus size={18} />, label: "Add / Import Leads" },
    { href: "/verify", icon: <ShieldCheck size={18} />, label: "Verification Queue", badgeKey: "verify" },
    { href: "/warming", icon: <Flame size={18} />, label: "Warming Queue", badgeKey: "warming" },
    { href: "/dm-approval", icon: <CheckCircle2 size={18} />, label: "DM Approval Queue", badgeKey: "dmApproval" },
    { href: "/dm-sent", icon: <Send size={18} />, label: "DM Sent / Replies" },
    { href: "/follow-ups", icon: <Clock size={18} />, label: "Follow-ups", badgeKey: "followUps" },
    { href: "/leads", icon: <Users size={18} />, label: "All Leads" },
    { href: "/reports", icon: <BarChart3 size={18} />, label: "Reports & Analytics" },
    { href: "/settings", icon: <Settings size={18} />, label: "Settings / Export" }
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col h-full shrink-0 overflow-y-auto select-none">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-md">
            <Instagram size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-100 tracking-tight leading-none">Veltris Lead Engine</h1>
            <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Instagram CRM &middot; UK ICP
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const badgeValue = item.badgeKey ? counts[item.badgeKey] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? "text-rose-400" : "text-zinc-400"}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {badgeValue > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2.5 text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center justify-between text-zinc-300 font-semibold">
            <span>Outreach Mode</span>
            <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/40">
              Manual IG Only
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-tight">
            No automated bots &middot; No emails &middot; 24h warm delay enforced
          </p>
        </div>
      </div>
    </aside>
  );
}
