import { Lead, LeadStatus, DashboardMetrics, PriorContactStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

export const STORAGE_KEY_V2 = "vle_queue_v2";
export const STORAGE_KEY_SETTINGS = "vle_settings";
export const LEGACY_KEY_QUEUE = "vle_queue";
export const LEGACY_KEY_APPROVED = "vle_approved";
export const LEGACY_KEY_CRM = "vle_crm";

export interface AppSettings {
  waitingPeriodHours: number; // default 24
  defaultCountry: string;
  defaultNiche: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  waitingPeriodHours: 24,
  defaultCountry: "United Kingdom",
  defaultNiche: "Aesthetic Clinics"
};

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  if (typeof window === "undefined") return;
  const current = getSettings();
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ ...current, ...settings }));
}

export function normalizeHandle(handle?: string | null): string {
  if (!handle) return "";
  let clean = handle.trim().toLowerCase();
  clean = clean.replace(/^@+/, "");
  clean = clean.replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
  clean = clean.split(/[/?#]/)[0];
  return clean.trim();
}

export function buildProfileUrl(handle?: string | null): string {
  const norm = normalizeHandle(handle);
  return norm ? `https://instagram.com/${norm}` : "";
}

export function normalizeBusinessName(name?: string | null): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeUrl(url?: string | null): string {
  if (!url) return "";
  let clean = url.toLowerCase().trim();
  clean = clean.replace(/^https?:\/\//, "");
  clean = clean.replace(/^www\./, "");
  clean = clean.replace(/\/+$/, "");
  return clean;
}

/**
 * Checks whether a candidate lead conflicts with any existing lead.
 */
export function checkDuplicate(
  candidate: { instagram_handle?: string | null; instagram_profile_url?: string | null; business_name?: string | null },
  leads: Lead[],
  excludeId?: string
): { isDuplicate: boolean; matchedLead: Lead | null; reason: string | null } {
  const cHandle = normalizeHandle(candidate.instagram_handle);
  const cUrl = normalizeUrl(candidate.instagram_profile_url);
  const cName = normalizeBusinessName(candidate.business_name);

  for (const existing of leads) {
    if (excludeId && existing.id === excludeId) continue;

    const eHandle = normalizeHandle(existing.instagram_handle);
    const eUrl = normalizeUrl(existing.instagram_profile_url);
    const eName = normalizeBusinessName(existing.business_name);

    if (cHandle && eHandle && cHandle === eHandle) {
      return { isDuplicate: true, matchedLead: existing, reason: `Instagram handle @${cHandle} already exists` };
    }

    if (cUrl && eUrl && cUrl === eUrl) {
      return { isDuplicate: true, matchedLead: existing, reason: `Instagram URL matches ${existing.business_name}` };
    }

    if (cName && eName && cName === eName) {
      return { isDuplicate: true, matchedLead: existing, reason: `Business name '${existing.business_name}' already exists` };
    }
  }

  return { isDuplicate: false, matchedLead: null, reason: null };
}

/**
 * Migration helper to map legacy objects to Schema V2
 */
interface LegacyLead {
  id?: string;
  businessName?: string;
  business_name?: string;
  contactName?: string;
  full_name_or_owner?: string;
  niche?: string;
  city?: string;
  country?: string;
  instagramHandle?: string;
  instagram_handle?: string;
  instagram_profile_url?: string;
  websiteUrl?: string;
  website_url?: string;
  status?: string;
  dateAdded?: string;
  created_at?: string;
  outreachStatus?: {
    dmStatus?: string;
    emailStatus?: string;
    lastContactedDate?: string;
    followUpDueDate?: string;
    leadStatus?: string;
  };
  verification?: {
    instagramFollowers?: number;
    hasWebsite?: boolean;
    websiteQuality?: string;
  };
  opportunityNotes?: string;
  outreachDrafts?: {
    dm?: string;
  };
  ruleBasedScore?: number;
}

export function migrateLegacyLead(legacy: LegacyLead): Lead {
  const now = new Date().toISOString();
  const handle = legacy.instagram_handle || legacy.instagramHandle || "";
  const normHandle = normalizeHandle(handle);
  const profileUrl = legacy.instagram_profile_url || buildProfileUrl(normHandle);

  let mappedStatus: LeadStatus = "Discovered";
  const oldStatus = legacy.status || "";
  const dmStatus = legacy.outreachStatus?.dmStatus;

  if (oldStatus === "Replied" || legacy.outreachStatus?.leadStatus === "Replied") {
    mappedStatus = "Replied";
  } else if (oldStatus === "Dead" || oldStatus === "Not Interested" || legacy.outreachStatus?.leadStatus === "Dead") {
    mappedStatus = "Closed / Dead";
  } else if (dmStatus === "Sent" || oldStatus === "Contacted") {
    mappedStatus = "DM Sent";
  } else if (dmStatus === "Ready" || oldStatus === "Approved") {
    mappedStatus = "Approved for Warming";
  } else {
    mappedStatus = "Discovered";
  }

  const followers = legacy.verification?.instagramFollowers ?? null;

  return {
    id: legacy.id || uuidv4(),
    business_name: legacy.business_name || legacy.businessName || "Unknown Clinic",
    full_name_or_owner: legacy.full_name_or_owner || legacy.contactName || null,
    niche: legacy.niche || "Aesthetic Clinics",
    city: legacy.city || "London",
    country: legacy.country || "United Kingdom",
    instagram_handle: normHandle ? `@${normHandle}` : "",
    instagram_profile_url: profileUrl,
    source_url: null,
    created_at: legacy.created_at || legacy.dateAdded || now,
    updated_at: now,

    account_type: "Business",
    follower_count: typeof followers === "number" ? followers : null,
    last_post_date: null,
    last_post_topic: null,
    profile_active: true,
    uk_verified: true,
    booking_link: null,
    bio_text: null,
    profile_verification_notes: null,

    website_url: legacy.website_url || legacy.websiteUrl || null,
    customer_journey_wound: legacy.opportunityNotes || "No online booking friction detected",
    wound_type: "Booking Friction",
    evidence_urls: [],
    evidence_notes: null,
    fit_status: "Viable",
    confidence: "Medium",
    prior_contact_status: "None",
    duplicate_check_status: "Clear",
    rejection_reason: null,
    research_notes: null,

    warming_approved_at: mappedStatus === "Approved for Warming" ? now : null,
    warming_started_at: null,
    warming_completed_at: null,
    follow_completed: false,
    likes_completed: 0,
    liked_post_urls: [],
    comment_completed: false,
    comment_text: null,
    comment_post_url: null,
    warming_notes: null,
    ready_at: null,

    dm_draft: legacy.outreachDrafts?.dm || null,
    dm_approved: false,
    dm_approved_at: null,
    dm_sent: mappedStatus === "DM Sent",
    dm_sent_at: mappedStatus === "DM Sent" ? legacy.outreachStatus?.lastContactedDate || now : null,
    dm_text_used: legacy.outreachDrafts?.dm || null,
    sender_ig_account: null,
    reply_status: mappedStatus === "Replied" ? "Positive reply" : null,
    reply_received_at: mappedStatus === "Replied" ? now : null,
    reply_notes: null,
    follow_up_1_date: legacy.outreachStatus?.followUpDueDate || null,
    follow_up_2_date: null,
    follow_up_date: legacy.outreachStatus?.followUpDueDate || null,
    follow_up_count: 0,
    follow_up_notes: null,
    final_outcome: null,

    status: mappedStatus
  };
}

/**
 * Checks for leads in "Waiting 24 Hours" and advances them to "DM Ready" if the 24h wait period has passed.
 */
export function checkAndAdvanceWaitingLeads(leads: Lead[]): { leads: Lead[]; changed: boolean } {
  const now = new Date();
  let changed = false;

  const updatedLeads = leads.map(lead => {
    if (lead.status === "Waiting 24 Hours" && lead.ready_at) {
      const readyDate = new Date(lead.ready_at);
      if (now >= readyDate) {
        changed = true;
        return {
          ...lead,
          status: "DM Ready" as LeadStatus,
          updated_at: now.toISOString()
        };
      }
    }
    return lead;
  });

  return { leads: updatedLeads, changed };
}

/**
 * Detects whether a lead record belongs to the imported historical batch
 */
export function isHistoricalBatchLead(record: unknown): boolean {
  if (!record || typeof record !== "object") return false;
  const r = record as Record<string, unknown>;

  const source = String(r.source_url || r.sourceUrl || r.source || "").toLowerCase();
  const notes = String(r.research_notes || r.researchNotes || r.notes || "").toLowerCase();
  const dmSentVal = r.dmSent !== undefined ? r.dmSent : r.dm_sent;
  const warmingStatusVal = String(r.warmingStatus || r.warming_status || "").toLowerCase();
  const statusVal = String(r.status || "").toLowerCase();

  const matchesSource = source.includes("attached veltris context pdfs");
  const matchesNotes = notes.includes("imported from attached pdfs");
  const matchesDmSent = dmSentVal === true || String(dmSentVal).toLowerCase() === "yes" || String(dmSentVal).toLowerCase() === "true" || dmSentVal === 1;
  const matchesWarmingStatus = warmingStatusVal === "warming complete" || warmingStatusVal === "complete";
  const matchesStatus = statusVal === "dm sent" || statusVal === "dm_sent";

  return matchesSource || matchesNotes || matchesDmSent || matchesWarmingStatus || matchesStatus;
}

/**
 * Idempotent migration/repair function for imported historical batch records.
 * Updates matching records to:
 * {
 *   status: "dm_sent",
 *   warmingStatus: "complete",
 *   warmingCompleted: true,
 *   dmApproved: true,
 *   dmSent: true,
 *   replyStatus: "unknown"
 * }
 */
export function repairHistoricalBatch(leads: Lead[]): { leads: Lead[]; repairedCount: number } {
  let repairedCount = 0;
  const now = new Date().toISOString();

  const repairedLeads = leads.map(lead => {
    const record = lead as unknown as Record<string, unknown>;
    if (!isHistoricalBatchLead(record)) {
      return lead;
    }

    // Check if already in the exact target state
    const alreadyRepaired =
      lead.status === "dm_sent" &&
      record.warmingStatus === "complete" &&
      record.warmingCompleted === true &&
      record.dmApproved === true &&
      record.dmSent === true &&
      record.replyStatus === "unknown";

    if (alreadyRepaired) {
      return lead;
    }

    repairedCount++;
    return {
      ...lead,
      status: "dm_sent" as LeadStatus,
      warmingStatus: "complete",
      warmingCompleted: true,
      dmApproved: true,
      dmSent: true,
      replyStatus: "unknown",
      // Align internal schema properties
      dm_approved: true,
      dm_approved_at: lead.dm_approved_at || lead.updated_at || now,
      dm_sent: true,
      dm_sent_at: lead.dm_sent_at || lead.updated_at || now,
      warming_completed_at: lead.warming_completed_at || lead.updated_at || now,
      follow_completed: true,
      comment_completed: true,
      likes_completed: lead.likes_completed || 3,
      reply_status: "unknown" as const,
      ready_at: lead.ready_at || lead.warming_completed_at || now,
      prior_contact_status: "Previously Contacted" as PriorContactStatus,
      updated_at: now
    };
  });

  return { leads: repairedLeads, repairedCount };
}

/**
 * Public idempotent repair execution scanning and repairing localStorage.
 */
export function repairHistoricalBatchLeads(): { repairedCount: number; total: number } {
  if (typeof window === "undefined") return { repairedCount: 0, total: 0 };
  const current = getLeads();
  const { leads: repaired, repairedCount } = repairHistoricalBatch(current);
  if (repairedCount > 0) {
    saveLeads(repaired);
  }
  return { repairedCount, total: repaired.length };
}

/**
 * Primary read method. Migrates legacy data on first run without data loss.
 */
export function getLeads(): Lead[] {
  if (typeof window === "undefined") return [];

  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    let leads: Lead[] = [];

    if (rawV2) {
      leads = JSON.parse(rawV2);
    } else {
      // Migrate from legacy keys: vle_queue, vle_approved, vle_crm
      const rawQueue = localStorage.getItem(LEGACY_KEY_QUEUE);
      const rawApproved = localStorage.getItem(LEGACY_KEY_APPROVED);
      const rawCrm = localStorage.getItem(LEGACY_KEY_CRM);

      const legacyCombined: LegacyLead[] = [];
      if (rawQueue) {
        try { legacyCombined.push(...JSON.parse(rawQueue)); } catch { /* ignore */ }
      }
      if (rawApproved) {
        try { legacyCombined.push(...JSON.parse(rawApproved)); } catch { /* ignore */ }
      }
      if (rawCrm) {
        try { legacyCombined.push(...JSON.parse(rawCrm)); } catch { /* ignore */ }
      }

      // Deduplicate legacy entries by ID or normalized handle
      const seen = new Set<string>();
      for (const item of legacyCombined) {
        const id = item.id || "";
        const handle = normalizeHandle(item.instagram_handle || item.instagramHandle);
        const dedupeKey = handle || id || normalizeBusinessName(item.business_name || item.businessName);
        if (dedupeKey && !seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          leads.push(migrateLegacyLead(item));
        }
      }

      // Save to V2 immediately to establish schema
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(leads));
    }

    // Run idempotent historical batch repair
    const { leads: repairedLeads, repairedCount } = repairHistoricalBatch(leads);
    if (repairedCount > 0) {
      leads = repairedLeads;
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(leads));
    }

    // Check timer advancement
    const { leads: checkedLeads, changed } = checkAndAdvanceWaitingLeads(leads);
    if (changed) {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(checkedLeads));
      return checkedLeads;
    }

    return leads;
  } catch (err) {
    console.error("Failed to load leads from storage:", err);
    return [];
  }
}

