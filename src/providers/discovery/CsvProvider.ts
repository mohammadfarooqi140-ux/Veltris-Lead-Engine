import { DiscoveryProvider } from "./index";
import { Lead, AccountType, ReplyStatus, LeadStatus } from "@/types";
import { buildProfileUrl, normalizeHandle } from "@/services/leadStorage";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";

export const CRM_FIELDS = [
  { id: "business_name", label: "Business Name", required: true, aliases: ["business name", "businessname", "company", "clinic", "title", "name"] },
  { id: "full_name_or_owner", label: "Full Name / Owner", required: false, aliases: ["full name", "owner", "contact name", "contact", "founder", "practitioner"] },
  { id: "niche", label: "Niche", required: true, aliases: ["niche", "category", "categoryname", "industry", "type"] },
  { id: "city", label: "City", required: true, aliases: ["city", "town", "location"] },
  { id: "country", label: "Country", required: false, aliases: ["country", "nation"] },
  { id: "instagram_handle", label: "Instagram Handle", required: true, aliases: ["instagram handle", "instagram", "ig handle", "ig", "handle"] },
  { id: "instagram_profile_url", label: "Instagram Profile URL", required: false, aliases: ["instagram profile url", "instagram url", "ig url", "profile url"] },
  { id: "website_url", label: "Website URL", required: false, aliases: ["website url", "website", "url", "web"] },
  { id: "booking_link", label: "Booking URL", required: false, aliases: ["booking url", "booking link", "booking", "fresha", "treatwell", "linktree"] },
  { id: "follower_count", label: "Follower Count", required: false, aliases: ["follower count", "followers", "ig followers"] },
  { id: "account_type", label: "Account Type", required: false, aliases: ["account type", "type"] },
  { id: "last_post_date", label: "Last Post Date", required: false, aliases: ["last post date", "last post", "recent post"] },
  { id: "last_post_topic", label: "Last Post Topic", required: false, aliases: ["last post topic", "post topic", "content topic"] },
  { id: "bio_text", label: "Bio Text", required: false, aliases: ["bio text", "bio", "instagram bio", "description"] },
  { id: "customer_journey_wound", label: "Customer Journey Wound", required: false, aliases: ["customer journey wound", "wound", "problem", "friction", "sales wound"] },
  { id: "source_url", label: "Source URL", required: false, aliases: ["source url", "source", "lead source"] },
  { id: "notes", label: "Notes", required: false, aliases: ["notes", "research notes", "comments"] },
  { id: "status", label: "Status", required: false, aliases: ["status", "lead status", "pipeline status", "stage"] },
  { id: "warming_status", label: "Warming Status", required: false, aliases: ["warming status", "warming", "warming state", "warmingstatus"] },
  { id: "warming_completed", label: "Warming Completed", required: false, aliases: ["warming completed", "warmingcompleted", "warmed"] },
  { id: "dm_approved", label: "DM Approved", required: false, aliases: ["dm approved", "dmapproved", "approved dm", "dm copy approved"] },
  { id: "dm_sent", label: "DM Sent", required: false, aliases: ["dm sent", "dmsent", "sent dm", "dm outreach sent"] },
  { id: "reply_status", label: "Reply Status", required: false, aliases: ["reply status", "replystatus", "reply", "response status", "replied", "outcome"] },
];

