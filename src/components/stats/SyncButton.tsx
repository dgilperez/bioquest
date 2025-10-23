'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { notifySyncComplete, notifyError, notifyMultipleBadges, notifyLevelUp, notifyMultipleQuests } from '@/lib/notifications/achievements';

interface SyncButtonProps {
  userId: string;
  inatUsername: string;
  accessToken: string;
}

export function SyncButton({ userId, inatUsername, accessToken }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, inatUsername, accessToken }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();

      // Show notifications for achievements
      if (result.completedQuests && result.completedQuests.length > 0) {
        const quests = result.completedQuests.map((cq: any) => cq.quest);
        const totalPoints = result.completedQuests.reduce((sum: number, cq: any) => sum + cq.pointsEarned, 0);
        notifyMultipleQuests(quests, totalPoints);
      }

      if (result.newBadges && result.newBadges.length > 0) {
        notifyMultipleBadges(result.newBadges);
      }

      if (result.leveledUp && result.newLevel) {
        notifyLevelUp(result.newLevel, result.levelTitle || '');
      }

      notifySyncComplete(result.newObservations || 0);

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Sync error:', error);
      notifyError('Failed to sync observations. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      size="sm"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync Data'}
    </Button>
  );
}
