import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { env } from "./components/config/env.js";
import { registerRoutes } from "./app/api/register-routes.js";
import { createLogger } from "./components/utils/logger.js";
import { createTraceContext, getTraceContextFromRequest } from "./components/utils/trace.js";

async function bootstrap() {
  const app = Fastify({
    logger: false
  });

  const logger = createLogger("server");

  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    const traceContext = createTraceContext(request.id, request.headers["x-trace-id"]);

    request.traceContext = traceContext;
    request.startedAt = Date.now();

    reply.header("x-request-id", traceContext.requestId);
    reply.header("x-trace-id", traceContext.traceId);

    logger.info("Incoming request", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      method: request.method,
      url: request.url
    });
  });

  app.addHook("onResponse", async (request: FastifyRequest, reply: FastifyReply) => {
    const traceContext = getTraceContextFromRequest(request);
    const startedAt = request.startedAt ?? Date.now();

    logger.info("Request completed", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const traceContext = getTraceContextFromRequest(request);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error("Unhandled request error", {
      requestId: traceContext.requestId,
      traceId: traceContext.traceId,
      method: request.method,
      url: request.url,
      errorMessage
    });

    void reply.code(500).send({
      error: "Internal Server Error",
      requestId: traceContext.requestId,
      traceId: traceContext.traceId
    });
  });

  registerRoutes(app);

  await app.listen({
    host: "0.0.0.0",
    port: env.PORT
  });

  logger.info("Backend server started", {
    port: env.PORT,
    environment: env.NODE_ENV
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start backend server", error);
  process.exit(1);
});
