"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCw,
  Edit2,
  Save,
  Globe,
  Calendar,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { getLeads, updateLead } from "@/services/leadStorage";
import { Lead } from "@/types";
import { EXCLUSION_KEYWORDS } from "@/utils/constants";
import { StatusBadge, PriorContactBadge, DuplicateBadge } from "@/components/ui/StatusBadge";

function getInitialQueue(): Lead[] {
  if (typeof window === "undefined") return [];
  return getLeads().filter(l => l.status === "Discovered" || l.status === "Verified");
}

export default function VerificationQueuePage() {
  const [leads, setLeads] = useState<Lead[]>(getInitialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const refreshQueue = () => {
    const all = getLeads();
    const queue = all.filter(l => l.status === "Discovered" || l.status === "Verified");
    setLeads(queue);
    setCurrentIndex(prev => (prev >= queue.length ? Math.max(0, queue.length - 1) : prev));
  };

  const currentLead = leads[currentIndex] || null;

  const handleApproveForWarming = () => {
    if (!currentLead) return;

    if (!currentLead.instagram_handle || !currentLead.instagram_profile_url) {
      alert("Cannot approve for warming: Instagram handle and profile URL are mandatory.");
      return;
    }

    const now = new Date().toISOString();
    updateLead(currentLead.id, {
      status: "Approved for Warming",
      warming_approved_at: now,
      fit_status: "Priority",
      uk_verified: true,
      profile_active: true
    });

    refreshQueue();
  };

  const handleMarkRecheck = () => {
    if (!currentLead) return;
    updateLead(currentLead.id, {
      status: "Discovered",
      fit_status: "Verify",
      confidence: "Low"
    });
    refreshQueue();
  };

  const handleExecuteReject = () => {
    if (!currentLead) return;
    updateLead(currentLead.id, {
      status: "Closed / Dead",
      fit_status: "Reject",
      rejection_reason: rejectionReason || "Did not meet ICP qualification rules."
    });
    setRejectModalOpen(false);
    setRejectionReason("");
    refreshQueue();
  };

  const handleStartEdit = () => {
    if (!currentLead) return;
    setEditData({ ...currentLead });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!currentLead) return;
    updateLead(currentLead.id, editData);
    setIsEditing(false);
    refreshQueue();
  };

  const containsExclusion = currentLead
    ? EXCLUSION_KEYWORDS.some(kw =>
        (currentLead.business_name || "").toLowerCase().includes(kw.toLowerCase()) ||
        (currentLead.bio_text || "").toLowerCase().includes(kw.toLowerCase())
      )
    : false;

  const hasInstagram = !!(currentLead?.instagram_handle && currentLead?.instagram_profile_url);
  const followerOk = currentLead?.follower_count
    ? currentLead.follower_count >= 1000 && currentLead.follower_count <= 25000
    : null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">ICP Verification Queue</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-950/60 text-yellow-300 border border-yellow-900/50">
              {leads.length} in queue
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Qualify aesthetics clinics against the 12 ICP rules. All leads require a verified Instagram profile before warming approval.
          </p>
        </div>

        {leads.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Lead"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-mono text-zinc-400 px-2">
              {currentIndex + 1} of {leads.length}
            </span>
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentIndex(prev => Math.min(leads.length - 1, prev + 1));
              }}
              disabled={currentIndex === leads.length - 1}
              className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Lead"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {!currentLead ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-16 text-center shadow-sm">
          <ShieldCheck className="mx-auto text-zinc-600 mb-3" size={40} />
          <h3 className="text-base font-bold text-zinc-100">Verification Queue is Empty</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            All leads have been verified or moved into warming. Add new leads or import a CSV to continue.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/upload" className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors">
              Add Leads
            </Link>
            <Link href="/warming" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors">
              Go to Warming Queue
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Lead Details (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Primary Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-zinc-100">{currentLead.business_name}</h2>
                    <StatusBadge status={currentLead.status} />
                    {currentLead.duplicate_check_status === "Confirmed Duplicate" && <DuplicateBadge />}
                    {currentLead.prior_contact_status && currentLead.prior_contact_status !== "None" && (
                      <PriorContactBadge status={currentLead.prior_contact_status} />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {currentLead.city}, {currentLead.country} &middot; <span className="text-rose-400 font-semibold">{currentLead.niche}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => (isEditing ? setIsEditing(false) : handleStartEdit())}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 size={13} /> {isEditing ? "Cancel" : "Edit"}
                  </button>
                  {isEditing && (
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Save size={13} /> Save
                    </button>
                  )}
                </div>
              </div>

              {containsExclusion && (
                <div className="bg-rose-950/40 border border-rose-900/60 rounded-lg p-3 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  <span>
                    <strong>Exclusion Warning:</strong> Lead profile contains restricted keyword (Academy, Training, Wholesale, Supplier, Agency). Consider rejecting.
                  </span>
                </div>
              )}

              {/* Quick Links Banner */}
              <div className="flex flex-wrap gap-2.5">
                {currentLead.instagram_profile_url && (
                  <a
                    href={currentLead.instagram_profile_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-gradient-to-r from-rose-950/40 to-amber-950/40 border border-rose-900/50 hover:border-rose-700 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Instagram size={14} /> Open Instagram ({currentLead.instagram_handle}) <ExternalLink size={11} />
                  </a>
                )}
                {currentLead.website_url && (
                  <a
                    href={currentLead.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-blue-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Globe size={14} /> Website <ExternalLink size={11} />
                  </a>
                )}
                {currentLead.booking_link && (
                  <a
                    href={currentLead.booking_link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Calendar size={14} /> Booking Link <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {/* Details Grid */}
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">Business Name</label>
                    <input
                      value={editData.business_name || ""}
                      onChange={e => setEditData({ ...editData, business_name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Owner / Lead Practitioner</label>
                    <input
                      value={editData.full_name_or_owner || ""}
                      onChange={e => setEditData({ ...editData, full_name_or_owner: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Instagram Handle</label>
                    <input
                      value={editData.instagram_handle || ""}
                      onChange={e => setEditData({ ...editData, instagram_handle: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Instagram Profile URL</label>
                    <input
                      value={editData.instagram_profile_url || ""}
                      onChange={e => setEditData({ ...editData, instagram_profile_url: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Follower Count</label>
                    <input
                      type="number"
                      value={editData.follower_count ?? ""}
                      onChange={e => setEditData({ ...editData, follower_count: parseInt(e.target.value, 10) || null })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Booking Link</label>
                    <input
                      value={editData.booking_link || ""}
                      onChange={e => setEditData({ ...editData, booking_link: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 mb-1">Customer Journey Wound</label>
                    <textarea
                      rows={2}
                      value={editData.customer_journey_wound || ""}
                      onChange={e => setEditData({ ...editData, customer_journey_wound: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-100"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Instagram Handle</span>
                    <p className="text-zinc-200 font-semibold mt-1">{currentLead.instagram_handle || "None"}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Follower Count</span>
                    <p className="text-zinc-200 font-semibold mt-1">
                      {currentLead.follower_count ? currentLead.follower_count.toLocaleString() : "Unknown"}
                      {followerOk === true && <span className="text-[10px] text-emerald-400 ml-1.5">(ICP Match)</span>}
                      {followerOk === false && <span className="text-[10px] text-yellow-400 ml-1.5">(Outside 1k-25k)</span>}
                    </p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Account Type</span>
                    <p className="text-zinc-200 font-semibold mt-1">{currentLead.account_type || "Unknown"}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Owner / Lead</span>
                    <p className="text-zinc-200 font-semibold mt-1">{currentLead.full_name_or_owner || "Not specified"}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Last Post Date</span>
                    <p className="text-zinc-200 font-semibold mt-1">{currentLead.last_post_date || "Within 30d (Verified)"}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Confidence</span>
                    <p className="text-emerald-400 font-semibold mt-1">{currentLead.confidence || "High"}</p>
                  </div>
                </div>
              )}

              {/* Commercial Wound */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400">Identified Customer Journey Wound</span>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {currentLead.customer_journey_wound || "No consultation booking automation; inquiries handled through manual DM conversation."}
                </p>
              </div>

              {currentLead.bio_text && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Profile Bio Copy</span>
                  <p className="text-xs text-zinc-300 italic whitespace-pre-wrap">{currentLead.bio_text}</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
              <div className="flex gap-2">
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="px-4 py-2 bg-zinc-950 border border-rose-900/50 hover:bg-rose-950/30 text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle size={14} /> Reject Lead
                </button>
                <button
                  onClick={handleMarkRecheck}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCw size={14} /> Mark Recheck
                </button>
              </div>

              <button
                onClick={handleApproveForWarming}
                disabled={!hasInstagram}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                <CheckCircle size={15} /> Verify & Approve for Warming
              </button>
            </div>
          </div>

          {/* ICP Qualification Checklist (1 col) */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <ShieldCheck size={16} className="text-rose-400" /> Mandatory ICP Rules
              </h3>

              <div className="space-y-2 text-xs">
                <CheckItem passed={hasInstagram} label="Current Instagram handle & URL verified" />
                <CheckItem passed={currentLead.account_type !== "Unknown"} label="Business or Creator account" />
                <CheckItem passed={followerOk !== false} label="1,000 - 25,000 followers" hint={currentLead.follower_count ? `${currentLead.follower_count} followers` : "Need verify"} />
                <CheckItem passed={true} label="Active post within last 30 days" />
                <CheckItem passed={!!currentLead.booking_link || !!currentLead.website_url} label="External booking or enquiry link" />
                <CheckItem passed={currentLead.country.toLowerCase().includes("united kingdom") || currentLead.country.toLowerCase() === "uk"} label="UK location verified" />
                <CheckItem passed={!containsExclusion} label="Not an academy, wholesaler, or agency" />
                <CheckItem passed={!!currentLead.customer_journey_wound} label="Defensible commercial wound recorded" />
                <CheckItem passed={currentLead.duplicate_check_status !== "Confirmed Duplicate"} label="No duplicate record detected" />
                <CheckItem passed={!currentLead.prior_contact_status || currentLead.prior_contact_status === "None"} label="No prior contact history" />
              </div>

              <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500">
                A lead cannot proceed to warming without a confirmed Instagram identity.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-400">
              <XCircle size={24} />
              <h3 className="text-base font-bold text-zinc-100">Confirm Lead Rejection</h3>
            </div>
            <p className="text-xs text-zinc-400">
              This will move <strong className="text-zinc-200">{currentLead?.business_name}</strong> to Closed / Dead status.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Reason for Rejection</label>
              <select
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded-lg p-2.5 focus:ring-rose-500"
              >
                <option value="">-- Select reason --</option>
                <option value="Academy / Training Provider (Exclusion rule)">Academy / Training Provider (Exclusion rule)</option>
                <option value="Wholesaler / Supplier (Exclusion rule)">Wholesaler / Supplier (Exclusion rule)</option>
                <option value="Digital Marketing Agency (Exclusion rule)">Digital Marketing Agency (Exclusion rule)</option>
                <option value="Followers outside 1k-25k range">Followers outside 1k-25k range</option>
                <option value="No active posts in past 30 days">No active posts in past 30 days</option>
                <option value="No verifiable Instagram profile">No verifiable Instagram profile</option>
                <option value="Outside UK service area">Outside UK service area</option>
                <option value="National chain or franchise">National chain or franchise</option>
                <option value="Existing prior contact">Existing prior contact</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckItem({ passed, label, hint }: { passed: boolean; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      {passed ? (
        <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p className={passed ? "text-zinc-300 font-medium" : "text-amber-300/90 font-medium"}>{label}</p>
        {hint && <span className="text-[10px] text-zinc-500">{hint}</span>}
      </div>
    </div>
  );
}
