import type { FastifyReply, FastifyRequest } from "fastify";

export async function checkMedicationRoute(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  return reply.code(501).send({
    message: "Medication check is not implemented yet."
  });
}
