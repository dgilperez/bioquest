/**
 * Sync Error Types and Codes
 *
 * Provides typed error handling for the sync system with clear error boundaries
 * and recovery guidance.
 */

/**
 * Sync Error Codes
 *
 * Categorized by phase for easy diagnosis and recovery
 */
export enum SyncErrorCode {
  // Initialization Errors (Phase 0)
  INIT_STATS_FETCH_FAILED = 'INIT_STATS_FETCH_FAILED',
  INIT_PROGRESS_FAILED = 'INIT_PROGRESS_FAILED',

  // Fetch Errors (Phase 1)
  FETCH_INAT_API_ERROR = 'FETCH_INAT_API_ERROR',
  FETCH_NETWORK_ERROR = 'FETCH_NETWORK_ERROR',
  FETCH_TIMEOUT = 'FETCH_TIMEOUT',
  FETCH_AUTH_ERROR = 'FETCH_AUTH_ERROR',
  FETCH_RATE_LIMIT = 'FETCH_RATE_LIMIT',

  // Location Update Errors (Phase 2)
  LOCATION_UPDATE_FAILED = 'LOCATION_UPDATE_FAILED',

  // Enrichment Errors (Phase 3)
  ENRICH_RARITY_CLASSIFICATION_FAILED = 'ENRICH_RARITY_CLASSIFICATION_FAILED',
  ENRICH_POINTS_CALCULATION_FAILED = 'ENRICH_POINTS_CALCULATION_FAILED',

  // Storage Errors (Phase 4 - Transaction)
  STORE_DATABASE_ERROR = 'STORE_DATABASE_ERROR',
  STORE_TRANSACTION_ROLLBACK = 'STORE_TRANSACTION_ROLLBACK',
  STORE_CONSTRAINT_VIOLATION = 'STORE_CONSTRAINT_VIOLATION',

  // Stats Calculation Errors (Phase 5 - Transaction)
  STATS_CALCULATION_FAILED = 'STATS_CALCULATION_FAILED',
  STATS_INAT_SPECIES_COUNT_FAILED = 'STATS_INAT_SPECIES_COUNT_FAILED',
  STATS_STREAK_CALCULATION_FAILED = 'STATS_STREAK_CALCULATION_FAILED',
  STATS_UPDATE_FAILED = 'STATS_UPDATE_FAILED',

  // Achievement Errors (Phase 6)
  ACHIEVEMENTS_CHECK_FAILED = 'ACHIEVEMENTS_CHECK_FAILED',
  LEADERBOARD_UPDATE_FAILED = 'LEADERBOARD_UPDATE_FAILED',

  // Background Processing Errors (Phase 7)
  QUEUE_CLASSIFICATION_FAILED = 'QUEUE_CLASSIFICATION_FAILED',
  BACKGROUND_PROCESSING_FAILED = 'BACKGROUND_PROCESSING_FAILED',

  // Unknown/Unhandled Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Sync Error Severity
 *
 * Determines how the error should be handled
 */
export enum SyncErrorSeverity {
  /**
   * Fatal: Sync must be aborted, user cannot proceed
   * Examples: Auth errors, database constraint violations
   */
  FATAL = 'FATAL',

  /**
   * Recoverable: Sync can be retried, temporary issue
   * Examples: Network errors, rate limits, timeouts
   */
  RECOVERABLE = 'RECOVERABLE',

  /**
   * Warning: Sync continues, but some functionality degraded
   * Examples: Background processing failed, leaderboard update failed
   */
  WARNING = 'WARNING',
}

/**
 * Recovery Strategy
 *
 * Guidance for how to recover from this error
 */
export interface RecoveryStrategy {
  /**
   * Should the user retry the sync?
   */
  canRetry: boolean;

  /**
   * Suggested delay before retry (in ms)
   */
  retryDelayMs?: number;

  /**
   * User-facing message explaining what went wrong
   */
  userMessage: string;

  /**
   * Technical details for debugging (not shown to user)
   */
  technicalDetails?: string;

  /**
   * Suggested action for the user
   */
  suggestedAction?: string;
}

/**
 * Sync Error Class
 *
 * Extended Error with sync-specific context
 */
export class SyncError extends Error {
  public readonly code: SyncErrorCode;
  public readonly severity: SyncErrorSeverity;
  public readonly phase: string;
  public readonly userId?: string;
  public readonly context?: Record<string, any>;
  public readonly recovery: RecoveryStrategy;

  constructor(
    code: SyncErrorCode,
    message: string,
    options: {
      severity: SyncErrorSeverity;
      phase: string;
      userId?: string;
      context?: Record<string, any>;
      cause?: Error;
      recovery?: Partial<RecoveryStrategy>;
    }
  ) {
    super(message);
    this.name = 'SyncError';
    this.code = code;
    this.severity = options.severity;
    this.phase = options.phase;
    this.userId = options.userId;
    this.context = options.context;

    // Set cause if provided (for error chaining)
    if (options.cause) {
      this.cause = options.cause;
    }

    // Build recovery strategy
    this.recovery = {
      canRetry: this.severity === SyncErrorSeverity.RECOVERABLE,
      userMessage: this.getUserMessage(),
      ...options.recovery,
    };

    // Maintain proper stack trace
    Error.captureStackTrace(this, SyncError);
  }

