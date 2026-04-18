import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import type { TraceContext } from "../utils/trace.js";

const RXNAV_BASE_URL = "https://rxnav.nlm.nih.gov";
const RXNAV_TIMEOUT_MS = 8000;

type RxNavApproximateCandidate = {
  rxcui: string;
  rxaui?: string;
  score: string;
  rank: string;
  name: string;
  source: string;
};

type RxNavApproximateResponse = {
  approximateGroup?: {
    candidate?: RxNavApproximateCandidate | RxNavApproximateCandidate[];
  };
};

export class RxNavClient {
  private readonly logger = createLogger("rxnav-client");

  async searchApproximateTerm(term: string, maxEntries = 10, traceContext?: TraceContext) {
    const searchParams = new URLSearchParams({
      term,
      maxEntries: String(maxEntries)
    });
    const url = `${RXNAV_BASE_URL}/REST/Prescribe/approximateTerm.json?${searchParams.toString()}`;
    const startedAt = Date.now();

    const data = await withRetry(
      async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), RXNAV_TIMEOUT_MS);

        try {
          const response = await fetch(url, {
            method: "GET",
            signal: controller.signal
          });

          if (!response.ok) {
            throw new Error(`RxNav request failed with status ${response.status}`);
          }

          const body = (await response.json()) as RxNavApproximateResponse;
          return normalizeCandidateArray(body.approximateGroup?.candidate);
        } finally {
          clearTimeout(timeout);
        }
      },
      {
        retries: 2,
        delayMs: 250,
        onRetry: (attempt, error) => {
          this.logger.warn("Retrying RxNav approximate term request", {
            requestId: traceContext?.requestId,
            traceId: traceContext?.traceId,
            term,
            attempt,
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    );

    this.logger.info("RxNav approximate term request completed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      term,
      maxEntries,
      candidateCount: data.length,
      durationMs: Date.now() - startedAt
    });

    return data;
  }
}

export type RxNavApproximateTermCandidate = RxNavApproximateCandidate;

function normalizeCandidateArray(
  candidate: RxNavApproximateCandidate | RxNavApproximateCandidate[] | undefined
) {
  if (!candidate) {
    return [];
  }

  return Array.isArray(candidate) ? candidate : [candidate];
}
