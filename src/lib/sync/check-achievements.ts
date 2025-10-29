/**
 * Achievement Checking Service
 *
 * Handles badges, quests, and leaderboard updates
 */

import { checkAndUnlockBadges } from '@/lib/gamification/badges/unlock';
import { updateAllQuestProgress } from '@/lib/gamification/quests/progress';
import { assignAvailableQuestsToUser } from '@/lib/gamification/quests/generation';
import { initializeUserPeriods, resetWeeklyLeaderboard, resetMonthlyLeaderboard } from '@/lib/leaderboards/reset';
import { prisma } from '@/lib/db/prisma';
import { Badge, Quest } from '@/types';

export interface CompletedQuest {
  quest: Quest;
  pointsEarned: number;
}

export interface AchievementResult {
  newBadges: Badge[];
  completedQuests: CompletedQuest[];
}

/**
 * Check for newly unlocked badges and completed quests
 */
export async function checkAchievements(userId: string): Promise<AchievementResult> {
  // Assign available quests to user
  await assignAvailableQuestsToUser(userId);

  // Update quest progress
  const questProgress = await updateAllQuestProgress(userId);
  const completedQuests: CompletedQuest[] = questProgress
    .filter(qp => qp.isNewlyCompleted)
    .map(qp => ({
      quest: qp.quest,
      pointsEarned: qp.quest.reward.points || 0,
    }));

  // Check for badge unlocks
  const badgeResults = await checkAndUnlockBadges(userId);
  const newBadges = badgeResults
    .filter(r => r.isNewlyUnlocked)
    .map(r => r.badge);

  return {
    newBadges,
    completedQuests,
  };
}

/**
 * Initialize and reset leaderboards as needed
 */
export async function manageLeaderboards(userId: string): Promise<void> {
  // Initialize weekly/monthly periods if this is the first sync
  const currentStats = await prisma.userStats.findUnique({ where: { userId } });

  if (!currentStats || !currentStats.weekStart || !currentStats.monthStart) {
    await initializeUserPeriods(userId);
  }

  // Auto-reset weekly/monthly leaderboards if period has changed
  const weeklyReset = await resetWeeklyLeaderboard();
  const monthlyReset = await resetMonthlyLeaderboard();

  if (weeklyReset.reset) {
    console.log(`Auto-reset weekly leaderboard for ${weeklyReset.count} users`);
  }
  if (monthlyReset.reset) {
    console.log(`Auto-reset monthly leaderboard for ${monthlyReset.count} users`);
  }
}
