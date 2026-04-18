import { OpenAiClient } from "../integrations/openai.client.js";
import {
  buildFallbackSideEffectSignals,
  buildFallbackSupportiveCareIdeas
} from "../parsing/side-effect-support.builder.js";
import type {
  MedicationCheckAiInsights,
  MedicationCheckAiSummary,
  MedicationCheckEvidenceItem,
  MedicationCheckSideEffectSignal,
  MedicationCheckSummary,
  MedicationCheckSupportiveCareIdea
} from "../schemas/check.schema.js";
import type { MedicationProfileResponse } from "../schemas/medication.schema.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

type SummarizeMedicationCheckInput = {
  candidateMedication: string;
  currentMedications: string[];
  evidence: MedicationCheckEvidenceItem[];
  summary: MedicationCheckSummary;
  candidateProfile: MedicationProfileResponse;
  currentProfiles: MedicationProfileResponse[];
};

const AI_SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    plainLanguageSummary: { type: "string" },
    whatTriggeredThis: { type: "string" },
    questionsForClinician: {
      type: "array",
      items: { type: "string" }
    },
    confidenceNote: { type: "string" },
    sideEffectSignals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          domain: {
            type: "string",
            enum: ["bleeding_risk", "stomach_irritation", "liver_caution", "kidney_caution", "sedation"]
          },
          severity: {
            type: "string",
            enum: ["low", "moderate", "high"]
          },
          sourceSections: {
            type: "array",
            items: { type: "string" }
          },
          explanation: { type: "string" }
        },
        required: ["domain", "severity", "sourceSections", "explanation"]
      }
    },
    supportiveCareIdeas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["food", "hydration", "timing_discussion", "monitoring", "supplement", "avoidance", "general_support"]
          },
          label: { type: "string" },
          rationale: { type: "string" },
          candidateName: {
            anyOf: [{ type: "string" }, { type: "null" }]
          },
          requiresReview: { type: "boolean" },
          shouldCheckInteractions: { type: "boolean" }
        },
        required: ["type", "label", "rationale", "candidateName", "requiresReview", "shouldCheckInteractions"]
      }
    }
  },
  required: [
    "headline",
    "plainLanguageSummary",
    "whatTriggeredThis",
    "questionsForClinician",
    "confidenceNote",
    "sideEffectSignals",
    "supportiveCareIdeas"
  ]
} as const;

export class AiSummaryService {
  private readonly logger = createLogger("ai-summary-service");

  constructor(private readonly openAiClient: OpenAiClient = new OpenAiClient()) {}

  async summarize(input: SummarizeMedicationCheckInput, traceContext?: TraceContext): Promise<MedicationCheckAiInsights> {
    const fallback = buildFallbackInsights(input);

    try {
      const response = await this.openAiClient.summarizeGroundedEvidence(
        {
          instructions: [
            "You are a medication label summarizer for a hackathon medication-awareness app.",
            "Summarize only from the structured evidence and label excerpts provided.",
            "Do not invent drug interactions or claim a medication is safe.",
            "Be explicit about whether the signal is an explicit interaction, a general warning, or incomplete evidence.",
            "You may suggest supportive care ideas, including supplement candidates, when side-effect patterns justify them.",
            "If you suggest a supplement, present it only as something to ask a clinician or pharmacist about.",
            "Every supplement idea must set requiresReview=true and shouldCheckInteractions=true.",
            "Keep the output concise, practical, and structured.",
            "plainLanguageSummary must be 1-2 sentences maximum (under 40 words). State only the key finding.",
            "whatTriggeredThis must be 1 sentence maximum (under 25 words). Name the medication and the specific label section that triggered the signal.",
            "This is based on FDA label information and is not medical advice."
          ].join(" "),
          input: JSON.stringify(buildPromptPayload(input)),
          schema: AI_SUMMARY_SCHEMA
        },
        traceContext
      );

      if (!response) {
        return fallback;
      }

      const aiInsights: MedicationCheckAiInsights = {
        aiSummary: {
          headline: asString(response.headline) ?? fallback.aiSummary.headline,
          plainLanguageSummary: asString(response.plainLanguageSummary) ?? fallback.aiSummary.plainLanguageSummary,
          whatTriggeredThis: asString(response.whatTriggeredThis) ?? fallback.aiSummary.whatTriggeredThis,
          questionsForClinician: asStringArray(response.questionsForClinician) ?? fallback.aiSummary.questionsForClinician,
          confidenceNote: asString(response.confidenceNote) ?? fallback.aiSummary.confidenceNote,
          generatedBy: "openai"
        },
        sideEffectSignals: asSideEffectSignals(response.sideEffectSignals) ?? fallback.sideEffectSignals,
        supportiveCareIdeas: asSupportiveCareIdeas(response.supportiveCareIdeas) ?? fallback.supportiveCareIdeas
      };

      this.logger.info("Medication AI insights generated", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        generatedBy: aiInsights.aiSummary.generatedBy,
        sideEffectSignalCount: aiInsights.sideEffectSignals.length,
        supportiveCareIdeaCount: aiInsights.supportiveCareIdeas.length
      });

      return aiInsights;
    } catch (error) {
      this.logger.warn("Falling back to deterministic AI summary", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId,
        errorMessage: error instanceof Error ? error.message : "Unknown error"
      });