  /**
   * Get user-friendly error message based on error code
   */
  private getUserMessage(): string {
    const messages: Record<SyncErrorCode, string> = {
      // Initialization
      [SyncErrorCode.INIT_STATS_FETCH_FAILED]: 'Failed to load your sync progress. Please try again.',
      [SyncErrorCode.INIT_PROGRESS_FAILED]: 'Failed to initialize sync tracking. Please try again.',

      // Fetch
      [SyncErrorCode.FETCH_INAT_API_ERROR]: 'Unable to fetch observations from iNaturalist. The service may be temporarily unavailable.',
      [SyncErrorCode.FETCH_NETWORK_ERROR]: 'Network connection error. Please check your internet connection and try again.',
      [SyncErrorCode.FETCH_TIMEOUT]: 'Request to iNaturalist timed out. Please try again.',
      [SyncErrorCode.FETCH_AUTH_ERROR]: 'Authentication failed. Please sign out and sign in again.',
      [SyncErrorCode.FETCH_RATE_LIMIT]: 'Too many requests to iNaturalist. Please wait a few minutes and try again.',

      // Location
      [SyncErrorCode.LOCATION_UPDATE_FAILED]: 'Failed to update location information. Your observations were still synced.',

      // Enrichment
      [SyncErrorCode.ENRICH_RARITY_CLASSIFICATION_FAILED]: 'Failed to classify rarity for some observations. They were still synced.',
      [SyncErrorCode.ENRICH_POINTS_CALCULATION_FAILED]: 'Failed to calculate points. Please try syncing again.',

      // Storage
      [SyncErrorCode.STORE_DATABASE_ERROR]: 'Database error while saving observations. Please try again.',
      [SyncErrorCode.STORE_TRANSACTION_ROLLBACK]: 'Sync was interrupted and rolled back. No changes were made. Please try again.',
      [SyncErrorCode.STORE_CONSTRAINT_VIOLATION]: 'Data integrity error. Please contact support if this persists.',

      // Stats
      [SyncErrorCode.STATS_CALCULATION_FAILED]: 'Failed to calculate statistics. Please try again.',
      [SyncErrorCode.STATS_INAT_SPECIES_COUNT_FAILED]: 'Failed to fetch species count from iNaturalist. Your observations were still synced.',
      [SyncErrorCode.STATS_STREAK_CALCULATION_FAILED]: 'Failed to calculate observation streak. Your observations were still synced.',
      [SyncErrorCode.STATS_UPDATE_FAILED]: 'Failed to update your statistics. Please try syncing again.',

      // Achievements
      [SyncErrorCode.ACHIEVEMENTS_CHECK_FAILED]: 'Failed to check for new badges and achievements. Your observations were still synced.',
      [SyncErrorCode.LEADERBOARD_UPDATE_FAILED]: 'Failed to update leaderboards. Your observations were still synced.',

      // Background
      [SyncErrorCode.QUEUE_CLASSIFICATION_FAILED]: 'Failed to queue rarity classification. This will be retried automatically.',
      [SyncErrorCode.BACKGROUND_PROCESSING_FAILED]: 'Background processing encountered an error. This does not affect your sync.',

      // Unknown
      [SyncErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
    };

    return messages[this.code] || 'An error occurred during sync.';
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      phase: this.phase,
      userId: this.userId,
      context: this.context,
      recovery: this.recovery,
      stack: this.stack,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
    };
  }
}

/**
 * Classify an unknown error into a SyncError
 *
 * Attempts to determine the error code and severity from the error message/type
 */
export function classifyError(
  error: unknown,
  phase: string,
  userId?: string
): SyncError {
  // Already a SyncError
  if (error instanceof SyncError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCause = error instanceof Error ? error : undefined;

  // Classify based on error message patterns
  if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return new SyncError(
      SyncErrorCode.FETCH_NETWORK_ERROR,
      errorMessage,
      {
        severity: SyncErrorSeverity.RECOVERABLE,
        phase,
        userId,
        cause: errorCause,
        recovery: {
          retryDelayMs: 3000,
          suggestedAction: 'Check your internet connection and try again.',
        },
      }
    );
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return new SyncError(
      SyncErrorCode.FETCH_TIMEOUT,
      errorMessage,
      {
        severity: SyncErrorSeverity.RECOVERABLE,
        phase,
        userId,
        cause: errorCause,
        recovery: {
          retryDelayMs: 5000,
          suggestedAction: 'Wait a moment and try again.',
        },
      }
    );
  }

  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return new SyncError(
      SyncErrorCode.FETCH_AUTH_ERROR,
      errorMessage,
      {
        severity: SyncErrorSeverity.FATAL,
        phase,
        userId,
        cause: errorCause,
        recovery: {
          canRetry: false,
          suggestedAction: 'Sign out and sign in again to refresh your authentication.',
        },
      }
    );
  }

  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return new SyncError(
      SyncErrorCode.FETCH_RATE_LIMIT,
      errorMessage,
      {
        severity: SyncErrorSeverity.RECOVERABLE,
        phase,
        userId,
        cause: errorCause,
        recovery: {
          retryDelayMs: 60000, // 1 minute
          suggestedAction: 'Wait a minute before trying again.',
        },
      }
    );
  }

  if (errorMessage.includes('transaction') || errorMessage.includes('rollback')) {
    return new SyncError(
      SyncErrorCode.STORE_TRANSACTION_ROLLBACK,
      errorMessage,
      {
        severity: SyncErrorSeverity.RECOVERABLE,
        phase,
        userId,
        cause: errorCause,
        recovery: {
          retryDelayMs: 1000,
          suggestedAction: 'Try syncing again.',
        },
      }
    );
  }

  // Default: Unknown error
  return new SyncError(
    SyncErrorCode.UNKNOWN_ERROR,
    errorMessage,
    {
      severity: SyncErrorSeverity.RECOVERABLE,
      phase,
      userId,
      cause: errorCause,
      recovery: {
        retryDelayMs: 3000,
        suggestedAction: 'Try again. If the problem persists, contact support.',
      },
    }
  );
}
