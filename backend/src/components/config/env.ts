import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  OPENAI_VISION_MODEL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  OPENFDA_API_KEY: z.string().optional()
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  SUPABASE_URL: emptyToUndefined(parsedEnv.SUPABASE_URL),
  SUPABASE_PUBLISHABLE_KEY: emptyToUndefined(parsedEnv.SUPABASE_PUBLISHABLE_KEY),
  SUPABASE_SERVICE_ROLE_KEY: emptyToUndefined(parsedEnv.SUPABASE_SERVICE_ROLE_KEY),
  OPENAI_API_KEY: emptyToUndefined(parsedEnv.OPENAI_API_KEY),
  OPENAI_VISION_MODEL: emptyToUndefined(parsedEnv.OPENAI_VISION_MODEL),
  CORS_ORIGIN: emptyToUndefined(parsedEnv.CORS_ORIGIN),
  OPENFDA_API_KEY: emptyToUndefined(parsedEnv.OPENFDA_API_KEY)
};

function emptyToUndefined(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
