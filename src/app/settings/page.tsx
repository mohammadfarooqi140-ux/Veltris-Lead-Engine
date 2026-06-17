"use client";

import { Settings as SettingsIcon, KeyRound, Database, Mail, AlertOctagon, Trash2, Download, Wrench, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { Lead } from "@/types";

export default function SettingsPage() {
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{success: boolean, message: string} | null>(null);
  const [repairStatus, setRepairStatus] = useState<string | null>(null);
  const [dataHealth, setDataHealth] = useState({
    total: 0,
    approved: 0,
    contacted: 0,
    queue: 0,
    replied: 0,
    dead: 0,
    followUpsDue: 0,
    storageKey: "vle_queue",
    hasLegacyApproved: false,
    hasLegacyCrm: false,
  });

  useEffect(() => {
    refreshDataHealth();
  }, []);

  const refreshDataHealth = () => {
    const raw = localStorage.getItem("vle_queue");
    const leads: Lead[] = raw ? JSON.parse(raw) : [];
    const now = new Date();

    const followUpsDue = leads.filter(l => {
      if (l.status === "Dead" || l.status === "Replied") return false;
      if (l.outreachStatus?.leadStatus === "Replied" || l.outreachStatus?.leadStatus === "Dead") return false;
      const sent = l.outreachStatus?.dmStatus === "Sent" || l.outreachStatus?.emailStatus === "Sent";
      if (!sent) return false;
      if (l.outreachStatus?.followUpDueDate) return new Date(l.outreachStatus.followUpDueDate) <= now;
      if (l.outreachStatus?.lastContactedDate) {
        return new Date(new Date(l.outreachStatus.lastContactedDate).getTime() + 3*24*60*60*1000) <= now;
      }
      return false;
    }).length;

    setDataHealth({
      total: leads.length,
      approved: leads.filter(l => l.status === "Approved").length,
      contacted: leads.filter(l => l.status === "Contacted").length,
      queue: leads.filter(l => l.status === "New" || l.status === "Research Complete").length,
      replied: leads.filter(l => l.status === "Replied" || l.outreachStatus?.leadStatus === "Replied").length,
      dead: leads.filter(l => l.status === "Dead" || l.outreachStatus?.leadStatus === "Dead").length,
      followUpsDue,
      storageKey: "vle_queue",
      hasLegacyApproved: !!localStorage.getItem("vle_approved"),
      hasLegacyCrm: !!localStorage.getItem("vle_crm"),
    });
  };

  const handleSendTestEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestEmailStatus(null);
    const formData = new FormData(e.currentTarget);
    const toEmail = formData.get("toEmail") as string;

    try {
      const response = await fetch("/api/outreach/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toEmail,
          subject: "Veltris Lead Engine - Test Email",
          content: "This is a test email from the Veltris Lead Engine. If you are reading this, your SMTP settings are configured correctly!",
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send email");
      }

      setTestEmailStatus({ success: true, message: "Test email sent successfully!" });
    } catch (err: any) {
      setTestEmailStatus({ success: false, message: err.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleExportJson = () => {
    const raw = localStorage.getItem("vle_queue");
    const leads: Lead[] = raw ? JSON.parse(raw) : [];
    const blob = new Blob([JSON.stringify(leads, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veltris_leads_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRepair = () => {
    const raw = localStorage.getItem("vle_queue");
    let canonical: Lead[] = raw ? JSON.parse(raw) : [];
    let mergedCount = 0;

    // Merge vle_approved
    const approvedRaw = localStorage.getItem("vle_approved");
    if (approvedRaw) {
      const legacy: Lead[] = JSON.parse(approvedRaw);
      const existingIds = new Set(canonical.map(l => l.id));
      for (const lead of legacy) {
        if (!existingIds.has(lead.id)) {
          canonical.push(lead);
          mergedCount++;
        }
      }
      localStorage.removeItem("vle_approved");
    }

    // Merge vle_crm
    const crmRaw = localStorage.getItem("vle_crm");
    if (crmRaw) {
      const legacy: Lead[] = JSON.parse(crmRaw);
      const existingIds = new Set(canonical.map(l => l.id));
      for (const lead of legacy) {
        if (!existingIds.has(lead.id)) {
          canonical.push(lead);
          mergedCount++;
        }
      }
      localStorage.removeItem("vle_crm");
    }

    // Deduplicate by ID (keep newest by preserving last occurrence)
    const deduped = Array.from(new Map(canonical.map(l => [l.id, l])).values());
    const removedDupes = canonical.length - deduped.length;

    // Ensure safe defaults for outreachStatus
    const repaired = deduped.map(l => ({
      ...l,
      outreachStatus: {
        dmStatus: "Not Ready" as const,
        emailStatus: "Not Ready" as const,
        channelUsed: "None" as const,
        ...l.outreachStatus,
      }
    }));

    localStorage.setItem("vle_queue", JSON.stringify(repaired));
    setRepairStatus(`Repair complete. Merged ${mergedCount} legacy leads. Removed ${removedDupes} duplicates. Total: ${repaired.length} leads.`);
    refreshDataHealth();
    setTimeout(() => setRepairStatus(null), 8000);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to delete ALL leads and reset the database? This action cannot be undone.")) {
      localStorage.removeItem("vle_queue");
      localStorage.removeItem("vle_approved");
      localStorage.removeItem("vle_crm");
      setResetStatus("Database has been completely reset. All leads cleared.");
      refreshDataHealth();
      setTimeout(() => setResetStatus(null), 5000);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <SettingsIcon size={24} /> Settings & Setup
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Environment configuration and system administration.</p>
      </div>

      {resetStatus && (
        <div className="mb-6 bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded-md p-4 text-sm font-medium">
          {resetStatus}
        </div>
      )}
      {repairStatus && (
        <div className="mb-6 bg-blue-950/50 border border-blue-900 text-blue-400 rounded-md p-4 text-sm font-medium">
          {repairStatus}
        </div>
      )}

      {/* Data Health */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm mb-8">
        <div className="border-b border-zinc-800 bg-zinc-800/30 p-4">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2"><Activity size={16} className="text-emerald-400" /> Data Health</h2>
          <p className="text-xs text-zinc-400 mt-1">Live view of lead storage state.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <HealthStat label="Total Leads" value={dataHealth.total} />
            <HealthStat label="Approved" value={dataHealth.approved} color="text-emerald-400" />
            <HealthStat label="Contacted" value={dataHealth.contacted} color="text-blue-400" />
            <HealthStat label="In Queue" value={dataHealth.queue} color="text-yellow-400" />
            <HealthStat label="Follow Ups Due" value={dataHealth.followUpsDue} color="text-orange-400" />
            <HealthStat label="Replied" value={dataHealth.replied} color="text-cyan-400" />
            <HealthStat label="Dead" value={dataHealth.dead} color="text-rose-400" />
            <div className="bg-zinc-800/30 rounded p-3">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Storage Key</p>
              <p className="text-xs font-mono text-zinc-300 mt-1">{dataHealth.storageKey}</p>
            </div>
          </div>

          {(dataHealth.hasLegacyApproved || dataHealth.hasLegacyCrm) && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded p-3 flex gap-2 text-xs mb-4">
              <AlertOctagon size={14} className="shrink-0 mt-0.5" />
              Legacy storage keys detected ({dataHealth.hasLegacyApproved && "vle_approved"}{dataHealth.hasLegacyApproved && dataHealth.hasLegacyCrm && ", "}{dataHealth.hasLegacyCrm && "vle_crm"}). Run Repair to merge.
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleExportJson} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded text-sm font-medium hover:bg-zinc-700 transition-colors">
              <Download size={14} /> Export JSON
            </button>
            <button onClick={handleRepair} className="flex items-center gap-2 px-4 py-2 bg-blue-950/30 border border-blue-900/30 text-blue-400 rounded text-sm font-medium hover:bg-blue-900/40 transition-colors">
              <Wrench size={14} /> Repair / Merge Legacy Data
            </button>
            <button onClick={refreshDataHealth} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-400 rounded text-sm font-medium hover:bg-zinc-700 transition-colors">
              <Activity size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm mb-8">
        <div className="border-b border-zinc-800 bg-zinc-800/30 p-4">
          <h2 className="text-sm font-semibold text-zinc-100">Environment Variables</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Create a <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">.env.local</code> file in the root of the project.
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Email Config */}
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-3">
              <Mail size={16} className="text-orange-400" /> Email Sending (SMTP)
            </h3>
            <div className="bg-zinc-800/30 border border-zinc-800 rounded-lg p-4 space-y-4 mb-4">
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold text-zinc-200">EMAIL_USER</span>
                <span className="text-xs text-zinc-400">Your email address (e.g., hello@veltris.uk)</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold text-zinc-200">EMAIL_APP_PASSWORD</span>
                <span className="text-xs text-zinc-400">Your generated Google App Password (not your main password).</span>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm p-4">
              <h4 className="text-sm font-bold text-zinc-100 mb-2">Send Test Email</h4>
              <p className="text-xs text-zinc-400 mb-4">Verify your environment variables and SMTP connection.</p>
              
              {testEmailStatus && (
                <div className={`mb-4 p-3 rounded text-sm ${testEmailStatus.success ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900' : 'bg-rose-950/50 text-rose-400 border border-rose-900'}`}>
                  {testEmailStatus.message}
                </div>
              )}

              <form onSubmit={handleSendTestEmail} className="flex gap-2">
                <input required name="toEmail" type="email" placeholder="Recipient (your email)" className="flex-1 text-sm bg-zinc-950 text-zinc-100 p-2 border border-zinc-800 rounded-lg focus:ring-zinc-700 focus:border-zinc-700 placeholder-zinc-600" />
                <button disabled={isSendingTest} type="submit" className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-white transition-colors">
                  {isSendingTest ? "Sending..." : "Send Test"}
                </button>
              </form>
            </div>
          </div>

          {/* API Providers */}
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-3">
              <KeyRound size={16} className="text-blue-400" /> API Providers
            </h3>
            <div className="bg-zinc-800/30 border border-zinc-800 rounded-lg p-4 space-y-4">
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold text-zinc-200 flex items-center gap-2">
                  GOOGLE_PLACES_API_KEY <span className="bg-blue-950 text-blue-400 border border-blue-900 text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-wider">OPTIONAL</span>
                </span>
                <span className="text-xs text-zinc-400">Required for the Google Maps Finder. If not provided, use CSV Import or Manual Entry.</span>
              </div>
            </div>
          </div>

          {/* CRM Config */}
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-3">
              <Database size={16} className="text-emerald-400" /> Google Sheets CRM Integration
            </h3>
            <div className="bg-zinc-800/30 border border-zinc-800 rounded-lg p-4 space-y-4">
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold text-zinc-200">GOOGLE_SHEET_ID</span>
                <span className="text-xs text-zinc-400">The unique ID found in your Google Sheet URL.</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold text-zinc-200">GOOGLE_SERVICE_ACCOUNT_EMAIL</span>
                <span className="text-xs text-zinc-400">Service account email generated from Google Cloud Console.</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold text-zinc-200">GOOGLE_PRIVATE_KEY</span>
                <span className="text-xs text-zinc-400">Service account private key. Enclose the string in quotes to handle newline (\n) characters properly.</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Note: You must share the target Google Sheet with the Service Account Email for it to have write access.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-zinc-900 border border-rose-900/50 rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-rose-900/50 bg-rose-950/20 p-4">
          <h2 className="text-sm font-semibold text-rose-500 flex items-center gap-2">
            <AlertOctagon size={18} /> Danger Zone
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Reset Database / Delete All Leads</h3>
              <p className="text-sm text-zinc-400 mt-1">Permanently remove all leads from localStorage.</p>
            </div>
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 font-semibold rounded-lg text-sm transition-colors"
            >
              <Trash2 size={16} /> Reset Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-zinc-800/30 rounded p-3">
      <p className="text-[10px] font-bold uppercase text-zinc-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color || 'text-zinc-100'}`}>{value}</p>
    </div>
  );
}
