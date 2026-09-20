import { NextResponse } from "next/server";
import { GeminiProvider } from "@/providers/ai/GeminiProvider";
import { Lead } from "@/types";

export async function POST(req: Request) {
  try {
    const lead: Lead = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_MISSING", message: "Gemini API key missing. Add GEMINI_API_KEY to .env.local." },
        { status: 400 }
      );
    }

    const provider = new GeminiProvider();
    const analysis = await provider.analyzeLead(lead);

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Analyze API error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred during AI analysis";

    return NextResponse.json(
      { error: "GENERATION_FAILED", message },
      { status: 500 }
    );
  }
}
