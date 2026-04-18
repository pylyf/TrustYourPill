import type { FastifyReply, FastifyRequest } from "fastify";
import { medicationScanRequestSchema } from "../../../../components/schemas/scan.schema.js";
import { MedicationScanService } from "../../../../components/services/medication-scan.service.js";
import { createLogger } from "../../../../components/utils/logger.js";
import { getTraceContextFromRequest } from "../../../../components/utils/trace.js";

const medicationScanService = new MedicationScanService();
const logger = createLogger("scan-medication-route");

export async function scanMedicationRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const bodyResult = medicationScanRequestSchema.safeParse(request.body);

  if (!bodyResult.success) {
    logger.warn("Medication scan validation failed", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      issues: bodyResult.error.issues
    });

    return reply.code(400).send({
      error: "Invalid medication scan payload",
      details: bodyResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }

  try {
    const result = await medicationScanService.scan(bodyResult.data, traceContext);
    return reply.code(200).send(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error("Medication scan failed", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      errorMessage
    });

    const statusCode =
      errorMessage === "OPENAI_API_KEY is not configured."
        ? 503
        : isClientInputError(errorMessage)
          ? 400
          : 502;

    return reply.code(statusCode).send({
      error: errorMessage,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }
}

function isClientInputError(errorMessage: string) {
  return (
    errorMessage.startsWith("Invalid image data URL") ||
    errorMessage.startsWith("Invalid base64 image payload") ||
    errorMessage.startsWith("SVG is not supported")
  );
}
