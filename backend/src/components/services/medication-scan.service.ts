import { env } from "../config/env.js";
import { DEFAULT_OPENAI_VISION_MODEL, OpenAiClient } from "../integrations/openai.client.js";
import type { MedicationSearchResponse } from "../schemas/medication.schema.js";
import type { MedicationScanRequest, MedicationScanResponse } from "../schemas/scan.schema.js";
import { MedicationSearchService } from "./medication-search.service.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export class MedicationScanService {
  private readonly logger = createLogger("medication-scan-service");

  constructor(
    private readonly openAiClient: OpenAiClient = new OpenAiClient(),
    private readonly medicationSearchService: MedicationSearchService = new MedicationSearchService()
  ) {}

  async scan(input: MedicationScanRequest, traceContext?: TraceContext): Promise<MedicationScanResponse> {
    const extraction = await this.openAiClient.extractMedicationPackaging(input, traceContext);

    let response: MedicationScanResponse;

    if (!extraction.isMedicationPackaging) {
      response = {
        source: "openai_vision",
        model: env.OPENAI_VISION_MODEL ?? DEFAULT_OPENAI_VISION_MODEL,
        extraction,
        match: {
          status: "no_match",
          reason: "The uploaded image does not appear to be medication packaging or a medication label.",
          query: null,
          candidateCount: 0,
          bestCandidate: null,
          candidates: []
        }
      };
    } else if (!extraction.medicationName) {
      response = {
        source: "openai_vision",
        model: env.OPENAI_VISION_MODEL ?? DEFAULT_OPENAI_VISION_MODEL,
        extraction,
        match: {
          status: "no_match",
          reason: "Visible text was found, but no medication name could be extracted confidently.",
          query: null,
          candidateCount: 0,
          bestCandidate: null,
          candidates: []
        }
      };
    } else {
      const searchResult = await this.searchForBestCandidates(extraction.medicationName, extraction.dosageText, traceContext);
      const bestCandidate = searchResult.candidates[0] ?? null;
      const status = inferMatchStatus(searchResult, extraction.medicationName);

      response = {
        source: "openai_vision",
        model: env.OPENAI_VISION_MODEL ?? DEFAULT_OPENAI_VISION_MODEL,
        extraction,
        match: {
          status,
          reason: buildMatchReason(status, searchResult.candidateCount, extraction.requiresReview),
          query: searchResult.query,
          candidateCount: searchResult.candidateCount,
          bestCandidate,
          candidates: searchResult.candidates
        }
      };
    }

    this.logger.info("Medication scan response built", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      medicationName: extraction.medicationName,
      packagingType: extraction.packagingType,
      matchStatus: response.match.status,
      candidateCount: response.match.candidateCount
    });

    return response;
  }

  private async searchForBestCandidates(
    medicationName: string,
    dosageText: string | null,
    traceContext?: TraceContext
  ) {
    const queries = dedupeQueries([medicationName, dosageText ? `${medicationName} ${dosageText}` : null]);

    for (const query of queries) {
      const result = await this.medicationSearchService.search(query, traceContext);

      if (result.candidateCount > 0) {
        return result;
      }
    }

    return {
      query: medicationName,
      candidateCount: 0,
      candidates: []
    } satisfies MedicationSearchResponse;
  }
}

function inferMatchStatus(searchResult: MedicationSearchResponse, extractedMedicationName: string) {
  const bestCandidate = searchResult.candidates[0];
  const secondCandidate = searchResult.candidates[1];

  if (!bestCandidate) {
    return "no_match" as const;
  }

  if (!secondCandidate) {
    return "matched" as const;
  }

  const normalizedExtractedName = normalizeName(extractedMedicationName);
  const normalizedBestName = normalizeName(bestCandidate.normalizedName);

  if (normalizedBestName === normalizedExtractedName) {
    return "matched" as const;
  }

  if (bestCandidate.rank === 1 && bestCandidate.confidenceScore - secondCandidate.confidenceScore >= 3) {
    return "matched" as const;
  }

  return "ambiguous" as const;
}

function buildMatchReason(status: "matched" | "ambiguous" | "no_match", candidateCount: number, requiresReview: boolean) {
  if (status === "no_match") {
    return "No RxNav candidates were found for the extracted medication text.";
  }

  if (status === "ambiguous") {
    return "Multiple close medication matches were found, so the frontend should ask the user to confirm one.";
  }

  if (requiresReview) {
    return "A likely match was found, but the scan quality suggests the frontend should still show a confirmation step.";
  }

  return candidateCount === 1
    ? "A single medication candidate was found from the extracted packaging text."
    : "A strong top medication candidate was found from the extracted packaging text.";
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function dedupeQueries(values: Array<string | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}
