import { env } from "../config/env.js";
import { TABLES } from "../config/constants.js";
import { SupabaseClientProvider } from "../integrations/supabase.client.js";
import { createLogger } from "../utils/logger.js";
import type { TraceContext } from "../utils/trace.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const CACHE_TTL_HOURS = 24;

export type SupplementSource = {
  store: string;
  price: string;
  url: string;
};

export type SupplementRecommendation = {
  candidateName: string;
  label: string;
  rationale: string;
  sources: SupplementSource[];
  basedOn: string[];
};

type BaseSupplementItem = {
  candidateName: string;
  label: string;
  rationale: string;
  basedOn: string[];
};

export class SupplementSourcesService {
  private readonly logger = createLogger("supplement-sources-service");
  private readonly supabase = new SupabaseClientProvider();

  async getSupplementsForUser(
    userId: string,
    medicationNames: string[],
    supplementsFromAnalysis: Array<{ candidateName: string | null; label: string; rationale: string; basedOn: string[] }>,
    traceContext?: TraceContext
  ): Promise<SupplementRecommendation[]> {
    const cacheKey = `supplements_v1:${userId}`;
    const cached = await this.getCached(cacheKey);
    if (cached) {
      this.logger.info("Returning cached supplements", {
        requestId: traceContext?.requestId,
        userId
      });
      return cached;
    }

    // Filter valid supplements — candidateName must be non-null, then deduplicate
    const supplementMap = new Map<string, BaseSupplementItem>();

    for (const supplement of supplementsFromAnalysis) {
      if (!supplement.candidateName) {
        continue;
      }

      const key = supplement.candidateName.toLowerCase();
      const existing = supplementMap.get(key);

      if (!existing) {
        supplementMap.set(key, {
          candidateName: supplement.candidateName,
          label: supplement.label,
          rationale: supplement.rationale,
          basedOn: [...supplement.basedOn]
        });
        continue;
      }

      existing.basedOn = Array.from(new Set([...existing.basedOn, ...supplement.basedOn]));
    }

    let baseSupplements: BaseSupplementItem[] = Array.from(supplementMap.values());

    // Fallback: ask AI to recommend supplements when none are stored
    if (baseSupplements.length === 0 && medicationNames.length > 0) {
      this.logger.info("No supplements in analysis — requesting AI recommendations", {
        requestId: traceContext?.requestId,
        medicationCount: medicationNames.length
      });
      baseSupplements = await this.recommendSupplements(medicationNames, traceContext);
    }

    if (baseSupplements.length === 0) return [];

    // Enrich each supplement with real store sources
    const withSources = await this.getStoreSources(baseSupplements, traceContext);

    await this.setCached(cacheKey, withSources);
    return withSources;
  }

