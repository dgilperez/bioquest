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
  const hasSynced = useRef(false);
  const [isCheckingProgress, setIsCheckingProgress] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Prevent double sync (React StrictMode)
    if (hasSynced.current) return;

    const checkExistingSync = async () => {
      try {
        // Check if sync is already in progress
        const progressRes = await fetch('/api/sync/progress');
        const progressData = await progressRes.json();

        if (progressData.status === 'syncing') {
          console.log('Auto-sync: Sync already in progress, not triggering new one');
          // Dispatch event so progress UI shows up
          window.dispatchEvent(new Event('sync-started'));
          setIsCheckingProgress(false);
          hasSynced.current = true;
          return;
        }

        setIsCheckingProgress(false);
      } catch (error) {
        console.error('Error checking sync progress:', error);
        setIsCheckingProgress(false);
      }
    };

    const shouldSync = () => {
      // Always sync if never synced before
      if (!lastSyncedAt) {
        return true;
      }

      // Auto-sync if last sync was > 1 hour ago
      const hourAgo = Date.now() - 60 * 60 * 1000;
      return new Date(lastSyncedAt).getTime() < hourAgo;
    };

    const triggerSync = async () => {
      // First check if sync is already running
      await checkExistingSync();

      if (hasSynced.current || !shouldSync()) {
        console.log('Auto-sync: Not needed');
        return;
      }

      console.log('Auto-sync: Triggering sync...');
      hasSynced.current = true;

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
          hasSynced.current = false; // Allow retry
        } else {
          const result = await response.json();
          console.log('Auto-sync completed:', result);

          // Don't reload - let the progress UI handle completion
          // User will see celebration, then we refresh
          router.refresh();
        }
      } catch (error) {
        console.error('Auto-sync error:', error);
        hasSynced.current = false; // Allow retry
      }
    };

    // Trigger sync after a short delay (let UI settle)
    const timeout = setTimeout(triggerSync, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [userId, inatUsername, accessToken, lastSyncedAt, router]);

  // This component renders nothing
  return null;
}
