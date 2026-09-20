"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  RotateCcw
} from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { getLeads, updateLead } from "@/services/leadStorage";
import { Lead } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

function getInitialFollowUpQueue(): Lead[] {
  if (typeof window === "undefined") return [];
  const all = getLeads();
  const now = new Date();

  return all.filter(l => {
    if (l.status === "Closed / Dead") return false;
    if (l.status === "Follow-up Due") return true;

    if (l.status === "DM Sent") {
      if (l.follow_up_date) {
        return new Date(l.follow_up_date) <= now;
      }
      if (l.dm_sent_at) {
        const due = new Date(new Date(l.dm_sent_at).getTime() + 3 * 24 * 60 * 60 * 1000);
        return due <= now;
      }
    }

    return false;
  });
}

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>(getInitialFollowUpQueue);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFollowUp1, setEditFollowUp1] = useState("");
  const [editFollowUp2, setEditFollowUp2] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const refreshLeads = () => {
    const all = getLeads();
    const now = new Date();

    const followUpQueue = all.filter(l => {
      if (l.status === "Closed / Dead") return false;
      if (l.status === "Follow-up Due") return true;

      if (l.status === "DM Sent") {
        if (l.follow_up_date) {
          return new Date(l.follow_up_date) <= now;
        }
        if (l.dm_sent_at) {
          const due = new Date(new Date(l.dm_sent_at).getTime() + 3 * 24 * 60 * 60 * 1000);
          return due <= now;
        }
      }

      return false;
    });

    setLeads(followUpQueue);
  };

  const handleStartEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setEditFollowUp1(lead.follow_up_1_date ? lead.follow_up_1_date.slice(0, 10) : "");
    setEditFollowUp2(lead.follow_up_2_date ? lead.follow_up_2_date.slice(0, 10) : "");
    setEditNotes(lead.follow_up_notes || "");
  };

  const handleSaveEdit = (lead: Lead) => {
    const nextDate = editFollowUp2 || editFollowUp1;
    updateLead(lead.id, {
      follow_up_1_date: editFollowUp1 ? new Date(editFollowUp1).toISOString() : null,
      follow_up_2_date: editFollowUp2 ? new Date(editFollowUp2).toISOString() : null,
      follow_up_date: nextDate ? new Date(nextDate).toISOString() : null,
      follow_up_notes: editNotes || null
    });
    setEditingId(null);
    refreshLeads();
  };

  const handleSnooze = (lead: Lead, days: number) => {
    const next = new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    updateLead(lead.id, {
      status: "DM Sent",
      follow_up_date: next,
      follow_up_count: (lead.follow_up_count || 0) + 1,
      follow_up_notes: `Snoozed +${days} days at ${new Date().toLocaleDateString()}`
    });
    refreshLeads();
  };

  const handleMarkReplied = (lead: Lead) => {
    updateLead(lead.id, {
      status: "Replied",
      reply_status: "Positive reply",
      reply_received_at: new Date().toISOString()
    });
    refreshLeads();
  };

  const handleMarkMaybeLater = (lead: Lead) => {
    const next = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    updateLead(lead.id, {
      reply_status: "Maybe later",
      follow_up_date: next,
      status: "DM Sent",
      follow_up_notes: "Prospect asked to re-contact in a few weeks"
    });
    refreshLeads();
  };

  const handleMarkNotInterested = (lead: Lead) => {
    updateLead(lead.id, {
      status: "Closed / Dead",
      reply_status: "Not interested",
      final_outcome: "Not interested"
    });
    refreshLeads();
  };

  const handleCloseLead = (lead: Lead) => {
    updateLead(lead.id, {
      status: "Closed / Dead",
      final_outcome: "Closed after non-response"
    });
    refreshLeads();
  };

  const handleReopenLead = (lead: Lead) => {
    updateLead(lead.id, {
      status: "Approved for Warming",
      final_outcome: null
    });
    refreshLeads();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Instagram Follow-ups</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-950/60 text-orange-300 border border-orange-900/50">
              {leads.length} due
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage secondary and tertiary follow-ups with customizable dates, snooze options, and reply recording.
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center shadow-sm">
          <Clock className="mx-auto text-zinc-600 mb-3" size={40} />
          <h3 className="text-base font-bold text-zinc-100">No Follow-ups Due Right Now</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Leads will automatically appear here once their scheduled follow-up date arrives.
          </p>
          <div className="mt-6">
            <Link
              href="/dm-sent"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-lg transition-colors inline-block"
            >
              View Sent Outreach
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map(lead => {
            const isEditing = editingId === lead.id;

            return (
              <div key={lead.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-100">{lead.business_name}</h3>
                      <StatusBadge status={lead.status} />
                      {lead.follow_up_count > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Follow-up #{lead.follow_up_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="text-rose-400 font-semibold">{lead.instagram_handle}</span>
                      <span>&middot;</span>
                      <span>Initial DM: {lead.dm_sent_at ? new Date(lead.dm_sent_at).toLocaleDateString() : "Recently"}</span>
                      <span>&middot;</span>
                      <span className="text-orange-400 font-semibold">
                        Due: {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : "Overdue"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                      onClick={() => (isEditing ? handleSaveEdit(lead) : handleStartEdit(lead))}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isEditing ? <><Save size={13} /> Save Dates</> : <><Edit2 size={13} /> Edit Dates</>}
                    </button>
                  </div>
                </div>

                {/* Editable Dates or Summary */}
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <div>
                      <label className="block text-zinc-400 mb-1">Follow-up 1 Date</label>
                      <input
                        type="date"
                        value={editFollowUp1}
                        onChange={e => setEditFollowUp1(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">Follow-up 2 Date</label>
                      <input
                        type="date"
                        value={editFollowUp2}
                        onChange={e => setEditFollowUp2(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">Follow-up Notes</label>
                      <input
                        type="text"
                        placeholder="Context for next follow-up"
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 text-xs text-zinc-400 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                    <span>
                      Follow-up 1: <strong className="text-zinc-200">{lead.follow_up_1_date ? new Date(lead.follow_up_1_date).toLocaleDateString() : "Not set"}</strong>
                    </span>
                    <span>&middot;</span>
                    <span>
                      Follow-up 2: <strong className="text-zinc-200">{lead.follow_up_2_date ? new Date(lead.follow_up_2_date).toLocaleDateString() : "Not set"}</strong>
                    </span>
                    {lead.follow_up_notes && (
                      <>
                        <span>&middot;</span>
                        <span className="text-zinc-300 italic truncate max-w-sm">Notes: {lead.follow_up_notes}</span>
                      </>
                    )}
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSnooze(lead, 3)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
                      title="Postpone follow-up by 3 days"
                    >
                      +3 Days
                    </button>
                    <button
                      onClick={() => handleSnooze(lead, 7)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors"
                      title="Postpone follow-up by 7 days"
                    >
                      +7 Days
                    </button>
                    <button
                      onClick={() => handleMarkMaybeLater(lead)}
                      className="px-3 py-1 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-900/40 text-purple-300 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Maybe Later (+14d)
                    </button>
                    <button
                      onClick={() => handleReopenLead(lead)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      title="Reopen lead into warming"
                    >
                      <RotateCcw size={12} /> Reopen
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleMarkReplied(lead)}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} /> Mark Replied
                    </button>
                    <button
                      onClick={() => handleMarkNotInterested(lead)}
                      className="px-3 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Not Interested
                    </button>
                    <button
                      onClick={() => handleCloseLead(lead)}
                      className="px-3 py-1 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/40 text-rose-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle size={13} /> Close Lead
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
