/**
 * Automatic Sync Component (Refactored)
 *
 * Orchestrates background sync operations with automatic retry logic.
 * Much simpler now that retry logic is extracted to useRetryableSync hook.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRetryableSync } from '@/hooks/useRetryableSync';
import { RETRY_CONFIG } from '@/lib/sync/retry-strategy';
import { verifySyncStatus, shouldVerifySyncStatus } from '@/lib/sync/verify-status';
import { processUserPendingReconciliation } from '@/lib/sync/reconciliation-queue';

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
  const [verificationDone, setVerificationDone] = useState(false);
  const [verifiedHasMore, setVerifiedHasMore] = useState(hasMoreToSync);

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
    console.log('Auto-sync shouldSync check:', {
      hasMoreToSync: verifiedHasMore,
      lastSyncedAt,
      lastSyncAgeMinutes: lastSyncedAt
        ? Math.round((Date.now() - new Date(lastSyncedAt).getTime()) / 1000 / 60)
        : null,
    });

    // Always sync if there's an incomplete sync (using verified flag)
    if (verifiedHasMore) {
      console.log('  → YES: hasMoreToSync is true');
      return true;
    }

    // Always sync if never synced before
    if (!lastSyncedAt) {
      console.log('  → YES: never synced before');
      return true;
    }

    // Don't auto-sync if recently synced (within 1 hour)
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const result = new Date(lastSyncedAt).getTime() < hourAgo;
    console.log(`  → ${result ? 'YES' : 'NO'}: last sync was ${result ? '>' : '<'} 1 hour ago`);
    return result;
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
   * Verification effect - runs FIRST to detect and fix incomplete syncs
   * CRITICAL for crash recovery: Verifies hasMoreToSync is accurate
   */
  useEffect(() => {
    if (verificationDone) return;

    const runVerification = async () => {
      // Check if verification is needed
      if (!shouldVerifySyncStatus(hasMoreToSync ?? false, lastSyncedAt)) {
        console.log('📊 Sync status verification: Not needed, trusting flag');
        setVerificationDone(true);
        setVerifiedHasMore(hasMoreToSync ?? false);
        return;
      }

      try {
        console.log('📊 Running sync status verification...');
        const result = await verifySyncStatus(userId, inatUsername, accessToken);

        console.log(`📊 Verification complete:`, {
          hasMoreToSync: result.hasMoreToSync,
          localCount: result.localCount,
          inatTotal: result.inatTotal,
          corrected: result.corrected,
        });

        setVerifiedHasMore(result.hasMoreToSync);
        setVerificationDone(true);

        // Lazy processing: Check for pending reconciliation job and process it
        try {
          const processed = await processUserPendingReconciliation(userId);
          if (processed) {
            console.log('📊 Lazy-processed pending reconciliation job');
            router.refresh(); // Refresh to show updated data
          }
        } catch (error) {
          console.error('📊 Failed to process pending reconciliation:', error);
          // Don't block verification on lazy processing errors
        }

        // If flag was corrected, refresh to update UI
        if (result.corrected) {
          console.log('📊 Flag corrected, refreshing page data...');
          router.refresh();
        }
      } catch (error) {
        console.error('📊 Verification failed:', error);
        // On error, trust the prop value and mark verification as done
        setVerifiedHasMore(hasMoreToSync ?? false);
        setVerificationDone(true);
      }
    };

    // Run verification after short delay
    const timeout = setTimeout(runVerification, 500);
    return () => clearTimeout(timeout);
  }, [userId, inatUsername, accessToken, hasMoreToSync, lastSyncedAt, verificationDone, router]);

  /**
   * Main sync effect - runs AFTER verification completes
   */
  useEffect(() => {
    // Wait for verification to complete
    if (!verificationDone) {
      console.log('Auto-sync: Waiting for verification...');
      return;
    }
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
    verifiedHasMore, // Use verified flag instead of hasMoreToSync
    retryState.isSyncing,
    retryState.isRetrying,
    retryState.triggerCount, // Re-run when retry is triggered
    executeSync,
    verificationDone, // Wait for verification to complete
  ]);

  // This component renders nothing
  return null;
}
