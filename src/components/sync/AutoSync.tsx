'use client';

import { useEffect, useRef } from 'react';

interface AutoSyncProps {
  userId: string;
  inatUsername: string;
  accessToken: string;
  lastSyncedAt: Date | null;
}

export function AutoSync({ userId, inatUsername, accessToken, lastSyncedAt }: AutoSyncProps) {
  const hasSynced = useRef(false);

  useEffect(() => {
    // Prevent double sync (React StrictMode)
    if (hasSynced.current) return;

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
      if (!shouldSync()) {
        console.log('Auto-sync: Not needed (last sync was recent)');
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

          // Refresh the page to show new data
          window.location.reload();
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
  }, [userId, inatUsername, accessToken, lastSyncedAt]);

  // This component renders nothing
  return null;
}
