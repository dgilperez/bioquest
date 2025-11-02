/**
 * Automatic Sync Component (Refactored)
 *
 * Orchestrates background sync operations with automatic retry logic.
 * Much simpler now that retry logic is extracted to useRetryableSync hook.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRetryableSync } from '@/hooks/useRetryableSync';
import { RETRY_CONFIG } from '@/lib/sync/retry-strategy';

interface AutoSyncProps {
  userId: string;
  inatUsername: string;
  accessToken: string;
  lastSyncedAt: Date | null;
  hasMoreToSync?: boolean;
}

export function AutoSync({
  userId,
  inatUsername,
  accessToken,
  lastSyncedAt,
  hasMoreToSync
}: AutoSyncProps) {
  const router = useRouter();

  /**
   * Hook provides:
   * - Automatic retry with exponential backoff
   * - Error classification
   * - State management
   */
  const [retryState, { executeSync, reset }] = useRetryableSync(
    { userId, inatUsername, accessToken },
    // onSuccess callback
    (result) => {
      console.log('Auto-sync completed:', result);
      console.log('  hasMore:', result.data?.hasMore);
      console.log('  totalAvailable:', result.data?.totalAvailable);
      console.log('  totalSynced:', result.data?.totalSynced);

      // Check if there are more observations to sync
      if (result.data?.hasMore) {
        const remaining = (result.data.totalAvailable || 0) - (result.data.totalSynced || 0);
        console.log(`📥 More observations available (${remaining} remaining). Continuing sync...`);

        // Wait for DB update and background processing
        setTimeout(() => {
          reset(); // Reset retry state for next batch
          router.refresh(); // Trigger re-render with updated hasMoreToSync
        }, RETRY_CONFIG.BATCH_DELAY);
      } else {
        console.log('✅ All observations synced!');
        reset();

        // Refresh to show updated stats
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    },
    // onFatalError callback
    (error) => {
      console.error('❌ Fatal sync error:', error.message);
      // TODO: Show error notification to user
      // TODO: If auth error, redirect to sign-in
    }
  );

  /**
   * Check if sync should be triggered
   */
  const shouldSync = (): boolean => {
    // Always sync if there's an incomplete sync
    if (hasMoreToSync) {
      return true;
    }

    // Always sync if never synced before
    if (!lastSyncedAt) {
      return true;
    }

    // Don't auto-sync if recently synced (within 1 hour)
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return new Date(lastSyncedAt).getTime() < hourAgo;
  };

  /**
   * Check if existing sync is in progress
   */
  const checkExistingSync = async (): Promise<boolean> => {
    try {
      const progressRes = await fetch('/api/sync/progress');
      const progressData = await progressRes.json();

      if (progressData.status === 'syncing') {
        console.log('Auto-sync: Sync already in progress');
        // Dispatch event so progress UI shows up
        window.dispatchEvent(new Event('sync-started'));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking sync progress:', error);
      return false;
    }
  };

  /**
   * Main sync effect
   */
  useEffect(() => {
    // Don't sync if currently syncing or retrying
    if (retryState.isSyncing || retryState.isRetrying) {
      return;
    }

    const triggerSync = async () => {
      // Check if another sync is already running
      const alreadySyncing = await checkExistingSync();
      if (alreadySyncing) return;

      // Check if sync is needed
      if (!shouldSync()) {
        console.log('Auto-sync: Not needed');
        return;
      }

      console.log(`Auto-sync: Triggering sync...`);

      // Dispatch event to show progress UI
      window.dispatchEvent(new Event('sync-started'));

      // Execute sync (hook handles retries automatically)
      await executeSync();
    };

    // Trigger sync after short delay (let UI settle)
    const timeout = setTimeout(triggerSync, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    userId,
    inatUsername,
    accessToken,
    lastSyncedAt,
    hasMoreToSync,
    retryState.isSyncing,
    retryState.isRetrying,
    retryState.triggerCount, // Re-run when retry is triggered
    executeSync,
  ]);

  // This component renders nothing
  return null;
}
