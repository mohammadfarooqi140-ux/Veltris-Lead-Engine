import { Lead, LeadScore } from "@/types";

/**
 * Calculates a rule-based score for a lead (1 to 5).
 * Higher score means a better opportunity for Veltris services.
 */
export function calculateRuleBasedScore(lead: Lead): LeadScore {
  let score = 2; // Baseline score
  
  const v = lead.verification;

  // Immediate rejections or strong negatives
  if (v.isChainOrFranchise) return 1;
  if (!v.isActive) return 1;
  
  if (v.websiteQuality === "Modern website") return 1; // Unlikely to need web services

  // Positive signals for needing a website
  if (!v.hasWebsite) score += 2;
  else if (["Broken website", "Linktree only", "Outdated website", "Weak website"].includes(v.websiteQuality)) {
    score += 1;
  }

  // Social presence (active business but bad/no website = higher score)
  if (v.hasInstagram || v.hasFacebook) {
    if (!v.hasWebsite) score += 1; 
  }

  // Good reviews indicate an established business that can afford a website
  if (v.reviewCount && v.reviewCount > 20 && v.reviewRating && v.reviewRating > 4.0) {
    score += 1;
  }

  // Cap score between 1 and 5
  if (score > 5) return 5;
  if (score < 1) return 1;

  return score as LeadScore;
}
