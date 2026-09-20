import { Lead } from "@/types";

export interface DiscoveryProvider {
  /**
   * Identifies the provider internally (e.g., 'csv', 'manual')
   */
  id: string;

  /**
   * Human-readable name of the provider
   */
  name: string;

  /**
   * Short description of what the provider does
   */
  description: string;

  /**
   * Initializes or authenticates the provider if necessary.
   */
  initialize?: (config?: Record<string, unknown>) => Promise<void>;

  /**
   * Executes the lead discovery process.
   */
  discover(params: unknown): Promise<Lead[]>;
}
