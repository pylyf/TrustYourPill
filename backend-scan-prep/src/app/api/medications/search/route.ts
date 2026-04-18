import type { FastifyReply, FastifyRequest } from "fastify";
import { medicationSearchQuerySchema } from "../../../../components/schemas/medication.schema.js";
import { MedicationSearchService } from "../../../../components/services/medication-search.service.js";
import { createLogger } from "../../../../components/utils/logger.js";
import { getTraceContextFromRequest } from "../../../../components/utils/trace.js";

const medicationSearchService = new MedicationSearchService();
const logger = createLogger("search-medication-route");

export async function searchMedicationRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const queryResult = medicationSearchQuerySchema.safeParse(request.query);

  if (!queryResult.success) {
    logger.warn("Medication search validation failed", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      issues: queryResult.error.issues
    });

    return reply.code(400).send({
      error: "Invalid search query",
      details: queryResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }

  const result = await medicationSearchService.search(queryResult.data.q, traceContext);

  logger.info("Medication search request served", {
    requestId: traceContext.requestId,
    traceId: traceContext.traceId,
    query: result.query,
    candidateCount: result.candidateCount
  });

  return reply.code(200).send(result);
}
