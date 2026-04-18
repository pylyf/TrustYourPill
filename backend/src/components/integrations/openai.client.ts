import { env } from "../config/env.js";
import type { MedicationPackagingExtraction, MedicationScanRequest } from "../schemas/scan.schema.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import type { TraceContext } from "../utils/trace.js";

type SummarizeGroundedEvidenceInput = {
  instructions: string;
  input: string;
  schema: Record<string, unknown>;
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_TIMEOUT_MS = 15_000;
export const DEFAULT_OPENAI_VISION_MODEL = "gpt-5.4-mini";

export class OpenAiClient {
  private readonly logger = createLogger("openai-client");

  async extractMedicationPackaging(
    input: MedicationScanRequest,
    traceContext?: TraceContext
  ): Promise<MedicationPackagingExtraction> {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const model = env.OPENAI_VISION_MODEL ?? DEFAULT_OPENAI_VISION_MODEL;
    const imageUrl = input.imageBase64DataUrl ?? input.imageUrl;

    if (!imageUrl) {
      throw new Error("Medication scan image is required.");
    }

    const normalizedImageUrl = normalizeImageUrl(imageUrl);
    const prompt = buildMedicationPackagingPrompt(input.hint);
    const startedAt = Date.now();

    const extraction = await withRetry(
      async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

        try {
          const apiResponse = await fetch(OPENAI_RESPONSES_URL, {
            method: "POST",
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
              "X-Client-Request-Id": traceContext?.traceId ?? crypto.randomUUID()
            },
            body: JSON.stringify({
              model,
              store: false,
              input: [
                {
                  role: "user",
                  content: [
                    {
                      type: "input_text",
                      text: prompt
                    },
                    {
                      type: "input_image",
                      image_url: normalizedImageUrl,
                      detail: "high"
                    }
                  ]
                }
              ],
              text: {
                format: {
                  type: "json_schema",
                  name: "medication_packaging_scan",
                  strict: true,
                  schema: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      isMedicationPackaging: { type: "boolean" },
                      packagingType: {
                        type: "string",
                        enum: ["bottle", "box", "blister_pack", "printed_label", "other", "unknown"]
                      },
                      medicationName: { type: ["string", "null"] },
                      dosageText: { type: ["string", "null"] },
                      formText: { type: ["string", "null"] },
                      manufacturer: { type: ["string", "null"] },
                      visibleText: {
                        type: "array",
                        items: { type: "string" }
                      },
                      confidence: {
                        type: "string",
                        enum: ["high", "medium", "low"]
                      },
                      requiresReview: { type: "boolean" }
                    },
                    required: [
                      "isMedicationPackaging",
                      "packagingType",
                      "medicationName",
                      "dosageText",
                      "formText",
                      "manufacturer",
                      "visibleText",
                      "confidence",
                      "requiresReview"
                    ]
                  }
                }
              }
            })
          });

          const body = (await apiResponse.json()) as Record<string, unknown>;

          if (!apiResponse.ok) {
            throw new Error(extractErrorMessage(body) ?? `OpenAI request failed with status ${apiResponse.status}`);
          }

          const outputText = extractOutputText(body);

          if (!outputText) {
            throw new Error("OpenAI response did not include structured output text.");
          }

          return JSON.parse(outputText) as MedicationPackagingExtraction;
        } finally {
          clearTimeout(timeout);
        }
      },
      {
        retries: 2,
        delayMs: 250,
        onRetry: (attempt, error) => {
          this.logger.warn("Retrying OpenAI medication scan", {
            requestId: traceContext?.requestId,
            traceId: traceContext?.traceId,
            attempt,
            errorMessage: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
    );

    this.logger.info("OpenAI medication scan completed", {
      requestId: traceContext?.requestId,
      traceId: traceContext?.traceId,
      model,
      hasMedicationName: Boolean(extraction.medicationName),
      packagingType: extraction.packagingType,
      confidence: extraction.confidence,
      durationMs: Date.now() - startedAt
    });

    return extraction;
  }

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
        const apiResponse = await fetch(OPENAI_RESPONSES_URL, {
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

function extractErrorMessage(body: Record<string, unknown>) {
  const error = body.error;

  if (!error || typeof error !== "object") {
    return null;
  }

  const message = (error as Record<string, unknown>).message;
  return typeof message === "string" && message.length > 0 ? message : null;
}

function buildMedicationPackagingPrompt(hint?: string) {
  const lines = [
    "Extract medication packaging details from the image.",
    "The image may show a prescription bottle, medication box, blister pack, or printed pharmacy label.",
    "Use only text that is actually visible in the image.",
    "Do not guess a medication name if the label is blurred or blocked.",
    "Return medicationName as the most likely medicine or product name printed on the packaging.",
    "Return dosageText for strengths like 200 mg or 20 mg/5 mL when visible.",
    "Return formText for form words like tablet, capsule, cream, or suspension when visible.",
    "Set isMedicationPackaging to false if the image does not look like medicine packaging or a medication label.",
    "Set requiresReview to true whenever the text is partial, low confidence, or multiple medicines appear."
  ];

  if (hint) {
    lines.push(`User hint: ${hint}`);
  }

  return lines.join("\n");
}

function normalizeImageUrl(imageUrl: string) {
  if (!imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  const matched = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);

  if (!matched) {
    throw new Error("Invalid image data URL. Expected format data:image/<type>;base64,<data>.");
  }

  const mimeType = matched[1].toLowerCase();
  const rawPayload = matched[2];

  if (mimeType === "image/svg+xml") {
    throw new Error("SVG is not supported for scan upload. Please upload PNG, JPEG, WEBP, or GIF.");
  }

  let payload = rawPayload.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (payload.length % 4)) % 4;
  payload += "=".repeat(paddingLength);

  if (!/^[A-Za-z0-9+/=]+$/.test(payload)) {
    throw new Error("Invalid base64 image payload. Re-export the image as PNG or JPEG and retry.");
  }

  return `data:${mimeType};base64,${payload}`;
}
