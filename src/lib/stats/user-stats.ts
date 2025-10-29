import { prisma } from '@/lib/db/prisma';
import { StreakMilestone } from '@/lib/gamification/streaks';
import { Badge, Quest, Rarity } from '@/types';
import { SYNC_CONFIG, LEVEL_CONFIG, getLevelTitle as getTitle } from '@/lib/gamification/constants';

// Re-export for backward compatibility
export { getLevelTitle } from '@/lib/gamification/constants';
export { calculateLevel } from '@/lib/sync/user-stats-helpers';

export interface UserStatsData {
  totalObservations: number;
  totalSpecies: number;
  totalPoints: number;
  level: number;
  pointsToNextLevel: number;
  rareObservations: number;
  legendaryObservations: number;
  currentStreak: number;
  longestStreak: number;
  lastObservationDate: Date | null;
  currentRarityStreak: number;
  longestRarityStreak: number;
}

/**
 * Get or create user stats from database
 */
export async function getUserStats(userId: string): Promise<UserStatsData> {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
  });

  if (!stats) {
    // Create initial stats
    const newStats = await prisma.userStats.create({
      data: {
        userId,
        totalObservations: 0,
        totalSpecies: 0,
        totalPoints: 0,
        level: LEVEL_CONFIG.STARTING_LEVEL,
        pointsToNextLevel: LEVEL_CONFIG.BASE_POINTS,
      },
    });
    return newStats;
  }

  return stats;
}

/**
 * Sync user observations from iNaturalist and update stats
 */
export interface CompletedQuest {
  quest: Quest;
  pointsEarned: number;
}

export interface RareFind {
  observationId: number;
  taxonName: string;
  commonName?: string;
  rarity: Rarity;
  bonusPoints: number;
  isFirstGlobal: boolean;
  isFirstRegional: boolean;
}

export interface SyncResult {
  newObservations: number;
  newBadges: Badge[];
  completedQuests: CompletedQuest[];
  leveledUp: boolean;
  newLevel?: number;
  levelTitle?: string;
  oldLevel?: number;
  streakMilestone?: StreakMilestone;
  streakData?: {
    currentStreak: number;
    longestStreak: number;
    streakAtRisk: boolean;
    hoursUntilBreak: number;
  };
  rareFinds: RareFind[];
}

export async function syncUserObservations(
  userId: string,
  inatUsername: string,
  accessToken: string
): Promise<SyncResult> {
  const { fetchUserObservations, updateUserLocation } = await import('@/lib/sync/fetch-observations');
  const { enrichObservations } = await import('@/lib/sync/enrich-observations');
  const { storeObservations } = await import('@/lib/sync/store-observations');
  const { calculateUserStats, updateUserStatsInDB } = await import('@/lib/sync/calculate-stats');
  const { checkAchievements, manageLeaderboards } = await import('@/lib/sync/check-achievements');

  try {
    // Get current stats and last sync time
    const currentStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    const oldObservationCount = currentStats?.totalObservations || 0;
    const oldLevel = currentStats?.level || 1;
    const lastSyncedAt = currentStats?.lastSyncedAt;

    // Step 1: Fetch observations from iNaturalist
    const { observations } = await fetchUserObservations({
      accessToken,
      inatUsername,
      lastSyncedAt: lastSyncedAt || undefined,
    });

    // Step 2: Update user location if we have observations
    if (observations.length > 0) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.inatId) {
        await updateUserLocation(userId, user.inatId, observations, accessToken);
      }
    }

    // Step 3: Enrich observations with rarity and points
    const { enrichedObservations, totalPoints, rareFinds } = await enrichObservations(
      observations,
      accessToken
    );

    // Step 4: Store observations in database
    await storeObservations(userId, enrichedObservations);

    // Step 5: Calculate stats (species, level, streaks)
    const stats = await calculateUserStats(
      {
        userId,
        accessToken,
        inatUsername,
        totalPoints,
        totalObservations: observations.length,
      },
      currentStats
    );

    // Step 6: Update user stats in database
    await updateUserStatsInDB(userId, {
      totalObservations: observations.length,
      totalPoints,
      stats,
    });

    // Step 7: Manage leaderboards
    await manageLeaderboards(userId);

    // Step 8: Check achievements (badges and quests)
    const { newBadges, completedQuests } = await checkAchievements(userId);

    // Determine level up
    const leveledUp = stats.level > oldLevel;
    const newObservations = observations.length - oldObservationCount;

    console.log(`Sync complete: ${newObservations} new observations, level ${stats.level}, ${newBadges.length} new badges`);

    return {
      newObservations,
      newBadges,
      completedQuests,
      leveledUp,
      newLevel: leveledUp ? stats.level : undefined,
      levelTitle: leveledUp ? getTitle(stats.level) : undefined,
      oldLevel,
      streakMilestone: stats.streakResult.milestoneReached,
      streakData: {
        currentStreak: stats.streakResult.currentStreak,
        longestStreak: stats.streakResult.longestStreak,
        streakAtRisk: stats.streakResult.streakAtRisk,
        hoursUntilBreak: stats.streakResult.hoursUntilBreak,
      },
      rareFinds: rareFinds.slice(0, SYNC_CONFIG.MAX_RARE_FINDS_TO_REPORT),
    };
  } catch (error) {
    console.error('Error syncing observations:', error);
    throw error;
  }
}

