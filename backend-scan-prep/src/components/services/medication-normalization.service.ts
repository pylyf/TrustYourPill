import { RxNavClient, type RxNavApproximateTermCandidate } from "../integrations/rxnav.client.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export type NormalizedMedication = {
  input: string;
  normalizedName: string;
  rxcui: string;
  rxaui: string | null;
  source: string;
  searchScore: number | null;
};

export class MedicationNormalizationService {
  private readonly logger = createLogger("medication-normalization-service");

  constructor(private readonly rxNavClient: RxNavClient = new RxNavClient()) {}

  async normalize(input: string, traceContext?: TraceContext): Promise<NormalizedMedication> {
    const searchTerm = input.trim();

    this.logger.info("Normalizing medication", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      input: searchTerm
    });

    const candidates = await this.rxNavClient.searchApproximateTerm(searchTerm, 5, traceContext);
    const candidate = pickBestCandidate(candidates);

    if (!candidate) {
      throw new Error("Medication normalization failed.");
    }

    return {
      input: searchTerm,
      normalizedName: candidate.name,
      rxcui: candidate.rxcui,
      rxaui: candidate.rxaui ?? null,
      source: candidate.source,
      searchScore: Number(candidate.score)
    };
  }
}

function pickBestCandidate(candidates: RxNavApproximateTermCandidate[]) {
  return [...candidates].sort((left, right) => {
    const rankDelta = Number(left.rank) - Number(right.rank);

    if (rankDelta !== 0) {
      return rankDelta;
    }

    return Number(right.score) - Number(left.score);
  })[0];
}
