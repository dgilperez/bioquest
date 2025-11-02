/**
 * Error Classifier Tests
 *
 * Tests HTTP error classification logic for retry decisions
 */

import { describe, it, expect } from 'vitest';
import {
  classifyHttpError,
  classifyNetworkError,
  formatErrorLog,
} from '../error-classifier';

describe('Error Classifier', () => {
  describe('classifyHttpError', () => {
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

  describe('classifyNetworkError', () => {
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

  describe('formatErrorLog', () => {
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

  describe('Integration: Error classification flow', () => {
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

  describe('Edge cases', () => {
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
});
