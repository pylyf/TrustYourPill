import { z } from "zod";

export const symptomKeySchema = z.enum([
  'headache', 'nausea', 'fatigue', 'dizzy',
  'stomach', 'fever', 'cough', 'soreThroat', 'other'
]);

export const createSymptomLogBodySchema = z.object({
  symptoms: z.array(symptomKeySchema).default([]),
  otherText: z.string().trim().optional().nullable(),
  feelingGood: z.boolean().default(false),
});

export type CreateSymptomLogBody = z.infer<typeof createSymptomLogBodySchema>;
