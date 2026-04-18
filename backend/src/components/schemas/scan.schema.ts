import { z } from "zod";
import { medicationSearchCandidateSchema } from "./medication.schema.js";

export const medicationScanRequestSchema = z
  .object({
    imageUrl: z.string().url().optional(),
    imageBase64DataUrl: z.string().startsWith("data:image/").max(16_000_000).optional(),
    hint: z.string().trim().min(1).max(160).optional()
  })
  .refine((value) => Boolean(value.imageUrl || value.imageBase64DataUrl), {
    message: "Provide imageUrl or imageBase64DataUrl.",
    path: ["imageUrl"]
  });

export const packagingTypeSchema = z.enum(["bottle", "box", "blister_pack", "printed_label", "other", "unknown"]);
export const scanConfidenceSchema = z.enum(["high", "medium", "low"]);
export const medicationScanMatchStatusSchema = z.enum(["matched", "ambiguous", "no_match"]);

export const medicationPackagingExtractionSchema = z.object({
  isMedicationPackaging: z.boolean(),
  packagingType: packagingTypeSchema,
  medicationName: z.string().nullable(),
  dosageText: z.string().nullable(),
  formText: z.string().nullable(),
  manufacturer: z.string().nullable(),
  visibleText: z.array(z.string()),
  confidence: scanConfidenceSchema,
  requiresReview: z.boolean()
});

export const medicationScanResponseSchema = z.object({
  source: z.literal("openai_vision"),
  model: z.string(),
  extraction: medicationPackagingExtractionSchema,
  match: z.object({
    status: medicationScanMatchStatusSchema,
    reason: z.string(),
    query: z.string().nullable(),
    candidateCount: z.number().int().nonnegative(),
    bestCandidate: medicationSearchCandidateSchema.nullable(),
    candidates: z.array(medicationSearchCandidateSchema)
  })
});

export type MedicationScanRequest = z.infer<typeof medicationScanRequestSchema>;
export type MedicationPackagingExtraction = z.infer<typeof medicationPackagingExtractionSchema>;
export type MedicationScanResponse = z.infer<typeof medicationScanResponseSchema>;
