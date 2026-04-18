import { TABLES } from "../config/constants.js";
import { SupabaseClientProvider } from "../integrations/supabase.client.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export type UserMedicationRecord = {
  id: string;
  userId: string;
  inputName: string;
  displayName: string;
  normalizedName: string;
  rxcui: string;
  rxaui: string | null;
  source: string;
  searchScore: number | null;
  createdAt: string;
};

export type CreateUserMedicationInput = {
  userId: string;
  inputName: string;
  displayName: string;
  normalizedName: string;
  rxcui: string;
  rxaui?: string | null;
  source: string;
  searchScore?: number | null;
};

type UserMedicationRow = {
  id: string;
  user_id: string;
  input_name: string;
  display_name: string;
  normalized_name: string;
  rxcui: string;
  rxaui: string | null;
  source: string;
  search_score: number | null;
  created_at: string;
};

export class MedicationRepository {
  private readonly logger = createLogger("medication-repository");

  constructor(private readonly supabaseClientProvider: SupabaseClientProvider = new SupabaseClientProvider()) {}

  async listByUserId(userId: string, traceContext?: TraceContext): Promise<UserMedicationRecord[]> {
    const client = this.supabaseClientProvider.getClient();

    const { data, error } = await client
      .from(TABLES.userMedications)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      this.logger.error("Failed to list user medications", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        userId,
        errorMessage: error.message
      });

      throw new Error(`Failed to list user medications: ${error.message}`);
    }

    return (data ?? []).map(mapUserMedicationRow);
  }

  async create(input: CreateUserMedicationInput, traceContext?: TraceContext): Promise<UserMedicationRecord> {
    const client = this.supabaseClientProvider.getClient();

    const payload = {
      user_id: input.userId,
      input_name: input.inputName,
      display_name: input.displayName,
      normalized_name: input.normalizedName,
      rxcui: input.rxcui,
      rxaui: input.rxaui ?? null,
      source: input.source,
      search_score: input.searchScore ?? null
    };

    const { data, error } = await client
      .from(TABLES.userMedications)
      .upsert(payload, { onConflict: "user_id,rxcui" })
      .select("*")
      .single();

    if (error) {
      this.logger.error("Failed to save user medication", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        userId: input.userId,
        rxcui: input.rxcui,
        errorMessage: error.message
      });

      throw new Error(`Failed to save user medication: ${error.message}`);
    }

    return mapUserMedicationRow(data);
  }

  async deleteById(userId: string, medicationId: string, traceContext?: TraceContext) {
    const client = this.supabaseClientProvider.getClient();

    const { data, error } = await client
      .from(TABLES.userMedications)
      .delete()
      .eq("user_id", userId)
      .eq("id", medicationId)
      .select("id")
      .maybeSingle();

    if (error) {
      this.logger.error("Failed to delete user medication", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        userId,
        medicationId,
        errorMessage: error.message
      });

      throw new Error(`Failed to delete user medication: ${error.message}`);
    }

    if (!data) {
      throw new Error("User medication not found.");
    }
  }
}

function mapUserMedicationRow(row: UserMedicationRow): UserMedicationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    inputName: row.input_name,
    displayName: row.display_name,
    normalizedName: row.normalized_name,
    rxcui: row.rxcui,
    rxaui: row.rxaui,
    source: row.source,
    searchScore: row.search_score,
    createdAt: row.created_at
  };
}
