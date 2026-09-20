"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ExternalLink,
  Trash2,
  Download,
  Calendar,
  Globe,
  ArrowUpDown
} from "lucide-react";
import { getLeads, deleteLead, deleteMultipleLeads, exportLeadsJson } from "@/services/leadStorage";
import { Lead } from "@/types";
import { TARGET_NICHES } from "@/utils/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";

type SortField = "created_at" | "updated_at" | "follower_count" | "ready_at" | "follow_up_date" | "status";
type SortOrder = "asc" | "desc";

export default function AllLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(() => (typeof window !== "undefined" ? getLeads() : []));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [followerFilter, setFollowerFilter] = useState<string>("all");
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [priorContactFilter, setPriorContactFilter] = useState<string>("all");

  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteBulk, setConfirmDeleteBulk] = useState(false);

  const refreshLeads = () => {
    setLeads(getLeads());
  };

  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.business_name.toLowerCase().includes(q) ||
        l.instagram_handle.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        (l.full_name_or_owner || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(l => l.status === statusFilter);
    }

    if (nicheFilter !== "all") {
      result = result.filter(l => l.niche === nicheFilter);
    }

    if (followerFilter === "icp") {
      result = result.filter(l => l.follower_count && l.follower_count >= 1000 && l.follower_count <= 25000);
    } else if (followerFilter === "under1k") {
      result = result.filter(l => l.follower_count && l.follower_count < 1000);
    } else if (followerFilter === "over25k") {
      result = result.filter(l => l.follower_count && l.follower_count > 25000);
    }

    if (bookingFilter === "yes") {
      result = result.filter(l => !!l.booking_link);
    } else if (bookingFilter === "no") {
      result = result.filter(l => !l.booking_link);
    }

    if (priorContactFilter === "has_contact") {
      result = result.filter(l => l.prior_contact_status && l.prior_contact_status !== "None");
    } else if (priorContactFilter === "clean") {
      result = result.filter(l => !l.prior_contact_status || l.prior_contact_status === "None");
    }

    // Sort
    result.sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    return result;
  }, [leads, searchQuery, statusFilter, nicheFilter, followerFilter, bookingFilter, priorContactFilter, sortField, sortOrder]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAndSortedLeads.map(l => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExecuteDeleteOne = (id: string) => {
    deleteLead(id);
    setConfirmDeleteId(null);
    selectedIds.delete(id);
    refreshLeads();
  };

  const handleExecuteDeleteBulk = () => {
    deleteMultipleLeads(selectedIds);
    setSelectedIds(new Set());
    setConfirmDeleteBulk(false);
    refreshLeads();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">All Leads Master Directory</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {leads.length} total leads
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Search, filter, and inspect the master Veltris database with full Instagram qualification metrics.
          </p>
        </div>

        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              {confirmDeleteBulk ? (
                <>
                  <span className="text-xs text-rose-400 font-semibold">Delete {selectedIds.size} leads?</span>
                  <button
                    onClick={() => setConfirmDeleteBulk(false)}
                    className="px-2.5 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteDeleteBulk}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-500"
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDeleteBulk(true)}
                  className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/50 text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} /> Delete Selected ({selectedIds.size})
                </button>
              )}
            </div>
          )}

          <button
            onClick={exportLeadsJson}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={13} /> Export JSON
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
            <input
              type="text"
              placeholder="Search clinic name, @handle, city, or owner..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:ring-rose-500"
            >
              <option value="all">All Statuses</option>
              <option value="Discovered">Discovered</option>
              <option value="Verified">Verified</option>
              <option value="Approved for Warming">Approved for Warming</option>
              <option value="Waiting 24 Hours">Waiting 24 Hours</option>
              <option value="DM Ready">DM Ready</option>
              <option value="DM Approved">DM Approved</option>
              <option value="DM Sent">DM Sent</option>
              <option value="Replied">Replied</option>
              <option value="Follow-up Due">Follow-up Due</option>
              <option value="Closed / Dead">Closed / Dead</option>
            </select>
          </div>

          {/* Niche Filter */}
          <div>
            <select
              value={nicheFilter}
              onChange={e => setNicheFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:ring-rose-500"
            >
              <option value="all">All Niches</option>
              {TARGET_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/60 text-xs">
          <div>
            <select
              value={followerFilter}
              onChange={e => setFollowerFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-300"
            >
              <option value="all">Followers: Any</option>
              <option value="icp">Followers: ICP (1k - 25k)</option>
              <option value="under1k">Followers: Under 1k</option>
              <option value="over25k">Followers: Over 25k</option>
            </select>
          </div>

          <div>
            <select
              value={bookingFilter}
              onChange={e => setBookingFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-300"
            >
              <option value="all">Booking Link: Any</option>
              <option value="yes">Has Booking Link</option>
              <option value="no">No Booking Link (Friction)</option>
            </select>
          </div>

          <div>
            <select
              value={priorContactFilter}
              onChange={e => setPriorContactFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-300"
            >
              <option value="all">Prior Contact: Any</option>
              <option value="clean">Clean (No Prior Contact)</option>
              <option value="has_contact">Flagged / Historical Contact</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full divide-y divide-zinc-800 text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredAndSortedLeads.length}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-500"
                />
              </th>
              <th className="p-3.5 cursor-pointer" onClick={() => handleToggleSort("status")}>
                <div className="flex items-center gap-1">Status <ArrowUpDown size={11} /></div>
              </th>
              <th className="p-3.5 cursor-pointer">
                Business & Location
              </th>
              <th className="p-3.5">
                Instagram Identity
              </th>
              <th className="p-3.5 cursor-pointer" onClick={() => handleToggleSort("follower_count")}>
                <div className="flex items-center gap-1">Followers <ArrowUpDown size={11} /></div>
              </th>
              <th className="p-3.5">Booking / Web</th>
              <th className="p-3.5 cursor-pointer" onClick={() => handleToggleSort("created_at")}>
                <div className="flex items-center gap-1">Added <ArrowUpDown size={11} /></div>
              </th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 bg-zinc-900">
            {filteredAndSortedLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-zinc-500">
                  No leads matching the current filters.
                </td>
              </tr>
            ) : (
              filteredAndSortedLeads.map(lead => {
                const isSelected = selectedIds.has(lead.id);

                return (
                  <tr key={lead.id} className={`hover:bg-zinc-800/40 transition-colors ${isSelected ? "bg-zinc-800/20" : ""}`}>
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(lead.id)}
                        className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-500"
                      />
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-zinc-100 truncate max-w-[200px]">{lead.business_name}</p>
                      <p className="text-[11px] text-zinc-400">{lead.city}, {lead.country} &middot; <span className="text-zinc-500">{lead.niche}</span></p>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-rose-400 font-semibold">{lead.instagram_handle}</span>
                        {lead.instagram_profile_url && (
                          <a href={lead.instagram_profile_url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-rose-400" title="Open Instagram">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-medium text-zinc-200">
                        {lead.follower_count ? lead.follower_count.toLocaleString() : "-"}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-zinc-400">
                        {lead.booking_link ? (
                          <a href={lead.booking_link} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1" title="Booking Link">
                            <Calendar size={12} /> Booking
                          </a>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">No link</span>
                        )}
                        {lead.website_url && (
                          <a href={lead.website_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1" title="Website">
                            <Globe size={12} /> Web
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-zinc-400 text-[11px]">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-right">
                      {confirmDeleteId === lead.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleExecuteDeleteOne(lead.id)} className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-bold">Yes</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[11px]">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(lead.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
