import { TABLES } from "../config/constants.js";
import { SupabaseClientProvider } from "../integrations/supabase.client.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export type SymptomLogRecord = {
  id: string;
  userId: string;
  symptoms: string[];
  otherText: string | null;
  feelingGood: boolean;
  loggedAt: string;
};

export type CreateSymptomLogInput = {
  userId: string;
  symptoms: string[];
  otherText?: string | null;
  feelingGood: boolean;
};

type SymptomLogRow = {
  id: string;
  user_id: string;
  symptoms: string[];
  other_text: string | null;
  feeling_good: boolean;
  logged_at: string;
};

export class SymptomLogRepository {
  private readonly logger = createLogger("symptom-log-repository");

  constructor(
    private readonly supabaseClientProvider: SupabaseClientProvider = new SupabaseClientProvider()
  ) {}

  async listByUserId(
    userId: string,
    limit = 20,
    traceContext?: TraceContext
  ): Promise<SymptomLogRecord[]> {
    const client = this.supabaseClientProvider.getClient();

    const { data, error } = await client
      .from(TABLES.symptomLogs)
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error("Failed to list symptom logs", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        userId,
        errorMessage: error.message,
      });
      throw new Error(`Failed to list symptom logs: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async create(
    input: CreateSymptomLogInput,
    traceContext?: TraceContext
  ): Promise<SymptomLogRecord> {
    const client = this.supabaseClientProvider.getClient();

    const payload = {
      user_id: input.userId,
      symptoms: input.symptoms,
      other_text: input.otherText ?? null,
      feeling_good: input.feelingGood,
    };

    const { data, error } = await client
      .from(TABLES.symptomLogs)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      this.logger.error("Failed to create symptom log", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        userId: input.userId,
        errorMessage: error.message,
      });
      throw new Error(`Failed to create symptom log: ${error.message}`);
    }

    return mapRow(data);
  }
}

function mapRow(row: SymptomLogRow): SymptomLogRecord {
  return {
    id: row.id,
    userId: row.user_id,
    symptoms: row.symptoms ?? [],
    otherText: row.other_text,
    feelingGood: row.feeling_good,
    loggedAt: row.logged_at,
  };
}
