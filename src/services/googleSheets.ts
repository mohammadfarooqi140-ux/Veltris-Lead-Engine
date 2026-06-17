import { JWT } from "google-auth-library";
import { Lead } from "@/types";
import { GoogleSpreadsheet } from "google-spreadsheet";

/**
 * Service to interact with Google Sheets.
 * Requires GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in environment variables.
 * Also requires GOOGLE_SHEET_ID.
 */
export async function syncLeadToCRM(lead: Lead): Promise<boolean> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Replace escaped newlines if present
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!sheetId || !clientEmail || !privateKey) {
    console.warn("Google Sheets credentials missing. Simulating CRM sync for lead:", lead.businessName);
    return true; // Simulate success if not configured
  }

  try {
    const jwt = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, jwt);

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Assume first sheet
    
    // Ensure header row exists (simplified)
    // In production, you'd check headerRow.
    
    await sheet.addRow({
      "Date Added": lead.dateAdded,
      "Business Name": lead.businessName,
      "Country": lead.country,
      "City": lead.city,
      "Niche": lead.niche,
      "Google Maps URL": lead.googleMapsUrl || "",
      "Website URL": lead.websiteUrl || "",
      "Website Status": lead.verification.websiteQuality,
      "Instagram Handle": lead.instagramHandle || "",
      "Instagram Followers": lead.verification.instagramFollowers || "",
      "Facebook URL": lead.facebookUrl || "",
      "LinkedIn URL": lead.linkedInUrl || "",
      "Email": lead.email || "",
      "Phone": lead.phone || "",
      "Contact Name": lead.contactName || "",
      "Review Count": lead.verification.reviewCount || "",
      "Review Rating": lead.verification.reviewRating || "",
      "Lead Score": lead.ruleBasedScore || "",
      "Opportunity Notes": lead.opportunityNotes || "",
      "DM Draft": lead.outreachDrafts?.dm || "",
      "Email Draft": lead.outreachDrafts?.email || "",
      "Status": lead.status,
    });
    
    return true;
  } catch (error) {
    console.error("Failed to sync lead to Google Sheets CRM:", error);
    return false;
  }
}
