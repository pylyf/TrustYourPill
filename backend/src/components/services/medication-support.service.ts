import { DISCLAIMER } from "../config/constants.js";
import { classifyFindings } from "../parsing/finding-classifier.js";
import type { MedicationSupportResponse, MedicationCheckSummary } from "../schemas/check.schema.js";
import { AiSummaryService } from "./ai-summary.service.js";
import { MedicationProfileService } from "./medication-profile.service.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

export class MedicationSupportService {
  private readonly logger = createLogger("medication-support-service");

  constructor(
    private readonly medicationProfileService: MedicationProfileService = new MedicationProfileService(),
    private readonly aiSummaryService: AiSummaryService = new AiSummaryService()
  ) {}

  async getSupport(
    candidateMedication: string,
    currentMedications: string[],
    traceContext?: TraceContext
  ): Promise<MedicationSupportResponse> {
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

    const response: MedicationSupportResponse = {
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
      sideEffectSignals: aiSummary.sideEffectSignals,
      supportiveCareIdeas: aiSummary.supportiveCareIdeas,
      aiSummary: aiSummary.aiSummary,
      interactionReviewNote:
        currentProfiles.length > 0
          ? `Supportive care ideas were generated while considering ${currentProfiles.map((profile) => profile.input).join(", ")} in the current regimen.`
          : "Supportive care ideas were generated from the candidate medication label evidence only.",
      disclaimer: DISCLAIMER
    };

    this.logger.info("Medication support completed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      candidateMedication: candidateProfile.input,
      currentMedicationCount: currentProfiles.length,
      sideEffectSignalCount: response.sideEffectSignals.length,
      supportiveCareIdeaCount: response.supportiveCareIdeas.length
    });

    return response;
  }
}

function buildSummary(
  evidence: Array<{
    type: string;
    foundInMedication: string;
    medication: string;
    section: string;
  }>,
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
