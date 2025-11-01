'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AutoSyncProps {
  userId: string;
  inatUsername: string;
  accessToken: string;
  lastSyncedAt: Date | null;
}

export function AutoSync({ userId, inatUsername, accessToken, lastSyncedAt }: AutoSyncProps) {
  const isSyncing = useRef(false);
  const [syncCount, setSyncCount] = useState(0);
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
          console.error('Auto-sync failed:', response.statusText);
          isSyncing.current = false;
        } else {
          const result = await response.json();
          console.log('Auto-sync completed:', result);

          // Check if there are more observations to sync
          if (result.data?.hasMore) {
            const remaining = result.data.totalAvailable - (result.data.newObservations || 0);
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
        isSyncing.current = false;
      }
    };

    // Trigger sync after a short delay (let UI settle)
    const timeout = setTimeout(triggerSync, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [userId, inatUsername, accessToken, lastSyncedAt, router, syncCount]);

  // This component renders nothing
  return null;
}
