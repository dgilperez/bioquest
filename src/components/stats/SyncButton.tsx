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

      // Build celebration URL parameters
      const celebrationParams = new URLSearchParams();
      let hasCelebrations = false;

      // Level up celebration
      if (result.leveledUp && result.newLevel) {
        celebrationParams.set('levelUp', 'true');
        celebrationParams.set('newLevel', result.newLevel.toString());
        celebrationParams.set('levelTitle', result.levelTitle || '');
        hasCelebrations = true;
      }

      // Streak milestone celebration
      if (result.streakMilestone) {
        celebrationParams.set('streakMilestone', 'true');
        celebrationParams.set('streakDays', result.streakMilestone.days.toString());
        celebrationParams.set('streakTitle', result.streakMilestone.title);
        celebrationParams.set('streakBonus', result.streakMilestone.bonusPoints.toString());
        hasCelebrations = true;
      }

      // Rare finds (for toast notifications)
      if (result.rareFinds && result.rareFinds.length > 0) {
        // Only show the rarest finds (top 3)
        const topFinds = result.rareFinds.slice(0, 3);
        celebrationParams.set('rareFinds', encodeURIComponent(JSON.stringify(topFinds)));
        hasCelebrations = true;
      }

      // Show toast notifications for quest completion
      if (result.completedQuests && result.completedQuests.length > 0) {
        const quests = result.completedQuests.map((cq: any) => cq.quest);
        const totalPoints = result.completedQuests.reduce((sum: number, cq: any) => sum + cq.pointsEarned, 0);
        notifyMultipleQuests(quests, totalPoints);
      }

      // Show toast notifications for badges
      if (result.newBadges && result.newBadges.length > 0) {
        notifyMultipleBadges(result.newBadges);
      }

      notifySyncComplete(result.newObservations || 0);

      // Redirect to dashboard with celebration params or just refresh
      if (hasCelebrations) {
        router.push(`/dashboard?${celebrationParams.toString()}`);
      } else {
        router.refresh();
      }
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
