"use client";

import { useEffect, useState } from "react";
import { Lead } from "@/types";
import { Clock, ExternalLink, Mail, MessageCircle, Search, CheckCircle2, XCircle, RotateCw } from "lucide-react";

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = () => {
    // Read from canonical source only
    const raw = localStorage.getItem("vle_queue");
    const allLeads: Lead[] = raw ? JSON.parse(raw) : [];
    const now = new Date();

    const dueLeads = allLeads.filter(l => {
      if (l.status === "Dead" || l.status === "Replied") return false;
      if (l.outreachStatus?.leadStatus === "Replied" || l.outreachStatus?.leadStatus === "Dead") return false;

      const dmSent = l.outreachStatus?.dmStatus === "Sent";
      const emailSent = l.outreachStatus?.emailStatus === "Sent";
      if (!dmSent && !emailSent) return false;

      // Check followUpDueDate first
      if (l.outreachStatus?.followUpDueDate) {
        return new Date(l.outreachStatus.followUpDueDate) <= now;
      }

      // Fallback: check lastContactedDate + 3 days
      if (l.outreachStatus?.lastContactedDate) {
        const lastContact = new Date(l.outreachStatus.lastContactedDate);
        const dueDate = new Date(lastContact.getTime() + 3 * 24 * 60 * 60 * 1000);
        return dueDate <= now;
      }

      return false;
    });

    setLeads(dueLeads);
  };

  const updateLeadInStorage = (updatedLead: Lead) => {
    const queueData = localStorage.getItem("vle_queue");
    if (queueData) {
      let queue: Lead[] = JSON.parse(queueData);
      queue = queue.map(q => q.id === updatedLead.id ? updatedLead : q);
      localStorage.setItem("vle_queue", JSON.stringify(queue));
    }
    setLeads(prev => prev.filter(l => l.id !== updatedLead.id || shouldStillShow(updatedLead)));
  };

  const shouldStillShow = (lead: Lead): boolean => {
    if (lead.status === "Dead" || lead.status === "Replied") return false;
    if (lead.outreachStatus?.leadStatus === "Replied" || lead.outreachStatus?.leadStatus === "Dead") return false;
    if (lead.outreachStatus?.followUpDueDate && new Date(lead.outreachStatus.followUpDueDate) > new Date()) return false;
    return true;
  };

  const handleFollowedUp = (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const now = new Date();
    const nextFollowUp = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const updated: Lead = {
      ...lead,
      outreachStatus: {
        ...lead.outreachStatus,
        dmStatus: lead.outreachStatus?.dmStatus || "Not Ready",
        emailStatus: lead.outreachStatus?.emailStatus || "Not Ready",
        channelUsed: lead.outreachStatus?.channelUsed || "None",
        lastContactedDate: now.toISOString(),
        followUpDueDate: nextFollowUp.toISOString(),
        leadStatus: "Active",
      }
    };
    updateLeadInStorage(updated);
    // Remove from current view since follow-up is now in the future
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleReplied = (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const updated: Lead = {
      ...lead,
      status: "Replied",
      outreachStatus: {
        ...lead.outreachStatus,
        dmStatus: lead.outreachStatus?.dmStatus || "Not Ready",
        emailStatus: lead.outreachStatus?.emailStatus || "Not Ready",
        channelUsed: lead.outreachStatus?.channelUsed || "None",
        leadStatus: "Replied",
      }
    };
    updateLeadInStorage(updated);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleDead = (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    const updated: Lead = {
      ...lead,
      status: "Dead",
      outreachStatus: {
        ...lead.outreachStatus,
        dmStatus: lead.outreachStatus?.dmStatus || "Not Ready",
        emailStatus: lead.outreachStatus?.emailStatus || "Not Ready",
        channelUsed: lead.outreachStatus?.channelUsed || "None",
        leadStatus: "Dead",
      }
    };
    updateLeadInStorage(updated);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const getDaysOverdue = (lead: Lead): number => {
    const dueDate = lead.outreachStatus?.followUpDueDate 
      ? new Date(lead.outreachStatus.followUpDueDate)
      : lead.outreachStatus?.lastContactedDate 
        ? new Date(new Date(lead.outreachStatus.lastContactedDate).getTime() + 3 * 24 * 60 * 60 * 1000)
        : new Date();
    const diff = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Follow Ups</h1>
        <p className="text-sm text-zinc-400 mt-1">Leads that need follow-up action. <span className="text-zinc-500">{leads.length} due</span></p>
      </div>

      <div className="divide-y divide-zinc-800/50">
        {leads.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <Clock className="mx-auto mb-3 text-zinc-600" size={32} />
            <p>No follow-ups due right now.</p>
            <p className="text-xs mt-1">Leads will appear here 3 days after outreach with no reply.</p>
          </div>
        ) : leads.map(lead => {
          const overdue = getDaysOverdue(lead);
          return (
            <div key={lead.id} className="py-3 hover:bg-zinc-900/30 transition-colors">
              <div className="flex items-center justify-between gap-4">
                {/* Lead info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-100 truncate">{lead.businessName}</h3>
                      <span className="text-xs text-zinc-500">{lead.city}</span>
                      {overdue > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/30 text-rose-400 border border-rose-900/30">
                          {overdue}d overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <MessageCircle size={11}/> {lead.outreachStatus?.dmStatus || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={11}/> {lead.outreachStatus?.emailStatus || "N/A"}
                      </span>
                      <span>
                        Channel: {lead.outreachStatus?.channelUsed || "None"}
                      </span>
                      <span>
                        Last: {lead.outreachStatus?.lastContactedDate ? new Date(lead.outreachStatus.lastContactedDate).toLocaleDateString() : "Never"}
                      </span>
                      {lead.outreachStatus?.followUpDueDate && (
                        <span>
                          Due: {new Date(lead.outreachStatus.followUpDueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {lead.instagramHandle ? (
                    <a 
                      href={lead.instagramHandle.includes("instagram.com") ? lead.instagramHandle : `https://instagram.com/${lead.instagramHandle.replace('@', '')}`}
                      target="_blank" rel="noreferrer"
                      className="px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink size={11}/> IG
                    </a>
                  ) : (
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${lead.businessName} ${lead.city} Instagram`)}`}
                      target="_blank" rel="noreferrer"
                      className="px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                      <Search size={11}/> IG
                    </a>
                  )}
                  
                  {lead.email ? (
                    <a 
                      href={`mailto:${lead.email}`}
                      className="px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                      <Mail size={11}/> Email
                    </a>
                  ) : (
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(`"${lead.businessName}" ${lead.city} email contact`)}`}
                      target="_blank" rel="noreferrer"
                      className="px-2 py-1 text-xs font-medium text-zinc-300 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                      <Search size={11}/> Email
                    </a>
                  )}

                  <button 
                    onClick={() => handleFollowedUp(lead.id)}
                    className="px-2.5 py-1 text-xs font-bold text-blue-400 bg-blue-950/30 border border-blue-900/30 rounded hover:bg-blue-900/40 transition-colors flex items-center gap-1"
                  >
                    <RotateCw size={11}/> Followed Up
                  </button>
                  <button 
                    onClick={() => handleReplied(lead.id)}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 rounded hover:bg-emerald-900/40 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 size={11}/> Replied
                  </button>
                  <button 
                    onClick={() => handleDead(lead.id)}
                    className="px-2.5 py-1 text-xs font-bold text-zinc-400 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
                  >
                    <XCircle size={11}/> Dead
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
