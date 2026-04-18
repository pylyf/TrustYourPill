import type { FastifyReply, FastifyRequest } from "fastify";
import { userIdParamsSchema } from "../../../../../components/schemas/user-medication.schema.js";
import { createSymptomLogBodySchema } from "../../../../../components/schemas/symptom-log.schema.js";
import { SymptomLogService } from "../../../../../components/services/symptom-log.service.js";
import { createLogger } from "../../../../../components/utils/logger.js";
import { getTraceContextFromRequest } from "../../../../../components/utils/trace.js";

const symptomLogService = new SymptomLogService();
const logger = createLogger("symptom-logs-route");

export async function listSymptomLogsRoute(
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
      traceId: traceContext.traceId,
    });
  }

  const result = await symptomLogService.listSymptomLogs(paramsResult.data.id, traceContext);

  return reply.code(200).send(result);
}

export async function createSymptomLogRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const paramsResult = userIdParamsSchema.safeParse(request.params);
  const bodyResult = createSymptomLogBodySchema.safeParse(request.body);

  if (!paramsResult.success) {
    return reply.code(400).send({
      error: "Invalid user id",
      details: paramsResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
    });
  }

  if (!bodyResult.success) {
    logger.warn("Create symptom log validation failed", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      issues: bodyResult.error.issues,
    });
    return reply.code(400).send({
      error: "Invalid symptom log payload",
      details: bodyResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
    });
  }

  const result = await symptomLogService.createSymptomLog(
    {
      userId: paramsResult.data.id,
      symptoms: bodyResult.data.symptoms,
      otherText: bodyResult.data.otherText ?? null,
      feelingGood: bodyResult.data.feelingGood,
    },
    traceContext
  );

  return reply.code(201).send(result);
}
