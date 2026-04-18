import { DailyMedClient } from "../integrations/dailymed.client.js";
import { OpenFdaClient } from "../integrations/openfda.client.js";
import { parseDailyMedLabelSections, parseLabelSections } from "../parsing/label-section.parser.js";
import type { MedicationProfileResponse } from "../schemas/medication.schema.js";
import { EvidenceCacheRepository } from "../storage/evidence-cache.repository.js";
import { MedicationNormalizationService } from "./medication-normalization.service.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export class MedicationProfileService {
  private readonly logger = createLogger("medication-profile-service");

  constructor(
    private readonly normalizationService: MedicationNormalizationService = new MedicationNormalizationService(),
    private readonly openFdaClient: OpenFdaClient = new OpenFdaClient(),
    private readonly dailyMedClient: DailyMedClient = new DailyMedClient(),
    private readonly evidenceCacheRepository: EvidenceCacheRepository = new EvidenceCacheRepository()
  ) {}

  async getProfile(name: string, traceContext?: TraceContext): Promise<MedicationProfileResponse> {
    const normalizedMedication = await this.normalizationService.normalize(name, traceContext);
    const lookupKey = buildMedicationProfileLookupKey(normalizedMedication.rxcui);
    const cachedEvidence = await this.evidenceCacheRepository.getActiveByLookupKey(lookupKey, traceContext);

    if (cachedEvidence) {
      this.logger.info("Medication profile cache hit", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        lookupKey,
        rxcui: normalizedMedication.rxcui,
        source: cachedEvidence.source,
        expiresAt: cachedEvidence.expiresAt
      });

      return {
        input: name.trim(),
        normalizedMedication,
        evidenceSource: cachedEvidence.parsedEvidence.evidenceSource,
        sectionCount: cachedEvidence.parsedEvidence.sectionCount,
        sections: cachedEvidence.parsedEvidence.sections
      };
    }

    this.logger.info("Medication profile cache miss", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      lookupKey,
      rxcui: normalizedMedication.rxcui
    });

    const labelMatch = await this.openFdaClient.getDrugLabel(
      {
        rxcui: normalizedMedication.rxcui,
        normalizedName: normalizedMedication.normalizedName,
        inputName: normalizedMedication.input
      },
      traceContext
    );

    if (labelMatch) {
      const openFdaSections = parseLabelSections(labelMatch.result);

      if (!shouldUseDailyMedFallback(openFdaSections)) {
        const response: MedicationProfileResponse = {
          input: name.trim(),
          normalizedMedication,
          evidenceSource: {
            source: "openfda",
            queryStrategy: labelMatch.queryStrategy,
            splId: firstValue(labelMatch.result.openfda?.spl_id),
            splSetId: firstValue(labelMatch.result.openfda?.spl_set_id),
            brandNames: labelMatch.result.openfda?.brand_name ?? [],
            genericNames: labelMatch.result.openfda?.generic_name ?? [],
            substanceNames: labelMatch.result.openfda?.substance_name ?? [],
            manufacturerNames: labelMatch.result.openfda?.manufacturer_name ?? [],
            productTypes: labelMatch.result.openfda?.product_type ?? [],
            routes: labelMatch.result.openfda?.route ?? [],
            effectiveTime: labelMatch.result.effective_time ?? null
          },
          sectionCount: openFdaSections.length,
          sections: openFdaSections
        };

        await this.evidenceCacheRepository.upsertMedicationProfileEvidence(
          {
            lookupKey,
            rxcui: normalizedMedication.rxcui,
            source: "openfda",
            rawPayload: labelMatch.result as Record<string, unknown>,
            parsedEvidence: {
              evidenceSource: response.evidenceSource,
              sectionCount: response.sectionCount,
              sections: response.sections
            }
          },
          traceContext
        );

        this.logger.info("Medication profile built from openFDA", {
          requestId: traceContext?.requestId,
          traceId: traceContext?.traceId,
          input: response.input,
          rxcui: response.normalizedMedication.rxcui,
          queryStrategy: response.evidenceSource.queryStrategy,
          sectionCount: response.sectionCount
        });

        return response;
      }

      this.logger.info("DailyMed fallback triggered for thin openFDA profile", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        input: normalizedMedication.input,
        rxcui: normalizedMedication.rxcui,
        openFdaSectionCount: openFdaSections.length
      });
    }

    const dailyMedLabel = await this.dailyMedClient.getDrugLabelByRxcui(normalizedMedication.rxcui, traceContext);

    if (!dailyMedLabel) {
      throw new Error("Medication label not found.");
    }

    const dailyMedSections = parseDailyMedLabelSections(dailyMedLabel);

    if (dailyMedSections.length === 0) {
      throw new Error("Medication label sections not found.");
    }

    const response: MedicationProfileResponse = {
      input: name.trim(),
      normalizedMedication,
      evidenceSource: {
        source: "dailymed",
        queryStrategy: "dailymed.rxcui",
        splId: dailyMedLabel.splId,
        splSetId: dailyMedLabel.setId,
        brandNames: dailyMedLabel.brandNames,
        genericNames: dailyMedLabel.genericNames,
        substanceNames: [],
        manufacturerNames: dailyMedLabel.manufacturerName ? [dailyMedLabel.manufacturerName] : [],
        productTypes: dailyMedLabel.productType ? [dailyMedLabel.productType] : [],
        routes: dailyMedLabel.route ? [dailyMedLabel.route] : [],
        effectiveTime: dailyMedLabel.effectiveTime
      },
      sectionCount: dailyMedSections.length,
      sections: dailyMedSections
    };

    await this.evidenceCacheRepository.upsertMedicationProfileEvidence(
      {
        lookupKey,
        rxcui: normalizedMedication.rxcui,
        source: "dailymed",
        rawPayload: dailyMedLabel as unknown as Record<string, unknown>,
        parsedEvidence: {
          evidenceSource: response.evidenceSource,
          sectionCount: response.sectionCount,
          sections: response.sections
        }
      },
      traceContext
    );

    this.logger.info("Medication profile built from DailyMed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      input: response.input,
      rxcui: response.normalizedMedication.rxcui,
      queryStrategy: response.evidenceSource.queryStrategy,
      sectionCount: response.sectionCount
    });

    return response;
  }
}

function firstValue(values: string[] | undefined) {
  return values?.[0] ?? null;
}

function shouldUseDailyMedFallback(
  sections: Array<{
    name: string;
  }>
) {
  return sections.length < 2;
}

function buildMedicationProfileLookupKey(rxcui: string) {
  return `profile:${rxcui}`;
}
