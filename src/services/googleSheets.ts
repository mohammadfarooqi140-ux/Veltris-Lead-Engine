import { Lead } from "@/types";

/**
 * DEPRECATED: Google Sheets CRM has been removed.
 * Veltris Lead Engine is the sole master database.
 */
export async function syncLeadToCRM(lead: Lead): Promise<boolean> {
  console.info("Google Sheets CRM integration is disabled. Master database is Veltris local storage.", lead.business_name);
  return true;
}
