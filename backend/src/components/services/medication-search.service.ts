import { RxNavClient } from "../integrations/rxnav.client.js";
import type { MedicationSearchResponse } from "../schemas/medication.schema.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export class MedicationSearchService {
  private readonly logger = createLogger("medication-search-service");

  constructor(private readonly rxNavClient: RxNavClient = new RxNavClient()) {}

  async search(query: string, traceContext?: TraceContext): Promise<MedicationSearchResponse> {
    const trimmedQuery = query.trim();

    this.logger.info("Searching medications", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      query: trimmedQuery
    });

    const upstreamCandidates = await this.rxNavClient.searchApproximateTerm(trimmedQuery, 10, traceContext);

    const candidates = upstreamCandidates.map((candidate) => ({
      rxcui: candidate.rxcui,
      rxaui: candidate.rxaui ?? null,
      displayName: candidate.name,
      normalizedName: candidate.name,
      confidenceScore: Number(candidate.score),
      rank: Number(candidate.rank),
      source: candidate.source
    }));

    const response: MedicationSearchResponse = {
      query: trimmedQuery,
      candidateCount: candidates.length,
      candidates
    };

    this.logger.info("Medication search completed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      query: trimmedQuery,
      candidateCount: response.candidateCount
    });

    return response;
  }
}
