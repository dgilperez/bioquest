/**
 * Retry Strategy Tests
 *
 * Tests exponential backoff, jitter, and retry limits
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBackoffDelay,
  shouldRetry,
  formatDelay,
  RETRY_CONFIG,
} from '../retry-strategy';

describe('Retry Strategy', () => {
  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      // Attempt 0: 3000 * 2^0 = 3000ms
      const delay0 = calculateBackoffDelay(0);
      expect(delay0).toBeGreaterThanOrEqual(3000 * 0.8); // -20% jitter
      expect(delay0).toBeLessThanOrEqual(3000 * 1.2);    // +20% jitter

      // Attempt 1: 3000 * 2^1 = 6000ms
      const delay1 = calculateBackoffDelay(1);
      expect(delay1).toBeGreaterThanOrEqual(6000 * 0.8);
      expect(delay1).toBeLessThanOrEqual(6000 * 1.2);

      // Attempt 2: 3000 * 2^2 = 12000ms
      const delay2 = calculateBackoffDelay(2);
      expect(delay2).toBeGreaterThanOrEqual(12000 * 0.8);
      expect(delay2).toBeLessThanOrEqual(12000 * 1.2);

      // Attempt 3: 3000 * 2^3 = 24000ms
      const delay3 = calculateBackoffDelay(3);
      expect(delay3).toBeGreaterThanOrEqual(24000 * 0.8);
      expect(delay3).toBeLessThanOrEqual(24000 * 1.2);

      // Attempt 4: 3000 * 2^4 = 48000ms
      const delay4 = calculateBackoffDelay(4);
      expect(delay4).toBeGreaterThanOrEqual(48000 * 0.8);
      expect(delay4).toBeLessThanOrEqual(48000 * 1.2);
    });

    it('should cap delay at MAX_DELAY', () => {
      // Attempt 20 would be 3000 * 2^20 = 3,145,728,000ms (over 36 days!)
      // Should be capped at 300,000ms (5 minutes)
      const delay = calculateBackoffDelay(20);
      expect(delay).toBeLessThanOrEqual(RETRY_CONFIG.MAX_DELAY * 1.2); // With jitter
    });

    it('should apply jitter for randomization', () => {
      // Run calculation multiple times for same attempt
      const delays = Array.from({ length: 100 }, () => calculateBackoffDelay(2));

      // All delays should be different (extremely unlikely to get duplicates with jitter)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(90); // At least 90% unique

      // All delays should be within jitter range (±20%)
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(12000 * 0.8);
        expect(delay).toBeLessThanOrEqual(12000 * 1.2);
      });
    });

    it('should always return integer milliseconds', () => {
      for (let attempt = 0; attempt < 10; attempt++) {
        const delay = calculateBackoffDelay(attempt);
        expect(Number.isInteger(delay)).toBe(true);
      }
    });

    it('should handle edge case of attempt 0', () => {
      const delay = calculateBackoffDelay(0);
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThan(RETRY_CONFIG.BASE_DELAY * 1.5);
    });
  });

  describe('shouldRetry', () => {
    it('should allow retry within MAX_RETRIES limit', () => {
      expect(shouldRetry(0)).toBe(true);  // Attempt 1
      expect(shouldRetry(1)).toBe(true);  // Attempt 2
      expect(shouldRetry(2)).toBe(true);  // Attempt 3
      expect(shouldRetry(3)).toBe(true);  // Attempt 4
      expect(shouldRetry(4)).toBe(true);  // Attempt 5 (last allowed)
    });

    it('should not allow retry at or beyond MAX_RETRIES', () => {
      expect(shouldRetry(5)).toBe(false);  // Attempt 6 (exceeded)
      expect(shouldRetry(6)).toBe(false);  // Attempt 7
      expect(shouldRetry(100)).toBe(false); // Way beyond
    });

    it('should handle edge case of exactly MAX_RETRIES - 1', () => {
      const lastAllowedAttempt = RETRY_CONFIG.MAX_RETRIES - 1;
      expect(shouldRetry(lastAllowedAttempt)).toBe(true);
      expect(shouldRetry(lastAllowedAttempt + 1)).toBe(false);
    });
  });

  describe('formatDelay', () => {
    it('should format milliseconds correctly', () => {
      expect(formatDelay(500)).toBe('500ms');
      expect(formatDelay(999)).toBe('999ms');
    });

    it('should format seconds correctly', () => {
      expect(formatDelay(1000)).toBe('1.0s');
      expect(formatDelay(3200)).toBe('3.2s');
      expect(formatDelay(5500)).toBe('5.5s');
      expect(formatDelay(59999)).toBe('60.0s');
    });

    it('should format minutes correctly', () => {
      expect(formatDelay(60000)).toBe('1.0m');
      expect(formatDelay(90000)).toBe('1.5m');
      expect(formatDelay(300000)).toBe('5.0m');
      expect(formatDelay(600000)).toBe('10.0m');
    });

    it('should handle edge cases', () => {
      expect(formatDelay(0)).toBe('0ms');
      expect(formatDelay(1)).toBe('1ms');
      expect(formatDelay(999)).toBe('999ms');
      expect(formatDelay(1000)).toBe('1.0s');
    });
  });

  describe('RETRY_CONFIG constants', () => {
    it('should have sensible configuration values', () => {
      expect(RETRY_CONFIG.MAX_RETRIES).toBe(5);
      expect(RETRY_CONFIG.BASE_DELAY).toBe(3000);
      expect(RETRY_CONFIG.MAX_DELAY).toBe(300000);
      expect(RETRY_CONFIG.JITTER_FACTOR).toBe(0.2);
      expect(RETRY_CONFIG.BATCH_DELAY).toBe(3000);
    });

    it('should be immutable (readonly)', () => {
      // This test ensures TypeScript enforces immutability
      // If you uncomment the line below, it should fail TypeScript compilation
      // RETRY_CONFIG.MAX_RETRIES = 10; // TypeScript error: Cannot assign to 'MAX_RETRIES' because it is a read-only property
      expect(RETRY_CONFIG.MAX_RETRIES).toBe(5); // Verify it hasn't changed
    });
  });

  describe('Integration: Full retry sequence', () => {
    it('should produce expected delay progression', () => {
      const attempts = [0, 1, 2, 3, 4];
      const delays = attempts.map(attempt => calculateBackoffDelay(attempt));

      // Each delay should be roughly double the previous (within jitter range)
      for (let i = 1; i < delays.length; i++) {
        const ratio = delays[i] / delays[i - 1];
        // Should be roughly 2x, but accounting for jitter (±20% on each)
        // Worst case: delay[i] has -20% jitter, delay[i-1] has +20% jitter
        // ratio = (2 * 0.8) / 1.2 = 1.33
        // Best case: delay[i] has +20% jitter, delay[i-1] has -20% jitter
        // ratio = (2 * 1.2) / 0.8 = 3.0
        expect(ratio).toBeGreaterThan(1.3);
        expect(ratio).toBeLessThan(3.1);
      }
    });

    it('should respect MAX_RETRIES boundary', () => {
      // Before limit
      for (let i = 0; i < RETRY_CONFIG.MAX_RETRIES; i++) {
        expect(shouldRetry(i)).toBe(true);
      }

      // At and after limit
      for (let i = RETRY_CONFIG.MAX_RETRIES; i < RETRY_CONFIG.MAX_RETRIES + 10; i++) {
        expect(shouldRetry(i)).toBe(false);
      }
    });
  });
});
