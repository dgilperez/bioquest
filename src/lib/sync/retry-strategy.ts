/**
 * Retry Strategy Configuration and Logic
 *
 * Provides exponential backoff with jitter for API retry logic.
 * Prevents "thundering herd" problem where multiple clients retry simultaneously.
 */

/**
 * Retry configuration constants
 *
 * Why these values:
 * - MAX_RETRIES (5): Balances persistence vs. giving up on truly failed requests
 * - BASE_DELAY (3000ms): Long enough to allow transient issues to resolve
 * - MAX_DELAY (300000ms): 5 minutes prevents indefinite waits
 * - JITTER_FACTOR (0.2): ±20% randomness prevents synchronized retries across users
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts before giving up */
  MAX_RETRIES: 5,

  /** Base delay in milliseconds for first retry (3 seconds) */
  BASE_DELAY: 3000,

  /** Maximum delay in milliseconds (5 minutes) */
  MAX_DELAY: 300000,

  /** Jitter factor for randomization (±20%) to prevent thundering herd */
  JITTER_FACTOR: 0.2,

  /** Delay between successful sync batches (3 seconds) */
  BATCH_DELAY: 3000,
} as const;

/**
 * Calculate exponential backoff delay with jitter
 *
 * Formula: min(BASE_DELAY * 2^attemptNumber, MAX_DELAY) ± jitter
 *
 * Example progression:
 * - Attempt 0: ~3s  (3000ms ± 20%)
 * - Attempt 1: ~6s  (6000ms ± 20%)
 * - Attempt 2: ~12s (12000ms ± 20%)
 * - Attempt 3: ~24s (24000ms ± 20%)
 * - Attempt 4: ~48s (48000ms ± 20%)
 * - Capped at: 5m  (300000ms)
 *
 * @param attemptNumber - Zero-indexed retry attempt number
 * @returns Delay in milliseconds before next retry
 */
export function calculateBackoffDelay(attemptNumber: number): number {
  // Calculate exponential delay: 3000 * 2^attemptNumber
  const exponentialDelay = RETRY_CONFIG.BASE_DELAY * Math.pow(2, attemptNumber);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.MAX_DELAY);

  // Add jitter: ±20% randomization to prevent synchronized retries
  const jitterRange = cappedDelay * RETRY_CONFIG.JITTER_FACTOR;
  const jitter = jitterRange * (Math.random() - 0.5);

  return Math.floor(cappedDelay + jitter);
}

/**
 * Check if retry should be attempted
 *
 * @param attemptNumber - Current retry attempt (0-indexed)
 * @returns True if retry is allowed, false if max retries exceeded
 */
export function shouldRetry(attemptNumber: number): boolean {
  return attemptNumber < RETRY_CONFIG.MAX_RETRIES;
}

/**
 * Format retry delay for logging
 *
 * @param delayMs - Delay in milliseconds
 * @returns Human-readable string (e.g., "3.2s", "1.5m")
 */
export function formatDelay(delayMs: number): string {
  if (delayMs < 1000) {
    return `${delayMs}ms`;
  }

  if (delayMs < 60000) {
    return `${(delayMs / 1000).toFixed(1)}s`;
  }

  return `${(delayMs / 60000).toFixed(1)}m`;
}
