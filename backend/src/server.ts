import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { env } from "./components/config/env.js";
import { registerRoutes } from "./app/api/register-routes.js";
import { createLogger } from "./components/utils/logger.js";
import { createTraceContext, getTraceContextFromRequest } from "./components/utils/trace.js";

async function bootstrap() {
  const app = Fastify({
    logger: false,
    bodyLimit: 1073741824 // 1 GB – no effective limit for hackathon
  });

  const logger = createLogger("server");
  const defaultCorsOrigin = "http://localhost:8081";

  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    const traceContext = createTraceContext(request.id, request.headers["x-trace-id"]);
    const requestOrigin = typeof request.headers.origin === "string" ? request.headers.origin : null;
    const allowedOrigin = env.CORS_ORIGIN ?? requestOrigin ?? defaultCorsOrigin;

    request.traceContext = traceContext;
    request.startedAt = Date.now();

    reply.header("access-control-allow-origin", allowedOrigin);
    reply.header("vary", "Origin");
    reply.header("access-control-allow-methods", "GET,POST,DELETE,OPTIONS");
    reply.header("access-control-allow-headers", "Content-Type, Authorization, X-Trace-Id");
    reply.header("access-control-expose-headers", "x-request-id, x-trace-id");

    reply.header("x-request-id", traceContext.requestId);
    reply.header("x-trace-id", traceContext.traceId);

    if (request.method === "OPTIONS") {
      await reply.code(204).send();
      return;
    }

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
