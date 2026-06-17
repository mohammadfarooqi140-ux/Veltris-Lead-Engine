import { DiscoveryProvider } from "./index";
import { Lead } from "@/types";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";

// Target CRM fields we need to map to
export const CRM_FIELDS = [
  { id: "businessName", label: "Business Name", aliases: ["title", "name", "businessname", "company", "business name"] },
  { id: "websiteUrl", label: "Website", aliases: ["website", "websiteurl", "url"] },
  { id: "googleMapsUrl", label: "Google Maps URL", aliases: ["placeurl", "mapsurl", "google maps", "google maps url"] },
  { id: "address", label: "Address", aliases: ["address", "street", "fulladdress"] },
  { id: "city", label: "City", aliases: ["city"] },
  { id: "country", label: "Country", aliases: ["country"] },
  { id: "phone", label: "Phone", aliases: ["phone", "phonenumber"] },
  { id: "reviewRating", label: "Rating", aliases: ["totalscore", "rating"] },
  { id: "reviewCount", label: "Review Count", aliases: ["reviewscount", "reviews", "review count"] },
  { id: "niche", label: "Category/Niche", aliases: ["categoryname", "category", "type", "niche"] },
  { id: "instagramHandle", label: "Instagram", aliases: ["instagram", "instagramurl", "ig"] },
  { id: "email", label: "Email", aliases: ["email", "emails"] },
  { id: "facebookUrl", label: "Facebook", aliases: ["facebook", "fb"] },
  { id: "linkedInUrl", label: "LinkedIn", aliases: ["linkedin"] },
  { id: "contactName", label: "Contact Name", aliases: ["contact name", "owner"] }
];

export interface ImportResult {
  validLeads: Partial<Lead>[];
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
  description = "Import leads from Apify, Outscraper, or any standard CSV file.";

  async discover(file: File): Promise<Partial<Lead>[]> {
    const { headers, rows } = await this.parseFile(file);
    const mapping = this.guessMapping(headers);
    const result = this.mapToLeads(rows, mapping);
    return result.validLeads;
  }

  async parseFile(file: File): Promise<{ headers: string[], rows: any[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(), // Fix whitespace issues in headers
        transform: (value) => value.trim(), // Fix whitespace in values
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
      const match = lowerHeaders.find(h => field.aliases.includes(h.lower) || h.lower === field.id.toLowerCase() || h.lower === field.label.toLowerCase());
      if (match) {
        mapping[field.id] = match.original;
      } else {
        mapping[field.id] = "";
      }
    }
    return mapping;
  }

  mapToLeads(rows: any[], mapping: Record<string, string>): ImportResult {
    const validLeads: Partial<Lead>[] = [];
    const errors: { row: number; messages: string[] }[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // Offset for header + 1-indexed
      const rowErrors: string[] = [];

      const getVal = (fieldId: string) => {
        const col = mapping[fieldId];
        return col ? row[col] : undefined;
      };

      const businessName = getVal("businessName");
      if (!businessName || businessName === "") {
        rowErrors.push("Missing Business Name");
      }

      const rawWebsite = getVal("websiteUrl");
      if (rawWebsite && rawWebsite.trim() !== "" && !rawWebsite.includes(".")) {
        rowErrors.push("Invalid Website URL");
      }
      
      const city = getVal("city");
      const address = getVal("address");
      if (!city && !address) {
        rowErrors.push("Missing Location (City or Address)");
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, messages: rowErrors });
        return; // Skip this row
      }

      const hasWebsite = !!rawWebsite && rawWebsite.trim() !== "";
      let websiteQuality: any = "Unknown";
      if (!hasWebsite) websiteQuality = "No website";
      else if (rawWebsite.toLowerCase().includes("linktr.ee")) websiteQuality = "Linktree only";
      
      validLeads.push({
        id: uuidv4(),
        dateAdded: new Date().toISOString(),
        businessName: businessName,
        country: getVal("country") || "Unknown",
        city: getVal("city") || "Unknown",
        niche: getVal("niche") || "Unknown",
        websiteUrl: rawWebsite,
        googleMapsUrl: getVal("googleMapsUrl"),
        instagramHandle: getVal("instagramHandle"),
        facebookUrl: getVal("facebookUrl"),
        linkedInUrl: getVal("linkedInUrl"),
        email: getVal("email"),
        phone: getVal("phone"),
        contactName: getVal("contactName"),
        status: "New",
        verification: {
          hasWebsite,
          websiteQuality,
          hasInstagram: !!getVal("instagramHandle"),
          hasFacebook: !!getVal("facebookUrl"),
          hasLinkedIn: !!getVal("linkedInUrl"),
          reviewCount: getVal("reviewCount") ? parseInt(getVal("reviewCount")) : undefined,
          reviewRating: getVal("reviewRating") ? parseFloat(getVal("reviewRating")) : undefined,
          isChainOrFranchise: false,
          isActive: true,
        }
      });
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
