import type { FastifyReply, FastifyRequest } from "fastify";
import { MedicationCheckAgent } from "../../../../components/agents/medication-check-agent.js";
import { medicationCheckRequestSchema } from "../../../../components/schemas/check.schema.js";
import { createLogger } from "../../../../components/utils/logger.js";
import { getTraceContextFromRequest } from "../../../../components/utils/trace.js";

const medicationCheckAgent = new MedicationCheckAgent();
const logger = createLogger("medication-check-route");

export async function checkMedicationRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const bodyResult = medicationCheckRequestSchema.safeParse(request.body);

  if (!bodyResult.success) {
    return reply.code(400).send({
      error: "Invalid medication check payload",
      details: bodyResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }

  try {
    const result = await medicationCheckAgent.run(
      bodyResult.data.candidateMedication,
      bodyResult.data.currentMedications,
      traceContext
    );

    return reply.code(200).send(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.warn("Medication check failed", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
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
