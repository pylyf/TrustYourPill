export function withCircuitBreaker<T>(operation: () => Promise<T>) {
  return operation();
}
