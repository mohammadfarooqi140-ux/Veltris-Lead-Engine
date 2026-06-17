import { DiscoveryProvider } from "./index";
import { Lead } from "@/types";

export interface GoogleMapsParams {
  country: string;
  city: string;
  niche: string;
  resultCount: number;
}

export class GoogleMapsProvider implements DiscoveryProvider {
  id = "google-maps";
  name = "Google Maps Lead Finder";
  description = "Experimental: Scrape local businesses directly from Google Maps.";

  async discover(params: GoogleMapsParams): Promise<Partial<Lead>[]> {
    const response = await fetch("/api/discover/google-maps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to discover leads from Google Maps");
    }

    const data = await response.json();
    return data.leads;
  }
}
