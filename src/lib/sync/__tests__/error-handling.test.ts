/**
 * Error Handling Tests
 *
 * Tests error classification, retry logic, and backoff strategies for sync operations
 */

import { describe, it, expect } from 'vitest';
import {
  classifyHttpError,
  classifyNetworkError,
  formatErrorLog,
} from '../error-classifier';
import {
  calculateBackoffDelay,
  shouldRetry,
  formatDelay,
  RETRY_CONFIG,
} from '../retry-strategy';

describe('Error Handling', () => {
  describe('Error Classification - HTTP Errors', () => {
    it('should classify 429 as recoverable rate limit error', () => {
      const result = classifyHttpError(429);

      expect(result.isRecoverable).toBe(true);
      expect(result.isFatal).toBe(false);
      expect(result.category).toBe('rate_limit');
      expect(result.suggestedDelay).toBe(60000); // 1 minute default
      expect(result.message).toContain('Rate limit');
    });

    it('should use custom retryAfter from response body', () => {
      const result = classifyHttpError(429, { retryAfter: 120000 }); // 2 minutes

      expect(result.suggestedDelay).toBe(120000);
    });

    it('should classify 408 as recoverable timeout error', () => {
      const result = classifyHttpError(408);

      expect(result.isRecoverable).toBe(true);
      expect(result.isFatal).toBe(false);
      expect(result.category).toBe('timeout');
      expect(result.suggestedDelay).toBe(5000); // 5 seconds
    });

    it('should classify 401 as fatal auth error', () => {
      const result = classifyHttpError(401);

      expect(result.isRecoverable).toBe(false);
      expect(result.isFatal).toBe(true);
      expect(result.category).toBe('auth_error');
      expect(result.suggestedDelay).toBe(0);
      expect(result.message).toContain('Authentication failed');
    });

    it('should classify 403 as fatal auth error', () => {
      const result = classifyHttpError(403);

      expect(result.isRecoverable).toBe(false);
      expect(result.isFatal).toBe(true);
      expect(result.category).toBe('auth_error');
    });

    it('should classify 409 as non-recoverable conflict', () => {
      const result = classifyHttpError(409);

      expect(result.isRecoverable).toBe(false);
      expect(result.isFatal).toBe(false); // Not fatal, just informational
      expect(result.category).toBe('conflict');
      expect(result.message).toContain('already in progress');
    });

    it('should classify 5xx as recoverable server error', () => {
      const statuses = [500, 502, 503, 504];

      statuses.forEach(status => {
        const result = classifyHttpError(status);

        expect(result.isRecoverable).toBe(true);
        expect(result.isFatal).toBe(false);
        expect(result.category).toBe('server_error');
        expect(result.suggestedDelay).toBe(5000);
      });
    });

    it('should detect network errors from response body keywords', () => {
      const testCases = [
        { error: 'network failure' },
        { message: 'timeout occurred' },
        { error: 'fetch failed' },
        { message: 'Network connection lost' },
      ];

      testCases.forEach(responseBody => {
        const result = classifyHttpError(400, responseBody); // Any status

        expect(result.isRecoverable).toBe(true);
        expect(result.category).toBe('network_error');
        expect(result.suggestedDelay).toBe(5000);
      });
    });

    it('should use custom message from response body', () => {
      const result = classifyHttpError(500, {
        message: 'Database connection failed',
      });

      expect(result.message).toBe('Database connection failed');
    });

    it('should handle unknown errors gracefully', () => {
      const result = classifyHttpError(418); // I'm a teapot (unused status)

      expect(result.isRecoverable).toBe(true); // Default to recoverable
      expect(result.isFatal).toBe(false);
      expect(result.category).toBe('unknown');
      expect(result.suggestedDelay).toBe(3000);
    });

    it('should handle 4xx errors (not auth) as unknown', () => {
      const clientErrors = [400, 404, 422];

      clientErrors.forEach(status => {
        const result = classifyHttpError(status);

        expect(result.category).toBe('unknown');
        expect(result.isRecoverable).toBe(true); // Default behavior
      });
    });

    it('should be case-insensitive when checking response body', () => {
      const testCases = [
        { error: 'NETWORK FAILURE' },
        { message: 'Timeout Occurred' },
        { error: 'FETCH Failed' },
      ];

      testCases.forEach(responseBody => {
        const result = classifyHttpError(400, responseBody);
        expect(result.category).toBe('network_error');
      });
    });
  });

  describe('Error Classification - Network Errors', () => {
    it('should classify Error objects as network errors', () => {
      const error = new Error('Failed to fetch');
      const result = classifyNetworkError(error);

      expect(result.isRecoverable).toBe(true);
      expect(result.isFatal).toBe(false);
      expect(result.category).toBe('network_error');
      expect(result.suggestedDelay).toBe(5000);
      expect(result.message).toContain('Failed to fetch');
    });

    it('should classify string errors as network errors', () => {
      const result = classifyNetworkError('Connection refused');

      expect(result.isRecoverable).toBe(true);
      expect(result.category).toBe('network_error');
      expect(result.message).toContain('Connection refused');
    });

    it('should handle unknown error types', () => {
      const result = classifyNetworkError({ code: 'ECONNREFUSED' });

      expect(result.isRecoverable).toBe(true);
      expect(result.category).toBe('network_error');
      expect(result.message).toContain('[object Object]'); // toString() result
    });

    it('should handle null/undefined gracefully', () => {
      const resultNull = classifyNetworkError(null);
      const resultUndefined = classifyNetworkError(undefined);

      expect(resultNull.category).toBe('network_error');
      expect(resultUndefined.category).toBe('network_error');
    });
  });

  describe('Error Log Formatting', () => {
    it('should format fatal errors correctly', () => {
      const classification = classifyHttpError(401);
      const log = formatErrorLog(classification, 0);

      expect(log).toContain('❌');
      expect(log).toContain('Fatal');
      expect(log).toContain('auth_error');
      expect(log).toContain('no retry');
    });

    it('should format non-recoverable errors correctly', () => {
      const classification = classifyHttpError(409); // Conflict
      const log = formatErrorLog(classification, 0);

      expect(log).toContain('⚠️');
      expect(log).toContain('conflict');
      expect(log).toContain('not retrying');
    });

    it('should format recoverable errors with attempt number', () => {
      const classification = classifyHttpError(429); // Rate limit
      const log = formatErrorLog(classification, 2); // 3rd attempt

      expect(log).toContain('⏳');
      expect(log).toContain('rate_limit');
      expect(log).toContain('attempt 3');
    });

    it('should include error message in log', () => {
      const classification = classifyHttpError(500, {
        message: 'Database overloaded',
      });
      const log = formatErrorLog(classification, 0);

      expect(log).toContain('Database overloaded');
    });
  });

  describe('Error Classification Integration', () => {
    it('should handle complete error response correctly', () => {
      const responseBody = {
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait 2 minutes.',
        recoverable: true,
        retryAfter: 120000,
      };

      const result = classifyHttpError(429, responseBody);

      expect(result.isRecoverable).toBe(true);
      expect(result.isFatal).toBe(false);
      expect(result.category).toBe('rate_limit');
      expect(result.suggestedDelay).toBe(120000);
      expect(result.message).toBe('Too many requests. Please wait 2 minutes.');
    });

    it('should prioritize status code over response body hints', () => {
      // Response says "network error" but status is 401 (auth)
      const responseBody = {
        error: 'network timeout',
      };

      const result = classifyHttpError(401, responseBody);

      // Should classify as auth error (status code takes precedence)
      expect(result.category).toBe('auth_error');
      expect(result.isFatal).toBe(true);
    });

    it('should handle empty response body gracefully', () => {
      const result = classifyHttpError(500, {});

      expect(result.category).toBe('server_error');
      expect(result.message).toBeTruthy(); // Has default message
    });

    it('should handle missing response body', () => {
      const result = classifyHttpError(503);

      expect(result.category).toBe('server_error');
      expect(result.message).toBeTruthy();
      expect(result.suggestedDelay).toBeGreaterThan(0);
    });
  });

  describe('Error Classification Edge Cases', () => {
    it('should handle extremely long error messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(10000);
      const result = classifyHttpError(500, { message: longMessage });

      expect(result.message).toBe(longMessage);
      expect(result.isRecoverable).toBe(true);
    });

    it('should handle special characters in error messages', () => {
      const specialMessage = 'Error: <script>alert("xss")</script> \n\t\r';
      const result = classifyHttpError(500, { message: specialMessage });

      expect(result.message).toBe(specialMessage);
    });

    it('should handle very large retryAfter values', () => {
      const result = classifyHttpError(429, { retryAfter: 999999999 });

      // Should accept it (caller will enforce MAX_DELAY)
      expect(result.suggestedDelay).toBe(999999999);
    });

    it('should handle negative retryAfter values', () => {
      const result = classifyHttpError(429, { retryAfter: -5000 });

      // Should use it as-is (negative would be caught by caller)
      expect(result.suggestedDelay).toBe(-5000);
    });

    it('should handle zero retryAfter', () => {
      const result = classifyHttpError(429, { retryAfter: 0 });

      expect(result.suggestedDelay).toBe(0);
    });
  });

  describe('Retry Strategy - Backoff Calculation', () => {
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

  describe('Retry Strategy - Retry Decision', () => {
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

  describe('Retry Strategy - Delay Formatting', () => {
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

  describe('Retry Strategy - Configuration', () => {
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

  describe('Retry Strategy - Integration', () => {
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
