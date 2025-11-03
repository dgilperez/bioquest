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
  const {
    prepareSyncContext,
    calculatePointsForNewObservations,
    buildXPBreakdown,
    buildSyncResult,
  } = await import('@/lib/sync/sync-helpers');
  const { createSyncLogger } = await import('@/lib/sync/sync-logger');

  const startTime = Date.now();
  const logger = createSyncLogger(userId);

  try {
    // Phase 0: Initialize sync
    logger.startPhase('init');

    // Get current stats and prepare sync context
    const currentStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    const { oldObservationCount, oldLevel, lastSyncedAt, syncCursor, isFirstSync, maxObservations } =
      prepareSyncContext(currentStats);

    logger.completePhase('init', {
      isFirstSync,
      oldObservationCount,
      oldLevel
    });

    // Initialize progress tracking (estimate total based on last sync)
    const estimatedTotal = lastSyncedAt ? 100 : maxObservations;
    initProgress(userId, estimatedTotal);

    // Phase 1: Fetch observations from iNaturalist
    logger.startPhase('fetching', { maxObservations });

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

    logger.completePhase('fetching', {
      observationCount: observations.length,
      fetchedAll,
      totalAvailable
    });

    // Update total now that we know the real count
    updateProgress(userId, {
      observationsTotal: observations.length,
      message: `Found ${observations.length} observations to process`,
    });

    // Phase 2: Update user location if we have observations
    if (observations.length > 0) {
      logger.startPhase('location');
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.inatId) {
        await updateUserLocation(userId, user.inatId, observations, accessToken);
        logger.completePhase('location');
      } else {
        logger.completePhase('location', { skipped: true, reason: 'No iNat user ID' });
      }
    }

    // Phase 3: Enrich observations with rarity and points
    // Use FAST SYNC for initial onboarding (classify only 200 most common taxa)
    logger.startPhase('enriching', { observationCount: observations.length });

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
      // Use env var to control limit (50 if dev limits enabled, 200 otherwise)
      {
        fastSync: true,
        fastSyncLimit: process.env.ENABLE_DEV_SYNC_LIMITS === 'true' ? 50 : 200
      }
    );

    logger.completePhase('enriching', {
      enrichedCount: enrichedObservations.length,
      rareFindsCount: rareFinds.length,
      unclassifiedCount: unclassifiedTaxa?.length || 0,
      totalPoints
    });

    updateProgress(userId, {
      observationsProcessed: observations.length,
      message: `Classified ${observations.length} observations (${rareFinds.length} rare finds)`,
    });

    // Phase 4: Store observations in database
    logger.startPhase('storing', { count: enrichedObservations.length });

    updateProgress(userId, {
      phase: 'storing',
      currentStep: 3,
      message: 'Saving to database...',
    });

    // Phase 5: Calculate stats (species, level, streaks)
    updateProgress(userId, {
      phase: 'calculating',
      currentStep: 4,
      message: 'Calculating statistics and achievements...',
    });

    logger.startPhase('calculating');

    // TRANSACTION: Wrap critical database operations for atomicity
    // If either operation fails, both are rolled back
    const { newObsCount, updatedCount, newObservationIds, updatedTotalObservations, updatedTotalPoints, stats } =
      await prisma.$transaction(async (tx) => {
        // Store observations (within transaction)
        const { newCount: newObsCount, updatedCount, newObservationIds } = await storeObservations(userId, enrichedObservations, tx);

        // Calculate cumulative totals - ONLY count NEW observations
        // (updated observations were already counted in a previous sync)
        const newObservationCount = newObsCount; // Only truly new observations
        const updatedTotalObservations = oldObservationCount + newObservationCount; // Cumulative total

        // Calculate points only from NEW observations (prevents double-counting)
        const newObsPoints = calculatePointsForNewObservations(enrichedObservations, newObservationIds);
        const updatedTotalPoints = (currentStats?.totalPoints || 0) + newObsPoints; // Cumulative total

        console.log(`📊 Sync stats: ${newObsCount} new observations (+${newObsPoints} XP), ${updatedCount} updated`);

        // Calculate stats (outside transaction - read-only operations)
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

        // Step 6: Calculate rarity counts from all observations in database (within transaction)
        const rareObservations = await tx.observation.count({
          where: {
            userId,
            rarity: { in: ['rare', 'epic', 'legendary', 'mythic'] }
          }
        });
        const legendaryObservations = await tx.observation.count({
          where: {
            userId,
            rarity: { in: ['legendary', 'mythic'] }
          }
        });

        // Step 7: Update user stats in database (within transaction)
        await updateUserStatsInDB(userId, {
          totalObservations: updatedTotalObservations,
          totalPoints: updatedTotalPoints,
          rareObservations,
          legendaryObservations,
          stats,
          fetchedAll, // Only set lastSyncedAt if we fetched all available observations
          newestObservationDate, // Set syncCursor for incremental pagination
        }, tx);

        // Return values needed outside transaction
        return { newObsCount, updatedCount, newObservationIds, updatedTotalObservations, updatedTotalPoints, stats };
      });

    // Transaction complete - all critical operations succeeded atomically
    logger.completePhase('storing', {
      newObservations: newObsCount,
      updatedObservations: updatedCount
    });
    logger.completePhase('calculating', {
      newLevel: stats.level,
      totalSpecies: stats.totalSpecies,
      totalPoints: updatedTotalPoints
    });

    const newObservationCount = newObsCount;

    // Phase 6: Check achievements (badges, quests, leaderboards)
    logger.startPhase('achievements');

    // Manage leaderboards
    await manageLeaderboards(userId);

    // Check achievements (badges and quests)
    const achievements = await checkAchievements(userId);

    logger.completePhase('achievements', {
      newBadges: achievements.newBadges.length,
      completedQuests: achievements.completedQuests.length,
      questMilestones: achievements.questMilestones.length
    });

    // Calculate XP breakdown for display (shows ALL fetched observations' potential XP)
    // Note: actual points awarded (newObsPoints) may be less due to updated observations
    const totalPotentialXP = enrichedObservations.reduce((sum, e) => sum + e.points, 0);
    const newSpeciesCount = stats.totalSpecies - (currentStats?.totalSpecies || 0);
    const xpBreakdown = buildXPBreakdown(enrichedObservations, newObservationIds, totalPotentialXP, newSpeciesCount);

    console.log(`Sync complete: ${newObservationCount} new observations, level ${stats.level}, ${achievements.newBadges.length} new badges, ${achievements.questMilestones.length} quest milestones, +${xpBreakdown.totalXP} XP`);

    // Phase 7: Queue unclassified taxa for background processing
    if (unclassifiedTaxa && unclassifiedTaxa.length > 0) {
      logger.startPhase('background', { taxaCount: unclassifiedTaxa.length });
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

      logger.completePhase('background', {
        queuedTaxa: queueItems.length
      });

      // Automatically start background processing (no manual trigger needed)
      console.log(`🚀 Starting automatic background classification...`);
      const { processUserQueue } = await import('@/lib/rarity-queue/processor');

      // Process in background without blocking sync completion
      processUserQueue(userId, 20).then(async (result) => {
        console.log(`✅ Background classification complete: ${result.succeeded} succeeded, ${result.failed} failed`);

        // Refresh Tree of Life stats after classification completes
        try {
          console.log('🌳 Refreshing Tree of Life stats...');
          const { updateUserTaxonProgress } = await import('@/lib/tree-of-life/progress');

          // Get all iconic taxon IDs (the major groups in Tree of Life)
          const iconicTaxa = await prisma.observation.findMany({
            where: { userId, rarityStatus: 'classified' },
            distinct: ['iconicTaxonId'],
            select: { iconicTaxonId: true },
          });

          // Update progress for each iconic taxon
          for (const { iconicTaxonId } of iconicTaxa) {
            if (iconicTaxonId) {
              await updateUserTaxonProgress(userId, iconicTaxonId);
            }
          }

          console.log(`✅ Tree of Life stats refreshed for ${iconicTaxa.length} groups`);
        } catch (error) {
          console.error('❌ Failed to refresh Tree of Life stats:', error);
        }
      }).catch(err => {
        console.error(`❌ Background classification error:`, err);
      });
    }

    // Mark sync as completed
    completeProgress(userId);

    // Complete sync logging with metrics
    logger.complete(true);

    // Build final result
    const durationMs = Date.now() - startTime;

    // Calculate totalSynced: cumulative count of observations processed from iNat
    // This should be oldObservationCount + observations fetched THIS sync
    const totalSyncedFromINat = oldObservationCount + observations.length;

    const result = buildSyncResult({
      achievements,
      stats: {
        level: stats.level,
        pointsToNextLevel: stats.pointsToNextLevel,
        totalSpecies: stats.totalSpecies,
        totalPoints: updatedTotalPoints,
        totalObservations: updatedTotalObservations,
        streakData: {
          currentStreak: stats.streakResult.currentStreak,
          longestStreak: stats.streakResult.longestStreak,
          streakAtRisk: stats.streakResult.streakAtRisk,
          hoursUntilBreak: stats.streakResult.hoursUntilBreak,
        },
      },
      rareFinds,
      xpBreakdown,
      newObservations: newObservationCount,
      totalSynced: totalSyncedFromINat,
      hasMore: !fetchedAll,
      totalAvailable,
      oldLevel,
      durationMs,
    });

    // Add streakMilestone for backward compatibility
    return {
      ...result,
      streakMilestone: stats.streakResult.milestoneReached,
    };
  } catch (error) {
    // Classify and enhance error with sync context
    const { classifyError } = await import('@/lib/sync/sync-errors');
    const syncError = classifyError(error, 'sync', userId);

    // Complete logger with error
    logger.complete(false, syncError.code);

    // Log structured error
    console.error('Sync failed:', {
      code: syncError.code,
      severity: syncError.severity,
      phase: syncError.phase,
      userId: syncError.userId,
      message: syncError.message,
      recovery: syncError.recovery,
      cause: syncError.cause instanceof Error ? syncError.cause.message : syncError.cause,
    });

    // Update progress with error
    errorProgress(userId, syncError.recovery.userMessage);

    // Re-throw the enhanced error
    throw syncError;
  }
}

