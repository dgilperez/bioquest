/**
 * React hook to monitor background classification queue status
 *
 * Polls the queue status API and provides real-time updates on classification progress
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface ClassificationStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  percentComplete: number;
  pendingObservations: number;
  isComplete: boolean;
}

interface UseClassificationStatusOptions {
  /**
   * Polling interval in milliseconds
   * @default 5000 (5 seconds)
   */
  pollInterval?: number;

  /**
   * Enable/disable polling
   * @default true
   */
  enabled?: boolean;
}

export function useClassificationStatus(options: UseClassificationStatusOptions = {}) {
  const { pollInterval = 5000, enabled = true } = options;
  const { data: session } = useSession();
  const [status, setStatus] = useState<ClassificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/queue/status');

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching classification status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Initial fetch
  useEffect(() => {
    if (enabled && session) {
      fetchStatus();
    }
  }, [enabled, session, fetchStatus]);

  // Polling
  useEffect(() => {
    if (!enabled || !session) {
      return undefined;
    }

    // Only poll if classification is not complete
    if (status && !status.isComplete) {
      const interval = setInterval(fetchStatus, pollInterval);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [enabled, session, status, pollInterval, fetchStatus]);

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}