export interface ImportResult {
  validLeads: Lead[];
  errors: { row: number; messages: string[] }[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

export class CsvProvider implements DiscoveryProvider {
  id = "csv";
  name = "CSV Import";
  description = "Import leads from external scrapers or CSV files with Instagram qualification.";

  async discover(file: File): Promise<Lead[]> {
    const { headers, rows } = await this.parseFile(file);
    const mapping = this.guessMapping(headers);
    const result = this.mapToLeads(rows, mapping);
    return result.validLeads;
  }

  async parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data
          });
        },
        error: (error) => reject(error),
      });
    });
  }

  guessMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const lowerHeaders = headers.map(h => ({ original: h, lower: h.toLowerCase() }));

    for (const field of CRM_FIELDS) {
      const match = lowerHeaders.find(h =>
        field.aliases.includes(h.lower) ||
        h.lower === field.id.toLowerCase() ||
        h.lower === field.label.toLowerCase()
      );
      if (match) {
        mapping[field.id] = match.original;
      } else {
        mapping[field.id] = "";
      }
    }
    return mapping;
  }

  mapToLeads(rows: Record<string, string>[], mapping: Record<string, string>): ImportResult {
    const validLeads: Lead[] = [];
    const errors: { row: number; messages: string[] }[] = [];
    const now = new Date().toISOString();

    rows.forEach((row, index) => {
      const rowNum = index + 2; // header + 1-indexed
      const rowErrors: string[] = [];

      const getVal = (fieldId: string) => {
        const col = mapping[fieldId];
        return col && row[col] !== undefined ? row[col].trim() : "";
      };

      const findRowVal = (keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
            return String(row[k]).trim();
          }
        }
        return "";
      };

      const businessName = getVal("business_name") || findRowVal(["Business Name", "business_name", "Clinic", "clinic", "Name", "Company"]);
      if (!businessName) {
        rowErrors.push("Missing Business Name");
      }

      const rawHandle = getVal("instagram_handle") || findRowVal(["Instagram Handle", "instagram_handle", "Instagram", "Handle", "IG"]);
      const rawProfileUrl = getVal("instagram_profile_url") || findRowVal(["Instagram Profile URL", "instagram_profile_url", "Instagram URL", "Profile URL", "URL"]);
      const normHandle = normalizeHandle(rawHandle) || normalizeHandle(rawProfileUrl);

      if (!normHandle && !rawProfileUrl) {
        rowErrors.push("Missing Instagram Handle or Profile URL (mandatory for Veltris outreach)");
      }

      const finalHandle = normHandle ? `@${normHandle}` : "";
      const finalProfileUrl = rawProfileUrl || buildProfileUrl(normHandle);

      if (!finalHandle || !finalProfileUrl) {
        rowErrors.push("Invalid or unverifiable Instagram identity");
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, messages: rowErrors });
        return;
      }

      const rawFollowers = getVal("follower_count") || findRowVal(["Followers", "follower_count", "Follower Count"]);
      const parsedFollowers = rawFollowers ? parseInt(rawFollowers.replace(/[^\d]/g, ""), 10) : null;
      const rawAccountType = (getVal("account_type") || findRowVal(["Account Type", "account_type", "Type"])).toLowerCase();
      let accountType: AccountType = "Business";
      if (rawAccountType.includes("creator")) accountType = "Creator";
      else if (rawAccountType.includes("unknown")) accountType = "Unknown";

      // Status, Warming & DM columns
      const rawStatus = getVal("status") || findRowVal(["Status", "status", "Lead Status", "lead_status"]);
      const rawWarmingStatus = getVal("warming_status") || findRowVal(["Warming Status", "warming_status", "Warming status", "WarmingStatus"]);
      const rawWarmingCompleted = getVal("warming_completed") || findRowVal(["Warming Completed", "warming_completed", "WarmingCompleted"]);
      const rawDmApproved = getVal("dm_approved") || findRowVal(["DM Approved", "dm_approved", "Dm Approved", "dmApproved"]);
      const rawDmSent = getVal("dm_sent") || findRowVal(["DM Sent", "dm_sent", "Dm Sent", "dmSent"]);
      const rawReplyStatus = getVal("reply_status") || findRowVal(["Reply Status", "reply_status", "Reply status", "replyStatus"]);
      const rawSourceUrl = getVal("source_url") || findRowVal(["Source URL", "source_url", "Source", "source"]);
      const rawNotes = getVal("notes") || findRowVal(["Notes", "notes", "Research Notes", "research_notes"]);

      const isTruthy = (val?: string | null) => {
        if (!val) return false;
        const s = val.trim().toLowerCase();
        return s === "yes" || s === "true" || s === "1" || s === "y" || s === "complete" || s === "completed";
      };

      const normStatus = rawStatus.toLowerCase().trim();
      const normWarming = rawWarmingStatus.toLowerCase().trim();
      const normSource = rawSourceUrl.toLowerCase();
      const normNotes = rawNotes.toLowerCase();

      // Check if lead matches historical batch or is already DM'd
      const isHistoricalBatch =
        normSource.includes("attached veltris context pdfs") ||
        normNotes.includes("imported from attached pdfs") ||
        normStatus === "dm sent" ||
        normStatus === "dm_sent" ||
        isTruthy(rawDmSent) ||
        (normWarming === "warming complete" && isTruthy(rawDmSent));

      let mappedStatus: LeadStatus = "Discovered";
      let warmingCompleted = isTruthy(rawWarmingCompleted) || normWarming.includes("complete");
      let dmApproved = isTruthy(rawDmApproved);
      let dmSent = isTruthy(rawDmSent);
      let replyStatus = rawReplyStatus || null;

      if (isHistoricalBatch || normStatus === "dm sent" || normStatus === "dm_sent" || dmSent) {
        mappedStatus = "dm_sent";
        warmingCompleted = true;
        dmApproved = true;
        dmSent = true;
        if (!replyStatus || replyStatus.toLowerCase() === "unknown") {
          replyStatus = "unknown";
        }
      } else if (normStatus === "replied") {
        mappedStatus = "Replied";
        warmingCompleted = true;
        dmApproved = true;
        dmSent = true;
        replyStatus = replyStatus || "Positive reply";
      } else if (normStatus === "dm approved" || dmApproved) {
        mappedStatus = "DM Approved";
        warmingCompleted = true;
        dmApproved = true;
      } else if (normStatus === "dm ready") {
        mappedStatus = "DM Ready";
        warmingCompleted = true;
      } else if (normStatus === "waiting 24 hours") {
        mappedStatus = "Waiting 24 Hours";
        warmingCompleted = true;
      } else if (normStatus === "warming complete" || warmingCompleted) {
        mappedStatus = "Warming Complete";
        warmingCompleted = true;
      } else if (normStatus === "approved for warming" || normStatus === "approved") {
        mappedStatus = "Approved for Warming";
      } else if (normStatus === "verified") {
        mappedStatus = "Verified";
      } else if (normStatus === "closed / dead" || normStatus === "dead" || normStatus === "closed") {
        mappedStatus = "Closed / Dead";
      }

      const lead: Lead = {
        id: uuidv4(),
        business_name: businessName,
        full_name_or_owner: getVal("full_name_or_owner") || findRowVal(["Full Name / Owner", "full_name_or_owner", "Owner", "Contact"]) || null,
        niche: getVal("niche") || findRowVal(["Niche", "niche", "Category"]) || "Aesthetic Clinics",
        city: getVal("city") || findRowVal(["City", "city", "Town", "Location"]) || "London",
        country: getVal("country") || findRowVal(["Country", "country"]) || "United Kingdom",
        instagram_handle: finalHandle,
        instagram_profile_url: finalProfileUrl,
        source_url: rawSourceUrl || null,
        created_at: now,
        updated_at: now,

        account_type: accountType,
        follower_count: isNaN(parsedFollowers as number) ? null : parsedFollowers,
        last_post_date: getVal("last_post_date") || findRowVal(["Last Post Date", "last_post_date"]) || null,
        last_post_topic: getVal("last_post_topic") || findRowVal(["Last Post Topic", "last_post_topic"]) || null,
        profile_active: true,
        uk_verified: (getVal("country") || findRowVal(["Country", "country"]) || "United Kingdom").toLowerCase().includes("united kingdom") || (getVal("country") || "UK").toLowerCase() === "uk",
        booking_link: getVal("booking_link") || findRowVal(["Booking URL", "booking_link", "Booking Link"]) || null,
        bio_text: getVal("bio_text") || findRowVal(["Bio Text", "bio_text", "Bio"]) || null,
        profile_verification_notes: null,

        website_url: getVal("website_url") || findRowVal(["Website URL", "website_url", "Website"]) || null,
        customer_journey_wound: getVal("customer_journey_wound") || findRowVal(["Customer Journey Wound", "customer_journey_wound", "Wound"]) || "No instant online consultation booking; client relies solely on manual DMs without automation",
        wound_type: "Booking Friction",
        evidence_urls: [],
        evidence_notes: null,
        fit_status: "Viable",
        confidence: "Medium",
        prior_contact_status: (dmSent || mappedStatus === "dm_sent") ? "Previously Contacted" : "None",
        duplicate_check_status: "Clear",
        rejection_reason: null,
        research_notes: rawNotes || null,

        warming_approved_at: (warmingCompleted || mappedStatus === "Approved for Warming") ? now : null,
        warming_started_at: warmingCompleted ? now : null,
        warming_completed_at: warmingCompleted ? now : null,
        follow_completed: warmingCompleted,
        likes_completed: warmingCompleted ? 3 : 0,
        liked_post_urls: [],
        comment_completed: warmingCompleted,
        comment_text: null,
        comment_post_url: null,
        warming_notes: null,
        ready_at: warmingCompleted ? now : null,

        dm_draft: null,
        dm_approved: dmApproved,
        dm_approved_at: dmApproved ? now : null,
        dm_sent: dmSent,
        dm_sent_at: dmSent ? now : null,
        dm_text_used: null,
        sender_ig_account: null,
        reply_status: (replyStatus as ReplyStatus) || null,
        reply_received_at: mappedStatus === "Replied" ? now : null,
        reply_notes: null,
        follow_up_1_date: null,
        follow_up_2_date: null,
        follow_up_date: null,
        follow_up_count: 0,
        follow_up_notes: null,
        final_outcome: null,

        status: mappedStatus,

        // Explicit compatibility properties requested
        warmingStatus: warmingCompleted ? "complete" : undefined,
        warmingCompleted: warmingCompleted || undefined,
        dmApproved: dmApproved || undefined,
        dmSent: dmSent || undefined,
        replyStatus: replyStatus || undefined,
      };

      validLeads.push(lead);
    });

    return {
      validLeads,
      errors,
      summary: {
        total: rows.length,
        success: validLeads.length,
        failed: errors.length
      }
    };
  }
}