      return fallback;
    }
  }
}

function buildFallbackInsights(input: SummarizeMedicationCheckInput): MedicationCheckAiInsights {
  const sideEffectSignals = buildFallbackSideEffectSignals(input.candidateProfile, input.currentProfiles);
  const supportiveCareIdeas = buildFallbackSupportiveCareIdeas(sideEffectSignals);
  const aiSummary = buildFallbackSummary(input, sideEffectSignals);

  return {
    aiSummary,
    sideEffectSignals,
    supportiveCareIdeas
  };
}

function buildFallbackSummary(
  input: SummarizeMedicationCheckInput,
  sideEffectSignals: MedicationCheckSideEffectSignal[]
): MedicationCheckAiSummary {
  const topFinding = input.evidence.find((item) => item.type !== "no_direct_label_match") ?? input.evidence[0];
  const sideEffectTail =
    sideEffectSignals.length > 0
      ? ` Additional side-effect signals include ${sideEffectSignals.map((item) => item.domain.replaceAll("_", " ")).join(", ")}.`
      : "";

  return {
    headline: input.summary.headline,
    plainLanguageSummary: `${input.summary.explanation}${sideEffectTail} This is based on FDA label information and is not medical advice.`,
    whatTriggeredThis: topFinding
      ? `${topFinding.foundInMedication} contains ${topFinding.section.replaceAll("_", " ")} evidence involving ${topFinding.medication}.`
      : "No direct evidence details were available beyond the current label lookup.",
    questionsForClinician: [
      `Should ${input.candidateMedication} be avoided or adjusted with ${input.currentMedications.join(", ")}?`,
      "Are there safer alternatives or monitoring steps to consider?"
    ],
    confidenceNote:
      input.summary.status === "insufficient_evidence"
        ? "Evidence is incomplete or indirect, so this summary should be treated cautiously."
        : "This summary is grounded in retrieved label evidence, but it does not replace pharmacist or clinician review.",
    generatedBy: "deterministic_fallback"
  };
}

function buildPromptPayload(input: SummarizeMedicationCheckInput) {
  return {
    candidateMedication: input.candidateMedication,
    currentMedications: input.currentMedications,
    evidence: input.evidence,
    summary: input.summary,
    candidateProfile: condenseProfile(input.candidateProfile),
    currentProfiles: input.currentProfiles.map(condenseProfile)
  };
}

function condenseProfile(profile: MedicationProfileResponse) {
  return {
    input: profile.input,
    normalizedMedication: profile.normalizedMedication,
    evidenceSource: {
      source: profile.evidenceSource.source,
      queryStrategy: profile.evidenceSource.queryStrategy
    },
    sections: profile.sections.map((section) => ({
      name: section.name,
      title: section.title,
      excerpt: section.excerpt
    }))
  };
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length > 0 ? items : null;
}

function asSideEffectSignals(value: unknown): MedicationCheckSideEffectSignal[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const validItems = value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const domain = asSideEffectDomain(candidate.domain);
    const severity = asSignalSeverity(candidate.severity);
    const sourceSections = asStringArray(candidate.sourceSections);
    const explanation = asString(candidate.explanation);

    if (!domain || !severity || !sourceSections || !explanation) {
      return [];
    }

    return [
      {
        domain,
        severity,
        sourceSections,
        explanation
      }
    ];
  });

  return validItems;
}

function asSupportiveCareIdeas(value: unknown): MedicationCheckSupportiveCareIdea[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const validItems = value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const type = asIdeaType(candidate.type);
    const label = asString(candidate.label);
    const rationale = asString(candidate.rationale);
    const candidateName =
      candidate.candidateName === null ? null : typeof candidate.candidateName === "string" ? candidate.candidateName : null;
    const requiresReview = typeof candidate.requiresReview === "boolean" ? candidate.requiresReview : null;
    const shouldCheckInteractions =
      typeof candidate.shouldCheckInteractions === "boolean" ? candidate.shouldCheckInteractions : null;

    if (!type || !label || !rationale || requiresReview === null || shouldCheckInteractions === null) {
      return [];
    }

    return [
      {
        type,
        label,
        rationale,
        candidateName,
        requiresReview: type === "supplement" ? true : requiresReview,
        shouldCheckInteractions: type === "supplement" ? true : shouldCheckInteractions
      }
    ];
  });

  return validItems;
}

function asSideEffectDomain(value: unknown): MedicationCheckSideEffectSignal["domain"] | null {
  return value === "bleeding_risk" ||
    value === "stomach_irritation" ||
    value === "liver_caution" ||
    value === "kidney_caution" ||
    value === "sedation"
    ? value
    : null;
}

function asSignalSeverity(value: unknown): MedicationCheckSideEffectSignal["severity"] | null {
  return value === "low" || value === "moderate" || value === "high" ? value : null;
}

function asIdeaType(value: unknown): MedicationCheckSupportiveCareIdea["type"] | null {
  return value === "food" ||
    value === "hydration" ||
    value === "timing_discussion" ||
    value === "monitoring" ||
    value === "supplement" ||
    value === "avoidance" ||
    value === "general_support"
    ? value
    : null;
}
