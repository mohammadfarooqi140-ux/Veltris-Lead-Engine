"use client";

import { useState } from "react";
import {
  Download,
  Upload,
  Wrench,
  Activity,
  AlertOctagon,
  Trash2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import {
  getLeads,
  getSettings,
  saveSettings,
  exportLeadsJson,
  importLeadsJson,
  repairAndMergeLegacyData,
  resetDatabase,
  STORAGE_KEY_V2,
  LEGACY_KEY_QUEUE,
  LEGACY_KEY_APPROVED,
  LEGACY_KEY_CRM
} from "@/services/leadStorage";

function computeStorageStats() {
  const leads = typeof window !== "undefined" ? getLeads() : [];
  return {
    total: leads.length,
    verified: leads.filter(l => l.status === "Verified" || l.status === "Approved for Warming").length,
    waiting24h: leads.filter(l => l.status === "Waiting 24 Hours").length,
    dmReady: leads.filter(l => l.status === "DM Ready" || l.status === "DM Approved").length,
    dmSent: leads.filter(l => l.status === "DM Sent").length,
    replied: leads.filter(l => l.status === "Replied").length,
    dead: leads.filter(l => l.status === "Closed / Dead").length,
    hasLegacyQueue: typeof window !== "undefined" ? !!localStorage.getItem(LEGACY_KEY_QUEUE) : false,
    hasLegacyApproved: typeof window !== "undefined" ? !!localStorage.getItem(LEGACY_KEY_APPROVED) : false,
    hasLegacyCrm: typeof window !== "undefined" ? !!localStorage.getItem(LEGACY_KEY_CRM) : false,
  };
}

export default function SettingsPage() {
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState("");

  const [waitingHoursInput, setWaitingHoursInput] = useState(() => (typeof window !== "undefined" ? getSettings().waitingPeriodHours || 24 : 24));

  const [storageStats, setStorageStats] = useState(computeStorageStats);

  const refreshStats = () => {
    setStorageStats(computeStorageStats());
  };

  const handleSaveWaitingHours = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = Math.max(1, Number(waitingHoursInput));
    saveSettings({ waitingPeriodHours: hours });
    setStatusMessage({ type: "success", text: `Waiting period updated to ${hours} hours.` });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleRepairLegacy = () => {
    const res = repairAndMergeLegacyData();
    setStatusMessage({
      type: "success",
      text: `Repair complete. Merged ${res.mergedCount} legacy records, resolved ${res.dedupeCount} duplicates. Total active leads: ${res.total}.`
    });
    refreshStats();
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsImporting(true);
      try {
        const res = await importLeadsJson(file);
        setStatusMessage({
          type: "success",
          text: `Successfully imported JSON backup: ${res.added} new leads added, ${res.skippedDuplicates} duplicates safely skipped.`
        });
        refreshStats();
      } catch (err: unknown) {
        setStatusMessage({
          type: "error",
          text: "Import failed: " + (err instanceof Error ? err.message : "Invalid JSON file")
        });
      } finally {
        setIsImporting(false);
      }
    }
  };

  const handleConfirmReset = () => {
    if (resetConfirmationInput !== "RESET") {
      alert("Please type RESET in capital letters to confirm database purge.");
      return;
    }

    resetDatabase();
    setResetModalOpen(false);
    setResetConfirmationInput("");
    setStatusMessage({
      type: "info",
      text: "Database has been completely purged. All leads cleared from localStorage."
    });
    refreshStats();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Settings & System Health</h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            Schema v2 &middot; Instagram CRM
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Local storage health, JSON backups, deduplication repair, and ICP defaults. Veltris Lead Engine is your exclusive master database.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-950/40 border border-emerald-900/60 text-emerald-300"
              : statusMessage.type === "error"
              ? "bg-rose-950/40 border border-rose-900/60 text-rose-300"
              : "bg-blue-950/40 border border-blue-900/60 text-blue-300"
          }`}
        >
          <CheckCircle2 size={16} />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Storage Health */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 bg-zinc-800/30 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" /> Database & Storage Health
            </h2>
            <p className="text-xs text-zinc-400">Live inspection of client-side database records.</p>
          </div>
          <button
            onClick={refreshStats}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <HealthCard label="Total Leads" value={storageStats.total} />
            <HealthCard label="Verified / In Queue" value={storageStats.verified} color="text-blue-400" />
            <HealthCard label="Waiting 24h" value={storageStats.waiting24h} color="text-purple-400" />
            <HealthCard label="DM Ready" value={storageStats.dmReady} color="text-emerald-400" />
            <HealthCard label="DMs Sent" value={storageStats.dmSent} color="text-indigo-400" />
            <HealthCard label="Replies" value={storageStats.replied} color="text-cyan-400" />
            <HealthCard label="Closed / Dead" value={storageStats.dead} color="text-zinc-500" />
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Storage Version</span>
              <p className="text-xs font-mono font-bold text-rose-400 mt-1">{STORAGE_KEY_V2}</p>
            </div>
          </div>

          {(storageStats.hasLegacyQueue || storageStats.hasLegacyApproved || storageStats.hasLegacyCrm) && (
            <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3 text-xs text-amber-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertOctagon size={16} className="text-amber-400 shrink-0" />
                <span>Legacy data keys detected from prior version. Click Repair to merge safely without duplicate records.</span>
              </div>
              <button
                onClick={handleRepairLegacy}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded text-xs transition-colors shrink-0"
              >
                Run Merge & Dedupe
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={exportLeadsJson}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} /> Export JSON Backup
            </button>

            <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload size={14} /> Import JSON Backup
              <input
                type="file"
                accept=".json"
                className="sr-only"
                onChange={handleImportJsonFile}
                disabled={isImporting}
              />
            </label>

            <button
              onClick={handleRepairLegacy}
              className="px-4 py-2 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-900/50 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wrench size={14} /> Repair & Merge Legacy Data
            </button>
          </div>
        </div>
      </div>

      {/* ICP Configuration & Delay Settings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 bg-zinc-800/30">
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck size={16} className="text-rose-400" /> Outreach & Qualification Parameters
          </h2>
          <p className="text-xs text-zinc-400">Configure operational warming delay and default ICP target values.</p>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSaveWaitingHours} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1 flex items-center gap-1">
                <Clock size={13} className="text-purple-400" /> Mandatory Warming Delay (Hours)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={waitingHoursInput}
                  onChange={e => setWaitingHoursInput(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  Save
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Default is 24 hours. Leeway allows adjusting for rapid staging test runs.</p>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Target Geographic Service Area</label>
              <input
                type="text"
                disabled
                value="United Kingdom (London, Manchester, Birmingham, Leeds, etc.)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-400 cursor-not-allowed"
              />
              <p className="text-[11px] text-zinc-500 mt-1">Veltris Lead Engine ICP is strictly configured for UK Aesthetic Clinics.</p>
            </div>
          </form>
        </div>
      </div>

      {/* Danger Zone: Reset Database */}
      <div className="bg-zinc-900 border border-rose-950 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-rose-950 bg-rose-950/20">
          <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <AlertOctagon size={16} /> Danger Zone
          </h2>
        </div>

        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-100">Reset Local Database</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Permanently purges all leads from localStorage. Ensure you export a JSON backup beforehand.
            </p>
          </div>

          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900 text-rose-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trash2 size={14} /> Purge & Reset Database
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-rose-900 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertOctagon size={28} />
              <div>
                <h3 className="text-base font-bold text-zinc-100">Permanent Database Purge</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This will permanently delete all leads, warming logs, and DM history from this browser. Type <strong className="text-rose-400">RESET</strong> below to confirm.
            </p>

            <div>
              <input
                type="text"
                placeholder="Type RESET"
                value={resetConfirmationInput}
                onChange={e => setResetConfirmationInput(e.target.value)}
                className="w-full bg-zinc-950 border border-rose-900/60 rounded-lg p-2.5 text-xs text-zinc-100 font-mono tracking-widest focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setResetModalOpen(false);
                  setResetConfirmationInput("");
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={resetConfirmationInput !== "RESET"}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Permanently Delete All Leads
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HealthCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
      <span className="text-[10px] uppercase font-bold text-zinc-500">{label}</span>
      <p className={`text-xl font-bold mt-0.5 ${color || "text-zinc-100"}`}>{value}</p>
    </div>
  );
}