export function saveLeads(leads: Lead[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(leads));
  } catch (err) {
    console.error("Failed to save leads to storage:", err);
  }
}

export function addLead(lead: Lead): { success: boolean; duplicate?: Lead; error?: string } {
  const current = getLeads();
  const dupCheck = checkDuplicate(lead, current);
  if (dupCheck.isDuplicate) {
    return { success: false, duplicate: dupCheck.matchedLead || undefined, error: dupCheck.reason || "Duplicate lead detected" };
  }

  const updated = [lead, ...current];
  saveLeads(updated);
  return { success: true };
}

export function updateLead(leadId: string, patch: Partial<Lead>): Lead | null {
  const current = getLeads();
  let updatedLead: Lead | null = null;

  const next = current.map(l => {
    if (l.id === leadId) {
      updatedLead = {
        ...l,
        ...patch,
        updated_at: new Date().toISOString()
      };
      return updatedLead;
    }
    return l;
  });

  if (updatedLead) {
    saveLeads(next);
  }
  return updatedLead;
}

export function deleteLead(leadId: string): void {
  const current = getLeads();
  const next = current.filter(l => l.id !== leadId);
  saveLeads(next);
}

export function deleteMultipleLeads(leadIds: Set<string>): void {
  const current = getLeads();
  const next = current.filter(l => !leadIds.has(l.id));
  saveLeads(next);
}

