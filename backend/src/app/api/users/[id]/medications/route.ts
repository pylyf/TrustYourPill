import type { FastifyReply, FastifyRequest } from "fastify";
import { createUserMedicationBodySchema, userIdParamsSchema } from "../../../../../components/schemas/user-medication.schema.js";
import { UserMedicationService } from "../../../../../components/services/user-medication.service.js";
import { createLogger } from "../../../../../components/utils/logger.js";
import { getTraceContextFromRequest } from "../../../../../components/utils/trace.js";

const userMedicationService = new UserMedicationService();
const logger = createLogger("user-medications-route");

export async function listUserMedicationsRoute(
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

  const result = await userMedicationService.listUserMedications(paramsResult.data.id, traceContext);

  return reply.code(200).send(result);
}

export async function saveUserMedicationRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const paramsResult = userIdParamsSchema.safeParse(request.params);
  const bodyResult = createUserMedicationBodySchema.safeParse(request.body);

  if (!paramsResult.success) {
    return reply.code(400).send({
      error: "Invalid user id",
      details: paramsResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }

  if (!bodyResult.success) {
    logger.warn("Save user medication validation failed", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      issues: bodyResult.error.issues
    });

    return reply.code(400).send({
      error: "Invalid medication payload",
      details: bodyResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }

  const result = await userMedicationService.saveUserMedication(
    {
      userId: paramsResult.data.id,
      ...bodyResult.data,
      analysis: bodyResult.data.analysis ?? null,
    },
    traceContext
  );

  return reply.code(201).send(result);
}
