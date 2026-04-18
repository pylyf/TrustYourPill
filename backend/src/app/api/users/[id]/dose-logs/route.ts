import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { SupabaseClientProvider } from "../../../../../components/integrations/supabase.client.js";
import { userIdParamsSchema } from "../../../../../components/schemas/user-medication.schema.js";
import { getTraceContextFromRequest } from "../../../../../components/utils/trace.js";

const toggleBodySchema = z.object({ medicationId: z.string().min(1) });
const db = new SupabaseClientProvider();

async function getTodayTakenIds(userId: string): Promise<string[]> {
  const today = new Date().toISOString().slice(0, 10);
  const client = db.getClient();
  const { data, error } = await client
    .from("dose_logs")
    .select("medication_id")
    .eq("user_id", userId)
    .eq("taken_date", today);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.medication_id);
}

export async function getTodayDoseLogsRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const paramsResult = userIdParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    return reply.code(400).send({ error: "Invalid user id", requestId: traceContext.requestId });
  }
  const takenIds = await getTodayTakenIds(paramsResult.data.id);
  return reply.code(200).send({ takenIds });
}

export async function toggleDoseLogRoute(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const traceContext = getTraceContextFromRequest(request);
  const paramsResult = userIdParamsSchema.safeParse(request.params);
  const bodyResult = toggleBodySchema.safeParse(request.body);

  if (!paramsResult.success || !bodyResult.success) {
    return reply.code(400).send({ error: "Invalid request", requestId: traceContext.requestId });
  }

  const userId = paramsResult.data.id;
  const { medicationId } = bodyResult.data;
  const today = new Date().toISOString().slice(0, 10);
  const client = db.getClient();

  // Check if already taken
  const { data: existing } = await client
    .from("dose_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("medication_id", medicationId)
    .eq("taken_date", today)
    .maybeSingle();

  if (existing) {
    await client
      .from("dose_logs")
      .delete()
      .eq("user_id", userId)
      .eq("medication_id", medicationId)
      .eq("taken_date", today);
  } else {
    await client
      .from("dose_logs")
      .insert({ user_id: userId, medication_id: medicationId, taken_date: today });
  }

  const takenIds = await getTodayTakenIds(userId);
  return reply.code(200).send({ takenIds });
}
