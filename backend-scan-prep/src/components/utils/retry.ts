type RetryOptions = {
  retries?: number;
  delayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
};

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}) {
  const retries = options.retries ?? 0;
  const delayMs = options.delayMs ?? 0;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        break;
      }

      options.onRetry?.(attempt + 1, error);

      if (delayMs > 0) {
        await sleep(delayMs * (attempt + 1));
      }
    }
  }

  throw lastError;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
