'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  queueAction,
  processQueue,
  getQueueCount,
  type QueuedAction,
} from '@/lib/offline-queue';

export function useOfflineQueue() {
  const [queueCount, setQueueCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    succeeded: number;
    failed: number;
    timestamp: number;
  } | null>(null);

  /**
   * Manually trigger queue processing
   */
  const tryProcessQueue = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await processQueue();
      setLastSyncResult({
        succeeded: result.succeeded,
        failed: result.failed,
        timestamp: Date.now(),
      });
      setQueueCount(getQueueCount());

      return result;
    } catch (error) {
      console.error('Failed to process queue:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  /**
   * Add an action to the queue
   */
  const addToQueue = useCallback(
    (type: QueuedAction['type'], payload: any) => {
      queueAction(type, payload);
      setQueueCount(getQueueCount());
    },
    []
  );

  // Update queue count on mount and when window regains focus
  useEffect(() => {
    const updateCount = () => setQueueCount(getQueueCount());

    updateCount();
    window.addEventListener('focus', updateCount);

    return () => window.removeEventListener('focus', updateCount);
  }, []);

  // Auto-process queue when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      if (getQueueCount() > 0) {
        await tryProcessQueue();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => window.removeEventListener('online', handleOnline);
  }, [tryProcessQueue]);

  return {
    queueCount,
    isProcessing,
    lastSyncResult,
    addToQueue,
    tryProcessQueue,
  };
}
