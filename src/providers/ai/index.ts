import { Lead } from "@/types";

export interface AIProvider {
  name: string;
  
  /**
   * Generates opportunity notes and outreach drafts for a given lead.
   */
  analyzeLead(lead: Lead): Promise<{
    opportunityNotes: string;
    drafts: {
      dm: string;
      email: string;
    };
  }>;
}
