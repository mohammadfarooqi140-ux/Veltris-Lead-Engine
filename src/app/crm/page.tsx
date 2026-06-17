"use client";

import { useEffect, useState } from "react";
import { Lead } from "@/types";
import { ExternalLink, Database, Copy, Trash2 } from "lucide-react";

export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState<boolean>(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = () => {
    const queueData = localStorage.getItem("vle_queue");
    let allLeads: Lead[] = [];
    if (queueData) allLeads = JSON.parse(queueData);
    setLeads(allLeads);
  };

  const saveLeads = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    localStorage.setItem("vle_queue", JSON.stringify(updatedLeads));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const executeDelete = (id: string) => {
    const updated = leads.filter(l => l.id !== id);
    saveLeads(updated);
    selectedIds.delete(id);
    setSelectedIds(new Set(selectedIds));
    setConfirmDeleteId(null);
  };

  const executeDeleteSelected = () => {
    const updated = leads.filter(l => !selectedIds.has(l.id));
    saveLeads(updated);
    setSelectedIds(new Set());
    setConfirmDeleteSelected(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">CRM View</h1>
          <p className="text-sm text-zinc-400 mt-1">Local representation of the entire database.</p>
        </div>
        <div className="flex gap-4">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              {confirmDeleteSelected ? (
                <>
                  <span className="text-sm font-medium text-rose-500">Delete {selectedIds.size} leads?</span>
                  <button onClick={() => setConfirmDeleteSelected(false)} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 text-sm font-medium">Cancel</button>
                  <button onClick={executeDeleteSelected} className="px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 text-sm font-medium">Confirm Delete</button>
                </>
              ) : (
                <button onClick={() => setConfirmDeleteSelected(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md text-sm font-medium hover:bg-rose-500/20 transition-colors">
                  <Trash2 size={16} /> Delete Selected ({selectedIds.size})
                </button>
              )}
            </div>
          )}
          <a 
            href="#"
            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-500/20 transition-colors"
          >
            <Database size={16} /> Open Google Sheet <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full table-fixed divide-y divide-zinc-800 text-sm text-left">
          <thead className="bg-zinc-800/50 text-zinc-400 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-6 py-3 w-16">
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(leads.map(l => l.id)));
                    else setSelectedIds(new Set());
                  }} 
                  checked={selectedIds.size === leads.length && leads.length > 0}
                  className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-700"
                />
              </th>
              <th className="px-6 py-3 font-semibold w-1/5">Business Name</th>
              <th className="px-6 py-3 font-semibold w-1/6">Location</th>
              <th className="px-6 py-3 font-semibold w-24">Score</th>
              <th className="px-6 py-3 font-semibold w-1/5">Website</th>
              <th className="px-6 py-3 font-semibold w-28">Status</th>
              <th className="px-6 py-3 font-semibold w-32">Last Contacted</th>
              <th className="px-6 py-3 font-semibold text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-zinc-900 divide-y divide-zinc-800">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-zinc-800/50">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(lead.id)} 
                    onChange={() => toggleSelect(lead.id)}
                    className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-700"
                  />
                </td>
                <td className="px-6 py-4 truncate font-medium text-zinc-100" title={lead.businessName}>{lead.businessName}</td>
                <td className="px-6 py-4 truncate text-zinc-400" title={`${lead.city}, ${lead.country}`}>{lead.city}, {lead.country}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                    ${lead.ruleBasedScore && lead.ruleBasedScore > 3 ? 'bg-emerald-500/10 text-emerald-400' : 
                      lead.ruleBasedScore === 3 ? 'bg-yellow-500/10 text-yellow-400' : 
                      'bg-rose-500/10 text-rose-400'}`}>
                    {lead.ruleBasedScore || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {lead.websiteUrl ? (
                    <div className="flex items-center gap-2">
                      <span className="truncate" title={lead.websiteUrl}>{lead.websiteUrl}</span>
                      <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 shrink-0" title="Visit Website"><ExternalLink size={14} /></a>
                      <button onClick={() => handleCopy(lead.websiteUrl || "")} className="text-zinc-500 hover:text-zinc-300 shrink-0" title="Copy URL"><Copy size={14} /></button>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold border
                    ${lead.status === 'Approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                      lead.status === 'Contacted' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
                      lead.status === 'Closed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 
                      'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-zinc-400 text-xs">
                  {lead.outreachStatus?.lastContactedDate ? new Date(lead.outreachStatus.lastContactedDate).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {confirmDeleteId === lead.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs font-bold text-rose-500">Sure?</span>
                      <button onClick={() => executeDelete(lead.id)} className="px-2 py-1 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700">Yes</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs font-bold rounded hover:bg-zinc-700">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(lead.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
