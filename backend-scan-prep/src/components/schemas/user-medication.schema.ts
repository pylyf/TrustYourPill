import { z } from "zod";

export const userIdParamsSchema = z.object({
  id: z.string().trim().min(1)
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
  searchScore: z.number().nullable().optional()
});

export type CreateUserMedicationBody = z.infer<typeof createUserMedicationBodySchema>;
