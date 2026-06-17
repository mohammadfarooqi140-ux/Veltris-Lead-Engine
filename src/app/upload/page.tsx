"use client";

import { useState } from "react";
import { Upload, FileType, CheckCircle2, AlertCircle, ArrowRight, XCircle, MapPin, Edit3, Search } from "lucide-react";
import { CsvProvider, CRM_FIELDS, ImportResult } from "@/providers/discovery/CsvProvider";
import { ManualProvider } from "@/providers/discovery/ManualProvider";
import { GoogleMapsProvider } from "@/providers/discovery/GoogleMapsProvider";

type ProviderTab = "csv" | "manual" | "google-maps";
type CsvStep = "upload" | "preview" | "summary";

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<ProviderTab>("csv");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Discover Leads</h1>
        <p className="text-sm text-zinc-400 mt-1">Import or find leads to begin the verification and outreach process.</p>
      </div>

      <div className="flex gap-4 mb-8">
        <ProviderTabButton 
          active={activeTab === "csv"} 
          onClick={() => setActiveTab("csv")} 
          icon={<Upload size={18} />} 
          title="CSV Import" 
          description="Import lists from scrapers" 
        />
        <ProviderTabButton 
          active={activeTab === "manual"} 
          onClick={() => setActiveTab("manual")} 
          icon={<Edit3 size={18} />} 
          title="Manual Entry" 
          description="Add a single lead" 
        />
        <ProviderTabButton 
          active={activeTab === "google-maps"} 
          onClick={() => setActiveTab("google-maps")} 
          icon={<MapPin size={18} />} 
          title="Google Maps Finder" 
          description="Experimental (API Key Required)" 
        />
      </div>

      {activeTab === "csv" && <CsvImportFlow />}
      {activeTab === "manual" && <ManualEntryFlow />}
      {activeTab === "google-maps" && <GoogleMapsFlow />}
    </div>
  );
}

function ProviderTabButton({ active, onClick, icon, title, description }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center p-4 border rounded-xl transition-colors
        ${active ? "bg-zinc-900 text-zinc-100 border-zinc-700 shadow-sm" : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"}`}
    >
      <div className="mb-2">{icon}</div>
      <h3 className="text-sm font-bold">{title}</h3>
      <p className={`text-xs mt-1 ${active ? "text-zinc-400" : "text-zinc-500"}`}>{description}</p>
    </button>
  );
}

