import { z } from "zod";

export const medicationCheckRequestSchema = z.object({
  candidateMedication: z.string().trim().min(1),
  currentMedications: z.array(z.string().trim().min(1)).default([])
});

export const medicationSupportRequestSchema = medicationCheckRequestSchema;

export const medicationCheckSummarySchema = z.object({
  status: z.enum(["avoid_until_reviewed", "review_before_use", "insufficient_evidence"]),
  headline: z.string(),
  explanation: z.string()
});

export const medicationCheckAiSummarySchema = z.object({
  headline: z.string(),
  plainLanguageSummary: z.string(),
  whatTriggeredThis: z.string(),
  questionsForClinician: z.array(z.string()),
  confidenceNote: z.string(),
  generatedBy: z.enum(["openai", "deterministic_fallback"])
});

export const medicationCheckSideEffectSignalSchema = z.object({
  domain: z.enum(["bleeding_risk", "stomach_irritation", "liver_caution", "kidney_caution", "sedation"]),
  severity: z.enum(["low", "moderate", "high"]),
  sourceSections: z.array(z.string()),
  explanation: z.string()
});

export const medicationCheckSupportiveCareIdeaSchema = z.object({
  type: z.enum(["food", "hydration", "timing_discussion", "monitoring", "supplement", "avoidance", "general_support"]),
  label: z.string(),
  rationale: z.string(),
  candidateName: z.string().nullable(),
  requiresReview: z.boolean(),
  shouldCheckInteractions: z.boolean()
});

export const medicationCheckEvidenceItemSchema = z.object({
  type: z.enum([
    "explicit_label_interaction",
    "general_contraindication",
    "general_warning",
    "adverse_effect_context",
    "no_direct_label_match"
  ]),
  source: z.enum(["openfda", "dailymed"]),
  section: z.string(),
  foundInMedication: z.string(),
  medication: z.string(),
  excerpt: z.string(),
  reason: z.string()
});

export const medicationCheckResponseSchema = z.object({
  candidateMedication: z.object({
    input: z.string(),
    normalizedName: z.string(),
    rxcui: z.string()
  }),
  currentMedications: z.array(
    z.object({
      input: z.string(),
      normalizedName: z.string(),
      rxcui: z.string()
    })
  ),
  evidence: z.array(medicationCheckEvidenceItemSchema),
  summary: medicationCheckSummarySchema,
  aiSummary: medicationCheckAiSummarySchema,
  sideEffectSignals: z.array(medicationCheckSideEffectSignalSchema),
  supportiveCareIdeas: z.array(medicationCheckSupportiveCareIdeaSchema),
  disclaimer: z.string()
});

export const medicationSupportResponseSchema = z.object({
  candidateMedication: z.object({
    input: z.string(),
    normalizedName: z.string(),
    rxcui: z.string()
  }),
  currentMedications: z.array(
    z.object({
      input: z.string(),
      normalizedName: z.string(),
      rxcui: z.string()
    })
  ),
  sideEffectSignals: z.array(medicationCheckSideEffectSignalSchema),
  supportiveCareIdeas: z.array(medicationCheckSupportiveCareIdeaSchema),
  aiSummary: medicationCheckAiSummarySchema,
  interactionReviewNote: z.string(),
  disclaimer: z.string()
});

export type MedicationCheckRequest = z.infer<typeof medicationCheckRequestSchema>;
export type MedicationSupportRequest = z.infer<typeof medicationSupportRequestSchema>;
export type MedicationCheckSummary = z.infer<typeof medicationCheckSummarySchema>;
export type MedicationCheckAiSummary = z.infer<typeof medicationCheckAiSummarySchema>;
export type MedicationCheckSideEffectSignal = z.infer<typeof medicationCheckSideEffectSignalSchema>;
export type MedicationCheckSupportiveCareIdea = z.infer<typeof medicationCheckSupportiveCareIdeaSchema>;
export type MedicationCheckEvidenceItem = z.infer<typeof medicationCheckEvidenceItemSchema>;
export type MedicationCheckResponse = z.infer<typeof medicationCheckResponseSchema>;
export type MedicationSupportResponse = z.infer<typeof medicationSupportResponseSchema>;
export type MedicationCheckAiInsights = {
  aiSummary: MedicationCheckAiSummary;
  sideEffectSignals: MedicationCheckSideEffectSignal[];
  supportiveCareIdeas: MedicationCheckSupportiveCareIdea[];
};
