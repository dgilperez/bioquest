'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AutoSyncProps {
  userId: string;
  inatUsername: string;
  accessToken: string;
  lastSyncedAt: Date | null;
  hasMoreToSync?: boolean;
}

const MAX_RETRIES = 5; // Maximum retry attempts per batch
const BASE_RETRY_DELAY = 3000; // 3 seconds base delay
const MAX_RETRY_DELAY = 300000; // 5 minutes max delay

export function AutoSync({ userId, inatUsername, accessToken, lastSyncedAt, hasMoreToSync }: AutoSyncProps) {
  const isSyncing = useRef(false);
  const [syncCount, setSyncCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Don't sync if already syncing
    if (isSyncing.current) return;

    const checkExistingSync = async () => {
      try {
        // Check if sync is already in progress
        const progressRes = await fetch('/api/sync/progress');
        const progressData = await progressRes.json();

        if (progressData.status === 'syncing') {
          console.log('Auto-sync: Sync already in progress, not triggering new one');
          // Dispatch event so progress UI shows up
          window.dispatchEvent(new Event('sync-started'));
          isSyncing.current = true;
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error checking sync progress:', error);
        return false;
      }
    };

    const shouldSync = () => {
      // Always sync if there's an incomplete sync (hasMoreToSync is set)
      if (hasMoreToSync) {
        return true;
      }

      // Always sync if never synced before
      if (!lastSyncedAt) {
        return true;
      }

      // For first auto-sync, check if last sync was > 1 hour ago
      if (syncCount === 0) {
        const hourAgo = Date.now() - 60 * 60 * 1000;
        return new Date(lastSyncedAt).getTime() < hourAgo;
      }

      // For subsequent syncs in the session, always continue
      // (they're triggered by hasMore flag, not time-based)
      return true;
    };

    const triggerSync = async () => {
      // First check if sync is already running
      const alreadySyncing = await checkExistingSync();
      if (alreadySyncing) return;

      if (!shouldSync()) {
        console.log('Auto-sync: Not needed');
        return;
      }

      console.log(`Auto-sync: Triggering sync (batch ${syncCount + 1})...`);
      isSyncing.current = true;

      // Dispatch event to trigger progress polling
      window.dispatchEvent(new Event('sync-started'));

      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, inatUsername, accessToken }),
        });

        if (!response.ok) {
          // Parse error response to check if it's recoverable
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: response.statusText };
          }

          console.error('Auto-sync failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            retryCount,
          });

          // Check if error is recoverable
          const isRecoverable =
            response.status === 429 || // Rate limit
            response.status === 408 || // Timeout
            response.status >= 500 ||  // Server errors
            errorData.error?.includes('network') ||
            errorData.error?.includes('timeout') ||
            errorData.error?.includes('fetch');

          const isFatal =
            response.status === 401 || // Unauthorized
            response.status === 403;   // Forbidden

          if (isFatal) {
            console.error('❌ Fatal error - cannot retry. User must re-authenticate.');
            isSyncing.current = false;
            // TODO: Show error to user, suggest re-authentication
            return;
          }

          if (isRecoverable && retryCount < MAX_RETRIES) {
            // Calculate exponential backoff with jitter
            const exponentialDelay = Math.min(
              BASE_RETRY_DELAY * Math.pow(2, retryCount),
              MAX_RETRY_DELAY
            );
            // Add jitter (±20%) to prevent thundering herd
            const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
            const retryDelay = Math.floor(exponentialDelay + jitter);

            console.log(`⏳ Retrying sync in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

            setTimeout(() => {
              isSyncing.current = false;
              setRetryCount(prev => prev + 1);
              setSyncCount(prev => prev + 1); // Trigger retry
            }, retryDelay);
          } else if (retryCount >= MAX_RETRIES) {
            console.error(`❌ Max retries (${MAX_RETRIES}) exceeded. Giving up on this batch.`);
            isSyncing.current = false;
            // Reset retry count for next batch
            setRetryCount(0);
            // TODO: Show persistent error to user
          } else {
            console.error('❌ Non-recoverable error, not retrying.');
            isSyncing.current = false;
            setRetryCount(0);
          }
        } else {
          const result = await response.json();
          console.log('Auto-sync completed:', result);
          console.log('  hasMore:', result.data?.hasMore);
          console.log('  totalAvailable:', result.data?.totalAvailable);
          console.log('  totalSynced:', result.data?.totalSynced);

          // Reset retry count on success
          setRetryCount(0);

          // Check if there are more observations to sync
          if (result.data?.hasMore) {
            const remaining = (result.data.totalAvailable || 0) - (result.data.totalSynced || 0);
            console.log(`📥 More observations available (${remaining} remaining). Continuing sync...`);

            // Wait a moment for DB to update and background processing to complete
            setTimeout(() => {
              isSyncing.current = false;
              setSyncCount(prev => prev + 1); // Trigger next sync
            }, 3000);
          } else {
            console.log('✅ All observations synced!');
            isSyncing.current = false;

            // Refresh the page to show updated stats
            setTimeout(() => {
              router.refresh();
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Auto-sync error:', error);

        // Network/fetch errors are always recoverable
        if (retryCount < MAX_RETRIES) {
          const exponentialDelay = Math.min(
            BASE_RETRY_DELAY * Math.pow(2, retryCount),
            MAX_RETRY_DELAY
          );
          const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
          const retryDelay = Math.floor(exponentialDelay + jitter);

          console.log(`⏳ Network error - retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

          setTimeout(() => {
            isSyncing.current = false;
            setRetryCount(prev => prev + 1);
            setSyncCount(prev => prev + 1);
          }, retryDelay);
        } else {
          console.error(`❌ Max retries (${MAX_RETRIES}) exceeded after network errors.`);
          isSyncing.current = false;
          setRetryCount(0);
        }
      }
    };

    // Trigger sync after a short delay (let UI settle)
    const timeout = setTimeout(triggerSync, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [userId, inatUsername, accessToken, lastSyncedAt, hasMoreToSync, router, syncCount]);

  // This component renders nothing
  return null;
}
