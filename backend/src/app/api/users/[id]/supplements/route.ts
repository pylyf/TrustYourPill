import type { FastifyReply, FastifyRequest } from "fastify";
import { userIdParamsSchema } from "../../../../../components/schemas/user-medication.schema.js";
import { MedicationRepository } from "../../../../../components/storage/medication.repository.js";
import { SupplementSourcesService } from "../../../../../components/services/supplement-sources.service.js";
import { createLogger } from "../../../../../components/utils/logger.js";
import { getTraceContextFromRequest } from "../../../../../components/utils/trace.js";

const medicationRepository = new MedicationRepository();
const supplementService = new SupplementSourcesService();
const logger = createLogger("supplements-route");

export async function getSupplementsRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const paramsResult = userIdParamsSchema.safeParse(request.params);

  if (!paramsResult.success) {
    return reply.code(400).send({
      error: "Invalid user id",
      details: paramsResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }

  const userId = paramsResult.data.id;

  try {
    const meds = await medicationRepository.listByUserId(userId, traceContext);

    const medicationNames = meds.map((m) => m.displayName);

    // Use candidateName presence as the signal — any idea with a specific product
    // name is purchasable regardless of how the AI classified its type.
    const supplementsFromAnalysis = meds.flatMap((m) =>
      (m.analysis?.supportiveCareIdeas ?? [])
        .filter((idea) => idea.candidateName != null)
        .map((idea) => ({
          ...idea,
          basedOn: [m.displayName]
        }))
    );

    const supplements = await supplementService.getSupplementsForUser(
      userId,
      medicationNames,
      supplementsFromAnalysis,
      traceContext
    );

    return reply.code(200).send({ supplements });
  } catch (err) {
    logger.error("Failed to get supplements", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      error: err instanceof Error ? err.message : "Unknown"
    });

    return reply.code(500).send({
      error: "Failed to retrieve supplements",
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }
}
