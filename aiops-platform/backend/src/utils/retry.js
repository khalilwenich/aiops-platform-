import { logger } from './logger.js';

export async function withRetry(fn, options = {}) {
  const {
    max = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry = null,
    label = 'operation'
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      logger.warn(`${label} attempt ${attempt}/${max} failed`, {
        error: error.message,
        attempt
      });

      if (attempt >= max) break;

      if (onRetry) {
        await onRetry(attempt, error);
      }

      const waitTime = backoff === 'exponential'
        ? delay * Math.pow(2, attempt - 1)
        : delay;

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  logger.error(`${label} failed after ${max} attempts`, { error: lastError?.message });
  throw lastError;
}
