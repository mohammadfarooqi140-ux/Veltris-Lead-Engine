"use client";

import { useEffect, useState } from "react";
import { Lead } from "@/types";
import { calculateRuleBasedScore } from "@/services/leadScoring";
import { getScreenshotUrl } from "@/services/screenshot";
import { Check, X, Edit2, Save, ExternalLink, Loader2, Image as ImageIcon, AlertTriangle } from "lucide-react";

export default function QueuePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]); // Full array for safe persistence
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  
  // Edit states
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingDm, setIsEditingDm] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("vle_queue");
    if (stored) {
      const parsed: Lead[] = JSON.parse(stored);
      setAllLeads(parsed);
      const newLeads = parsed.filter(l => l.status === "New" || l.status === "Research Complete");
      setLeads(newLeads);
    }
    setIsLoading(false);
  }, []);

  const currentLead = leads[currentIndex];

  const generateFallbackDrafts = (lead: Lead) => {
    let dm = "";
    let email = "";
    let notes = "Lead qualifies based on rule-based scoring.";

    if (lead.verification.websiteQuality === "No website") {
      dm = "Hey, was checking out your page and couldn't find a website. Are customers currently finding your menu, opening hours and directions entirely through Instagram?";
      email = "Hi team, I noticed you don't have a website listed. A professional website can help customers easily find your services and opening hours. We build highly effective websites for local businesses.";
      notes = "No website detected. Strong opportunity for web development services.";
    } else if (lead.verification.websiteQuality === "Broken website") {
      dm = "Hey, was checking out your page and noticed the website link doesn't seem to be working. Not sure if you're already aware, but it looks like the site may be down.";
      email = "Hi team, I tried visiting your website but noticed the link appears to be broken. I wanted to give you a heads-up in case you weren't aware. If you need help getting it back online, let me know.";
      notes = "Broken website detected. Urgent opportunity to fix or replace their site.";
    } else if (lead.verification.websiteQuality === "Linktree only") {
      dm = "Hey, was checking out your page and noticed you're using Linktree instead of a dedicated website. Has that worked well for customers finding your key info?";
      email = "Hi team, I saw you are using Linktree. While great for basic links, a dedicated website allows for better branding and SEO. We specialize in helping local businesses upgrade from Linktree to professional sites.";
      notes = "Linktree used instead of a real website. Good opportunity for a proper landing page.";
    } else {
      dm = "Hey, I was checking out your business and loved what I saw. I'm reaching out to see if you'd be interested in upgrading your online presence to attract more local customers.";
      email = "Hi team, I was reviewing your online presence and see some great potential to attract more customers. We help local businesses enhance their digital footprint.";
    }

    return { opportunityNotes: notes, drafts: { dm, email } };
  };

  useEffect(() => {
    async function processLead() {
      if (!currentLead) return;
      
      let updated = { ...currentLead };
      let changed = false;

      // 1. Calculate Score
      if (!updated.ruleBasedScore) {
        updated.ruleBasedScore = calculateRuleBasedScore(updated);
        changed = true;
      }

      // 2. Fetch Screenshot URL
      if (!updated.screenshotUrl && updated.websiteUrl) {
        updated.screenshotUrl = await getScreenshotUrl(updated.websiteUrl);
        changed = true;
      }

      // 3. AI Analysis (only if we have a score and haven't analyzed yet)
      if (!updated.opportunityNotes && updated.ruleBasedScore) {
        setIsAnalyzing(true);
        setApiWarning(null);
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
          });
          
          if (res.ok) {
            const data = await res.json();
            updated.opportunityNotes = data.opportunityNotes;
            updated.outreachDrafts = data.drafts;
          } else {
            const errorData = await res.json();
            if (errorData.error === "GEMINI_MISSING") {
              setApiWarning(errorData.message);
            } else {
              setApiWarning("AI analysis failed. Using fallback templates.");
            }
            // Use Fallback
            const fallback = generateFallbackDrafts(updated);
            updated.opportunityNotes = fallback.opportunityNotes;
            updated.outreachDrafts = fallback.drafts;
          }
          updated.status = "Research Complete";
          changed = true;
        } catch (e) {
          console.error("Failed to analyze lead", e);
          setApiWarning("Network error during analysis. Using fallback templates.");
          const fallback = generateFallbackDrafts(updated);
          updated.opportunityNotes = fallback.opportunityNotes;
          updated.outreachDrafts = fallback.drafts;
          updated.status = "Research Complete";
          changed = true;
        } finally {
          setIsAnalyzing(false);
        }
      }

      if (changed) {
        updateLeadInState(updated);
      }
    }

    processLead();
  }, [currentIndex, currentLead]);

  const updateLeadInState = (updated: Lead) => {
    // Update the filtered view
    const newList = [...leads];
    newList[currentIndex] = updated;
    setLeads(newList);
    
    // Update the FULL array safely — find by ID and replace
    const newAll = allLeads.map(l => l.id === updated.id ? updated : l);
    setAllLeads(newAll);
    localStorage.setItem("vle_queue", JSON.stringify(newAll));
  };

  const handleScoreOverride = (score: number) => {
    if (!currentLead) return;
    updateLeadInState({ ...currentLead, ruleBasedScore: score as any });
  };

  const handleAction = (action: "Approve" | "Reject") => {
    if (!currentLead) return;
    const updatedLead = { ...currentLead, status: (action === "Approve" ? "Approved" : "Not Interested") as Lead["status"] };
    
    // Save the status change to the full array
    const newAll = allLeads.map(l => l.id === updatedLead.id ? updatedLead : l);
    setAllLeads(newAll);
    localStorage.setItem("vle_queue", JSON.stringify(newAll));
    
    // Remove from the filtered queue view
    const remaining = leads.filter(l => l.id !== currentLead.id);
    setLeads(remaining);
    setCurrentIndex(Math.min(currentIndex, Math.max(0, remaining.length - 1)));
  };

  if (isLoading) return <div className="p-8 text-zinc-500">Loading queue...</div>;
  if (!currentLead) return <div className="p-8 text-zinc-500">Queue is empty. Upload CSV or discover leads to begin.</div>;

  return (
    <div className="flex h-full flex-col md:flex-row bg-zinc-950">
      <div className="w-full md:w-1/2 border-r border-zinc-800 bg-zinc-950 overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">{currentLead.businessName}</h2>
            <p className="text-sm text-zinc-400">{currentLead.city}, {currentLead.country} &middot; {currentLead.niche}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Queue</span>
            <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md font-medium">{currentIndex + 1} / {leads.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <InfoItem label="Website" value={currentLead.websiteUrl} isLink />
          <InfoItem label="Email" value={currentLead.email} />
          <InfoItem label="Phone" value={currentLead.phone} />
          <InfoItem label="Instagram" value={currentLead.instagramHandle} />
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-100 mb-2 flex items-center gap-2">
            <ImageIcon size={16} className="text-zinc-500" /> Website Preview
          </h3>
          <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 aspect-video flex items-center justify-center overflow-hidden shadow-inner">
            {currentLead.screenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentLead.screenshotUrl} alt="Website preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm text-zinc-500 font-medium">No screenshot available</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-zinc-900 border-l border-zinc-800 overflow-y-auto p-6 flex flex-col">
        {apiWarning && (
          <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg p-3 flex gap-2 text-sm shadow-sm">
            <AlertTriangle className="shrink-0 text-yellow-500" size={18} />
            <p>{apiWarning}</p>
          </div>
        )}

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-zinc-100">Lead Score</h3>
            <span className="text-xs text-zinc-500">Manual Override</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onClick={() => handleScoreOverride(s)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${currentLead.ruleBasedScore === s 
                    ? (s > 3 ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : s === 3 ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" : "bg-rose-500/20 border-rose-500/30 text-rose-400") 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4 flex-1 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex justify-between items-center">
            Opportunity & Drafts
            {isAnalyzing && <span className="text-xs text-indigo-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> AI Generating...</span>}
          </h3>

          <div className="space-y-4">
            <EditableSection
              label="Opportunity Notes"
              value={currentLead.opportunityNotes || ""}
              isEditing={isEditingNotes}
              setIsEditing={setIsEditingNotes}
              onSave={(val: string) => updateLeadInState({ ...currentLead, opportunityNotes: val })}
            />
            <EditableSection
              label="Instagram DM"
              value={currentLead.outreachDrafts?.dm || ""}
              isEditing={isEditingDm}
              setIsEditing={setIsEditingDm}
              onSave={(val: string) => updateLeadInState({ ...currentLead, outreachDrafts: { ...currentLead.outreachDrafts!, dm: val } })}
            />
            <EditableSection
              label="Email Draft"
              value={currentLead.outreachDrafts?.email || ""}
              isEditing={isEditingEmail}
              setIsEditing={setIsEditingEmail}
              onSave={(val: string) => updateLeadInState({ ...currentLead, outreachDrafts: { ...currentLead.outreachDrafts!, email: val } })}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-auto pt-4">
          <button 
            onClick={() => handleAction("Reject")}
            className="flex-1 py-3 bg-zinc-900 border border-rose-900/50 text-rose-500 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-rose-950/30 transition-colors shadow-sm"
          >
            <X size={18} /> Reject
          </button>
          <button 
            onClick={() => handleAction("Approve")}
            disabled={isAnalyzing}
            className="flex-1 py-3 bg-zinc-100 text-zinc-900 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors shadow-sm"
          >
            <Check size={18} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, isLink }: { label: string; value?: string; isLink?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      {isLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1">
          {value.replace(/^https?:\/\//, '').split('/')[0]} <ExternalLink size={12} />
        </a>
      ) : (
        <span className="text-sm font-medium text-zinc-100">{value}</span>
      )}
    </div>
  );
}

function EditableSection({ label, value, isEditing, setIsEditing, onSave }: any) {
  const [tempVal, setTempVal] = useState(value);

  useEffect(() => { setTempVal(value); }, [value]);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-zinc-400 uppercase">{label}</span>
          <button onClick={() => { onSave(tempVal); setIsEditing(false); }} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Save size={12}/> Save</button>
        </div>
        <textarea 
          className="w-full text-sm bg-zinc-900 text-zinc-100 border border-zinc-700 rounded-lg p-2 focus:ring-zinc-500 focus:border-zinc-500 min-h-[100px]"
          value={tempVal}
          onChange={e => setTempVal(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 group">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-zinc-500 uppercase">{label}</span>
        <button onClick={() => setIsEditing(true)} className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-zinc-300 transition-opacity flex items-center gap-1"><Edit2 size={12}/> Edit</button>
      </div>
      <p className="text-sm text-zinc-300 bg-zinc-900 border border-zinc-800 p-3 rounded-lg whitespace-pre-wrap">{value || <span className="text-zinc-600 italic">No data</span>}</p>
    </div>
  );
}
