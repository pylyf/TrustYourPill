import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export class SupabaseClientProvider {
  private client: SupabaseClient | null = null;

  getClient() {
    if (this.client) {
      return this.client;
    }

    if (!env.SUPABASE_URL) {
      throw new Error("SUPABASE_URL is not configured.");
    }

    const apiKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY;

    if (!apiKey) {
      throw new Error("A Supabase API key is required. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY.");
    }

    this.client = createClient(env.SUPABASE_URL, apiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    return this.client;
  }
}
