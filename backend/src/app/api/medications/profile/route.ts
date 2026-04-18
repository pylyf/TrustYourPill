import type { FastifyReply, FastifyRequest } from "fastify";
import { medicationProfileQuerySchema } from "../../../../components/schemas/medication.schema.js";
import { MedicationProfileService } from "../../../../components/services/medication-profile.service.js";
import { createLogger } from "../../../../components/utils/logger.js";
import { getTraceContextFromRequest } from "../../../../components/utils/trace.js";

const medicationProfileService = new MedicationProfileService();
const logger = createLogger("medication-profile-route");

export async function medicationProfileRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const queryResult = medicationProfileQuerySchema.safeParse(request.query);

  if (!queryResult.success) {
    return reply.code(400).send({
      error: "Invalid medication profile query",
      details: queryResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }

  try {
    const profile = await medicationProfileService.getProfile(queryResult.data.name, traceContext);
    return reply.code(200).send(profile);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.warn("Medication profile lookup failed", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      name: queryResult.data.name,
      errorMessage
    });

    if (
      errorMessage === "Medication normalization failed." ||
      errorMessage === "Medication label not found." ||
      errorMessage === "Medication label sections not found."
    ) {
      return reply.code(404).send({
        error: errorMessage,
        requestId: traceContext.requestId,
        traceId: traceContext.traceId
      });
    }

    throw error;
  }
}
