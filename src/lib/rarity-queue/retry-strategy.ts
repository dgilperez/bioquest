/**
 * Retry Strategy for Rarity Classification Queue
 *
 * Implements exponential backoff with max retries to prevent infinite retry loops
 * while giving transient errors a chance to resolve.
 */

export const RETRY_CONFIG = {
  /**
   * Maximum number of retry attempts before marking as permanently failed
   */
  MAX_ATTEMPTS: 3,

  /**
   * Backoff delays in milliseconds for each attempt
   * - Attempt 1: 1 minute
   * - Attempt 2: 5 minutes
   * - Attempt 3: 30 minutes
   */
  BACKOFF_DELAYS: [
    60 * 1000,      // 1 minute
    5 * 60 * 1000,  // 5 minutes
    30 * 60 * 1000, // 30 minutes
  ],
} as const;

/**
 * Determine if a failed queue item should be retried
 */
export function shouldRetry(attempts: number): boolean {
  return attempts < RETRY_CONFIG.MAX_ATTEMPTS;
}

/**
 * Calculate when the next retry should occur based on attempt count
 */
export function getNextRetryDelay(attempts: number): number {
  const index = Math.min(attempts, RETRY_CONFIG.BACKOFF_DELAYS.length - 1);
  return RETRY_CONFIG.BACKOFF_DELAYS[index];
}

/**
 * Check if enough time has passed since last attempt to retry
 */
export function isReadyForRetry(lastAttemptAt: Date | null, attempts: number): boolean {
  if (!lastAttemptAt) return true;

  const now = new Date();
  const timeSinceLastAttempt = now.getTime() - lastAttemptAt.getTime();
  const requiredDelay = getNextRetryDelay(attempts - 1); // attempts is already incremented

  return timeSinceLastAttempt >= requiredDelay;
}

/**
 * Get a human-readable description of retry status
 */
export function getRetryStatusMessage(attempts: number, lastAttemptAt: Date | null): string {
  if (attempts === 0) {
    return 'First attempt';
  }

  if (attempts >= RETRY_CONFIG.MAX_ATTEMPTS) {
    return `Failed after ${RETRY_CONFIG.MAX_ATTEMPTS} attempts - permanently failed`;
  }

  const nextRetryIn = lastAttemptAt
    ? getNextRetryDelay(attempts - 1) - (Date.now() - lastAttemptAt.getTime())
    : 0;

  if (nextRetryIn > 0) {
    const minutes = Math.ceil(nextRetryIn / (60 * 1000));
    return `Retry ${attempts} of ${RETRY_CONFIG.MAX_ATTEMPTS} - next retry in ${minutes}m`;
  }

  return `Retry ${attempts} of ${RETRY_CONFIG.MAX_ATTEMPTS} - ready to retry`;
}
