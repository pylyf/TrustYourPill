import { CACHE_TTLS, TABLES } from "../config/constants.js";
import { SupabaseClientProvider } from "../integrations/supabase.client.js";
import type { MedicationProfileResponse } from "../schemas/medication.schema.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

type MedicationEvidenceCacheRow = {
  lookup_key: string;
  rxcui: string;
  source: string;
  raw_payload: Record<string, unknown>;
  parsed_evidence: CachedMedicationProfileEvidence;
  fetched_at: string;
  expires_at: string;
};

export type CachedMedicationProfileEvidence = {
  evidenceSource: MedicationProfileResponse["evidenceSource"];
  sectionCount: number;
  sections: MedicationProfileResponse["sections"];
};

export type MedicationEvidenceCacheEntry = {
  lookupKey: string;
  rxcui: string;
  source: string;
  rawPayload: Record<string, unknown>;
  parsedEvidence: CachedMedicationProfileEvidence;
  fetchedAt: string;
  expiresAt: string;
};

type UpsertMedicationEvidenceCacheInput = {
  lookupKey: string;
  rxcui: string;
  source: string;
  rawPayload: Record<string, unknown>;
  parsedEvidence: CachedMedicationProfileEvidence;
};

export class EvidenceCacheRepository {
  private readonly logger = createLogger("evidence-cache-repository");

  constructor(private readonly supabaseClientProvider: SupabaseClientProvider = new SupabaseClientProvider()) {}

  async getActiveByLookupKey(lookupKey: string, traceContext?: TraceContext): Promise<MedicationEvidenceCacheEntry | null> {
    const client = this.supabaseClientProvider.getClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await client
      .from(TABLES.medicationEvidenceCache)
      .select("*")
      .eq("lookup_key", lookupKey)
      .gt("expires_at", nowIso)
      .maybeSingle();

    if (error) {
      this.logger.error("Failed to read medication evidence cache", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        lookupKey,
        errorMessage: error.message
      });

      throw new Error(`Failed to read medication evidence cache: ${error.message}`);
    }

    return data ? mapMedicationEvidenceCacheRow(data) : null;
  }

  async upsertMedicationProfileEvidence(
    input: UpsertMedicationEvidenceCacheInput,
    traceContext?: TraceContext
  ): Promise<MedicationEvidenceCacheEntry> {
    const client = this.supabaseClientProvider.getClient();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTLS.evidenceDays * 24 * 60 * 60 * 1000);

    const payload = {
      lookup_key: input.lookupKey,
      rxcui: input.rxcui,
      source: input.source,
      raw_payload: input.rawPayload,
      parsed_evidence: input.parsedEvidence,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    };

    const { data, error } = await client
      .from(TABLES.medicationEvidenceCache)
      .upsert(payload, { onConflict: "lookup_key" })
      .select("*")
      .single();

    if (error) {
      this.logger.error("Failed to upsert medication evidence cache", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        lookupKey: input.lookupKey,
        rxcui: input.rxcui,
        errorMessage: error.message
      });

      throw new Error(`Failed to upsert medication evidence cache: ${error.message}`);
    }

    return mapMedicationEvidenceCacheRow(data);
  }
}

function mapMedicationEvidenceCacheRow(row: MedicationEvidenceCacheRow): MedicationEvidenceCacheEntry {
  return {
    lookupKey: row.lookup_key,
    rxcui: row.rxcui,
    source: row.source,
    rawPayload: row.raw_payload,
    parsedEvidence: row.parsed_evidence,
    fetchedAt: row.fetched_at,
    expiresAt: row.expires_at
  };
}
