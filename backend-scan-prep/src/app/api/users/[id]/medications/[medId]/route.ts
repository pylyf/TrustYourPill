import type { FastifyReply, FastifyRequest } from "fastify";
import { userMedicationParamsSchema } from "../../../../../../components/schemas/user-medication.schema.js";
import { UserMedicationService } from "../../../../../../components/services/user-medication.service.js";
import { getTraceContextFromRequest } from "../../../../../../components/utils/trace.js";

const userMedicationService = new UserMedicationService();

export async function deleteUserMedicationRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const paramsResult = userMedicationParamsSchema.safeParse(request.params);

  if (!paramsResult.success) {
    return reply.code(400).send({
      error: "Invalid route params",
      details: paramsResult.error.issues,
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  }

  try {
    const result = await userMedicationService.deleteUserMedication(
      paramsResult.data.id,
      paramsResult.data.medId,
      traceContext
    );

    return reply.code(200).send(result);
  } catch (error) {
    if (error instanceof Error && error.message === "User medication not found.") {
      return reply.code(404).send({
        error: error.message,
        requestId: traceContext.requestId,
        traceId: traceContext.traceId
      });
    }

    throw error;
  }
}
