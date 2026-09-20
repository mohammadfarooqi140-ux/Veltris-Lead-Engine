"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Send,
  Sparkles,
  ShieldAlert
} from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { getLeads, updateLead } from "@/services/leadStorage";
import { Lead } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

function getInitialReadyLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  return getLeads().filter(l => l.status === "DM Ready" || l.status === "DM Approved");
}

export default function DmApprovalQueuePage() {
  const [leads, setLeads] = useState<Lead[]>(getInitialReadyLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(() => {
    const init = getInitialReadyLeads();
    return init.length > 0 ? init[0].id : null;
  });
  const [draftTexts, setDraftTexts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Send confirmation modal state
  const [sendModalLead, setSendModalLead] = useState<Lead | null>(null);
  const [senderAccount, setSenderAccount] = useState("@veltris.uk");
  const [confirmedText, setConfirmedText] = useState("");
  const [sendNotes, setSendNotes] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<string | null>(null);

  const refreshLeads = () => {
    const all = getLeads();
    const readyLeads = all.filter(l => l.status === "DM Ready" || l.status === "DM Approved");
    setLeads(readyLeads);

    if (readyLeads.length > 0 && (!selectedLeadId || !readyLeads.some(l => l.id === selectedLeadId))) {
      setSelectedLeadId(readyLeads[0].id);
    }
  };

  const activeLead = leads.find(l => l.id === selectedLeadId) || leads[0] || null;

  const currentDraft = activeLead
    ? draftTexts[activeLead.id] !== undefined
      ? draftTexts[activeLead.id]
      : activeLead.dm_draft || generateDefaultDm(activeLead)
    : "";

  function generateDefaultDm(lead: Lead): string {
    const firstName = lead.full_name_or_owner ? lead.full_name_or_owner.split(" ")[0] : "there";
    return `Hey ${firstName}! Was just admiring your clinic's recent patient results. Quick question: are most of your new patients finding and booking consultations directly through Instagram DMs right now?`;
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleApproveDm = (lead: Lead) => {
    const now = new Date().toISOString();
    updateLead(lead.id, {
      dm_draft: currentDraft,
      dm_approved: true,
      dm_approved_at: now,
      status: "DM Approved"
    });
    refreshLeads();
  };

  const handleGenerateAiCopy = async (lead: Lead) => {
    setIsGeneratingAi(lead.id);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.drafts?.dm) {
          setDraftTexts(prev => ({ ...prev, [lead.id]: data.drafts.dm }));
          updateLead(lead.id, { dm_draft: data.drafts.dm, customer_journey_wound: data.opportunityNotes || lead.customer_journey_wound });
        }
      }
    } catch (e) {
      console.error("AI Generation error:", e);
    } finally {
      setIsGeneratingAi(null);
    }
  };

  const handleOpenSendModal = (lead: Lead) => {
    setSendModalLead(lead);
    setConfirmedText(currentDraft);
    setSendNotes("");
  };

  const handleExecuteSend = () => {
    if (!sendModalLead) return;

    const now = new Date();
    const followUpDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    updateLead(sendModalLead.id, {
      status: "DM Sent",
      dm_sent: true,
      dm_sent_at: now.toISOString(),
      dm_text_used: confirmedText,
      sender_ig_account: senderAccount,
      reply_status: "Awaiting reply",
      follow_up_1_date: followUpDate,
      follow_up_date: followUpDate,
      follow_up_notes: sendNotes || null
    });

    setSendModalLead(null);
    refreshLeads();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">DM Approval Queue</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-900/50">
              {leads.length} ready for DM
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Review and approve personalized Instagram DMs. Once approved, manually send on Instagram and record completion.
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-zinc-400">
          <ShieldAlert size={14} className="text-amber-400" />
          <span>Zero Automation: Send DMs manually in the Instagram app</span>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-zinc-600 mb-3" size={40} />
          <h3 className="text-base font-bold text-zinc-100">No Leads Currently in DM Ready</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Leads enter this queue 24 hours after their warming sequence is completed. Check the Warming Queue to inspect timers.
          </p>
          <div className="mt-6">
            <Link
              href="/warming"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors inline-block"
            >
              View Warming Queue
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Lead List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Leads Ready for Approval ({leads.length})
            </h3>

            <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
              {leads.map(lead => {
                const isSelected = lead.id === activeLead?.id;
                return (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 border-rose-500/50 shadow-md ring-1 ring-rose-500/30"
                        : "bg-zinc-950 border-zinc-800 hover:bg-zinc-900/60 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-zinc-100 truncate max-w-[200px]">{lead.business_name}</h4>
                      <StatusBadge status={lead.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="text-rose-400 font-medium">{lead.instagram_handle}</span>
                      <span>&middot;</span>
                      <span>{lead.city}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-2 truncate">
                      Wound: {lead.customer_journey_wound || "Consultation booking friction"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Lead DM Editor & Actions (8 cols) */}
          {activeLead && (
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
              {/* Header Details */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-zinc-100">{activeLead.business_name}</h2>
                    <StatusBadge status={activeLead.status} />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {activeLead.city}, UK &middot; Contact: <strong className="text-zinc-200">{activeLead.full_name_or_owner || "Owner"}</strong>
                  </p>
                </div>

                <div className="flex gap-2">
                  {activeLead.instagram_profile_url && (
                    <a
                      href={activeLead.instagram_profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Instagram size={14} /> View IG Profile <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Warming History & Wound */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Warming Sequence Completed</span>
                  <p className="text-zinc-300">
                    {activeLead.warming_completed_at ? new Date(activeLead.warming_completed_at).toLocaleString() : "Recently"}
                  </p>
                  <p className="text-zinc-500 text-[11px]">Followed, 3 posts liked, 1 comment left.</p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rose-400">Personalization Hook / Wound</span>
                  <p className="text-zinc-300">
                    {activeLead.customer_journey_wound || "Consultation booking friction & reliance on manual DMs"}
                  </p>
                </div>
              </div>

              {/* DM Draft Editor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    Instagram Direct Message Copy
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateAiCopy(activeLead)}
                      disabled={isGeneratingAi === activeLead.id}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold disabled:opacity-50"
                    >
                      <Sparkles size={12} /> {isGeneratingAi === activeLead.id ? "Regenerating..." : "Regenerate AI Copy"}
                    </button>
                    <button
                      onClick={() => handleCopy(currentDraft, activeLead.id)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-semibold ml-2"
                    >
                      <Copy size={12} /> {copiedId === activeLead.id ? "Copied!" : "Copy Text"}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={currentDraft}
                  onChange={e => setDraftTexts({ ...draftTexts, [activeLead.id]: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 font-sans leading-relaxed focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Draft your personalized Instagram DM..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
                <div>
                  {activeLead.dm_approved ? (
                    <span className="text-xs text-teal-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Approved at {activeLead.dm_approved_at ? new Date(activeLead.dm_approved_at).toLocaleTimeString() : ""}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApproveDm(activeLead)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={14} /> Approve DM Copy
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenSendModal(activeLead)}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-opacity shadow-sm cursor-pointer"
                  >
                    <Send size={14} /> Mark DM Sent (Record Manual Send)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mark DM Sent Confirmation Modal */}
      {sendModalLead && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <Send size={24} />
              <div>
                <h3 className="text-base font-bold text-zinc-100">Confirm Manual Instagram Send</h3>
                <p className="text-xs text-zinc-400">Record that this message was sent manually on Instagram.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Target Account</label>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded text-rose-400 font-mono font-bold">
                  {sendModalLead.instagram_handle}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Your Instagram Account Used</label>
                <input
                  type="text"
                  value={senderAccount}
                  onChange={e => setSenderAccount(e.target.value)}
                  placeholder="@veltris.uk"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Exact Message Sent</label>
                <textarea
                  rows={4}
                  value={confirmedText}
                  onChange={e => setConfirmedText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Optional Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Sent via mobile app, active 5m ago"
                  value={sendNotes}
                  onChange={e => setSendNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSendModalLead(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSend}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors"
              >
                Confirm Sent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
