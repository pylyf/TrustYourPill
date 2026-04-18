import { env } from "../config/env.js";
import type { MedicationPackagingExtraction, MedicationScanRequest } from "../schemas/scan.schema.js";
import { createLogger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import type { TraceContext } from "../utils/trace.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_TIMEOUT_MS = 15_000;
export const DEFAULT_OPENAI_VISION_MODEL = "gpt-5.4-mini";

type OpenAiResponsesApiResponse = {
  model?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

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
          const response = await fetch(OPENAI_RESPONSES_URL, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
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

          const body = (await response.json()) as OpenAiResponsesApiResponse;

          if (!response.ok) {
            const errorMessage = body.error?.message ?? `OpenAI request failed with status ${response.status}`;
            throw new Error(errorMessage);
          }

          const outputText = getOutputText(body);

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

  async summarizeGroundedEvidence() {
    throw new Error("OpenAiClient.summarizeGroundedEvidence is not implemented yet.");
  }
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

function getOutputText(body: OpenAiResponsesApiResponse) {
  if (typeof body.output_text === "string" && body.output_text.length > 0) {
    return body.output_text;
  }

  for (const item of body.output ?? []) {
    for (const contentItem of item.content ?? []) {
      if (contentItem.type === "output_text" && typeof contentItem.text === "string") {
        return contentItem.text;
      }
    }
  }

  return null;
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

  // Some web pickers return URL-safe base64 or include line breaks.
  let payload = rawPayload.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (payload.length % 4)) % 4;
  payload += "=".repeat(paddingLength);

  if (!/^[A-Za-z0-9+/=]+$/.test(payload)) {
    throw new Error("Invalid base64 image payload. Re-export the image as PNG or JPEG and retry.");
  }

  return `data:${mimeType};base64,${payload}`;
}
