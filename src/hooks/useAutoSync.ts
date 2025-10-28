'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAutoSync() {
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
        console.log('🔄 Auto-syncing data in background...');

        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: (session.user as any).id,
            inatUsername: (session.user as any).inatUsername,
            accessToken: (session as any).accessToken,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Background sync completed:', {
            newObservations: result.newObservations,
            newBadges: result.newBadges?.length || 0,
            completedQuests: result.completedQuests?.length || 0,
            leveledUp: result.leveledUp,
            mock: result.mock,
          });

          // Only refresh if there were actual changes
          // Use router.refresh() for soft refresh instead of hard reload
          if (result.newObservations > 0 || result.leveledUp || result.newBadges?.length > 0) {
            console.log('🔄 Refreshing page with new data...');
            router.refresh();
          }
        } else {
          console.warn('⚠️  Background sync failed:', response.statusText);
        }
      } catch (error) {
        console.error('❌ Background sync error:', error);
      }
    };

    // Mark as synced before starting to prevent duplicate calls
    hasSynced.current = true;

    // Run sync in background after a short delay (let the page render first)
    const timeoutId = setTimeout(syncData, 2000);

    return () => clearTimeout(timeoutId);
  }, [session, status, router]);
}
