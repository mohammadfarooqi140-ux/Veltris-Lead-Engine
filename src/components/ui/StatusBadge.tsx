import { LeadStatus } from "@/types";

export function StatusBadge({ status }: { status: LeadStatus | string }) {
  switch (status) {
    case "Discovered":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          Discovered
        </span>
      );
    case "Verified":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/40 text-blue-400 border border-blue-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Verified
        </span>
      );
    case "Approved for Warming":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-400 border border-amber-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          Approved for Warming
        </span>
      );
    case "Warming Complete":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950/40 text-orange-400 border border-orange-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
          Warming Complete
        </span>
      );
    case "Waiting 24 Hours":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/40 text-purple-300 border border-purple-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
          Waiting 24 Hours
        </span>
      );
    case "DM Ready":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          DM Ready
        </span>
      );
    case "DM Approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-950/40 text-teal-300 border border-teal-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
          DM Approved
        </span>
      );
    case "DM Sent":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/40 text-indigo-300 border border-indigo-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          DM Sent
        </span>
      );
    case "Replied":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/40 text-cyan-300 border border-cyan-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          Replied
        </span>
      );
    case "Follow-up Due":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/40 text-rose-300 border border-rose-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          Follow-up Due
        </span>
      );
    case "Closed / Dead":
    case "Dead":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-500 border border-zinc-800">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
          Closed / Dead
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300">
          {status}
        </span>
      );
  }
}

export function DuplicateBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60">
      Duplicate
    </span>
  );
}

export function PriorContactBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
      {status}
    </span>
  );
}
