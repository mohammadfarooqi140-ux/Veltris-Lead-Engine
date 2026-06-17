import { DiscoveryProvider } from "./index";
import { Lead } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface ManualEntryParams {
  businessName: string;
  country: string;
  city: string;
  niche: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  linkedInUrl?: string;
  email?: string;
  phone?: string;
  contactName?: string;
}

export class ManualProvider implements DiscoveryProvider {
  id = "manual";
  name = "Manual Entry";
  description = "Manually add a single lead if you already have their details.";

  async discover(params: ManualEntryParams): Promise<Partial<Lead>[]> {
    const rawWebsite = params.websiteUrl || "";
    const hasWebsite = rawWebsite.trim() !== "";
    
    let websiteQuality: any = "Unknown";
    if (!hasWebsite) websiteQuality = "No website";
    else if (rawWebsite.toLowerCase().includes("linktr.ee")) websiteQuality = "Linktree only";

    const lead: Partial<Lead> = {
      id: uuidv4(),
      dateAdded: new Date().toISOString(),
      businessName: params.businessName || "Unknown Business",
      country: params.country || "Unknown",
      city: params.city || "Unknown",
      niche: params.niche || "Unknown",
      websiteUrl: params.websiteUrl,
      googleMapsUrl: params.googleMapsUrl,
      instagramHandle: params.instagramHandle,
      facebookUrl: params.facebookUrl,
      linkedInUrl: params.linkedInUrl,
      email: params.email,
      phone: params.phone,
      contactName: params.contactName,
      status: "New",
      verification: {
        hasWebsite,
        websiteQuality,
        hasInstagram: !!params.instagramHandle,
        hasFacebook: !!params.facebookUrl,
        hasLinkedIn: !!params.linkedInUrl,
        isChainOrFranchise: false,
        isActive: true,
      }
    };

    return [lead];
  }
}
