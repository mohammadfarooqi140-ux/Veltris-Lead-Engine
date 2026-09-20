"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Clock,
  ExternalLink,
  CheckCircle2,
  Zap,
  ArrowRight,
  Heart,
  MessageSquare,
  UserCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { getLeads, updateLead, fastForwardWaitingPeriod, getSettings } from "@/services/leadStorage";
import { Lead } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function WarmingQueuePage() {
  const [leads, setLeads] = useState<Lead[]>(() => (typeof window !== "undefined" ? getLeads() : []));
  const [activeTab, setActiveTab] = useState<"pending" | "waiting" | "completed">("pending");
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Form inputs for the warming sequence
  const [likedPosts, setLikedPosts] = useState<Record<string, string[]>>({});
  const [comments, setComments] = useState<Record<string, { text: string; postUrl: string }>>({});
  const [warmingNotes, setWarmingNotes] = useState<Record<string, string>>({});
  const [confirmModalLead, setConfirmModalLead] = useState<Lead | null>(null);

  const refreshLeads = () => {
    const all = getLeads();
    setLeads(all);
  };

  useEffect(() => {
    const interval = setInterval(refreshLeads, 4000);
    return () => clearInterval(interval);
  }, []);

  const isDmSentOrDone = (l: Lead) => l.status === "dm_sent" || l.status === "DM Sent" || l.dm_sent || l.dmSent;
  const pendingWarmingLeads = leads.filter(l => l.status === "Approved for Warming" && !isDmSentOrDone(l));
  const waitingLeads = leads.filter(l => l.status === "Waiting 24 Hours" && !isDmSentOrDone(l));
  const readyOrWarmedLeads = leads.filter(l => l.status === "DM Ready" || l.status === "DM Approved" || l.status === "Warming Complete" || isDmSentOrDone(l));

  const handleMarkWarmingComplete = (lead: Lead) => {
    const now = new Date();
    const settings = getSettings();
    const waitingMs = (settings.waitingPeriodHours || 24) * 60 * 60 * 1000;
    const readyAt = new Date(now.getTime() + waitingMs).toISOString();

    const currentLiked = likedPosts[lead.id] || [];
    const currentComment = comments[lead.id] || { text: "", postUrl: "" };
    const currentNotes = warmingNotes[lead.id] || "";

    updateLead(lead.id, {
      status: "Waiting 24 Hours",
      warming_completed_at: now.toISOString(),
      follow_completed: true,
      likes_completed: 3,
      liked_post_urls: currentLiked,
      comment_completed: true,
      comment_text: currentComment.text || "Engaged with genuine, non-sales comment on recent clinic procedure post.",
      comment_post_url: currentComment.postUrl || null,
      warming_notes: currentNotes || null,
      ready_at: readyAt
    });

    setConfirmModalLead(null);
    setExpandedLeadId(null);
    refreshLeads();
  };

  const handleFastForwardOverride = (leadId: string) => {
    fastForwardWaitingPeriod(leadId);
    refreshLeads();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Instagram Warming Queue</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/60 text-amber-300 border border-amber-900/50 flex items-center gap-1">
              <Flame size={12} /> 1 Single Sequence
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Warm prospect accounts manually on Instagram: 1 Follow + 3 Likes + 1 Non-sales Comment. Enforces a mandatory 24-hour waiting delay.
          </p>
        </div>

        <div className="flex gap-2">
          <TabButton
            active={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
            label="Ready to Warm"
            count={pendingWarmingLeads.length}
          />
          <TabButton
            active={activeTab === "waiting"}
            onClick={() => setActiveTab("waiting")}
            label="Waiting 24 Hours"
            count={waitingLeads.length}
          />
          <TabButton
            active={activeTab === "completed"}
            onClick={() => setActiveTab("completed")}
            label="Warmed / DM Ready"
            count={readyOrWarmedLeads.length}
          />
        </div>
      </div>

      {/* Tab 1: Ready to Warm */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingWarmingLeads.length === 0 ? (
            <EmptyState message="No leads waiting for warming." subMessage="Approve leads from the Verification Queue to start warming." />
          ) : (
            pendingWarmingLeads.map(lead => {
              const isExpanded = expandedLeadId === lead.id;
              const leadLikes = likedPosts[lead.id] || ["", "", ""];
              const leadComment = comments[lead.id] || { text: "", postUrl: "" };

              return (
                <div key={lead.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-all">
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-100">{lead.business_name}</h3>
                        <StatusBadge status={lead.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="text-rose-400 font-semibold">{lead.instagram_handle}</span>
                        <span>&middot;</span>
                        <span>{lead.city}, UK</span>
                        <span>&middot;</span>
                        <span>{lead.follower_count ? `${lead.follower_count.toLocaleString()} followers` : "Active account"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {lead.instagram_profile_url && (
                        <a
                          href={lead.instagram_profile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Instagram size={13} /> Open Instagram <ExternalLink size={10} />
                        </a>
                      )}
                      <button
                        onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                      >
                        <Flame size={13} /> {isExpanded ? "Close Checklist" : "Start / Complete Warming"}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Single Sequence Checklist & Inputs */}
                  {isExpanded && (
                    <div className="p-6 bg-zinc-950/70 border-t border-zinc-800 space-y-6">
                      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                          Single Sequence Warming Protocol
                        </h4>
                        <p className="text-xs text-zinc-400 mb-3">
                          Perform the following 3 manual actions on their profile right now, then click Mark Warming Complete:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="bg-zinc-950 p-3 rounded border border-zinc-800 flex items-center gap-2">
                            <UserCheck size={16} className="text-emerald-400 shrink-0" />
                            <span>1. Follow the Instagram account</span>
                          </div>
                          <div className="bg-zinc-950 p-3 rounded border border-zinc-800 flex items-center gap-2">
                            <Heart size={16} className="text-rose-400 shrink-0" />
                            <span>2. Like 3 posts or reels</span>
                          </div>
                          <div className="bg-zinc-950 p-3 rounded border border-zinc-800 flex items-center gap-2">
                            <MessageSquare size={16} className="text-blue-400 shrink-0" />
                            <span>3. Leave 1 genuine, non-sales comment</span>
                          </div>
                        </div>
                      </div>

                      {/* Optional Action Details Input */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-semibold text-zinc-300">Record Action Details & URLs (Optional)</h5>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block text-zinc-400 mb-1">Liked Post 1 URL</label>
                            <input
                              type="url"
                              placeholder="https://instagram.com/p/..."
                              value={leadLikes[0] || ""}
                              onChange={e => {
                                const arr = [...leadLikes];
                                arr[0] = e.target.value;
                                setLikedPosts({ ...likedPosts, [lead.id]: arr });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 mb-1">Liked Post 2 URL</label>
                            <input
                              type="url"
                              placeholder="https://instagram.com/p/..."
                              value={leadLikes[1] || ""}
                              onChange={e => {
                                const arr = [...leadLikes];
                                arr[1] = e.target.value;
                                setLikedPosts({ ...likedPosts, [lead.id]: arr });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 mb-1">Liked Post 3 URL</label>
                            <input
                              type="url"
                              placeholder="https://instagram.com/p/..."
                              value={leadLikes[2] || ""}
                              onChange={e => {
                                const arr = [...leadLikes];
                                arr[2] = e.target.value;
                                setLikedPosts({ ...likedPosts, [lead.id]: arr });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-zinc-400 mb-1">Comment Text Left</label>
                            <textarea
                              rows={2}
                              placeholder="e.g. Really natural lip contouring result, love how subtle the volume looks!"
                              value={leadComment.text || ""}
                              onChange={e => setComments({ ...comments, [lead.id]: { ...leadComment, text: e.target.value } })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 mb-1">Commented Post URL & Warming Notes</label>
                            <input
                              type="url"
                              placeholder="Post URL where comment was left"
                              value={leadComment.postUrl || ""}
                              onChange={e => setComments({ ...comments, [lead.id]: { ...leadComment, postUrl: e.target.value } })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 mb-2"
                            />
                            <input
                              type="text"
                              placeholder="Optional warming notes"
                              value={warmingNotes[lead.id] || ""}
                              onChange={e => setWarmingNotes({ ...warmingNotes, [lead.id]: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Single Completion Button */}
                      <div className="flex justify-end pt-4 border-t border-zinc-800">
                        <button
                          onClick={() => setConfirmModalLead(lead)}
                          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-opacity shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 size={15} /> Mark Warming Complete (Starts 24h Timer)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Waiting 24 Hours */}
      {activeTab === "waiting" && (
        <div className="space-y-4">
          {waitingLeads.length === 0 ? (
            <EmptyState message="No leads currently waiting 24 hours." subMessage="Complete warming on pending leads to start their waiting timers." />
          ) : (
            waitingLeads.map(lead => (
              <WaitingLeadCard
                key={lead.id}
                lead={lead}
                onFastForward={() => handleFastForwardOverride(lead.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Tab 3: Completed / DM Ready */}
      {activeTab === "completed" && (
        <div className="space-y-4">
          {readyOrWarmedLeads.length === 0 ? (
            <EmptyState message="No leads are DM Ready yet." subMessage="Once 24 hours pass after warming, leads appear here ready for DM drafting." />
          ) : (
            readyOrWarmedLeads.map(lead => (
              <div key={lead.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-100">{lead.business_name}</h3>
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Warmed at {lead.warming_completed_at ? new Date(lead.warming_completed_at).toLocaleString() : "Recently"} &middot; 
                    <span className="text-emerald-400 font-semibold ml-1">24h delay satisfied</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href="/dm-approval"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    Draft & Approve DM <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Warming Completion Confirmation Modal */}
      {confirmModalLead && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-amber-400">
              <CheckCircle2 size={24} />
              <h3 className="text-base font-bold text-zinc-100">Confirm Warming Complete</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Have you manually completed on Instagram for <strong className="text-zinc-200">{confirmModalLead.business_name}</strong>:
            </p>

            <ul className="text-xs text-zinc-300 space-y-1.5 pl-4 list-disc">
              <li>Followed <span className="text-rose-400 font-semibold">{confirmModalLead.instagram_handle}</span></li>
              <li>Liked 3 posts or reels</li>
              <li>Left 1 genuine, non-sales comment</li>
            </ul>

            <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-3 text-xs text-purple-300">
              This will lock the lead into a <strong>24-Hour Waiting Period</strong>. DM drafting will become active only after 24 hours.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalLead(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkWarmingComplete(confirmModalLead)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg"
              >
                Confirm & Start 24h Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WaitingLeadCard({ lead, onFastForward }: { lead: Lead; onFastForward: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isPast: boolean }>({
    hours: 24,
    minutes: 0,
    seconds: 0,
    isPast: false
  });

  useEffect(() => {
    const calc = () => {
      if (!lead.ready_at) return;
      const target = new Date(lead.ready_at).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isPast: false });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [lead.ready_at]);

  return (
    <div className="bg-zinc-900 border border-purple-900/40 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-zinc-100">{lead.business_name}</h3>
          <StatusBadge status="Waiting 24 Hours" />
        </div>
        <p className="text-xs text-zinc-400">
          Warmed: {lead.warming_completed_at ? new Date(lead.warming_completed_at).toLocaleTimeString() : ""} &middot; 
          Ready: <strong className="text-purple-300">{lead.ready_at ? new Date(lead.ready_at).toLocaleString() : ""}</strong>
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Live Countdown */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
          <Clock size={14} className="text-purple-400 animate-spin" />
          <span className="font-mono font-bold text-purple-300">
            {timeLeft.isPast ? (
              "Ready to advance!"
            ) : (
              `${String(timeLeft.hours).padStart(2, "0")}:${String(timeLeft.minutes).padStart(2, "0")}:${String(timeLeft.seconds).padStart(2, "0")} remaining`
            )}
          </span>
        </div>

        {/* Development / Admin Fast-Forward Override */}
        <button
          onClick={onFastForward}
          className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/80 text-purple-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Fast-forward timer to immediately enable DM Ready state for testing"
        >
          <Zap size={13} className="text-yellow-400" /> Fast-Forward (Admin Override)
        </button>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
        active
          ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
          : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200"
      }`}
    >
      <span>{label}</span>
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-400"}`}>
        {count}
      </span>
    </button>
  );
}

function EmptyState({ message, subMessage }: { message: string; subMessage: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-sm">
      <Flame className="mx-auto text-zinc-600 mb-3" size={36} />
      <h3 className="text-sm font-bold text-zinc-100">{message}</h3>
      <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">{subMessage}</p>
    </div>
  );
}
