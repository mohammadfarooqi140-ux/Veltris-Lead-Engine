import { DiscoveryProvider } from "./index";
import { Lead, AccountType } from "@/types";
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

      const businessName = getVal("business_name");
      if (!businessName) {
        rowErrors.push("Missing Business Name");
      }

      const rawHandle = getVal("instagram_handle");
      const rawProfileUrl = getVal("instagram_profile_url");
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

      const rawFollowers = getVal("follower_count");
      const parsedFollowers = rawFollowers ? parseInt(rawFollowers.replace(/[^\d]/g, ""), 10) : null;
      const rawAccountType = getVal("account_type").toLowerCase();
      let accountType: AccountType = "Business";
      if (rawAccountType.includes("creator")) accountType = "Creator";
      else if (rawAccountType.includes("unknown")) accountType = "Unknown";

      const lead: Lead = {
        id: uuidv4(),
        business_name: businessName,
        full_name_or_owner: getVal("full_name_or_owner") || null,
        niche: getVal("niche") || "Aesthetic Clinics",
        city: getVal("city") || "London",
        country: getVal("country") || "United Kingdom",
        instagram_handle: finalHandle,
        instagram_profile_url: finalProfileUrl,
        source_url: getVal("source_url") || null,
        created_at: now,
        updated_at: now,

        account_type: accountType,
        follower_count: isNaN(parsedFollowers as number) ? null : parsedFollowers,
        last_post_date: getVal("last_post_date") || null,
        last_post_topic: getVal("last_post_topic") || null,
        profile_active: true,
        uk_verified: (getVal("country") || "United Kingdom").toLowerCase().includes("united kingdom") || (getVal("country") || "UK").toLowerCase() === "uk",
        booking_link: getVal("booking_link") || null,
        bio_text: getVal("bio_text") || null,
        profile_verification_notes: null,

        website_url: getVal("website_url") || null,
        customer_journey_wound: getVal("customer_journey_wound") || "No instant online consultation booking; client relies solely on manual DMs without automation",
        wound_type: "Booking Friction",
        evidence_urls: [],
        evidence_notes: null,
        fit_status: "Viable",
        confidence: "Medium",
        prior_contact_status: "None",
        duplicate_check_status: "Clear",
        rejection_reason: null,
        research_notes: getVal("notes") || null,

        warming_approved_at: null,
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

        dm_draft: null,
        dm_approved: false,
        dm_approved_at: null,
        dm_sent: false,
        dm_sent_at: null,
        dm_text_used: null,
        sender_ig_account: null,
        reply_status: null,
        reply_received_at: null,
        reply_notes: null,
        follow_up_1_date: null,
        follow_up_2_date: null,
        follow_up_date: null,
        follow_up_count: 0,
        follow_up_notes: null,
        final_outcome: null,

        status: "Discovered"
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
