"use client";

import { useEffect, useState } from "react";
import { BarChart3, CheckCircle, Clock, ListTodo, MessageSquare, Users, XCircle, Reply } from "lucide-react";
import Link from "next/link";
import { Lead } from "@/types";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    total: 0,
    queue: 0,
    approved: 0,
    messagesSent: 0,
    followUpsDue: 0,
    replies: 0,
    dead: 0,
  });

  useEffect(() => {
    // READ-ONLY — never mutate localStorage from Dashboard
    const raw = localStorage.getItem("vle_queue");
    const leads: Lead[] = raw ? JSON.parse(raw) : [];

    const now = new Date();

    const queue = leads.filter(l => l.status === "New" || l.status === "Research Complete").length;
    const approved = leads.filter(l => l.status === "Approved" || l.status === "Contacted").length;
    
    const messagesSent = leads.filter(l => 
      l.outreachStatus?.dmStatus === "Sent" || l.outreachStatus?.emailStatus === "Sent"
    ).length;

    const followUpsDue = leads.filter(l => {
      if (l.status === "Dead" || l.status === "Replied") return false;
      if (l.outreachStatus?.leadStatus === "Replied" || l.outreachStatus?.leadStatus === "Dead") return false;
      const dmSent = l.outreachStatus?.dmStatus === "Sent";
      const emailSent = l.outreachStatus?.emailStatus === "Sent";
      if (!dmSent && !emailSent) return false;
      if (l.outreachStatus?.followUpDueDate) {
        return new Date(l.outreachStatus.followUpDueDate) <= now;
      }
      if (l.outreachStatus?.lastContactedDate) {
        const due = new Date(new Date(l.outreachStatus.lastContactedDate).getTime() + 3 * 24 * 60 * 60 * 1000);
        return due <= now;
      }
      return false;
    }).length;

    const replies = leads.filter(l => l.status === "Replied" || l.outreachStatus?.leadStatus === "Replied").length;
    const dead = leads.filter(l => l.status === "Dead" || l.outreachStatus?.leadStatus === "Dead").length;

    setMetrics({
      total: leads.length,
      queue,
      approved,
      messagesSent,
      followUpsDue,
      replies,
      dead,
    });
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Overview of Veltris Lead Engine performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Leads" value={metrics.total.toString()} icon={<Users className="text-blue-400" size={20} />} />
        <MetricCard title="Approval Queue" value={metrics.queue.toString()} icon={<ListTodo className="text-yellow-400" size={20} />} href="/queue" />
        <MetricCard title="Approved Leads" value={metrics.approved.toString()} icon={<CheckCircle className="text-emerald-400" size={20} />} href="/approved" />
        <MetricCard title="Messages Sent" value={metrics.messagesSent.toString()} subtitle="DM or email" icon={<MessageSquare className="text-violet-400" size={20} />} />
        <MetricCard title="Follow Ups Due" value={metrics.followUpsDue.toString()} icon={<Clock className="text-orange-400" size={20} />} href="/follow-ups" highlight={metrics.followUpsDue > 0} />
        <MetricCard title="Replies" value={metrics.replies.toString()} icon={<Reply className="text-cyan-400" size={20} />} />
        <MetricCard title="Dead Leads" value={metrics.dead.toString()} icon={<XCircle className="text-rose-400" size={20} />} />
        <MetricCard title="Conversion" value={metrics.total > 0 ? `${Math.round((metrics.replies / metrics.total) * 100)}%` : "0%"} subtitle="Replies / Total" icon={<BarChart3 className="text-indigo-400" size={20} />} />
      </div>

      <div className="border-t border-zinc-800/50 pt-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <Link href="/upload" className="px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-semibold rounded hover:bg-white transition-colors">
            Discover Leads
          </Link>
          <Link href="/queue" className="px-4 py-2 bg-zinc-800/50 text-zinc-300 text-sm font-semibold rounded hover:bg-zinc-800 transition-colors">
            Review Queue
          </Link>
          <Link href="/approved" className="px-4 py-2 bg-zinc-800/50 text-zinc-300 text-sm font-semibold rounded hover:bg-zinc-800 transition-colors">
            Outreach
          </Link>
          <Link href="/follow-ups" className="px-4 py-2 bg-zinc-800/50 text-zinc-300 text-sm font-semibold rounded hover:bg-zinc-800 transition-colors">
            Follow Ups
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, href, subtitle, highlight }: { title: string; value: string; icon: React.ReactNode; href?: string; subtitle?: string; highlight?: boolean }) {
  const content = (
    <div className={`p-4 flex items-center justify-between border-l-2 transition-colors ${highlight ? 'border-orange-500 bg-orange-950/10' : 'border-zinc-800 hover:border-zinc-700'} ${href ? 'cursor-pointer' : ''}`}>
      <div>
        <p className="text-xs font-medium text-zinc-500">{title}</p>
        <p className="text-2xl font-bold text-zinc-100 mt-0.5">{value}</p>
        {subtitle && <p className="text-[10px] text-zinc-600 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-2.5 bg-zinc-800/50 rounded-lg">
        {icon}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
