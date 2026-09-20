export type LeadStatus =
  | "Discovered"
  | "Verified"
  | "Approved for Warming"
  | "Warming Complete"
  | "Waiting 24 Hours"
  | "DM Ready"
  | "DM Approved"
  | "DM Sent"
  | "Replied"
  | "Follow-up Due"
  | "Closed / Dead";

export type FitStatus = "Priority" | "Viable" | "Verify" | "Reject";
export type ConfidenceLevel = "High" | "Medium" | "Low";
export type AccountType = "Business" | "Creator" | "Unknown";
export type TriStateBoolean = true | false | "unknown";

export type PriorContactStatus =
  | "None"
  | "Previously Contacted"
  | "Previously Warmed"
  | "Existing Conversation";

export type DuplicateCheckStatus =
  | "Clear"
  | "Potential Duplicate"
  | "Confirmed Duplicate";

export type ReplyStatus =
  | "Awaiting reply"
  | "Positive reply"
  | "Question / needs response"
  | "Maybe later"
  | "Not interested"
  | "No response"
  | "Closed";

export interface Lead {
  // Identity
  id: string;
  business_name: string;
  full_name_or_owner: string | null;
  niche: string;
  city: string;
  country: string;
  instagram_handle: string;
  instagram_profile_url: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;

  // Instagram qualification
  account_type: AccountType;
  follower_count: number | null;
  last_post_date: string | null;
  last_post_topic: string | null;
  profile_active: boolean | null;
  uk_verified: boolean | null;
  booking_link: string | null;
  bio_text: string | null;
  profile_verification_notes: string | null;

  // Business and sales qualification
  website_url: string | null;
  customer_journey_wound: string | null;
  wound_type: string | null;
  evidence_urls: string[];
  evidence_notes: string | null;
  fit_status: FitStatus | null;
  confidence: ConfidenceLevel | null;
  prior_contact_status: PriorContactStatus | null;
  duplicate_check_status: DuplicateCheckStatus | null;
  rejection_reason: string | null;
  research_notes: string | null;

  // Warming sequence
  warming_approved_at: string | null;
  warming_started_at: string | null;
  warming_completed_at: string | null;
  follow_completed: boolean;
  likes_completed: number;
  liked_post_urls: string[];
  comment_completed: boolean;
  comment_text: string | null;
  comment_post_url: string | null;
  warming_notes: string | null;
  ready_at: string | null; // warming_completed_at + 24 hours

  // DM outreach
  dm_draft: string | null;
  dm_approved: boolean;
  dm_approved_at: string | null;
  dm_sent: boolean;
  dm_sent_at: string | null;
  dm_text_used: string | null;
  sender_ig_account: string | null;
  reply_status: ReplyStatus | null;
  reply_received_at: string | null;
  reply_notes: string | null;
  follow_up_1_date: string | null;
  follow_up_2_date: string | null;
  follow_up_date: string | null;
  follow_up_count: number;
  follow_up_notes: string | null;
  final_outcome: string | null;

  // Primary Status
  status: LeadStatus;
}

export interface DashboardMetrics {
  total: number;
  verified: number;
  awaitingVerification: number;
  approvedForWarming: number;
  warmingComplete: number;
  waiting24Hours: number;
  dmReady: number;
  dmApproved: number;
  dmsSent: number;
  replies: number;
  followUpsDue: number;
  closedDead: number;
  replyRate: number;
  conversionRate: number;
}
