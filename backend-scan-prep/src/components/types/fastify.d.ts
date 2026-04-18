import "fastify";
import type { TraceContext } from "../utils/trace.js";

declare module "fastify" {
  interface FastifyRequest {
    startedAt?: number;
    traceContext?: TraceContext;
  }
}