  private async recommendSupplements(
    medicationNames: string[],
    traceContext?: TraceContext
  ): Promise<BaseSupplementItem[]> {
    if (!env.OPENAI_API_KEY) return [];

    try {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          store: false,
          instructions:
            "You are a pharmacist assistant. Given a list of medications, recommend 2–4 supplements that would genuinely benefit the patient — either to support overall health or to mitigate known side effects. Return only safe, evidence-based suggestions with specific, accurate names.",
          input: `Patient is currently taking: ${medicationNames.join(", ")}. Recommend supplements.`,
          text: {
            format: {
              type: "json_schema",
              name: "supplement_recommendations",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  supplements: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        candidateName: { type: "string" },
                        label: { type: "string" },
                        rationale: { type: "string" }
                      },
                      required: ["candidateName", "label", "rationale"]
                    }
                  }
                },
                required: ["supplements"]
              }
            }
          }
        })
      });

      if (!response.ok) return [];
      const body = (await response.json()) as Record<string, unknown>;
      const text = extractOutputText(body);
      if (!text) return [];
      const parsed = JSON.parse(text) as { supplements: BaseSupplementItem[] };
      return (parsed.supplements ?? []).map((supplement) => ({
        ...supplement,
        basedOn: medicationNames
      }));
    } catch (err) {
      this.logger.warn("Failed to get AI supplement recommendations", {
        requestId: traceContext?.requestId,
        error: err instanceof Error ? err.message : "Unknown"
      });
      return [];
    }
  }

  private async getStoreSources(
    supplements: BaseSupplementItem[],
    traceContext?: TraceContext
  ): Promise<SupplementRecommendation[]> {
    if (!env.OPENAI_API_KEY) {
      return supplements.map((s) => ({ ...s, sources: [] }));
    }

    try {
      const names = supplements.map((s) => s.candidateName);

      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          store: false,
          instructions:
            "You are a supplement retail expert. For each supplement provided, give 2–3 reputable online retailers. The 'price' field MUST be a single dollar amount only — exactly like '$12.99' or '$8.99'. No ranges, no dashes, no extra text, no parentheses, no units. Just a dollar sign and a number. Use real store names (iHerb, Amazon, Thorne, Vitacost, Walmart, CVS, Nordic Naturals, Life Extension, etc.) and valid base URLs.",
          input: `Provide store purchase options for: ${names.join(", ")}`,
          text: {
            format: {
              type: "json_schema",
              name: "supplement_sources",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        supplementName: { type: "string" },
                        sources: {
                          type: "array",
                          items: {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                              store: { type: "string" },
                              price: { type: "string" },
                              url: { type: "string" }
                            },
                            required: ["store", "price", "url"]
                          }
                        }
                      },
                      required: ["supplementName", "sources"]
                    }
                  }
                },
                required: ["results"]
              }
            }
          }
        })
      });

      if (!response.ok) {
        return supplements.map((s) => ({ ...s, sources: [] }));
      }

      const body = (await response.json()) as Record<string, unknown>;
      const text = extractOutputText(body);
      if (!text) return supplements.map((s) => ({ ...s, sources: [] }));

      const parsed = JSON.parse(text) as {
        results: Array<{ supplementName: string; sources: SupplementSource[] }>;
      };

      return supplements.map((s) => {
        const needle = s.candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = parsed.results.find((r) => {
          const hay = r.supplementName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return hay === needle || hay.includes(needle) || needle.includes(hay);
        });
        return { ...s, sources: match?.sources ?? [] };
      });
    } catch (err) {
      this.logger.warn("Failed to get supplement store sources", {
        requestId: traceContext?.requestId,
        error: err instanceof Error ? err.message : "Unknown"
      });
      return supplements.map((s) => ({ ...s, sources: [] }));
    }
  }

  private async getCached(cacheKey: string): Promise<SupplementRecommendation[] | null> {
    try {
      const client = this.supabase.getClient();
      const nowIso = new Date().toISOString();
      const { data } = await client
        .from(TABLES.medicationEvidenceCache)
        .select("raw_payload")
        .eq("lookup_key", cacheKey)
        .gt("expires_at", nowIso)
        .maybeSingle();

      if (!data) return null;
      const payload = data.raw_payload as { supplements?: SupplementRecommendation[] };
      return payload.supplements ?? null;
    } catch {
      return null;
    }
  }

  private async setCached(cacheKey: string, supplements: SupplementRecommendation[]): Promise<void> {
    try {
      const client = this.supabase.getClient();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000);

      await client.from(TABLES.medicationEvidenceCache).upsert(
        {
          lookup_key: cacheKey,
          rxcui: "supplement",
          source: "openai",
          raw_payload: { supplements },
          parsed_evidence: {},
          fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        },
        { onConflict: "lookup_key" }
      );
    } catch {
      // Cache write failure is non-fatal
    }
  }
}

function extractOutputText(body: Record<string, unknown>): string | null {
  const output = body.output;
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (item && typeof item === "object" && (item as Record<string, unknown>).type === "message") {
      const content = (item as Record<string, unknown>).content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (
            c &&
            typeof c === "object" &&
            (c as Record<string, unknown>).type === "output_text"
          ) {
            return (c as Record<string, unknown>).text as string;
          }
        }
      }
    }
  }
  return null;
}
