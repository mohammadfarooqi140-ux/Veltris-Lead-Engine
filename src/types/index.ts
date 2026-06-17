export type LeadScore = 1 | 2 | 3 | 4 | 5;

export type LeadStatus =
  | "New"
  | "Research Complete"
  | "Approved"
  | "Contacted"
  | "Replied"
  | "Interested"
  | "Not Interested"
  | "Closed"
  | "Dead";

export interface VerificationData {
  hasWebsite: boolean;
  websiteQuality: "No website" | "Broken website" | "Linktree only" | "Outdated website" | "Weak website" | "Modern website" | "Unknown";
  hasInstagram: boolean;
  hasFacebook: boolean;
  hasLinkedIn: boolean;
  instagramFollowers?: number;
  reviewCount?: number;
  reviewRating?: number;
  isChainOrFranchise: boolean;
  isActive: boolean;
}

export interface OutreachDrafts {
  dm: string;
  email: string;
}

export interface Lead {
  id: string; // Internal UUID
  dateAdded: string;
  businessName: string;
  country: string;
  city: string;
  niche: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  linkedInUrl?: string;
  email?: string;
  phone?: string;
  contactName?: string;
  
  // Verification & Scoring
  verification: VerificationData;
  ruleBasedScore?: LeadScore;
  opportunityNotes?: string;
  outreachDrafts?: OutreachDrafts;
  screenshotUrl?: string;
  
  outreachStatus?: {
    dmStatus: "Not Ready" | "Ready" | "Sent" | "Replied" | "Dead";
    emailStatus: "Not Ready" | "Ready" | "Sent" | "Replied" | "Dead";
    channelUsed: "None" | "DM" | "Email" | "Both";
    lastContactedDate?: string;
    followUpDue?: string;
    followUpDueDate?: string;
    leadStatus?: "Active" | "Replied" | "Dead";
    notes?: string;
    instagramConfidence?: "High" | "Medium" | "Low";
  };
  
  status: LeadStatus;
}
