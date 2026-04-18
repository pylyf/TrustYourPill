type TraceHeaderValue = string | string[] | undefined;

export type TraceContext = {
  requestId: string;
  traceId: string;
};

export function createTraceContext(requestId?: string, traceHeaderValue?: TraceHeaderValue): TraceContext {
  const incomingTraceId = Array.isArray(traceHeaderValue) ? traceHeaderValue[0] : traceHeaderValue;

  return {
    requestId: requestId ?? crypto.randomUUID(),
    traceId: incomingTraceId ?? crypto.randomUUID()
  };
}

export function getTraceContextFromRequest(request: { id: string; traceContext?: TraceContext }): TraceContext {
  return request.traceContext ?? createTraceContext(request.id);
}
