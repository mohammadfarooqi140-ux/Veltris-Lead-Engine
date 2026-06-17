import { AIProvider } from "./index";
import { Lead } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiProvider implements AIProvider {
  name = "Gemini";
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || "";
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async analyzeLead(lead: Lead) {
    const prompt = `
      You are an expert sales development representative (SDR) analyzing a local business lead.
      Business Name: ${lead.businessName}
      Niche: ${lead.niche}
      Location: ${lead.city}, ${lead.country}
      
      Website Status: ${lead.verification.hasWebsite ? 'Yes' : 'No'} (${lead.verification.websiteQuality})
      Instagram: ${lead.verification.hasInstagram ? 'Yes' : 'No'}
      Facebook: ${lead.verification.hasFacebook ? 'Yes' : 'No'}
      
      Rule-based Score: ${lead.ruleBasedScore || 'N/A'} (1-5 scale)

      Task 1: Generate a short Opportunity Analysis (max 4 sentences) highlighting why this business is a good prospect for our digital services (e.g., website creation, modernizing online presence), based on the provided data.
      
      Task 2: Generate an Instagram DM draft (casual, professional, short) targeting the owner. Address the specific issue (e.g. no website or broken website). Do not be overly salesy.
      
      Task 3: Generate an Email draft (professional, value-driven, short) targeting the owner.

      Output JSON strictly in the following format:
      {
        "opportunityNotes": "...",
        "dm": "...",
        "email": "..."
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      // Basic JSON extraction if markdown backticks are present
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          opportunityNotes: parsed.opportunityNotes || "Unable to generate notes.",
          drafts: {
            dm: parsed.dm || "Unable to generate DM.",
            email: parsed.email || "Unable to generate email."
          }
        };
      }
      throw new Error("Invalid JSON from AI.");
    } catch (error) {
      console.error("Gemini analysis error:", error);
      return {
        opportunityNotes: "Error generating notes.",
        drafts: { dm: "Error", email: "Error" }
      };
    }
  }
}