function ManualEntryFlow() {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const provider = new ManualProvider();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("processing");
    const formData = new FormData(e.currentTarget);
    
    try {
      const params = {
        businessName: formData.get("businessName") as string,
        country: formData.get("country") as string,
        city: formData.get("city") as string,
        niche: formData.get("niche") as string,
        websiteUrl: formData.get("websiteUrl") as string,
        instagramHandle: formData.get("instagramHandle") as string,
        email: formData.get("email") as string,
      };

      const leads = await provider.discover(params);
      
      const existing = localStorage.getItem("vle_queue");
      let allLeads = existing ? JSON.parse(existing) : [];
      allLeads = [...allLeads, ...leads];
      localStorage.setItem("vle_queue", JSON.stringify(allLeads));

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  if (status === "success") {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={32} />
        <h3 className="text-xl font-bold text-zinc-100 mb-2">Lead Added Successfully</h3>
        <p className="text-zinc-400 mb-6">The lead has been sent to the approval queue.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => setStatus("idle")} className="px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">Add Another</button>
          <a href="/queue" className="px-6 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-white transition-colors">Go to Queue</a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-sm">
      <h2 className="text-lg font-bold text-zinc-100 mb-6">Add Lead Manually</h2>
      
      {status === "error" && (
        <div className="mb-6 bg-rose-950/50 border border-rose-900 text-rose-400 rounded-lg p-4 flex gap-3">
          <AlertCircle className="shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Business Name *</label>
            <input required name="businessName" type="text" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Niche *</label>
            <input required name="niche" type="text" placeholder="e.g. Cafe, Barber" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700 placeholder-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Country *</label>
            <input required name="country" type="text" defaultValue="United Kingdom" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">City *</label>
            <input required name="city" type="text" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Website URL</label>
            <input name="websiteUrl" type="url" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Instagram</label>
            <input name="instagramHandle" type="text" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
            <input name="email" type="email" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700" />
          </div>
        </div>
        <div className="flex justify-end">
          <button disabled={status === "processing"} type="submit" className="px-6 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors">
            {status === "processing" ? "Saving..." : "Add Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}

function GoogleMapsFlow() {
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const provider = new GoogleMapsProvider();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("processing");
    const formData = new FormData(e.currentTarget);
    
    try {
      const params = {
        country: formData.get("country") as string,
        city: formData.get("city") as string,
        niche: formData.get("niche") as string,
        resultCount: parseInt(formData.get("resultCount") as string, 10),
      };

      const leads = await provider.discover(params);
      
      const existing = localStorage.getItem("vle_queue");
      let allLeads = existing ? JSON.parse(existing) : [];
      allLeads = [...allLeads, ...leads];
      localStorage.setItem("vle_queue", JSON.stringify(allLeads));

      setImportedCount(leads.length);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  if (status === "success") {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={32} />
        <h3 className="text-xl font-bold text-zinc-100 mb-2">Discovery Complete!</h3>
        <p className="text-zinc-400 mb-6">Successfully imported {importedCount} leads from Google Maps.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => setStatus("idle")} className="px-4 py-2 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">Search Again</button>
          <a href="/queue" className="px-6 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-white transition-colors">Go to Queue</a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Google Maps Finder</h2>
          <p className="text-sm text-zinc-400">Experimental: Requires GOOGLE_PLACES_API_KEY in settings.</p>
        </div>
      </div>
      
      {status === "error" && (
        <div className="mb-6 bg-rose-950/50 border border-rose-900 text-rose-400 rounded-lg p-4 flex gap-3">
          <AlertCircle className="shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Niche *</label>
            <input required name="niche" type="text" placeholder="e.g. Coffee Shop, Plumber" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700 placeholder-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">City *</label>
            <input required name="city" type="text" placeholder="e.g. London" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700 placeholder-zinc-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Country *</label>
            <input required name="country" type="text" defaultValue="United Kingdom" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Max Results</label>
            <select name="resultCount" className="w-full bg-zinc-950 text-zinc-100 border-zinc-800 rounded-lg shadow-sm border p-2 focus:ring-zinc-700 focus:border-zinc-700">
              <option value="10">10 Leads</option>
              <option value="20">20 Leads</option>
              <option value="50">50 Leads</option>
              <option value="100">100 Leads</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button disabled={status === "processing"} type="submit" className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors">
            {status === "processing" ? "Searching..." : <><Search size={16}/> Search Maps</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function CsvImportFlow() {
  const [step, setStep] = useState<CsvStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  
  // Parse state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  
  // Status state
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  // Result state
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const provider = new CsvProvider();

  const isNoisyHeader = (h: string) => {
    const lower = h.toLowerCase();
    if (lower.includes("additionalinfo") || lower.includes("accessibility")) return true;
    if (lower.includes("cid") || lower.includes("placeid") || lower.includes("fid")) return true;
    if (lower.includes("reviewsperrating") || lower.includes("locatedin")) return true;
    if (lower.includes("coordinates") || lower.includes("image")) return true;
    return false;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setStatus("processing");
      try {
        const { headers, rows } = await provider.parseFile(selected);
        setHeaders(headers);
        setRows(rows);
        setMapping(provider.guessMapping(headers));
        setStep("preview");
        setStatus("idle");
      } catch (err: any) {
        setStatus("error");
        setMessage("Failed to parse CSV file: " + err.message);
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
        const existing = localStorage.getItem("vle_queue");
        let allLeads = existing ? JSON.parse(existing) : [];
        allLeads = [...allLeads, ...result.validLeads];
        localStorage.setItem("vle_queue", JSON.stringify(allLeads));
      }
      
      setStatus("success");
      setStep("summary");
    } catch (err: any) {
      setStatus("error");
      setMessage("Failed to import leads: " + err.message);
    }
  };

  return (
    <>
      {status === "error" && (
        <div className="mb-6 bg-rose-950/50 border border-rose-900 text-rose-400 rounded-lg p-4 flex gap-3">
          <AlertCircle className="shrink-0" />
          <p className="text-sm">{message}</p>
        </div>
      )}

      {step === "upload" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-sm">
          <Upload className="mx-auto h-12 w-12 text-zinc-500" />
          <h3 className="mt-4 text-sm font-semibold text-zinc-100">Upload CSV file</h3>
          <p className="mt-2 text-sm text-zinc-400">
            CSV must include columns like Business Name, Country, City, Niche, and optional URLs.
          </p>
          
          <div className="mt-6">
            <label htmlFor="file-upload" className="cursor-pointer bg-zinc-800 py-2 px-4 border border-zinc-700 rounded-lg shadow-sm text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">
              <span>Select file</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} disabled={status === "processing"} />
            </label>
          </div>
          {status === "processing" && <p className="mt-4 text-sm text-zinc-500 animate-pulse">Parsing CSV...</p>}
        </div>
      )}

      {step === "upload" && (
        <div className="mt-8 bg-blue-950/30 border border-blue-900/50 rounded-xl p-6">
          <h4 className="text-sm font-bold text-blue-400 mb-2">External Scraper Workflow</h4>
          <p className="text-sm text-zinc-400 mb-4">
            You can use free, open-source Google Maps scrapers to generate lead lists. Follow this workflow:
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-300 items-center">
            <span className="bg-zinc-800 px-2 py-1 rounded-md shadow-sm border border-zinc-700">External scraper</span> <ArrowRight size={14} className="text-blue-500" />
            <span className="bg-zinc-800 px-2 py-1 rounded-md shadow-sm border border-zinc-700">Export CSV</span> <ArrowRight size={14} className="text-blue-500" />
            <span className="bg-zinc-800 px-2 py-1 rounded-md shadow-sm border border-zinc-700">Upload CSV</span> <ArrowRight size={14} className="text-blue-500" />
            <span className="bg-zinc-800 px-2 py-1 rounded-md shadow-sm border border-zinc-700">Score leads</span> <ArrowRight size={14} className="text-blue-500" />
            <span className="bg-zinc-800 px-2 py-1 rounded-md shadow-sm border border-zinc-700">Generate drafts</span> <ArrowRight size={14} className="text-blue-500" />
            <span className="bg-zinc-800 px-2 py-1 rounded-md shadow-sm border border-zinc-700">Approve leads</span> <ArrowRight size={14} className="text-blue-500" />
            <span className="bg-zinc-800 px-2 py-1 rounded-md shadow-sm border border-zinc-700">Track in CRM</span>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-6">
          <div className="border-b border-zinc-800 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FileType size={20} className="text-blue-400"/> Data Mapping
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Map your CSV columns to lead fields.</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={showAdvancedFields} onChange={(e) => setShowAdvancedFields(e.target.checked)} className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-700" />
                Show all CSV columns
              </label>
              <span className="text-sm font-bold text-zinc-100 bg-zinc-800 px-3 py-1 rounded">{rows.length} rows</span>
            </div>
          </div>

          {/* Required Fields */}
          <div>
            <h4 className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-3">Required Fields</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CRM_FIELDS.filter(f => ["businessName", "city", "country", "niche"].includes(f.id)).map(field => (
                <div key={field.id}>
                  <label className="text-xs font-medium text-zinc-300 mb-1 block">
                    {field.label} {field.id === "businessName" && <span className="text-rose-500">*</span>}
                  </label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded text-xs p-1.5 focus:ring-zinc-700 focus:border-zinc-700 max-h-48"
                    value={mapping[field.id] || ""}
                    onChange={(e) => handleMappingChange(field.id, e.target.value)}
                  >
                    <option value="">-- Ignore --</option>
                    {headers.filter(h => showAdvancedFields || !isNoisyHeader(h)).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <h4 className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-3">Optional Fields</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CRM_FIELDS.filter(f => !["businessName", "city", "country", "niche"].includes(f.id)).map(field => (
                <div key={field.id}>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">{field.label}</label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded text-xs p-1.5 focus:ring-zinc-700 focus:border-zinc-700 max-h-48"
                    value={mapping[field.id] || ""}
                    onChange={(e) => handleMappingChange(field.id, e.target.value)}
                  >
                    <option value="">-- Ignore --</option>
                    {headers.filter(h => showAdvancedFields || !isNoisyHeader(h)).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {!mapping["businessName"] && (
             <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded p-3 flex gap-2 text-xs">
               <AlertCircle size={14} /> <strong>Warning:</strong> Business Name is not mapped. Leads without a name will be rejected.
             </div>
          )}

          {/* Preview Table */}
          <div className="border border-zinc-800/50 rounded overflow-hidden">
             <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800/50">
               <h4 className="text-xs font-semibold text-zinc-400">Preview (First 5 rows)</h4>
             </div>
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-zinc-800/50 text-xs text-left">
                  <thead>
                    <tr>
                      {headers.filter(h => showAdvancedFields || !isNoisyHeader(h)).map(h => (
                        <th key={h} className="px-3 py-2 font-semibold text-zinc-500 bg-zinc-900/30 border-r border-zinc-800/30 last:border-0 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-800/30">
                        {headers.filter(h => showAdvancedFields || !isNoisyHeader(h)).map(h => (
                          <td key={h} className="px-3 py-1.5 text-zinc-300 border-r border-zinc-800/20 last:border-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => {setStep("upload"); setFile(null);}}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={status === "processing"}
              className="px-6 py-2 bg-zinc-100 text-zinc-900 rounded text-sm font-semibold flex items-center gap-2 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors"
            >
              {status === "processing" ? "Importing..." : "Confirm & Import"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === "summary" && importResult && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
              <CheckCircle2 className="text-emerald-500" size={28} />
              <h2 className="text-xl font-bold text-zinc-100">Import Summary</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mb-8 text-center">
              <div className="bg-zinc-800/30 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase">Total Rows</p>
                <p className="text-2xl font-bold text-zinc-100 mt-1">{importResult.summary.total}</p>
              </div>
              <div className="bg-emerald-950/30 border border-emerald-900 rounded-lg p-4">
                <p className="text-xs font-semibold text-emerald-500 uppercase">Successfully Mapped</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{importResult.summary.success}</p>
              </div>
              <div className="bg-rose-950/30 border border-rose-900 rounded-lg p-4">
                <p className="text-xs font-semibold text-rose-500 uppercase">Failed Rows</p>
                <p className="text-2xl font-bold text-rose-400 mt-1">{importResult.summary.failed}</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 mb-3">
                  <XCircle size={16} className="text-rose-500" /> Row-Level Errors
                </h3>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-zinc-800 text-sm text-left">
                    <thead className="bg-zinc-900">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-zinc-400 w-24">Row</th>
                        <th className="px-4 py-2 font-semibold text-zinc-400">Error Messages</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {importResult.errors.map(err => (
                        <tr key={err.row} className="hover:bg-zinc-800/50">
                          <td className="px-4 py-3 font-medium text-zinc-300">Row {err.row}</td>
                          <td className="px-4 py-3 text-rose-400">
                            <ul className="list-disc list-inside">
                              {err.messages.map((msg, i) => <li key={i}>{msg}</li>)}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex gap-4 mt-8 justify-end">
              <button 
                onClick={() => {setStep("upload"); setFile(null); setImportResult(null);}}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Upload Another
              </button>
              <a
                href="/queue"
                className="px-6 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
              >
                Go to Queue
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
