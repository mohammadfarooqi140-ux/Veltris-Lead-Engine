import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "GOOGLE_MAPS_DISABLED", message: "Google Maps discovery has been removed. Use CSV Import or Manual Entry with Instagram qualification." },
    { status: 410 }
  );
}
