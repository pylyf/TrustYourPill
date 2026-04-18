import type { FastifyInstance } from "fastify";
import { registerMedicationRoutes } from "./medications/register-medication-routes.js";
import { registerUserMedicationRoutes } from "./users/register-user-medication-routes.js";
import { env } from "../../components/config/env.js";
import { getTraceContextFromRequest } from "../../components/utils/trace.js";

export function registerRoutes(app: FastifyInstance) {
  app.get("/health", async (request) => {
    const traceContext = getTraceContextFromRequest(request);

    return {
      status: "ok",
      service: "trust-your-pill-backend",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    };
  });

  registerMedicationRoutes(app);
  registerUserMedicationRoutes(app);
}
