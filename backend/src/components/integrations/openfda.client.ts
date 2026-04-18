import { env } from "../config/env.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import type { TraceContext } from "../utils/trace.js";

const OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json";
const OPENFDA_TIMEOUT_MS = 8000;

type OpenFdaQueryStrategy = "openfda.rxcui" | "openfda.generic_name" | "openfda.substance_name" | "openfda.brand_name";

type OpenFdaResult = {
  boxed_warning?: string[];
  contraindications?: string[];
  drug_interactions?: string[];
  drug_and_or_laboratory_test_interactions?: string[];
  warnings?: string[];
  ask_doctor_or_pharmacist?: string[];
  adverse_reactions?: string[];
  effective_time?: string;
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    substance_name?: string[];
    manufacturer_name?: string[];
    product_type?: string[];
    route?: string[];
    spl_id?: string[];
    spl_set_id?: string[];
  };
};

type OpenFdaSearchResponse = {
  results?: OpenFdaResult[];
};

export type OpenFdaDrugLabelMatch = {
  queryStrategy: OpenFdaQueryStrategy;
  result: OpenFdaResult;
};

type GetDrugLabelInput = {
  rxcui: string;
  normalizedName: string;
  inputName: string;
};

export class OpenFdaClient {
  private readonly logger = createLogger("openfda-client");

  async getDrugLabel(input: GetDrugLabelInput, traceContext?: TraceContext): Promise<OpenFdaDrugLabelMatch | null> {
    const searchCandidates = buildSearchCandidates(input);

    for (const candidate of searchCandidates) {
      const match = await this.searchSingleStrategy(candidate.strategy, candidate.value, traceContext);

      if (match) {
        return match;
      }
    }

    return null;
  }

  private async searchSingleStrategy(
    strategy: OpenFdaQueryStrategy,
    value: string,
    traceContext?: TraceContext
  ): Promise<OpenFdaDrugLabelMatch | null> {
    const search = `${strategy}:${JSON.stringify(value)}`;
    const searchParams = new URLSearchParams({
      search,
      limit: "1"
    });

    if (env.OPENFDA_API_KEY) {
      searchParams.set("api_key", env.OPENFDA_API_KEY);
    }

    const url = `${OPENFDA_BASE_URL}?${searchParams.toString()}`;
    const startedAt = Date.now();

    const result = await withRetry(
      async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), OPENFDA_TIMEOUT_MS);

        try {
          const response = await fetch(url, {
            method: "GET",
            signal: controller.signal
          });

          if (response.status === 404) {
            return null;
          }

          if (!response.ok) {
            throw new Error(`openFDA request failed with status ${response.status}`);
          }

          const body = (await response.json()) as OpenFdaSearchResponse;
          const firstResult = body.results?.[0];

          if (!firstResult) {
            return null;
          }

          return {
            queryStrategy: strategy,
            result: firstResult
          } satisfies OpenFdaDrugLabelMatch;
        } finally {
          clearTimeout(timeout);
        }
      },
      {
        retries: 2,
        delayMs: 250,
        onRetry: (attempt, error) => {
          this.logger.warn("Retrying openFDA request", {
            requestId: traceContext?.requestId,
            traceId: traceContext?.traceId,
            strategy,
            value,
            attempt,
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    );

    this.logger.info("openFDA request completed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      strategy,
      value,
      matched: Boolean(result),
      durationMs: Date.now() - startedAt
    });

    return result;
  }
}

function buildSearchCandidates(input: GetDrugLabelInput) {
  const dedupedNames = dedupeValues([input.normalizedName, input.inputName]);

  return [
    { strategy: "openfda.rxcui" as const, value: input.rxcui },
    ...dedupedNames.map((value) => ({ strategy: "openfda.generic_name" as const, value })),
    ...dedupedNames.map((value) => ({ strategy: "openfda.substance_name" as const, value })),
    ...dedupedNames.map((value) => ({ strategy: "openfda.brand_name" as const, value }))
  ];
}

function dedupeValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}
