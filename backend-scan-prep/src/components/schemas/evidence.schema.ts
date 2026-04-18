import { z } from "zod";

export const evidenceItemSchema = z.object({
  type: z.string(),
  source: z.string(),
  section: z.string(),
  medication: z.string(),
  excerpt: z.string()
});

export const labelSectionSchema = z.object({
  name: z.string(),
  title: z.string(),
  excerpt: z.string(),
  fullText: z.string()
});

export type LabelSection = z.infer<typeof labelSectionSchema>;