/**
 * Fast forward waiting period for a lead (Admin / Dev override)
 */
export function fastForwardWaitingPeriod(leadId: string): Lead | null {
  const now = new Date();
  return updateLead(leadId, {
    ready_at: now.toISOString(),
    status: "DM Ready"
  });
}

/**
 * Repair and merge legacy data deduplicating strictly by Instagram handle / URL / Business name
 */
export function repairAndMergeLegacyData(): { mergedCount: number; dedupeCount: number; total: number } {
  const current = getLeads();
  const rawQueue = localStorage.getItem(LEGACY_KEY_QUEUE);
  const rawApproved = localStorage.getItem(LEGACY_KEY_APPROVED);
  const rawCrm = localStorage.getItem(LEGACY_KEY_CRM);

  const legacyList: LegacyLead[] = [];
  if (rawQueue) {
    try { legacyList.push(...JSON.parse(rawQueue)); } catch { /* ignore */ }
  }
  if (rawApproved) {
    try { legacyList.push(...JSON.parse(rawApproved)); } catch { /* ignore */ }
  }
  if (rawCrm) {
    try { legacyList.push(...JSON.parse(rawCrm)); } catch { /* ignore */ }
  }

  let mergedCount = 0;
  const mergedLeads = [...current];

  for (const item of legacyList) {
    const candidate = migrateLegacyLead(item);
    const dup = checkDuplicate(candidate, mergedLeads);
    if (!dup.isDuplicate) {
      mergedLeads.push(candidate);
      mergedCount++;
    }
  }

  // Deduplicate merged array
  const deduped: Lead[] = [];
  let dedupeCount = 0;
  for (const l of mergedLeads) {
    const dup = checkDuplicate(l, deduped);
    if (!dup.isDuplicate) {
      deduped.push(l);
    } else {
      dedupeCount++;
    }
  }

  saveLeads(deduped);
  return { mergedCount, dedupeCount, total: deduped.length };
}

