"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  XCircle,
  Edit3,
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Instagram } from "@/components/ui/InstagramIcon";
import { CsvProvider, CRM_FIELDS, ImportResult } from "@/providers/discovery/CsvProvider";
import { ManualProvider } from "@/providers/discovery/ManualProvider";
import { addLead, checkDuplicate, getLeads } from "@/services/leadStorage";
import { Lead, AccountType } from "@/types";
import { TARGET_NICHES, UK_CITIES } from "@/utils/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ProviderTab = "manual" | "csv";
type CsvStep = "upload" | "preview" | "summary";

export default function AddImportPage() {
  const [activeTab, setActiveTab] = useState<ProviderTab>("manual");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-zinc-100">Add / Import Leads</h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/60 text-rose-300 border border-rose-900/50 flex items-center gap-1">
            <Instagram size={12} /> Instagram Required
          </span>
        </div>
        <p className="text-sm text-zinc-400 mt-1">
          Add single aesthetic clinics or import batch CSV lists. Every lead must have a current, verifiable Instagram account.
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer ${
            activeTab === "manual"
              ? "bg-zinc-900 text-zinc-100 border-rose-500/50 shadow-md ring-1 ring-rose-500/30"
              : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
          }`}
        >
          <Edit3 size={20} className={activeTab === "manual" ? "text-rose-400 mb-1.5" : "text-zinc-500 mb-1.5"} />
          <h3 className="text-sm font-bold">Manual Lead Entry</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Add a single verified clinic profile</p>
        </button>

        <button
          onClick={() => setActiveTab("csv")}
          className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer ${
            activeTab === "csv"
              ? "bg-zinc-900 text-zinc-100 border-rose-500/50 shadow-md ring-1 ring-rose-500/30"
              : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
          }`}
        >
          <Upload size={20} className={activeTab === "csv" ? "text-rose-400 mb-1.5" : "text-zinc-500 mb-1.5"} />
          <h3 className="text-sm font-bold">CSV Import</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Import and map scraper CSV exports</p>
        </button>
      </div>

      {activeTab === "manual" && <ManualEntryFlow />}
      {activeTab === "csv" && <CsvImportFlow />}
    </div>
  );
}

