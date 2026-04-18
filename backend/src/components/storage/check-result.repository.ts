import { TABLES } from "../config/constants.js";
import { SupabaseClientProvider } from "../integrations/supabase.client.js";
import type { MedicationCheckEvidenceItem, MedicationCheckSummary } from "../schemas/check.schema.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export type CreateCheckResultInput = {
  userId?: string | null;
  candidateRxcui: string;
  currentMedicationRxcuis: string[];
  findings: MedicationCheckEvidenceItem[];
  summary: MedicationCheckSummary;
};

export type CheckResultRecord = {
  id: string;
  userId: string | null;
  candidateRxcui: string;
  currentMedicationRxcuis: string[];
  findings: MedicationCheckEvidenceItem[];
  summary: MedicationCheckSummary;
  createdAt: string;
};

type CheckResultRow = {
  id: string;
  user_id: string | null;
  candidate_rxcui: string;
  current_medication_rxcuis: string[];
  findings: MedicationCheckEvidenceItem[];
  summary: MedicationCheckSummary;
  created_at: string;
};

export class CheckResultRepository {
  private readonly logger = createLogger("check-result-repository");

  constructor(private readonly supabaseClientProvider: SupabaseClientProvider = new SupabaseClientProvider()) {}

  async create(input: CreateCheckResultInput, traceContext?: TraceContext): Promise<CheckResultRecord> {
    const client = this.supabaseClientProvider.getClient();
    const payload = {
      user_id: input.userId ?? null,
      candidate_rxcui: input.candidateRxcui,
      current_medication_rxcuis: input.currentMedicationRxcuis,
      findings: input.findings,
      summary: input.summary
    };

    const { data, error } = await client
      .from(TABLES.checkResults)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      this.logger.error("Failed to create check result", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        candidateRxcui: input.candidateRxcui,
        errorMessage: error.message
      });

      throw new Error(`Failed to create check result: ${error.message}`);
    }

    return mapCheckResultRow(data);
  }
}

function mapCheckResultRow(row: CheckResultRow): CheckResultRecord {
  return {
    id: row.id,
    userId: row.user_id,
    candidateRxcui: row.candidate_rxcui,
    currentMedicationRxcuis: row.current_medication_rxcuis,
    findings: row.findings,
    summary: row.summary,
    createdAt: row.created_at
  };
}
