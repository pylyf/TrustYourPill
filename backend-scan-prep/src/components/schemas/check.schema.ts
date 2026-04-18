import { z } from "zod";

export const medicationCheckRequestSchema = z.object({
  candidateMedication: z.string().min(1),
  currentMedications: z.array(z.string().min(1)).default([])
});

export const medicationCheckSummarySchema = z.object({
  status: z.enum(["avoid_until_reviewed", "review_before_use", "insufficient_evidence"]),
  headline: z.string(),
  explanation: z.string()
});
