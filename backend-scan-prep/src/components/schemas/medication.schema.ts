import { z } from "zod";

export const medicationSearchQuerySchema = z.object({
  q: z.string().trim().min(1)
});

export const medicationProfileQuerySchema = z.object({
  name: z.string().trim().min(1)
});

export const normalizedMedicationSchema = z.object({
  input: z.string(),
  normalizedName: z.string(),
  rxcui: z.string(),
  rxaui: z.string().nullable().optional(),
  source: z.string().optional(),
  searchScore: z.number().nullable().optional()
});

export const medicationSearchCandidateSchema = z.object({
  rxcui: z.string(),
  rxaui: z.string().nullable(),
  displayName: z.string(),
  normalizedName: z.string(),
  confidenceScore: z.number(),
  rank: z.number().int().positive(),
  source: z.string()
});

export const medicationSearchResponseSchema = z.object({
  query: z.string(),
  candidateCount: z.number().int().nonnegative(),
  candidates: z.array(medicationSearchCandidateSchema)
});

export const medicationProfileSourceSchema = z.object({
  source: z.enum(["openfda", "dailymed"]),
  queryStrategy: z.enum([
    "openfda.rxcui",
    "openfda.generic_name",
    "openfda.substance_name",
    "openfda.brand_name",
    "dailymed.rxcui"
  ]),
  splId: z.string().nullable(),
  splSetId: z.string().nullable(),
  brandNames: z.array(z.string()),
  genericNames: z.array(z.string()),
  substanceNames: z.array(z.string()),
  manufacturerNames: z.array(z.string()),
  productTypes: z.array(z.string()),
  routes: z.array(z.string()),
  effectiveTime: z.string().nullable()
});

export const medicationProfileResponseSchema = z.object({
  input: z.string(),
  normalizedMedication: normalizedMedicationSchema.extend({
    rxaui: z.string().nullable(),
    source: z.string(),
    searchScore: z.number().nullable()
  }),
  evidenceSource: medicationProfileSourceSchema,
  sectionCount: z.number().int().nonnegative(),
  sections: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      excerpt: z.string(),
      fullText: z.string()
    })
  )
});

export type MedicationSearchQuery = z.infer<typeof medicationSearchQuerySchema>;
export type MedicationSearchResponse = z.infer<typeof medicationSearchResponseSchema>;
export type MedicationProfileResponse = z.infer<typeof medicationProfileResponseSchema>;
