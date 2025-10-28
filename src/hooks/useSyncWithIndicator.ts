'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { queueAction, processQueue } from '@/lib/offline-queue';

export function useSyncWithIndicator(setIsSyncing: (syncing: boolean) => void) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasSynced.current || status !== 'authenticated' || !session?.user) {
      return;
    }

    const syncData = async () => {
      try {
        setIsSyncing(true);
        console.log('🔄 Auto-syncing data in background...');

        // First, process any queued offline actions
        try {
          const queueResult = await processQueue();
          if (queueResult.succeeded > 0) {
            console.log(`✅ Processed ${queueResult.succeeded} queued actions`);
          }
          if (queueResult.failed > 0) {
            console.warn(`⚠️  ${queueResult.failed} queued actions failed`);
          }
        } catch (queueError) {
          console.error('❌ Failed to process offline queue:', queueError);
        }

        // Then do the regular sync
        const syncPayload = {
          userId: (session.user as any).id,
          inatUsername: (session.user as any).inatUsername,
          accessToken: (session as any).accessToken,
        };

        let response;
        if (navigator.onLine) {
          response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload),
          });
        } else {
          // Queue the sync for later if offline
          queueAction('sync_observations', syncPayload);
          console.log('Queued sync for when you are back online');
          setIsSyncing(false);
          return;
        }

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Background sync completed:', {
            newObservations: result.newObservations,
            newBadges: result.newBadges?.length || 0,
            completedQuests: result.completedQuests?.length || 0,
            leveledUp: result.leveledUp,
            mock: result.mock,
          });

          // Wait a moment to show the completion state
          await new Promise(resolve => setTimeout(resolve, 800));
          setIsSyncing(false);

          // Only refresh if there were actual changes
          // Use router.refresh() for soft refresh instead of hard reload
          if (result.newObservations > 0 || result.leveledUp || result.newBadges?.length > 0) {
            console.log('🔄 Refreshing page with new data...');
            router.refresh();
          }
        } else {
          console.warn('⚠️  Background sync failed:', response.statusText);
          // Queue the sync if it failed
          queueAction('sync_observations', syncPayload);
          setIsSyncing(false);
        }
      } catch (error) {
        console.error('❌ Background sync error:', error);
        // Queue the sync if there was an error
        if (session?.user) {
          queueAction('sync_observations', {
            userId: (session.user as any).id,
            inatUsername: (session.user as any).inatUsername,
            accessToken: (session as any).accessToken,
          });
        }
        setIsSyncing(false);
      }
    };

    // Mark as synced before starting to prevent duplicate calls
    hasSynced.current = true;

    // Run sync in background after a short delay (let the page render first)
    const timeoutId = setTimeout(syncData, 2000);

    return () => clearTimeout(timeoutId);
  }, [session, status, router, setIsSyncing]);
}
