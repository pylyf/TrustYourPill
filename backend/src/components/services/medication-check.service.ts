import { DISCLAIMER } from "../config/constants.js";
import { classifyFindings } from "../parsing/finding-classifier.js";
import type { MedicationCheckResponse, MedicationCheckSummary } from "../schemas/check.schema.js";
import { CheckResultRepository } from "../storage/check-result.repository.js";
import { AiSummaryService } from "./ai-summary.service.js";
import { MedicationProfileService } from "./medication-profile.service.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export class MedicationCheckService {
  private readonly logger = createLogger("medication-check-service");

  constructor(
    private readonly medicationProfileService: MedicationProfileService = new MedicationProfileService(),
    private readonly checkResultRepository: CheckResultRepository = new CheckResultRepository(),
    private readonly aiSummaryService: AiSummaryService = new AiSummaryService()
  ) {}

  async check(
    candidateMedication: string,
    currentMedications: string[],
    traceContext?: TraceContext
  ): Promise<MedicationCheckResponse> {
    const candidateProfile = await this.medicationProfileService.getProfile(candidateMedication, traceContext);
    const currentProfiles = await Promise.all(
      currentMedications.map((medication) => this.medicationProfileService.getProfile(medication, traceContext))
    );

    const evidence = classifyFindings({
      candidateProfile,
      currentProfiles
    });
    const summary = buildSummary(evidence, candidateProfile.input, currentProfiles.map((profile) => profile.input));
    const aiSummary = await this.aiSummaryService.summarize(
      {
        candidateMedication: candidateProfile.input,
        currentMedications: currentProfiles.map((profile) => profile.input),
        evidence,
        summary,
        candidateProfile,
        currentProfiles
      },
      traceContext
    );

    const response: MedicationCheckResponse = {
      candidateMedication: {
        input: candidateProfile.input,
        normalizedName: candidateProfile.normalizedMedication.normalizedName,
        rxcui: candidateProfile.normalizedMedication.rxcui
      },
      currentMedications: currentProfiles.map((profile) => ({
        input: profile.input,
        normalizedName: profile.normalizedMedication.normalizedName,
        rxcui: profile.normalizedMedication.rxcui
      })),
      evidence,
      summary,
      aiSummary: aiSummary.aiSummary,
      sideEffectSignals: aiSummary.sideEffectSignals,
      supportiveCareIdeas: aiSummary.supportiveCareIdeas,
      disclaimer: DISCLAIMER
    };

    await this.checkResultRepository.create(
      {
        candidateRxcui: response.candidateMedication.rxcui,
        currentMedicationRxcuis: response.currentMedications.map((medication) => medication.rxcui),
        findings: response.evidence,
        summary: response.summary
      },
      traceContext
    );

    this.logger.info("Medication check completed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      candidateMedication: candidateProfile.input,
      currentMedicationCount: currentProfiles.length,
      evidenceCount: evidence.length,
      status: summary.status
    });

    return response;
  }
}

function buildSummary(
  evidence: MedicationCheckResponse["evidence"],
  candidateMedication: string,
  currentMedicationInputs: string[]
): MedicationCheckSummary {
  const explicit = evidence.find((item) => item.type === "explicit_label_interaction");
  if (explicit) {
    return {
      status: "avoid_until_reviewed",
      headline: "This combination should be avoided until reviewed.",
      explanation: `The ${explicit.foundInMedication} label explicitly references ${explicit.medication} in ${explicit.section.replaceAll("_", " ")} evidence for the ${candidateMedication} combination.`
    };
  }

  const general = evidence.find((item) => item.type === "general_contraindication" || item.type === "general_warning");
  if (general) {
    return {
      status: "review_before_use",
      headline: "This combination should be reviewed before use.",
      explanation: `The ${general.foundInMedication} label contains a general warning signal involving ${general.medication} in ${general.section.replaceAll("_", " ")} evidence for the ${candidateMedication} combination.`
    };
  }

  return {
    status: "insufficient_evidence",
    headline: "No direct label match was found in the retrieved evidence.",
    explanation: `The current label lookup for ${candidateMedication} did not produce an explicit interaction or class-level warning for ${currentMedicationInputs.join(", ")}.`
  };
}
