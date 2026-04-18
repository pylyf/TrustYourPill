type LogContext = Record<string, unknown> | undefined;

export function createLogger(scope: string) {
  return {
    info(message: string, context?: LogContext) {
      console.log(JSON.stringify(buildLogEntry("info", scope, message, context)));
    },
    warn(message: string, context?: LogContext) {
      console.warn(JSON.stringify(buildLogEntry("warn", scope, message, context)));
    },
    error(message: string, context?: LogContext) {
      console.error(JSON.stringify(buildLogEntry("error", scope, message, context)));
    }
  };
}

function buildLogEntry(
  level: "info" | "warn" | "error",
  scope: string,
  message: string,
  context?: LogContext
) {
  return {
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    ...context
  };
}
