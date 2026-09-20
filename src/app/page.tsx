"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  ListFilter,
  Flame,
  Clock,
  CheckCircle2,
  Send,
  Reply,
  AlertCircle,
  XCircle,
  Percent,
  TrendingUp,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { getLeads, calculateMetrics } from "@/services/leadStorage";
import { DashboardMetrics } from "@/types";

function getInitialMetrics(): DashboardMetrics {
  if (typeof window === "undefined") {
    return {
      total: 0,
      verified: 0,
      awaitingVerification: 0,
      approvedForWarming: 0,
      warmingComplete: 0,
      waiting24Hours: 0,
      dmReady: 0,
      dmApproved: 0,
      dmsSent: 0,
      replies: 0,
      followUpsDue: 0,
      closedDead: 0,
      replyRate: 0,
      conversionRate: 0
    };
  }
  const leads = getLeads();
  return calculateMetrics(leads);
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(getInitialMetrics);

  useEffect(() => {
    const refresh = () => {
      const leads = getLeads();
      setMetrics(calculateMetrics(leads));
    };
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Instagram Outreach Dashboard</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/60 text-rose-300 border border-rose-900/50 flex items-center gap-1">
              <Instagram size={12} /> IG Only
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Manual qualification, warming, and DM tracking for UK Aesthetic Clinics & MedSpas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/upload"
            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 text-zinc-950 font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles size={14} /> Add / Import Leads
          </Link>
          <Link
            href="/verify"
            className="px-4 py-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 font-medium text-xs rounded-lg border border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck size={14} /> Verification Queue
          </Link>
          <Link
            href="/warming"
            className="px-4 py-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 font-medium text-xs rounded-lg border border-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <Flame size={14} /> Warming Queue
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Core Performance Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <MetricCard title="Total Leads" value={metrics.total} icon={<Users size={16} className="text-blue-400" />} href="/leads" />
          <MetricCard title="Awaiting Verify" value={metrics.awaitingVerification} icon={<ListFilter size={16} className="text-yellow-400" />} href="/verify" highlight={metrics.awaitingVerification > 0} />
          <MetricCard title="Verified Leads" value={metrics.verified} icon={<ShieldCheck size={16} className="text-cyan-400" />} href="/verify" />
          <MetricCard title="Approved Warming" value={metrics.approvedForWarming} icon={<Flame size={16} className="text-amber-400" />} href="/warming" highlight={metrics.approvedForWarming > 0} />
          <MetricCard title="Waiting 24h" value={metrics.waiting24Hours} icon={<Clock size={16} className="text-purple-400" />} href="/warming" />
          <MetricCard title="DM Ready" value={metrics.dmReady} icon={<CheckCircle2 size={16} className="text-emerald-400" />} href="/dm-approval" highlight={metrics.dmReady > 0} />
          <MetricCard title="DM Approved" value={metrics.dmApproved} icon={<CheckCircle2 size={16} className="text-teal-400" />} href="/dm-approval" />
        </div>
      </div>

      {/* Outreach Funnel & Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="DMs Sent" value={metrics.dmsSent} subtitle="Manual Instagram DMs" icon={<Send size={18} className="text-indigo-400" />} href="/dm-sent" />
        <MetricCard title="Replies Received" value={metrics.replies} subtitle={`${metrics.replyRate}% reply rate`} icon={<Reply size={18} className="text-cyan-400" />} href="/dm-sent" />
        <MetricCard title="Follow-ups Due" value={metrics.followUpsDue} subtitle="Action required" icon={<AlertCircle size={18} className="text-rose-400" />} href="/follow-ups" highlight={metrics.followUpsDue > 0} />
        <MetricCard title="Closed / Dead" value={metrics.closedDead} subtitle="Non-responsive / Not interested" icon={<XCircle size={18} className="text-zinc-500" />} href="/leads" />
      </div>

      {/* Rates & Funnel Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion & Rates */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Percent size={16} className="text-rose-400" /> Conversion & Response
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-zinc-400 font-medium">DM Reply Rate</span>
                <span className="text-sm font-bold text-emerald-400">{metrics.replyRate}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, metrics.replyRate)}%` }}></div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Replies / Total Contacted Leads</p>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-zinc-400 font-medium">Total Conversion Rate</span>
                <span className="text-sm font-bold text-cyan-400">{metrics.conversionRate}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, metrics.conversionRate)}%` }}></div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Replies / Total Discovered Leads</p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/80">
            <Link href="/reports" className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1">
              View Detailed Instagram Analytics <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Workflow Stage Funnel */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-blue-400" /> Active Instagram Pipeline Funnel
          </h3>

          <div className="space-y-3">
            <FunnelBar label="1. Discovered" count={metrics.awaitingVerification} total={metrics.total} color="bg-zinc-500" href="/verify" />
            <FunnelBar label="2. Verified" count={metrics.verified} total={metrics.total} color="bg-blue-500" href="/verify" />
            <FunnelBar label="3. Approved for Warming" count={metrics.approvedForWarming} total={metrics.total} color="bg-amber-500" href="/warming" />
            <FunnelBar label="4. Waiting 24h Delay" count={metrics.waiting24Hours} total={metrics.total} color="bg-purple-500" href="/warming" />
            <FunnelBar label="5. DM Ready" count={metrics.dmReady} total={metrics.total} color="bg-emerald-500" href="/dm-approval" />
            <FunnelBar label="6. DM Sent" count={metrics.dmsSent} total={metrics.total} color="bg-indigo-500" href="/dm-sent" />
            <FunnelBar label="7. Replied" count={metrics.replies} total={metrics.total} color="bg-cyan-500" href="/dm-sent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  href,
  highlight
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
  highlight?: boolean;
}) {
  const card = (
    <div
      className={`p-4 rounded-xl border transition-all ${
        highlight
          ? "bg-rose-950/20 border-rose-900/60 shadow-sm"
          : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
      } ${href ? "cursor-pointer group" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors">{title}</span>
        <div className="p-1.5 bg-zinc-950/80 rounded-md border border-zinc-800">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</p>
      {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

function FunnelBar({
  label,
  count,
  total,
  color,
  href
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  href: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <Link href={href} className="group block">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-zinc-300 group-hover:text-zinc-100 font-medium transition-colors">{label}</span>
        <span className="text-zinc-400 font-semibold">{count} leads ({pct}%)</span>
      </div>
      <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
        <div className={`h-full ${color} rounded-full transition-all duration-300`} style={{ width: `${Math.max(2, pct)}%` }}></div>
      </div>
    </Link>
  );
}
