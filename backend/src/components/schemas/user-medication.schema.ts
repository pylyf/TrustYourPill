import { z } from "zod";

export const userIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

const medicationAnalysisSchema = z.object({
  summary: z.object({
    status: z.enum(['avoid_until_reviewed', 'review_before_use', 'insufficient_evidence', 'safe']),
    headline: z.string(),
    explanation: z.string(),
  }),
  aiSummary: z.object({
    headline: z.string(),
    plainLanguageSummary: z.string(),
    whatTriggeredThis: z.string(),
    questionsForClinician: z.array(z.string()),
  }),
  sideEffectSignals: z.array(z.object({
    domain: z.string(),
    severity: z.string(),
    explanation: z.string(),
  })).optional(),
  supportiveCareIdeas: z.array(z.object({
    type: z.string(),
    label: z.string(),
    rationale: z.string(),
    candidateName: z.string(),
  })).optional(),
});

export const userMedicationParamsSchema = z.object({
  id: z.string().trim().min(1),
  medId: z.string().uuid()
});

export const createUserMedicationBodySchema = z.object({
  inputName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  normalizedName: z.string().trim().min(1),
  rxcui: z.string().trim().min(1),
  rxaui: z.string().trim().min(1).nullable().optional(),
  source: z.string().trim().min(1),
  searchScore: z.number().nullable().optional(),
  scheduleTimes: z.array(z.string()).optional().default([]),
  dosageText: z.string().trim().optional().nullable(),
  analysis: medicationAnalysisSchema.optional().nullable(),
});

export type CreateUserMedicationBody = z.infer<typeof createUserMedicationBodySchema>;