/**
 * Compute real-time dashboard metrics
 */
export function calculateMetrics(leads: Lead[]): DashboardMetrics {
  const now = new Date();

  let verified = 0;
  let awaitingVerification = 0;
  let approvedForWarming = 0;
  let warmingComplete = 0;
  let waiting24Hours = 0;
  let dmReady = 0;
  let dmApproved = 0;
  let dmsSent = 0;
  let replies = 0;
  let followUpsDue = 0;
  let closedDead = 0;

  for (const l of leads) {
    switch (l.status) {
      case "Discovered":
        awaitingVerification++;
        break;
      case "Verified":
        verified++;
        break;
      case "Approved for Warming":
        approvedForWarming++;
        break;
      case "Warming Complete":
        warmingComplete++;
        break;
      case "Waiting 24 Hours":
        waiting24Hours++;
        break;
      case "DM Ready":
        dmReady++;
        break;
      case "DM Approved":
        dmApproved++;
        break;
      case "DM Sent":
      case "dm_sent":
        dmsSent++;
        // Check if follow-up is due
        if (l.follow_up_date && new Date(l.follow_up_date) <= now) {
          followUpsDue++;
        }
        break;
      case "Replied":
        replies++;
        break;
      case "Follow-up Due":
        followUpsDue++;
        break;
      case "Closed / Dead":
        closedDead++;
        break;
    }
  }

  const total = leads.length;
  // Reply rate = replies / (dmsSent + replies + followUpsDue)
  const totalContacted = dmsSent + replies + followUpsDue;
  const replyRate = totalContacted > 0 ? Math.round((replies / totalContacted) * 100) : 0;
  const conversionRate = total > 0 ? Math.round((replies / total) * 100) : 0;

  return {
    total,
    verified,
    awaitingVerification,
    approvedForWarming,
    warmingComplete,
    waiting24Hours,
    dmReady,
    dmApproved,
    dmsSent,
    replies,
    followUpsDue,
    closedDead,
    replyRate,
    conversionRate
  };
}

/**
 * Export JSON backup
 */
export function exportLeadsJson(): void {
  const leads = getLeads();
  const blob = new Blob([JSON.stringify(leads, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `veltris_leads_v2_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import JSON backup
 */
export function importLeadsJson(file: File): Promise<{ total: number; added: number; skippedDuplicates: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed)) {
          throw new Error("Invalid JSON: Root element must be an array of leads.");
        }

        const current = getLeads();
        let added = 0;
        let skippedDuplicates = 0;
        const next = [...current];

        for (const item of parsed) {
          const lead = item.created_at ? (item as Lead) : migrateLegacyLead(item);
          const dup = checkDuplicate(lead, next);
          if (dup.isDuplicate) {
            skippedDuplicates++;
          } else {
            next.push(lead);
            added++;
          }
        }

        saveLeads(next);
        resolve({ total: parsed.length, added, skippedDuplicates });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Reset database
 */
export function resetDatabase(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_V2);
  localStorage.removeItem(LEGACY_KEY_QUEUE);
  localStorage.removeItem(LEGACY_KEY_APPROVED);
  localStorage.removeItem(LEGACY_KEY_CRM);
}
