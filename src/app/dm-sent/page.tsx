"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send,
  Reply,
  ExternalLink,
  Filter
} from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { getLeads, updateLead } from "@/services/leadStorage";
import { Lead, ReplyStatus } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

function getInitialSentLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  return getLeads().filter(l => l.status === "DM Sent" || l.status === "dm_sent" || l.status === "Replied" || l.dm_sent || l.dmSent);
}

export default function DmSentPage() {
  const [leads, setLeads] = useState<Lead[]>(getInitialSentLeads);
  const [filterReply, setFilterReply] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [replyStatusVal, setReplyStatusVal] = useState<ReplyStatus>("Positive reply");
  const [replyNotesVal, setReplyNotesVal] = useState("");
  const [followUpDateVal, setFollowUpDateVal] = useState("");

  const refreshLeads = () => {
    const all = getLeads();
    const sentLeads = all.filter(l => l.status === "DM Sent" || l.status === "dm_sent" || l.status === "Replied" || l.dm_sent || l.dmSent);
    setLeads(sentLeads);
  };

  const filteredLeads = leads.filter(l => {
    if (filterReply === "all") return true;
    const rStatus = (l.replyStatus || l.reply_status || "").toLowerCase();
    return rStatus === filterReply.toLowerCase();
  });

  const handleOpenReplyModal = (lead: Lead) => {
    setSelectedLead(lead);
    setReplyStatusVal(lead.reply_status || "Positive reply");
    setReplyNotesVal(lead.reply_notes || "");
    setFollowUpDateVal(lead.follow_up_date ? lead.follow_up_date.slice(0, 10) : "");
  };

  const handleSaveReply = () => {
    if (!selectedLead) return;

    const now = new Date().toISOString();
    const isReplied = ["Positive reply", "Question / needs response", "Maybe later", "Not interested"].includes(replyStatusVal);

    updateLead(selectedLead.id, {
      reply_status: replyStatusVal,
      reply_notes: replyNotesVal || null,
      reply_received_at: isReplied ? now : selectedLead.reply_received_at,
      status: isReplied ? "Replied" : replyStatusVal === "Closed" ? "Closed / Dead" : selectedLead.status,
      follow_up_date: followUpDateVal ? new Date(followUpDateVal).toISOString() : selectedLead.follow_up_date
    });

    setSelectedLead(null);
    refreshLeads();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">DM Sent & Replies</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-900/50">
              {leads.length} outreach records
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Track outbound Instagram DMs, log prospect replies, and manage ongoing dialogue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-zinc-500" />
          <select
            value={filterReply}
            onChange={e => setFilterReply(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg p-2 focus:ring-rose-500"
          >
            <option value="all">All Reply Statuses ({leads.length})</option>
            <option value="unknown">Unknown</option>
            <option value="Awaiting reply">Awaiting reply</option>
            <option value="Positive reply">Positive reply</option>
            <option value="Question / needs response">Question / needs response</option>
            <option value="Maybe later">Maybe later</option>
            <option value="Not interested">Not interested</option>
            <option value="No response">No response</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center shadow-sm">
          <Send className="mx-auto text-zinc-600 mb-3" size={40} />
          <h3 className="text-base font-bold text-zinc-100">No Sent DMs Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Once DMs are approved and marked as sent, they will appear here with status tracking.
          </p>
          <div className="mt-6">
            <Link
              href="/dm-approval"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors inline-block"
            >
              Go to DM Approval Queue
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-zinc-100">{lead.business_name}</h3>
                    <StatusBadge status={lead.status} />
                    {(lead.replyStatus || lead.reply_status) && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-900/40 capitalize">
                        {lead.replyStatus || lead.reply_status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="text-rose-400 font-semibold">{lead.instagram_handle}</span>
                    <span>&middot;</span>
                    <span>Sent: {lead.dm_sent_at ? new Date(lead.dm_sent_at).toLocaleString() : "Recently"}</span>
                    {lead.sender_ig_account && (
                      <>
                        <span>&middot;</span>
                        <span className="text-zinc-500">Via: {lead.sender_ig_account}</span>
                      </>
                    )}
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
                      <Instagram size={13} /> View Conversation <ExternalLink size={10} />
                    </a>
                  )}
                  <button
                    onClick={() => handleOpenReplyModal(lead)}
                    className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Reply size={13} /> Log / Edit Reply
                  </button>
                </div>
              </div>

              {/* Message Sent Preview */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 text-xs text-zinc-300 leading-relaxed font-sans">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Message Sent on Instagram:</span>
                <p className="whitespace-pre-wrap">{lead.dm_text_used || lead.dm_draft || "No text recorded"}</p>
              </div>

              {/* Reply Details if recorded */}
              {lead.reply_notes && (
                <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-lg p-3 text-xs text-cyan-300">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Prospect Response Notes:</span>
                  <p>{lead.reply_notes}</p>
                  {lead.reply_received_at && (
                    <span className="text-[10px] text-cyan-500 mt-1 block">
                      Received at: {new Date(lead.reply_received_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Record / Edit Reply Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <Reply size={24} />
              <div>
                <h3 className="text-base font-bold text-zinc-100">Log Reply & Status</h3>
                <p className="text-xs text-zinc-400">{selectedLead.business_name} ({selectedLead.instagram_handle})</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Reply Outcome</label>
                <select
                  value={replyStatusVal}
                  onChange={e => setReplyStatusVal(e.target.value as ReplyStatus)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                >
                  <option value="Awaiting reply">Awaiting reply</option>
                  <option value="Positive reply">Positive reply (Interested in booking automation)</option>
                  <option value="Question / needs response">Question / needs response</option>
                  <option value="Maybe later">Maybe later</option>
                  <option value="Not interested">Not interested</option>
                  <option value="No response">No response</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Reply Notes & Context</label>
                <textarea
                  rows={3}
                  value={replyNotesVal}
                  onChange={e => setReplyNotesVal(e.target.value)}
                  placeholder="Record key details from prospect's message..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Next Follow-up Date (Optional)</label>
                <input
                  type="date"
                  value={followUpDateVal}
                  onChange={e => setFollowUpDateVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReply}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors"
              >
                Save Outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
