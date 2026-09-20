import { DiscoveryProvider } from "./index";
import { Lead, AccountType } from "@/types";
import { buildProfileUrl, normalizeHandle } from "@/services/leadStorage";
import { v4 as uuidv4 } from "uuid";

export interface ManualEntryParams {
  business_name: string;
  full_name_or_owner?: string;
  niche: string;
  city: string;
  country: string;
  instagram_handle: string;
  instagram_profile_url?: string;
  website_url?: string;
  booking_link?: string;
  follower_count?: number;
  account_type?: AccountType;
  last_post_date?: string;
  last_post_topic?: string;
  bio_text?: string;
  customer_journey_wound?: string;
  source_url?: string;
  research_notes?: string;
}

export class ManualProvider implements DiscoveryProvider {
  id = "manual";
  name = "Manual Entry";
  description = "Manually add a single lead with verified Instagram account details.";

  async discover(params: unknown): Promise<Lead[]> {
    const p = params as ManualEntryParams;
    const now = new Date().toISOString();

    const normHandle = normalizeHandle(p.instagram_handle) || normalizeHandle(p.instagram_profile_url);
    if (!normHandle) {
      throw new Error("A valid Instagram handle or profile URL is required. All Veltris outreach occurs on Instagram.");
    }

    const finalHandle = `@${normHandle}`;
    const finalProfileUrl = p.instagram_profile_url && p.instagram_profile_url.startsWith("http")
      ? p.instagram_profile_url
      : buildProfileUrl(normHandle);

    const lead: Lead = {
      id: uuidv4(),
      business_name: p.business_name || "Unknown Clinic",
      full_name_or_owner: p.full_name_or_owner || null,
      niche: p.niche || "Aesthetic Clinics",
      city: p.city || "London",
      country: p.country || "United Kingdom",
      instagram_handle: finalHandle,
      instagram_profile_url: finalProfileUrl,
      source_url: p.source_url || null,
      created_at: now,
      updated_at: now,

      account_type: p.account_type || "Business",
      follower_count: p.follower_count || null,
      last_post_date: p.last_post_date || null,
      last_post_topic: p.last_post_topic || null,
      profile_active: true,
      uk_verified: (p.country || "United Kingdom").toLowerCase().includes("united kingdom") || (p.country || "UK").toLowerCase() === "uk",
      booking_link: p.booking_link || null,
      bio_text: p.bio_text || null,
      profile_verification_notes: null,

      website_url: p.website_url || null,
      customer_journey_wound: p.customer_journey_wound || "Booking friction: Manual DM consultation booking with no automated calendar link",
      wound_type: "Booking Friction",
      evidence_urls: [],
      evidence_notes: null,
      fit_status: "Viable",
      confidence: "Medium",
      prior_contact_status: "None",
      duplicate_check_status: "Clear",
      rejection_reason: null,
      research_notes: p.research_notes || null,

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

    return [lead];
  }
}
