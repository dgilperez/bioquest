/**
 * Sentry Error Reporting for Rarity Classification Queue
 *
 * Captures and reports classification errors to Sentry with relevant context
 */

import * as Sentry from '@sentry/nextjs';
import { RETRY_CONFIG } from './retry-strategy';

export interface ClassificationErrorContext {
  userId: string;
  taxonId: number;
  taxonName?: string | null;
  queueItemId: string;
  attempts: number;
  isPermanentFailure: boolean;
}

/**
 * Report a classification error to Sentry
 *
 * @param error - The error that occurred during classification
 * @param context - Context about the classification attempt
 */
export function reportClassificationError(
  error: Error,
  context: ClassificationErrorContext
): void {
  // Only report permanent failures to Sentry to avoid noise
  // Temporary failures are expected and will be retried
  if (!context.isPermanentFailure) {
    return;
  }

  Sentry.captureException(error, {
    tags: {
      component: 'rarity-classification',
      errorType: 'permanent-failure',
      userId: context.userId,
      taxonId: context.taxonId.toString(),
    },
    contexts: {
      classification: {
        queueItemId: context.queueItemId,
        taxonId: context.taxonId,
        taxonName: context.taxonName || 'Unknown',
        attempts: context.attempts,
        maxAttempts: RETRY_CONFIG.MAX_ATTEMPTS,
        isPermanentFailure: context.isPermanentFailure,
      },
    },
    level: 'error',
    fingerprint: [
      'rarity-classification',
      context.queueItemId,
      error.message,
    ],
  });
}

/**
 * Report a batch of permanent failures
 * Useful when processing multiple items and want to batch report errors
 */
export function reportBatchFailures(
  failures: Array<{ error: Error; context: ClassificationErrorContext }>
): void {
  const permanentFailures = failures.filter(f => f.context.isPermanentFailure);

  if (permanentFailures.length === 0) {
    return;
  }

  // Report each permanent failure
  permanentFailures.forEach(({ error, context }) => {
    reportClassificationError(error, context);
  });

  // Also capture a summary event
  Sentry.captureMessage(
    `Batch classification: ${permanentFailures.length} permanent failures`,
    {
      level: 'warning',
      tags: {
        component: 'rarity-classification',
        errorType: 'batch-permanent-failures',
      },
      contexts: {
        batchSummary: {
          totalFailures: failures.length,
          permanentFailures: permanentFailures.length,
          retriableFailures: failures.length - permanentFailures.length,
          failedTaxonIds: permanentFailures.map(f => f.context.taxonId),
        },
      },
    }
  );
}

/**
 * Check if an error is retriable (network issues, rate limits, etc.)
 * vs permanent (invalid data, API errors)
 */
export function isRetriableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();

  // Network and temporary errors that should be retried
  const retriablePatterns = [
    'network',
    'timeout',
    'econnrefused',
    'econnreset',
    'etimedout',
    'rate limit',
    'too many requests',
    '429',
    '502',
    '503',
    '504',
  ];

  return retriablePatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Classify error severity for better Sentry organization
 */
export function getErrorSeverity(
  error: Error,
  context: ClassificationErrorContext
): Sentry.SeverityLevel {
  if (context.isPermanentFailure) {
    return 'error';
  }

  if (context.attempts >= RETRY_CONFIG.MAX_ATTEMPTS - 1) {
    return 'warning';
  }

  if (isRetriableError(error)) {
    return 'info';
  }

  return 'warning';
}
