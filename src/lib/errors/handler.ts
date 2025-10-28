/**
 * Centralized error handling utilities
 */

import * as Sentry from '@sentry/nextjs';
import { AppError, ErrorCode, ErrorContext } from './types';

/**
 * Log error to console and Sentry
 */
export function logError(error: Error | AppError, context?: ErrorContext): void {
  // Always log to console in dev
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  // Send to Sentry if configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      // Add context to Sentry scope
      if (context) {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, { value: context[key] });
        });
      }

      // Add custom tags
      if (error instanceof AppError) {
        scope.setTag('error_code', error.code);
        scope.setTag('is_operational', error.isOperational);
        scope.setLevel(error.isOperational ? 'warning' : 'error');
      }

      // Capture exception
      Sentry.captureException(error);
    });
  }
}

/**
 * Create a user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    // Return the original message for operational errors (already user-friendly)
    if (error.isOperational) {
      return error.message;
    }

    // Generic message for non-operational errors
    switch (error.code) {
      case ErrorCode.API_RATE_LIMIT:
        return 'Too many requests. Please try again in a few minutes.';
      case ErrorCode.API_UNAUTHORIZED:
        return 'You need to sign in to continue.';
      case ErrorCode.API_NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorCode.API_TIMEOUT:
        return 'Request timed out. Please try again.';
      case ErrorCode.API_NETWORK:
        return 'Network error. Please check your connection.';
      case ErrorCode.INAT_RATE_LIMIT:
        return 'iNaturalist rate limit reached. Please try again later.';
      case ErrorCode.DB_CONNECTION:
        return 'Database connection error. Please try again.';
      case ErrorCode.SYNC_FAILED:
        return 'Failed to sync observations. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Generic message for unknown errors
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Handle error and return standardized response for API routes
 */
export function handleAPIError(error: Error | AppError): {
  error: string;
  code?: ErrorCode;
  statusCode: number;
} {
  // Log the error
  logError(error);

  // Determine status code
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  // Determine error code
  const code = error instanceof AppError ? error.code : undefined;

  return {
    error: getUserFriendlyMessage(error),
    code,
    statusCode,
  };
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown, fallbackMessage: string = 'An error occurred'): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message || fallbackMessage,
      ErrorCode.UNKNOWN,
      500,
      false
    );
  }

  return new AppError(
    fallbackMessage,
    ErrorCode.UNKNOWN,
    500,
    false
  );
}
