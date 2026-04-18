import { env } from "../config/env.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import type { TraceContext } from "../utils/trace.js";

type SummarizeGroundedEvidenceInput = {
  instructions: string;
  input: string;
  schema: Record<string, unknown>;
};

export class OpenAiClient {
  private readonly logger = createLogger("openai-client");

  async summarizeGroundedEvidence(
    payload: SummarizeGroundedEvidenceInput,
    traceContext?: TraceContext
  ): Promise<Record<string, unknown> | null> {
    if (!env.OPENAI_API_KEY) {
      this.logger.warn("Skipping OpenAI summary because OPENAI_API_KEY is not configured", {
        requestId: traceContext?.requestId,
        traceId: traceContext?.traceId
      });

      return null;
    }

    const response = await withRetry(
      async () => {
        const apiResponse = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL,
            store: false,
            instructions: payload.instructions,
            input: payload.input,
            reasoning: {
              effort: "minimal"
            },
            text: {
              format: {
                type: "json_schema",
                name: "medication_check_ai_summary",
                schema: payload.schema,
                strict: true
              }
            }
          })
        });

        if (!apiResponse.ok) {
          throw new Error(`OpenAI Responses API request failed with status ${apiResponse.status}`);
        }

        const body = (await apiResponse.json()) as Record<string, unknown>;
        const outputText = extractOutputText(body);

        if (!outputText) {
          throw new Error("OpenAI Responses API returned no text output.");
        }

        return JSON.parse(outputText) as Record<string, unknown>;
      },
      {
        retries: 1,
        delayMs: 300,
        onRetry: (attempt, error) => {
          this.logger.warn("Retrying OpenAI grounded summary request", {
            requestId: traceContext?.requestId,
            traceId: traceContext?.traceId,
            attempt,
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    );

    this.logger.info("OpenAI grounded summary completed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      model: env.OPENAI_MODEL
    });

    return response;
  }
}

function extractOutputText(body: Record<string, unknown>) {
  const direct = body.output_text;

  if (typeof direct === "string" && direct.length > 0) {
    return direct;
  }

  const output = Array.isArray(body.output) ? body.output : [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as Array<Record<string, unknown>>)
      : [];

    for (const chunk of content) {
      const text = chunk.text;

      if (typeof text === "string" && text.length > 0) {
        return text;
      }
    }
  }

  return null;
}
