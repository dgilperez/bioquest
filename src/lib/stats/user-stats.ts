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
  lastSyncedAt: Date | null;
  hasMoreToSync: boolean;
  weeklyPoints: number;
  monthlyPoints: number;
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

export interface QuestMilestone {
  quest: Quest;
  progress: number;
  milestone: number; // 25, 50, 75, or 100
}

export interface SyncResult {
  newObservations: number;
  totalSynced: number; // Cumulative total observations synced so far
  newBadges: Badge[];
  completedQuests: CompletedQuest[];
  questMilestones: QuestMilestone[];
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
  // XP breakdown for sync summary
  xpBreakdown?: {
    totalXP: number;
    newSpeciesCount: number;
    rareFindsCount: number;
    researchGradeCount: number;
  };
  // Incremental sync tracking
  hasMore?: boolean;
  totalAvailable?: number;
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
  const { initProgress, updateProgress, completeProgress, errorProgress } = await import('@/lib/sync/progress');

  try {
    // Get current stats and last sync time
    const currentStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    const oldObservationCount = currentStats?.totalObservations || 0;
    const oldLevel = currentStats?.level || 1;
    const lastSyncedAt = currentStats?.lastSyncedAt;
    const syncCursor = currentStats?.syncCursor;

    // Determine if this is a first sync (no observations in DB)
    const isFirstSync = oldObservationCount === 0;
    const maxObservations = isFirstSync ? SYNC_CONFIG.FIRST_SYNC_LIMIT : SYNC_CONFIG.MAX_OBSERVATIONS_PER_SYNC;

    // Initialize progress tracking (estimate total based on last sync)
    const estimatedTotal = lastSyncedAt ? 100 : maxObservations;
    initProgress(userId, estimatedTotal);

    // Step 1: Fetch observations from iNaturalist
    updateProgress(userId, {
      phase: 'fetching',
      currentStep: 1,
      message: 'Fetching observations from iNaturalist...',
    });

    const { observations, fetchedAll, totalAvailable, newestObservationDate } = await fetchUserObservations({
      accessToken,
      inatUsername,
      lastSyncedAt: lastSyncedAt || undefined,
      syncCursor: syncCursor || undefined,
      maxObservations,
    });

    // Update total now that we know the real count
    updateProgress(userId, {
      observationsTotal: observations.length,
      message: `Found ${observations.length} observations to process`,
    });

    // Step 2: Update user location if we have observations
    if (observations.length > 0) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.inatId) {
        await updateUserLocation(userId, user.inatId, observations, accessToken);
      }
    }

    // Step 3: Enrich observations with rarity and points
    // Use FAST SYNC for initial onboarding (classify only 200 most common taxa)
    updateProgress(userId, {
      phase: 'enriching',
      currentStep: 2,
      message: 'Classifying rarity and calculating points...',
    });

    const { enrichedObservations, totalPoints, rareFinds, unclassifiedTaxa } = await enrichObservations(
      observations,
      accessToken,
      // Progress callback for rarity classification
      (processed, total, message) => {
        // Estimate observations processed based on taxa progress
        // If we've classified 50/100 taxa, assume we've processed ~50% of observations
        const estimatedObsProcessed = Math.floor((processed / total) * observations.length);
        updateProgress(userId, {
          message: `${message}: ${processed}/${total} taxa classified`,
          observationsProcessed: estimatedObsProcessed,
        });
      },
      // Enable fast sync for onboarding (only classify top N taxa)
      // In dev mode, use lower limit to test background processing
      { fastSync: true, fastSyncLimit: process.env.NODE_ENV === 'production' ? 200 : 50 }
    );

    updateProgress(userId, {
      observationsProcessed: observations.length,
      message: `Classified ${observations.length} observations (${rareFinds.length} rare finds)`,
    });

    // Step 4: Store observations in database
    updateProgress(userId, {
      phase: 'storing',
      currentStep: 3,
      message: 'Saving to database...',
    });

    await storeObservations(userId, enrichedObservations);

    // Step 5: Calculate stats (species, level, streaks)
    updateProgress(userId, {
      phase: 'calculating',
      currentStep: 4,
      message: 'Calculating statistics and achievements...',
    });

    // Calculate cumulative totals
    const newObservationCount = observations.length; // Newly synced observations
    const updatedTotalObservations = oldObservationCount + newObservationCount; // Cumulative total
    const updatedTotalPoints = (currentStats?.totalPoints || 0) + totalPoints; // Cumulative total

    const stats = await calculateUserStats(
      {
        userId,
        accessToken,
        inatUsername,
        totalPoints: updatedTotalPoints,
        totalObservations: updatedTotalObservations,
      },
      currentStats
    );

    // Step 6: Calculate rarity counts from all observations in database
    const rareObservations = await prisma.observation.count({
      where: {
        userId,
        rarity: { in: ['rare', 'epic', 'legendary', 'mythic'] }
      }
    });
    const legendaryObservations = await prisma.observation.count({
      where: {
        userId,
        rarity: { in: ['legendary', 'mythic'] }
      }
    });

    // Step 7: Update user stats in database
    await updateUserStatsInDB(userId, {
      totalObservations: updatedTotalObservations,
      totalPoints: updatedTotalPoints,
      rareObservations,
      legendaryObservations,
      stats,
      fetchedAll, // Only set lastSyncedAt if we fetched all available observations
      newestObservationDate, // Set syncCursor for incremental pagination
    });

    // Step 8: Manage leaderboards
    await manageLeaderboards(userId);

    // Step 9: Check achievements (badges and quests)
    const { newBadges, completedQuests, questMilestones } = await checkAchievements(userId);

    // Determine level up
    const leveledUp = stats.level > oldLevel;

    // Calculate XP breakdown for synced observations
    // Note: enrichedObservations already contains only the newly fetched observations
    const newSpeciesCount = stats.totalSpecies - (currentStats?.totalSpecies || 0);
    const rareFindsCount = enrichedObservations.filter(e =>
      e.rarity && ['rare', 'epic', 'legendary', 'mythic'].includes(e.rarity)
    ).length;
    const researchGradeCount = enrichedObservations.filter(e =>
      e.observation.quality_grade === 'research'
    ).length;

    const xpBreakdown = {
      totalXP: enrichedObservations.reduce((sum, e) => sum + e.points, 0),
      newSpeciesCount,
      rareFindsCount,
      researchGradeCount,
    };

    console.log(`Sync complete: ${newObservationCount} new observations, level ${stats.level}, ${newBadges.length} new badges, ${questMilestones.length} quest milestones, +${xpBreakdown.totalXP} XP`);

    // Step 10: Queue unclassified taxa for background processing
    if (unclassifiedTaxa && unclassifiedTaxa.length > 0) {
      console.log(`📥 Queueing ${unclassifiedTaxa.length} taxa for background classification...`);

      const { queueTaxaForClassification } = await import('@/lib/rarity-queue/manager');

      // Count observations per taxon to set priority
      const taxonCounts = new Map<number, number>();
      const taxonNames = new Map<number, string>();

      observations.forEach(obs => {
        if (obs.taxon?.id && unclassifiedTaxa.includes(obs.taxon.id)) {
          taxonCounts.set(obs.taxon.id, (taxonCounts.get(obs.taxon.id) || 0) + 1);
          if (!taxonNames.has(obs.taxon.id)) {
            taxonNames.set(obs.taxon.id, obs.taxon.name);
          }
        }
      });

      // Build queue items with priority based on observation count
      const queueItems = unclassifiedTaxa.map(taxonId => ({
        taxonId,
        taxonName: taxonNames.get(taxonId),
        priority: taxonCounts.get(taxonId) || 0, // More observations = higher priority
      }));

      await queueTaxaForClassification(userId, queueItems);
      console.log(`✅ Queued ${queueItems.length} taxa for background processing`);

      // Automatically start background processing (no manual trigger needed)
      console.log(`🚀 Starting automatic background classification...`);
      const { processUserQueue } = await import('@/lib/rarity-queue/processor');

      // Process in background without blocking sync completion
      processUserQueue(userId, 20).then(result => {
        console.log(`✅ Background classification complete: ${result.succeeded} succeeded, ${result.failed} failed`);
      }).catch(err => {
        console.error(`❌ Background classification error:`, err);
      });
    }

    // Mark sync as completed
    completeProgress(userId);

    return {
      newObservations: newObservationCount,
      totalSynced: updatedTotalObservations, // Cumulative total synced so far
      newBadges,
      completedQuests,
      questMilestones,
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
      xpBreakdown,
      hasMore: !fetchedAll, // Indicate if there are more observations to sync
      totalAvailable,
    };
  } catch (error) {
    console.error('Error syncing observations:', error);
    errorProgress(userId, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

