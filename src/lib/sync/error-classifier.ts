/**
 * HTTP Error Classification for Sync Operations
 *
 * Centralizes error classification logic to determine:
 * - Is the error recoverable (should we retry)?
 * - Is the error fatal (must stop, no retries)?
 * - What delay should we use before retrying?
 */

export interface ErrorClassification {
  /** Can this error be retried? */
  isRecoverable: boolean;

  /** Is this a fatal error that requires user action? */
  isFatal: boolean;

  /** Suggested delay in milliseconds before retry */
  suggestedDelay: number;

  /** Error category for logging and metrics */
  category: ErrorCategory;

  /** Human-readable error message */
  message: string;
}

export type ErrorCategory =
  | 'rate_limit'      // 429 - Too many requests
  | 'timeout'         // 408 - Request timeout
  | 'server_error'    // 5xx - Server-side error
  | 'auth_error'      // 401/403 - Authentication/authorization failed
  | 'network_error'   // Network/fetch failure
  | 'conflict'        // 409 - Sync already in progress
  | 'unknown';        // Unclassified error

/**
 * Classify HTTP error response from sync API
 *
 * @param status - HTTP status code
 * @param responseBody - Parsed JSON response body (if available)
 * @returns Error classification with retry guidance
 */
export function classifyHttpError(
  status: number,
  responseBody?: {
    error?: string;
    message?: string;
    recoverable?: boolean;
    retryAfter?: number;
  }
): ErrorClassification {
  // Rate limit errors (429)
  if (status === 429) {
    return {
      isRecoverable: true,
      isFatal: false,
      suggestedDelay: responseBody?.retryAfter !== undefined ? responseBody.retryAfter : 60000, // 1 minute default
      category: 'rate_limit',
      message: responseBody?.message || 'Rate limit exceeded. Please wait before retrying.',
    };
  }

  // Timeout errors (408)
  if (status === 408) {
    return {
      isRecoverable: true,
      isFatal: false,
      suggestedDelay: 5000, // 5 seconds
      category: 'timeout',
      message: 'Request timed out. Retrying...',
    };
  }

  // Authentication errors (401, 403)
  if (status === 401 || status === 403) {
    return {
      isRecoverable: false,
      isFatal: true,
      suggestedDelay: 0,
      category: 'auth_error',
      message: responseBody?.message || 'Authentication failed. Please sign in again.',
    };
  }

  // Conflict error (409) - Sync already in progress
  if (status === 409) {
    return {
      isRecoverable: false, // Don't retry, another sync is already running
      isFatal: false,       // Not fatal, just informational
      suggestedDelay: 0,
      category: 'conflict',
      message: 'Sync already in progress.',
    };
  }

  // Server errors (5xx) - Temporary issues, retry
  if (status >= 500 && status < 600) {
    return {
      isRecoverable: true,
      isFatal: false,
      suggestedDelay: responseBody?.retryAfter || 5000, // 5 seconds default
      category: 'server_error',
      message: responseBody?.message || 'Server error. Retrying...',
    };
  }

  // Check response body for network/timeout hints
  const errorText = responseBody?.error?.toLowerCase() || '';
  const messageText = responseBody?.message?.toLowerCase() || '';
  const combinedText = `${errorText} ${messageText}`;

  if (
    combinedText.includes('network') ||
    combinedText.includes('timeout') ||
    combinedText.includes('fetch')
  ) {
    return {
      isRecoverable: true,
      isFatal: false,
      suggestedDelay: 5000,
      category: 'network_error',
      message: responseBody?.message || 'Network error. Retrying...',
    };
  }

  // Unknown error - treat as recoverable by default
  return {
    isRecoverable: true,
    isFatal: false,
    suggestedDelay: 3000,
    category: 'unknown',
    message: responseBody?.message || 'An error occurred. Retrying...',
  };
}

/**
 * Classify network/fetch errors (when request doesn't even reach server)
 *
 * @param error - Error object from fetch/network failure
 * @returns Error classification
 */
export function classifyNetworkError(error: unknown): ErrorClassification {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return {
    isRecoverable: true,
    isFatal: false,
    suggestedDelay: 5000,
    category: 'network_error',
    message: `Network error: ${errorMessage}`,
  };
}

/**
 * Format error for logging
 *
 * @param classification - Error classification
 * @param attemptNumber - Current retry attempt
 * @returns Formatted log message
 */
export function formatErrorLog(
  classification: ErrorClassification,
  attemptNumber: number
): string {
  const { category, message, isRecoverable, isFatal } = classification;

  if (isFatal) {
    return `❌ Fatal ${category}: ${message} (no retry)`;
  }

  if (!isRecoverable) {
    return `⚠️  ${category}: ${message} (not retrying)`;
  }

  return `⏳ ${category}: ${message} (attempt ${attemptNumber + 1})`;
}