function ManualEntryFlow() {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "duplicate" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [createdLead, setCreatedLead] = useState<Lead | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("processing");
    setErrorMessage("");
    setDuplicateLead(null);

    const formData = new FormData(e.currentTarget);
    const provider = new ManualProvider();

    try {
      const followersRaw = formData.get("follower_count") as string;
      const parsedFollowers = followersRaw ? parseInt(followersRaw.replace(/[^\d]/g, ""), 10) : undefined;

      const rawHandle = (formData.get("instagram_handle") as string) || "";
      const rawProfileUrl = (formData.get("instagram_profile_url") as string) || "";
      const businessName = (formData.get("business_name") as string) || "";

      if (!rawHandle.trim() && !rawProfileUrl.trim()) {
        throw new Error("An Instagram handle or profile URL is mandatory for every lead.");
      }

      // Check duplicates before building lead
      const existing = getLeads();
      const dupCheck = checkDuplicate(
        { instagram_handle: rawHandle, instagram_profile_url: rawProfileUrl, business_name: businessName },
        existing
      );

      if (dupCheck.isDuplicate && dupCheck.matchedLead) {
        setDuplicateLead(dupCheck.matchedLead);
        setStatus("duplicate");
        return;
      }

      const leads = await provider.discover({
        business_name: businessName,
        full_name_or_owner: (formData.get("full_name_or_owner") as string) || undefined,
        niche: (formData.get("niche") as string) || "Aesthetic Clinics",
        city: (formData.get("city") as string) || "London",
        country: (formData.get("country") as string) || "United Kingdom",
        instagram_handle: rawHandle,
        instagram_profile_url: rawProfileUrl || undefined,
        website_url: (formData.get("website_url") as string) || undefined,
        booking_link: (formData.get("booking_link") as string) || undefined,
        follower_count: parsedFollowers,
        account_type: (formData.get("account_type") as AccountType) || "Business",
        last_post_date: (formData.get("last_post_date") as string) || undefined,
        last_post_topic: (formData.get("last_post_topic") as string) || undefined,
        bio_text: (formData.get("bio_text") as string) || undefined,
        customer_journey_wound: (formData.get("customer_journey_wound") as string) || undefined,
        source_url: (formData.get("source_url") as string) || undefined,
        research_notes: (formData.get("notes") as string) || undefined,
      });

      const leadToSave = leads[0];
      const result = addLead(leadToSave);

      if (!result.success) {
        if (result.duplicate) {
          setDuplicateLead(result.duplicate);
          setStatus("duplicate");
          return;
        }
        throw new Error(result.error || "Failed to add lead");
      }

      setCreatedLead(leadToSave);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to add lead.");
    }
  };

  if (status === "duplicate" && duplicateLead) {
    return (
      <div className="bg-zinc-900 border border-amber-900/60 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-amber-400" size={28} />
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Duplicate Lead Detected</h3>
            <p className="text-xs text-amber-300 mt-0.5">
              This Instagram handle or business name already exists in the Veltris database. A second duplicate record will not be created.
            </p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-zinc-100">{duplicateLead.business_name}</p>
              <p className="text-xs text-zinc-400">{duplicateLead.city}, {duplicateLead.country} &middot; {duplicateLead.niche}</p>
            </div>
            <StatusBadge status={duplicateLead.status} />
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
            <span>IG: <strong className="text-rose-400">{duplicateLead.instagram_handle}</strong></span>
            {duplicateLead.instagram_profile_url && (
              <a href={duplicateLead.instagram_profile_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                Open Profile <ExternalLink size={11} />
              </a>
            )}
            <span>Created: {new Date(duplicateLead.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setStatus("idle")}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-700"
          >
            Go Back & Edit
          </button>
          <Link
            href={`/verify`}
            className="px-5 py-2 bg-rose-500 text-zinc-950 font-semibold rounded-lg text-xs hover:bg-rose-400"
          >
            View in Verification Queue
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success" && createdLead) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={36} />
        <h3 className="text-xl font-bold text-zinc-100 mb-1">Lead Added Successfully</h3>
        <p className="text-zinc-400 text-sm mb-6">
          <strong className="text-zinc-200">{createdLead.business_name}</strong> has been added and queued for ICP verification.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setStatus("idle")}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-700 transition-colors"
          >
            Add Another Lead
          </button>
          <Link
            href="/verify"
            className="px-5 py-2 bg-zinc-100 text-zinc-950 rounded-lg text-xs font-semibold hover:bg-white transition-colors"
          >
            Go to Verification Queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-100">Manual Aesthetic Clinic Entry</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Required fields are marked with an asterisk (*). Email fields are permanently removed.</p>
        </div>
      </div>

      {status === "error" && (
        <div className="mb-6 bg-rose-950/50 border border-rose-900 text-rose-400 rounded-lg p-4 flex gap-3 text-sm">
          <AlertCircle className="shrink-0 text-rose-400" size={18} />
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Location */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Identity & Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Business Name *</label>
              <input required name="business_name" type="text" placeholder="e.g. Radiance Aesthetics Clinic" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Owner / Lead Practitioner</label>
              <input name="full_name_or_owner" type="text" placeholder="e.g. Dr. Sarah Jenkins" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Niche *</label>
              <select name="niche" defaultValue="Aesthetic Clinics" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500">
                {TARGET_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">City *</label>
              <input required list="uk-cities" name="city" placeholder="e.g. London" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
              <datalist id="uk-cities">
                {UK_CITIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Country *</label>
              <input required name="country" defaultValue="United Kingdom" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Website URL</label>
              <input name="website_url" type="url" placeholder="https://..." className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
            </div>
          </div>
        </div>

        {/* Instagram Qualification */}
        <div className="pt-4 border-t border-zinc-800/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
            <Instagram size={14} /> Mandatory Instagram Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Instagram Handle *</label>
              <input required name="instagram_handle" type="text" placeholder="@radiance_clinic" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Instagram Profile URL</label>
              <input name="instagram_profile_url" type="url" placeholder="https://instagram.com/radiance_clinic" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Account Type</label>
              <select name="account_type" defaultValue="Business" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500">
                <option value="Business">Business</option>
                <option value="Creator">Creator</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Follower Count (ICP: 1,000 - 25,000)</label>
              <input name="follower_count" type="number" placeholder="e.g. 4800" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">External Booking URL</label>
              <input name="booking_link" type="url" placeholder="Fresha / Treatwell / Linktree URL" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Last Post Date</label>
              <input name="last_post_date" type="date" className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500" />
            </div>
          </div>
        </div>

        {/* Commercial Wound & Context */}
        <div className="pt-4 border-t border-zinc-800/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Commercial Wound & Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Customer Journey Wound</label>
              <textarea
                name="customer_journey_wound"
                rows={3}
                defaultValue="Consultation booking friction: Patients forced to DM back-and-forth for dates with no automated scheduling link."
                className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Last Post Topic / Content Hook</label>
              <textarea
                name="last_post_topic"
                rows={3}
                placeholder="e.g. Lip filler before/after showcasing natural enhancement technique."
                className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Instagram Bio Text</label>
              <textarea
                name="bio_text"
                rows={2}
                placeholder="Full bio copy from clinic profile"
                className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Source URL / Research Notes</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Source directory, notes on clinic reputation, etc."
                className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-lg p-2.5 text-xs focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-800">
          <button
            type="submit"
            disabled={status === "processing"}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-zinc-950 rounded-lg text-xs font-bold transition-colors disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer shadow-sm"
          >
            {status === "processing" ? "Adding Lead..." : "Save & Queue Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CsvImportFlow() {
  const [step, setStep] = useState<CsvStep>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const provider = new CsvProvider();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setStatus("processing");
      try {
        const { headers, rows } = await provider.parseFile(selected);
        if (headers.length === 0 || rows.length === 0) {
          throw new Error("CSV file contains no rows or readable headers.");
        }
        setHeaders(headers);
        setRows(rows);
        setMapping(provider.guessMapping(headers));
        setStep("preview");
        setStatus("idle");
      } catch (err: unknown) {
        setStatus("error");
        setMessage("Failed to parse CSV: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    }
  };

  const handleMappingChange = (crmFieldId: string, csvHeader: string) => {
    setMapping(prev => ({ ...prev, [crmFieldId]: csvHeader }));
  };

  const handleImport = async () => {
    setStatus("processing");
    try {
      const result = provider.mapToLeads(rows, mapping);
      setImportResult(result);

      if (result.validLeads.length > 0) {
        let addedCount = 0;
        let skippedDupes = 0;
        for (const lead of result.validLeads) {
          const res = addLead(lead);
          if (res.success) addedCount++;
          else skippedDupes++;
        }

        result.summary.success = addedCount;
        if (skippedDupes > 0) {
          result.errors.push({
            row: 0,
            messages: [`${skippedDupes} leads skipped because their Instagram handle or business name already exists in the database.`]
          });
        }
      }

      setStatus("success");
      setStep("summary");
    } catch (err: unknown) {
      setStatus("error");
      setMessage("Import failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  return (
    <div className="space-y-6">
      {status === "error" && (
        <div className="bg-rose-950/50 border border-rose-900 text-rose-400 rounded-xl p-4 flex gap-3 text-sm">
          <AlertCircle className="shrink-0 text-rose-400" size={18} />
          <p>{message}</p>
        </div>
      )}

      {step === "upload" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-rose-400 mb-4">
            <Upload size={24} />
          </div>
          <h3 className="text-base font-bold text-zinc-100">Upload Scraper CSV</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
            Upload CSV files from Apify, Outscraper, Instagram scrapers, or custom directories. Every row must include an Instagram Handle or Profile URL.
          </p>

          <div className="mt-6">
            <label htmlFor="csv-file-upload" className="cursor-pointer px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-zinc-950 rounded-lg font-bold text-xs inline-flex items-center gap-2 transition-colors">
              <FileSpreadsheet size={16} /> Select CSV File
              <input
                id="csv-file-upload"
                type="file"
                className="sr-only"
                accept=".csv"
                onChange={handleFileChange}
                disabled={status === "processing"}
              />
            </label>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Column Mapping</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Map your CSV columns to Veltris CRM fields. Instagram is required.</p>
            </div>
            <span className="text-xs font-bold text-zinc-200 bg-zinc-800 px-3 py-1 rounded border border-zinc-700">
              {rows.length} rows loaded
            </span>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-3">Required Lead Identifiers</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CRM_FIELDS.filter(f => f.required).map(field => (
                <div key={field.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5">
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    {field.label} <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={mapping[field.id] || ""}
                    onChange={(e) => handleMappingChange(field.id, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded p-1.5 focus:ring-rose-500"
                  >
                    <option value="">-- Select column --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Optional Qualification Fields</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CRM_FIELDS.filter(f => !f.required).map(field => (
                <div key={field.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5">
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    {field.label}
                  </label>
                  <select
                    value={mapping[field.id] || ""}
                    onChange={(e) => handleMappingChange(field.id, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded p-1.5 focus:ring-rose-500"
                  >
                    <option value="">-- Ignore --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={status === "processing"}
              className="px-6 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {status === "processing" ? "Importing..." : "Confirm & Import Leads"} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === "summary" && importResult && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
            <CheckCircle2 size={28} className="text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Import Complete</h2>
              <p className="text-xs text-zinc-400">Processed batch import with strict Instagram verification.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Total Rows</span>
              <p className="text-2xl font-bold text-zinc-100 mt-1">{importResult.summary.total}</p>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-4">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Added to Queue</span>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{importResult.summary.success}</p>
            </div>
            <div className="bg-rose-950/30 border border-rose-900/40 rounded-lg p-4">
              <span className="text-[10px] uppercase font-bold text-rose-400">Rejected / Skipped</span>
              <p className="text-2xl font-bold text-rose-300 mt-1">{importResult.summary.failed}</p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <XCircle size={14} className="text-rose-400" /> Row Validation Notes & Errors
              </h4>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 max-h-48 overflow-y-auto text-xs space-y-1.5">
                {importResult.errors.map((err, idx) => (
                  <div key={idx} className="text-zinc-400">
                    {err.row > 0 ? <strong className="text-zinc-300">Row {err.row}: </strong> : null}
                    <span className="text-rose-400">{err.messages.join("; ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-700"
            >
              Upload Another File
            </button>
            <Link
              href="/verify"
              className="px-6 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 rounded-lg text-xs font-bold transition-colors"
            >
              Go to Verification Queue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
