"use client";

import { useEffect, useState } from "react";
import { Lead } from "@/types";
import { CheckCircle2, Copy, ExternalLink, MessageCircle, Mail, Search, Trash2, Edit2, ChevronDown, ChevronUp, AlertTriangle, Send, PhoneCall } from "lucide-react";

export default function ApprovedLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState("");
  const [findingIgFor, setFindingIgFor] = useState<string | null>(null);
  const [findingEmailFor, setFindingEmailFor] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState<boolean>(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = () => {
    // Canonical source: vle_queue
    const queueData = localStorage.getItem("vle_queue");
    const approvedData = localStorage.getItem("vle_approved");
    
    let canonical: Lead[] = queueData ? JSON.parse(queueData) : [];
    
    // Migration: merge any leads from vle_approved into vle_queue
    if (approvedData) {
      const legacyApproved: Lead[] = JSON.parse(approvedData);
      const existingIds = new Set(canonical.map(l => l.id));
      for (const lead of legacyApproved) {
        if (!existingIds.has(lead.id)) {
          canonical.push(lead);
        }
      }
      // Save merged result and remove legacy key
      localStorage.setItem("vle_queue", JSON.stringify(canonical));
      localStorage.removeItem("vle_approved");
    }
    
    setLeads(canonical.filter(l => l.status === "Approved" || l.status === "Contacted"));
  };

  const saveLeads = (updatedApprovedLeads: Lead[]) => {
    // Read the FULL canonical array
    const raw = localStorage.getItem("vle_queue");
    const fullArray: Lead[] = raw ? JSON.parse(raw) : [];
    
    // Build a map of updated leads by ID for fast lookup
    const updateMap = new Map(updatedApprovedLeads.map(l => [l.id, l]));
    
    // Update existing leads in-place, keep non-approved leads untouched
    const newFull = fullArray.map(l => {
      if (updateMap.has(l.id)) {
        return updateMap.get(l.id)!;
      }
      return l;
    });
    
    // Remove deleted approved leads (those in fullArray as Approved but not in updatedApprovedLeads)
    const updatedIds = new Set(updatedApprovedLeads.map(l => l.id));
    const cleaned = newFull.filter(l => {
      if ((l.status === "Approved" || l.status === "Contacted") && !updatedIds.has(l.id)) {
        return false; // This lead was deleted from the approved view
      }
      return true;
    });
    
    localStorage.setItem("vle_queue", JSON.stringify(cleaned));
    setLeads(updatedApprovedLeads.filter(l => l.status === "Approved" || l.status === "Contacted"));
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

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
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

  const handleMarkDmSent = (id: string) => {
    const now = new Date();
    const followUp = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const updated = leads.map(l => {
      if (l.id === id) {
        const prevStatus = l.outreachStatus || { dmStatus: "Not Ready" as const, emailStatus: "Not Ready" as const, channelUsed: "None" as const };
        return {
          ...l,
          status: "Contacted" as const,
          outreachStatus: {
            ...prevStatus,
            dmStatus: "Sent" as const,
            channelUsed: (prevStatus.emailStatus === "Sent" ? "Both" : "DM") as "None" | "DM" | "Email" | "Both",
            lastContactedDate: now.toISOString(),
            followUpDueDate: followUp.toISOString(),
            leadStatus: "Active" as const,
          }
        };
      }
      return l;
    });
    saveLeads(updated);
  };

  const handleMarkEmailSent = (id: string) => {
    const now = new Date();
    const followUp = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const updated = leads.map(l => {
      if (l.id === id) {
        const prevStatus = l.outreachStatus || { dmStatus: "Not Ready" as const, emailStatus: "Not Ready" as const, channelUsed: "None" as const };
        return {
          ...l,
          status: "Contacted" as const,
          outreachStatus: {
            ...prevStatus,
            emailStatus: "Sent" as const,
            channelUsed: (prevStatus.dmStatus === "Sent" ? "Both" : "Email") as "None" | "DM" | "Email" | "Both",
            lastContactedDate: now.toISOString(),
            followUpDueDate: followUp.toISOString(),
            leadStatus: "Active" as const,
          }
        };
      }
      return l;
    });
    saveLeads(updated);
  };

  const handleMarkContacted = (id: string) => {
    const now = new Date();
    const followUp = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const updated = leads.map(l => {
      if (l.id === id) {
        const prevStatus = l.outreachStatus || { dmStatus: "Not Ready" as const, emailStatus: "Not Ready" as const, channelUsed: "None" as const };
        return {
          ...l,
          status: "Contacted" as const,
          outreachStatus: {
            ...prevStatus,
            lastContactedDate: now.toISOString(),
            followUpDueDate: followUp.toISOString(),
            leadStatus: "Active" as const,
          }
        };
      }
      return l;
    });
    saveLeads(updated);
  };

  const handleSendEmail = async (id: string, email: string | undefined) => {
    try {
      const response = await fetch("/api/outreach/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          leadId: id, 
          content: emailContent,
          to: email,
          subject: "Quick question about your business"
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send email");
      }

      const now = new Date();
      const followUp = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const updated = leads.map(l => {
        if (l.id === id) {
          const prevStatus = l.outreachStatus || { dmStatus: "Not Ready" as const, emailStatus: "Not Ready" as const, channelUsed: "None" as const };
          return {
            ...l,
            status: "Contacted" as const,
            outreachStatus: {
              ...prevStatus,
              emailStatus: "Sent" as const,
              channelUsed: (prevStatus.dmStatus === "Sent" ? "Both" : "Email") as "None" | "DM" | "Email" | "Both",
              lastContactedDate: now.toISOString(),
              followUpDueDate: followUp.toISOString(),
              leadStatus: "Active" as const,
            }
          };
        }
        return l;
      });
      saveLeads(updated);
      setEditingEmailId(null);
      alert("Email sent successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveIgHandle = (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const handle = formData.get("handle") as string;
    const confidence = formData.get("confidence") as "High" | "Medium" | "Low";
    
    const updated = leads.map(l => {
      if (l.id === id) {
        return {
          ...l,
          instagramHandle: handle,
          verification: { ...l.verification, hasInstagram: true },
          outreachStatus: {
            ...l.outreachStatus,
            instagramConfidence: confidence,
            dmStatus: "Not Ready" as const,
            emailStatus: l.outreachStatus?.emailStatus || "Not Ready" as const,
            channelUsed: l.outreachStatus?.channelUsed || "None" as const
          }
        };
      }
      return l;
    });
    saveLeads(updated);
    setFindingIgFor(null);
  };

  const handleSaveEmail = (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEmail = formData.get("email") as string;
    
    const updated = leads.map(l => {
      if (l.id === id) {
        return {
          ...l,
          email: newEmail,
        };
      }
      return l;
    });
    saveLeads(updated);
    setFindingEmailFor(null);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Outreach Workflow</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage approved leads and execute outreach. <span className="text-zinc-500">{leads.length} leads</span></p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            {confirmDeleteSelected ? (
              <>
                <span className="text-sm font-medium text-rose-500">Delete {selectedIds.size} leads?</span>
                <button onClick={() => setConfirmDeleteSelected(false)} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 text-sm font-medium">Cancel</button>
                <button onClick={executeDeleteSelected} className="px-3 py-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 text-sm font-medium">Confirm Delete</button>
              </>
            ) : (
              <button onClick={() => setConfirmDeleteSelected(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-950/30 text-rose-500 border border-rose-900 rounded text-sm font-medium hover:bg-rose-900/50 transition-colors">
                <Trash2 size={16} /> Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-zinc-800/50">
        {leads.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            No approved leads yet. Process the queue first.
          </div>
        ) : leads.map(lead => (
          <div key={lead.id} className="py-3 hover:bg-zinc-900/30 transition-colors">
            
            {/* COLLAPSED HEADER */}
            <div className="flex items-center gap-3 w-full">
              <div className="shrink-0">
                <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-zinc-100 focus:ring-zinc-700" />
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <h3 className="text-sm font-bold text-zinc-100 truncate max-w-[200px]">{lead.businessName}</h3>
                  <span className="text-xs text-zinc-500 hidden md:inline">{lead.city}</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300 shrink-0">{lead.ruleBasedScore}</span>
                  
                  <div className="hidden lg:flex items-center gap-2 ml-1 border-l border-zinc-800 pl-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><ExternalLink size={11}/> {lead.websiteUrl ? 'Yes' : 'No'}</span>
                    <span className="flex items-center gap-1"><Mail size={11}/> {lead.outreachStatus?.emailStatus || 'N/A'}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={11}/> {lead.outreachStatus?.dmStatus || 'N/A'}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {lead.websiteUrl && (
                    <>
                      <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 rounded transition-colors" title="Open Website"><ExternalLink size={14} /></a>
                      <button onClick={() => handleCopy(lead.websiteUrl || "")} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors" title="Copy Website"><Copy size={14} /></button>
                    </>
                  )}

                  {/* External Outreach Actions */}
                  {lead.status !== "Contacted" && (
                    <div className="flex items-center gap-1 ml-1 border-l border-zinc-800 pl-2">
                      <button
                        onClick={() => handleMarkDmSent(lead.id)}
                        disabled={lead.outreachStatus?.dmStatus === "Sent"}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-violet-400 bg-violet-950/30 border border-violet-900/30 rounded hover:bg-violet-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Mark DM as sent outside the app"
                      >
                        <MessageCircle size={12} /> DM Sent
                      </button>
                      <button
                        onClick={() => handleMarkEmailSent(lead.id)}
                        disabled={lead.outreachStatus?.emailStatus === "Sent"}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-blue-400 bg-blue-950/30 border border-blue-900/30 rounded hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Mark email as sent outside the app"
                      >
                        <Mail size={12} /> Email Sent
                      </button>
                      <button
                        onClick={() => handleMarkContacted(lead.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 rounded hover:bg-emerald-900/40 transition-colors"
                        title="Mark as contacted via any channel outside the app"
                      >
                        <PhoneCall size={12} /> Contacted
                      </button>
                    </div>
                  )}
                  {lead.status === "Contacted" && (
                    <span className="flex items-center gap-1 ml-1 px-2 py-1 text-xs font-bold text-emerald-500 bg-emerald-950/20 border border-emerald-900/20 rounded">
                      <CheckCircle2 size={12} /> Contacted
                    </span>
                  )}
                  
                  {confirmDeleteId === lead.id ? (
                    <div className="flex items-center gap-1 bg-rose-950/30 px-2 py-1 rounded border border-rose-900/50">
                      <AlertTriangle size={14} className="text-rose-500" />
                      <span className="text-xs font-bold text-rose-500">Delete?</span>
                      <button onClick={() => executeDelete(lead.id)} className="px-2 py-0.5 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 ml-1">Yes</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs font-bold rounded hover:bg-zinc-700">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(lead.id)} className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-950/30 rounded transition-colors" title="Delete Lead"><Trash2 size={14} /></button>
                  )}

                  <button onClick={() => toggleExpand(lead.id)} className="ml-1 flex items-center gap-1 px-2.5 py-1 bg-zinc-800 text-zinc-300 text-xs font-bold rounded hover:bg-zinc-700 transition-colors">
                    {expandedIds.has(lead.id) ? <><ChevronUp size={14} /> Less</> : <><ChevronDown size={14} /> More</>}
                  </button>
                </div>
              </div>
            </div>

            {/* EXPANDED VIEW */}
            {expandedIds.has(lead.id) && (
              <div className="mt-3 pt-3 border-t border-zinc-800/50 flex flex-col lg:flex-row gap-6">
                
                {/* Column 1: Details & Tracking */}
                <div className="lg:w-1/3 space-y-3 text-sm text-zinc-300">
                  <div className="flex items-center">
                    <span className="font-medium text-zinc-500 w-24 shrink-0 text-xs">Email</span> 
                    <span className="truncate text-xs">{lead.email || "None"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-zinc-500 w-24 shrink-0 text-xs">Phone</span> 
                    <span className="text-xs">{lead.phone || "None"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-zinc-500 w-24 shrink-0 text-xs">Status</span> 
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${lead.status === "Contacted" ? "bg-blue-900/30 text-blue-400" : "bg-emerald-900/30 text-emerald-400"}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="pt-3 mt-1 border-t border-zinc-800/50">
                    <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-2 tracking-wider">Outreach Tracking</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-500">DM</span><span className="text-zinc-300">{lead.outreachStatus?.dmStatus || "Not Ready"}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Email</span><span className="text-zinc-300">{lead.outreachStatus?.emailStatus || "Not Ready"}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Channel</span><span className="text-zinc-300">{lead.outreachStatus?.channelUsed || "None"}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Last Contact</span><span className="text-zinc-300">{lead.outreachStatus?.lastContactedDate ? new Date(lead.outreachStatus.lastContactedDate).toLocaleDateString() : "Never"}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Follow Up</span><span className="text-zinc-300">{lead.outreachStatus?.followUpDueDate ? new Date(lead.outreachStatus.followUpDueDate).toLocaleDateString() : "Not Scheduled"}</span></div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Instagram + Email Workflows */}
                <div className="lg:w-2/3 flex flex-col lg:flex-row gap-4 lg:border-l border-zinc-800/50 lg:pl-6">
                  {/* Instagram Workflow */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="text-xs font-bold flex items-center gap-2 mb-2 text-zinc-100">
                      <MessageCircle size={14} /> Instagram
                    </h4>
                    
                    {!lead.instagramHandle ? (
                      <div className="bg-orange-950/20 border border-orange-900/30 rounded p-3 flex-1">
                        <p className="text-xs text-orange-500 font-medium mb-2">No handle found.</p>
                        {findingIgFor === lead.id ? (
                          <form onSubmit={(e) => handleSaveIgHandle(lead.id, e)} className="space-y-2">
                            <input required name="handle" placeholder="@handle or URL" className="w-full text-xs p-1.5 bg-zinc-950 border border-orange-900/50 text-zinc-100 rounded" />
                            <select required name="confidence" className="w-full text-xs p-1.5 bg-zinc-950 border border-orange-900/50 text-zinc-100 rounded">
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                            <div className="flex gap-2">
                              <button type="submit" className="flex-1 bg-orange-600 text-white text-xs font-medium py-1.5 rounded hover:bg-orange-700">Save</button>
                              <button type="button" onClick={() => setFindingIgFor(null)} className="text-xs text-orange-500 hover:text-orange-400">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div className="space-y-1.5">
                            <a 
                              href={`https://www.google.com/search?q=${encodeURIComponent(`${lead.businessName} ${lead.city} Instagram`)}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex justify-center items-center gap-1 w-full text-orange-400 text-xs font-medium py-1.5 rounded border border-orange-900/30 hover:bg-orange-900/20 transition-colors"
                            >
                              <Search size={12} /> Search
                            </a>
                            <button onClick={() => setFindingIgFor(lead.id)} className="w-full text-center text-xs text-orange-500 hover:text-orange-400 underline">
                              I found the handle
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border border-zinc-800/50 rounded flex-1 flex flex-col group/card">
                        <div className="px-3 py-2 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50 rounded-t">
                          <span className="font-medium text-xs text-zinc-100 truncate">{lead.instagramHandle}</span>
                          <a href={lead.instagramHandle.includes("instagram.com") ? lead.instagramHandle : `https://instagram.com/${lead.instagramHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0">
                            Open <ExternalLink size={10} />
                          </a>
                        </div>
                        <div className="px-3 py-2 relative flex-1">
                          <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{lead.outreachDrafts?.dm || "No draft."}</p>
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button onClick={() => handleCopy(lead.outreachDrafts?.dm || "")} className="p-1 bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100" title="Copy"><Copy size={12} /></button>
                          </div>
                        </div>
                        <div className="px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/50 rounded-b">
                          <button 
                            onClick={() => handleMarkDmSent(lead.id)}
                            disabled={lead.outreachStatus?.dmStatus === "Sent"}
                            className="w-full py-1 bg-zinc-100 text-zinc-900 text-xs font-bold rounded disabled:bg-emerald-900/30 disabled:text-emerald-500 flex justify-center items-center gap-1 hover:bg-white transition-colors"
                          >
                            {lead.outreachStatus?.dmStatus === "Sent" ? <><CheckCircle2 size={12}/> DM Sent</> : "Mark DM Sent"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email Workflow */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="text-xs font-bold flex items-center gap-2 mb-2 text-zinc-100">
                      <Mail size={14} /> Email
                    </h4>
                    
                    {!lead.email ? (
                      <div className="bg-amber-950/20 border border-amber-900/30 rounded p-3 flex-1">
                        <p className="text-xs text-amber-500 font-medium mb-2">No email found.</p>
                        {findingEmailFor === lead.id ? (
                          <form onSubmit={(e) => handleSaveEmail(lead.id, e)} className="space-y-2">
                            <input required name="email" type="email" placeholder="Contact email" className="w-full text-xs p-1.5 bg-zinc-950 border border-amber-900/50 text-zinc-100 rounded" />
                            <div className="flex gap-2">
                              <button type="submit" className="flex-1 bg-amber-600 text-white text-xs font-medium py-1.5 rounded hover:bg-amber-700">Save</button>
                              <button type="button" onClick={() => setFindingEmailFor(null)} className="text-xs text-amber-500 hover:text-amber-400">Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div className="space-y-1.5">
                            <a 
                              href={`https://www.google.com/search?q=${encodeURIComponent(`"${lead.businessName}" ${lead.city} email address contact`)}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex justify-center items-center gap-1 w-full text-amber-400 text-xs font-medium py-1.5 rounded border border-amber-900/30 hover:bg-amber-900/20 transition-colors"
                            >
                              <Search size={12} /> Search Google
                            </a>
                            {lead.websiteUrl && (
                              <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="flex justify-center items-center gap-1 w-full text-amber-400 text-xs font-medium py-1.5 rounded border border-amber-900/30 hover:bg-amber-900/20 transition-colors">
                                <ExternalLink size={12} /> Visit Website
                              </a>
                            )}
                            <button onClick={() => setFindingEmailFor(lead.id)} className="w-full text-center text-xs text-amber-500 hover:text-amber-400 underline">
                              I found the email
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border border-zinc-800/50 rounded flex-1 flex flex-col group/card">
                        <div className="px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/50 rounded-t">
                          <p className="text-xs text-zinc-500 truncate">To: <span className="text-zinc-100">{lead.email}</span></p>
                        </div>
                        <div className="px-3 py-2 relative flex-1">
                          {editingEmailId === lead.id ? (
                            <textarea 
                              value={emailContent}
                              onChange={(e) => setEmailContent(e.target.value)}
                              className="w-full h-full min-h-[80px] text-xs p-1.5 bg-zinc-950 text-zinc-300 border border-zinc-700 rounded"
                            />
                          ) : (
                            <>
                              <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">{lead.outreachDrafts?.email || "No draft."}</p>
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => { setEmailContent(lead.outreachDrafts?.email || ""); setEditingEmailId(lead.id); }}
                                  className="p-1 bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100" title="Edit">
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/50 rounded-b flex gap-2">
                          {editingEmailId === lead.id ? (
                            <>
                              <button onClick={() => setEditingEmailId(null)} className="w-1/3 py-1 bg-zinc-800 text-zinc-400 text-xs font-bold rounded hover:bg-zinc-700">Cancel</button>
                              <button onClick={() => handleSendEmail(lead.id, lead.email)} className="w-2/3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700">Send Email</button>
                            </>
                          ) : (
                            <>
                              {lead.outreachStatus?.emailStatus === "Sent" ? (
                                <div className="w-full py-1 bg-emerald-900/30 text-emerald-500 text-xs font-bold rounded flex justify-center items-center gap-1">
                                  <CheckCircle2 size={12}/> Email Sent
                                </div>
                              ) : (
                                <div className="flex gap-2 w-full">
                                  <button 
                                    onClick={() => { setEmailContent(lead.outreachDrafts?.email || ""); setEditingEmailId(lead.id); }}
                                    className="flex-1 py-1 bg-zinc-100 text-zinc-900 text-xs font-bold rounded hover:bg-white transition-colors"
                                  >
                                    Review & Send Email
                                  </button>
                                  <button 
                                    onClick={() => handleMarkEmailSent(lead.id)}
                                    className="py-1 px-2.5 bg-blue-950/40 text-blue-400 text-xs font-bold rounded border border-blue-900/30 hover:bg-blue-900/40 transition-colors flex items-center gap-1"
                                    title="Mark as sent outside the app"
                                  >
                                    <Mail size={12} /> Mark Sent
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
