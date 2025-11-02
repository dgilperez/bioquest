/**
 * Retryable Sync Hook
 *
 * Encapsulates retry logic for sync operations with exponential backoff.
 * Handles error classification, retry counting, and state management.
 */

import { useCallback, useRef, useState } from 'react';
import {
  calculateBackoffDelay,
  shouldRetry,
  formatDelay,
  RETRY_CONFIG,
} from '@/lib/sync/retry-strategy';
import {
  classifyHttpError,
  classifyNetworkError,
  formatErrorLog,
  type ErrorClassification,
} from '@/lib/sync/error-classifier';

export interface SyncRequest {
  userId: string;
  inatUsername: string;
  accessToken: string;
}

export interface SyncResponse {
  success: boolean;
  data?: {
    hasMore?: boolean;
    totalAvailable?: number;
    totalSynced?: number;
    [key: string]: any;
  };
  error?: string;
  message?: string;
}

export interface RetryState {
  /** Is sync currently in progress? */
  isSyncing: boolean;

  /** Is sync waiting to retry? */
  isRetrying: boolean;

  /** Current retry attempt number (0-indexed) */
  retryCount: number;

  /** Last error classification (if any) */
  lastError: ErrorClassification | null;

  /** Trigger count for useEffect dependency */
  triggerCount: number;
}

export interface RetryActions {
  /** Execute sync with automatic retry logic */
  executeSync: () => Promise<SyncResponse | null>;

  /** Reset retry state (call on success or when giving up) */
  reset: () => void;

  /** Manually trigger a retry */
  retry: () => void;
}

/**
 * Hook for retryable sync operations
 *
 * Handles:
 * - HTTP error classification
 * - Exponential backoff with jitter
 * - Max retry limits
 * - Fatal error detection
 *
 * @param syncRequest - Sync parameters (userId, token, etc.)
 * @param onSuccess - Callback when sync succeeds
 * @param onFatalError - Callback when fatal error occurs
 * @returns Retry state and actions
 */
export function useRetryableSync(
  syncRequest: SyncRequest,
  onSuccess?: (result: SyncResponse) => void,
  onFatalError?: (error: ErrorClassification) => void
): [RetryState, RetryActions] {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<ErrorClassification | null>(null);
  const [triggerCount, setTriggerCount] = useState(0);

  const isSyncing = useRef(false);
  const isRetrying = useRef(false);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * Execute sync with retry logic
   */
  const executeSync = useCallback(async (): Promise<SyncResponse | null> => {
    // Prevent concurrent syncs
    if (isSyncing.current || isRetrying.current) {
      console.log('Sync already in progress, skipping');
      return null;
    }

    isSyncing.current = true;

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncRequest),
      });

      // Parse response body
      let responseData: SyncResponse;
      try {
        responseData = await response.json();
      } catch {
        responseData = {
          success: false,
          error: response.statusText,
        };
      }

      // Success case
      if (response.ok) {
        console.log('✅ Sync completed successfully');
        isSyncing.current = false;
        setLastError(null);
        setRetryCount(0);

        if (onSuccess) {
          onSuccess(responseData);
        }

        return responseData;
      }

      // Error case - classify and decide retry strategy
      const errorClass = classifyHttpError(response.status, responseData);
      setLastError(errorClass);

      console.error(formatErrorLog(errorClass, retryCount));

      // Fatal error - stop immediately
      if (errorClass.isFatal) {
        console.error('❌ Fatal error detected, stopping sync');
        isSyncing.current = false;
        setRetryCount(0);

        if (onFatalError) {
          onFatalError(errorClass);
        }

        return null;
      }

      // Non-recoverable error (but not fatal) - stop without retry
      if (!errorClass.isRecoverable) {
        console.log('⚠️  Non-recoverable error, not retrying');
        isSyncing.current = false;
        setRetryCount(0);
        return null;
      }

      // Recoverable error - schedule retry if within limits
      if (shouldRetry(retryCount)) {
        const baseDelay = calculateBackoffDelay(retryCount);
        // Use suggested delay from error if it's reasonable, otherwise use backoff
        const retryDelay = errorClass.suggestedDelay > 0 && errorClass.suggestedDelay < RETRY_CONFIG.MAX_DELAY
          ? errorClass.suggestedDelay
          : baseDelay;

        console.log(
          `⏳ Scheduling retry ${retryCount + 1}/${RETRY_CONFIG.MAX_RETRIES} in ${formatDelay(retryDelay)}`
        );

        isRetrying.current = true;
        isSyncing.current = false;

        // Schedule retry
        retryTimeout.current = setTimeout(() => {
          isRetrying.current = false;
          setRetryCount(prev => prev + 1);
          setTriggerCount(prev => prev + 1); // Trigger re-execution
        }, retryDelay);

        return null;
      } else {
        // Max retries exceeded
        console.error(`❌ Max retries (${RETRY_CONFIG.MAX_RETRIES}) exceeded, giving up`);
        isSyncing.current = false;
        setRetryCount(0);
        return null;
      }
    } catch (error) {
      // Network/fetch error
      const errorClass = classifyNetworkError(error);
      setLastError(errorClass);

      console.error(formatErrorLog(errorClass, retryCount));

      // Network errors are always recoverable - retry if within limits
      if (shouldRetry(retryCount)) {
        const retryDelay = calculateBackoffDelay(retryCount);

        console.log(
          `⏳ Network error - scheduling retry ${retryCount + 1}/${RETRY_CONFIG.MAX_RETRIES} in ${formatDelay(retryDelay)}`
        );

        isRetrying.current = true;
        isSyncing.current = false;

        retryTimeout.current = setTimeout(() => {
          isRetrying.current = false;
          setRetryCount(prev => prev + 1);
          setTriggerCount(prev => prev + 1);
        }, retryDelay);

        return null;
      } else {
        console.error(`❌ Max retries (${RETRY_CONFIG.MAX_RETRIES}) exceeded after network errors`);
        isSyncing.current = false;
        setRetryCount(0);
        return null;
      }
    }
  }, [syncRequest, retryCount, onSuccess, onFatalError]);

  /**
   * Reset retry state
   */
  const reset = useCallback(() => {
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
    isSyncing.current = false;
    isRetrying.current = false;
    setRetryCount(0);
    setLastError(null);
  }, []);

  /**
   * Manually trigger a retry
   */
  const retry = useCallback(() => {
    if (isSyncing.current || isRetrying.current) {
      console.log('Sync already in progress, cannot manually retry');
      return;
    }
    setRetryCount(0); // Reset retry count for manual retry
    setTriggerCount(prev => prev + 1);
  }, []);

  const state: RetryState = {
    isSyncing: isSyncing.current,
    isRetrying: isRetrying.current,
    retryCount,
    lastError,
    triggerCount,
  };

  const actions: RetryActions = {
    executeSync,
    reset,
    retry,
  };

  return [state, actions];
}
