import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { country, city, niche, resultCount } = await req.json();

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { message: "GOOGLE_PLACES_API_KEY missing. Please add it to Settings to use the Maps scraper." },
        { status: 503 } // 503 Service Unavailable so UI can show a clean warning
      );
    }

    // In a full implementation, we would call:
    // https://maps.googleapis.com/maps/api/place/textsearch/json?query={niche}+in+{city},+{country}&key=...
    // For V1 experimental, we will simulate a mock response if the key is 'test' or similar,
    // or you can implement the real fetch here.

    // Let's implement a real fetch to Google Places API (Text Search)
    const query = encodeURIComponent(`${niche} in ${city}, ${country}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
       throw new Error(`Google Places API Error: ${data.status} - ${data.error_message || ""}`);
    }

    // Map Google Places results to Lead format
    const results = data.results.slice(0, resultCount || 10);
    
    const leads = results.map((place: any) => {
      // Note: Text Search doesn't return website or phone number by default.
      // You need Place Details API for that. For V1 experimental, we'll map what we have.
      return {
        id: uuidv4(),
        dateAdded: new Date().toISOString(),
        businessName: place.name || "Unknown Business",
        country: country,
        city: city,
        niche: niche,
        address: place.formatted_address,
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        status: "New",
        verification: {
          hasWebsite: false, // We don't know without Place Details
          websiteQuality: "Unknown",
          hasInstagram: false,
          hasFacebook: false,
          hasLinkedIn: false,
          reviewCount: place.user_ratings_total,
          reviewRating: place.rating,
          isChainOrFranchise: false,
          isActive: place.business_status === "OPERATIONAL",
        }
      };
    });

    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error("Google Maps API error:", error);
    return NextResponse.json(
      { message: error.message || "An unexpected error occurred during Maps discovery." },
      { status: 500 }
    );
  }
}
