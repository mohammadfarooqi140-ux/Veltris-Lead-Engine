import { AIProvider } from "./index";
import { Lead } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ModelResponse {
  opportunityNotes: string;
  drafts: {
    dm: string;
  };
}

export class GeminiProvider implements AIProvider {
  name = "Gemini";
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || "";
    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async analyzeLead(lead: Lead): Promise<ModelResponse> {
    const prompt = `
      You are an elite sales development strategist for Veltris, specializing in Instagram outreach for high-end UK Aesthetic Clinics, MedSpas, and Nurse Injectors.
      
      Business Name: ${lead.business_name}
      Owner/Practitioner: ${lead.full_name_or_owner || "Owner"}
      Niche: ${lead.niche}
      Location: ${lead.city}, ${lead.country}
      Instagram: ${lead.instagram_handle} (${lead.follower_count ? `${lead.follower_count} followers` : "active"})
      Website: ${lead.website_url || "None listed"}
      Booking Link: ${lead.booking_link || "None detected"}
      Customer Journey Wound: ${lead.customer_journey_wound || "Booking friction / manual DMs required"}
      Last Post Topic: ${lead.last_post_topic || "Aesthetic treatment showcasing"}

      Task 1: Generate a concise Opportunity & Commercial Wound Analysis (2-3 sentences). Highlight the specific customer-journey gap (e.g. friction booking consultations, unautomated patient inquiries).
      
      Task 2: Craft an authentic, personalized Instagram DM draft (2-4 sentences max).
      Tone: Peer-to-peer, genuine, professional, non-salesy.
      Guidelines:
      - Compliment a real aspect of their work or treatment portfolio.
      - Reference the customer journey wound naturally without pitching aggressively.
      - Ask a low-friction question about their patient booking process.
      - Do NOT sound like an agency pitch or mention "services", "packages", or "boost sales".
      - Strictly for Instagram DM (no subject line, no email formatting).

      Output JSON strictly in this structure:
      {
        "opportunityNotes": "...",
        "dm": "..."
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { opportunityNotes?: string; dm?: string };
        return {
          opportunityNotes: parsed.opportunityNotes || "Lead qualified for Instagram warming and outreach.",
          drafts: {
            dm: parsed.dm || `Hey ${lead.full_name_or_owner ? lead.full_name_or_owner.split(" ")[0] : "there"}! Loved seeing your recent patient results on your page. Are you currently handling all consultation bookings manually through DMs, or do you have an automated flow for patient enquiries?`
          }
        };
      }
      throw new Error("Invalid JSON structure from AI.");
    } catch (error) {
      console.error("Gemini analysis error:", error);
      return {
        opportunityNotes: "Customer journey wound identified: Consultation booking friction and reliance on manual Instagram DMs.",
        drafts: {
          dm: `Hey ${lead.full_name_or_owner ? lead.full_name_or_owner.split(" ")[0] : "there"}! Was just admiring your clinic's patient results. Quick question: are most of your new patients finding and booking consultations directly through Instagram DMs right now?`
        }
      };
    }
  }
}
