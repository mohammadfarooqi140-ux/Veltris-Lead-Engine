import { Lead, FitStatus } from "@/types";

/**
 * Evaluates a lead against the aesthetic clinic ICP rules and returns a FitStatus.
 */
export function calculateLeadFit(lead: Lead): { fit: FitStatus; reasons: string[] } {
  const reasons: string[] = [];

  // Check Instagram
  if (!lead.instagram_handle) {
    return { fit: "Reject", reasons: ["Missing Instagram handle"] };
  }

  // Follower range check
  if (lead.follower_count !== null) {
    if (lead.follower_count < 1000) {
      reasons.push("Followers below ICP minimum (1,000)");
    } else if (lead.follower_count > 25000) {
      reasons.push("Followers exceed ICP maximum (25,000)");
    }
  }

  // Booking link check
  if (!lead.booking_link) {
    reasons.push("High friction: No automated booking link found on profile");
  }

  // Prior contact
  if (lead.prior_contact_status && lead.prior_contact_status !== "None") {
    reasons.push(`Prior contact history exists: ${lead.prior_contact_status}`);
    return { fit: "Verify", reasons };
  }

  if (reasons.length === 0) {
    return { fit: "Priority", reasons: ["Meets all primary ICP qualification rules"] };
  }

  return { fit: "Viable", reasons };
}
