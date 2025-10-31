'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { notifySyncComplete, notifyError, notifyMultipleBadges, notifyMultipleQuests, notifyQuestProgress } from '@/lib/notifications/achievements';

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

    // Trigger progress polling
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

      // Badge unlock ceremony (show full ceremony for first badge only)
      if (result.newBadges && result.newBadges.length > 0) {
        // Show full ceremony for the first/most important badge
        const primaryBadge = result.newBadges[0];
        celebrationParams.set('badgeUnlock', 'true');
        celebrationParams.set('badgeId', primaryBadge.id);
        celebrationParams.set('badgeCode', primaryBadge.code);
        celebrationParams.set('badgeName', primaryBadge.name);
        celebrationParams.set('badgeDescription', primaryBadge.description);
        if (primaryBadge.iconUrl) {
          celebrationParams.set('badgeIconUrl', primaryBadge.iconUrl);
        }
        celebrationParams.set('badgeTier', primaryBadge.tier || 'bronze');
        hasCelebrations = true;

        // Show toasts for other badges
        if (result.newBadges.length > 1) {
          notifyMultipleBadges(result.newBadges.slice(1));
        }
      }

      // Show toast notifications for quests
      if (result.completedQuests && result.completedQuests.length > 0) {
        const quests = result.completedQuests.map((cq: any) => cq.quest);
        const totalPoints = result.completedQuests.reduce((sum: number, cq: any) => sum + cq.pointsEarned, 0);
        notifyMultipleQuests(quests, totalPoints);
      }

      // Show toast notifications for quest progress milestones (25%, 50%, 75%)
      // Full-screen celebration for 100% completion
      if (result.questMilestones && result.questMilestones.length > 0) {
        const completedQuest = result.questMilestones.find((qm: any) => qm.milestone === 100);

        if (completedQuest) {
          // Show full-screen celebration for quest completion
          celebrationParams.set('questComplete', 'true');
          celebrationParams.set('questTitle', completedQuest.quest.title);
          hasCelebrations = true;
        }

        // Show toasts for non-completion milestones
        result.questMilestones
          .filter((qm: any) => qm.milestone !== 100)
          .forEach((qm: any) => {
            notifyQuestProgress(qm.quest.title, qm.progress, qm.milestone);
          });
      }

      // Show sync complete notification with XP breakdown if available
      if (result.xpBreakdown) {
        notifySyncComplete({
          newObservations: result.newObservations || 0,
          totalXP: result.xpBreakdown.totalXP,
          newSpeciesCount: result.xpBreakdown.newSpeciesCount,
          rareFindsCount: result.xpBreakdown.rareFindsCount,
          researchGradeCount: result.xpBreakdown.researchGradeCount,
        });
      } else {
        // Fallback: calculate basic XP breakdown from available data
        const rareFindsCount = result.rareFinds?.length || 0;
        const estimatedXP = (result.newObservations || 0) * 10; // Base XP estimate

        notifySyncComplete({
          newObservations: result.newObservations || 0,
          totalXP: estimatedXP,
          rareFindsCount,
        });
      }

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
