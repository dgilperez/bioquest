import { prisma } from '@/lib/db/prisma';
import { getINatClient } from '@/lib/inat/client';
import { checkAndUnlockBadges } from '@/lib/gamification/badges/unlock';
import { updateAllQuestProgress } from '@/lib/gamification/quests/progress';
import { assignAvailableQuestsToUser } from '@/lib/gamification/quests/generation';
import { calculateStreak, StreakMilestone } from '@/lib/gamification/streaks';
import { updateStreaks } from '@/lib/gamification/streak-tracking';
import { initializeUserPeriods } from '@/lib/leaderboards/reset';
import { Badge, Quest, Rarity } from '@/types';
import {
  POINTS_CONFIG,
  SYNC_CONFIG,
  LEVEL_CONFIG,
  getLevelTitle as getTitle,
  isRarityTracked,
  pointsForLevel
} from '@/lib/gamification/constants';

// Re-export for backward compatibility
export { getLevelTitle } from '@/lib/gamification/constants';

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
  const client = getINatClient(accessToken);

  try {
    // Get current stats and last sync time
    const currentStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    const oldObservationCount = currentStats?.totalObservations || 0;
    const oldLevel = currentStats?.level || 1;
    const lastSyncedAt = currentStats?.lastSyncedAt;

    // Determine if this is an incremental sync or full sync
    const isIncrementalSync = !!lastSyncedAt;

    // Fetch ALL observations across multiple pages
    let allObservations: any[] = [];
    let currentPage = 1;
    let totalResults = 0;
    const perPage = SYNC_CONFIG.OBSERVATIONS_PER_PAGE;

    console.log(`Starting ${isIncrementalSync ? 'incremental' : 'full'} sync for ${inatUsername}...`);

    do {
      const response = await client.getUserObservations(inatUsername, {
        per_page: perPage,
        page: currentPage,
        updated_since: isIncrementalSync ? lastSyncedAt.toISOString() : undefined,
      });

      allObservations = allObservations.concat(response.results);
      totalResults = response.total_results;

      console.log(`Fetched page ${currentPage}: ${response.results.length} observations (${allObservations.length}/${totalResults} total)`);

      currentPage++;

      // Continue if there are more pages
      if (allObservations.length >= totalResults) {
        break;
      }

      // Small delay between pages to be nice to the API
      if (allObservations.length < totalResults) {
        await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.PAGE_DELAY_MS));
      }
    } while (allObservations.length < totalResults);

    console.log(`Fetched ${allObservations.length} observations. Processing...`);

    // Get user info to populate region/location
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.inatId) {
      try {
        const userInfoResponse = await client.getUserInfo(user.inatId);
        if (userInfoResponse.results && userInfoResponse.results.length > 0) {
          // Note: iNat API doesn't directly provide place/region in user info
          // We'll extract most common location from observations instead
          const mostCommonLocation = allObservations
            .map(obs => obs.place_guess)
            .filter(Boolean)
            .reduce((acc: Record<string, number>, place) => {
              if (place) acc[place] = (acc[place] || 0) + 1;
              return acc;
            }, {});

          const topLocation = Object.entries(mostCommonLocation)
            .sort(([,a], [,b]) => b - a)[0]?.[0];

          if (topLocation) {
            await prisma.user.update({
              where: { id: userId },
              data: { region: topLocation }
            });
          }
        }
      } catch (error) {
        console.warn('Could not fetch user info:', error);
      }
    }

    // Process each observation: classify rarity and store
    let totalPoints = 0;
    const rareFindsToReport: RareFind[] = [];

    for (let i = 0; i < allObservations.length; i++) {
      const inatObs = allObservations[i];

      if (i % 50 === 0) {
        console.log(`Processing observation ${i + 1}/${allObservations.length}...`);
      }

      // Calculate base points
      let obsPoints = POINTS_CONFIG.BASE_OBSERVATION_POINTS;

      // Classify rarity (only for observations with taxon)
      let rarity: Rarity = 'common';
      let bonusPoints = 0;
      let isFirstGlobal = false;
      let isFirstRegional = false;

      if (inatObs.taxon?.id) {
        try {
          const { classifyObservationRarity } = await import('@/lib/gamification/rarity');
          const rarityResult = await classifyObservationRarity(inatObs, accessToken);

          rarity = rarityResult.rarity;
          bonusPoints = rarityResult.bonusPoints;
          isFirstGlobal = rarityResult.isFirstGlobal;
          isFirstRegional = rarityResult.isFirstRegional;

          obsPoints += bonusPoints;

          // Track rare finds for reporting
          if (isRarityTracked(rarity)) {
            rareFindsToReport.push({
              observationId: inatObs.id,
              taxonName: inatObs.taxon.name,
              commonName: inatObs.taxon.preferred_common_name || undefined,
              rarity,
              bonusPoints,
              isFirstGlobal,
              isFirstRegional,
            });
          }
        } catch (error) {
          console.warn(`Could not classify rarity for observation ${inatObs.id}:`, error);
          // Continue with default rarity
        }
      }

      // Research grade bonus
      if (inatObs.quality_grade === 'research') {
        obsPoints += POINTS_CONFIG.RESEARCH_GRADE_BONUS;
      }

      // Photo bonus (max 3 photos)
      const photoCount = inatObs.photos?.length || 0;
      const photoBonus = Math.min(photoCount, POINTS_CONFIG.MAX_PHOTO_BONUS) * POINTS_CONFIG.PHOTO_POINTS;
      obsPoints += photoBonus;

      totalPoints += obsPoints;

      // Store observation in database
      await prisma.observation.upsert({
        where: { id: inatObs.id },
        update: {
          speciesGuess: inatObs.species_guess || null,
          taxonId: inatObs.taxon?.id || null,
          taxonName: inatObs.taxon?.name || null,
          taxonRank: inatObs.taxon?.rank || null,
          commonName: inatObs.taxon?.preferred_common_name || null,
          iconicTaxon: inatObs.taxon?.iconic_taxon_name || null,
          observedOn: new Date(inatObs.observed_on),
          qualityGrade: inatObs.quality_grade,
          photosCount: photoCount,
          location: inatObs.location || null,
          placeGuess: inatObs.place_guess || null,
          rarity,
          isFirstGlobal,
          isFirstRegional,
          pointsAwarded: obsPoints,
          updatedAt: new Date(),
        },
        create: {
          id: inatObs.id,
          userId,
          speciesGuess: inatObs.species_guess || null,
          taxonId: inatObs.taxon?.id || null,
          taxonName: inatObs.taxon?.name || null,
          taxonRank: inatObs.taxon?.rank || null,
          commonName: inatObs.taxon?.preferred_common_name || null,
          iconicTaxon: inatObs.taxon?.iconic_taxon_name || null,
          observedOn: new Date(inatObs.observed_on),
          qualityGrade: inatObs.quality_grade,
          photosCount: photoCount,
          location: inatObs.location || null,
          placeGuess: inatObs.place_guess || null,
          rarity,
          isFirstGlobal,
          isFirstRegional,
          pointsAwarded: obsPoints,
        },
      });
    }

    console.log(`Stored ${allObservations.length} observations with ${totalPoints} total points`);

    // Get species counts
    const speciesResponse = await client.getUserSpeciesCounts(inatUsername);
    const totalSpecies = speciesResponse.total_results;

    // Calculate level
    const { level, pointsToNextLevel } = calculateLevel(totalPoints);

    // Calculate streaks from stored observations
    const observations = await prisma.observation.findMany({
      where: { userId },
      select: { observedOn: true, rarity: true },
      orderBy: { observedOn: 'desc' },
    });

    const streakResult = calculateStreak(
      observations,
      currentStats?.currentStreak || 0,
      currentStats?.longestStreak || 0
    );

    // Calculate rarity streaks (consecutive rare+ observations)
    let currentRarityStreak = currentStats?.currentRarityStreak || 0;
    let longestRarityStreak = currentStats?.longestRarityStreak || 0;
    let lastRareObservationDate = currentStats?.lastRareObservationDate || null;

    // Sort observations by date ascending to track streaks chronologically
    const sortedObservations = [...observations].reverse();

    for (const obs of sortedObservations) {
      const streakUpdate = updateStreaks(
        {
          currentStreak: streakResult.currentStreak,
          longestStreak: streakResult.longestStreak,
          currentRarityStreak,
          longestRarityStreak,
          lastObservationDate: streakResult.lastObservationDate,
          lastRareObservationDate,
        },
        obs.observedOn,
        obs.rarity
      );

      // Update values for next iteration
      currentRarityStreak = streakUpdate.currentRarityStreak;
      longestRarityStreak = streakUpdate.longestRarityStreak;
      lastRareObservationDate = streakUpdate.lastRareObservationDate;
    }

    // Update stats and track sync time
    const syncTime = new Date();
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalObservations: allObservations.length,
        totalSpecies,
        totalPoints,
        level,
        pointsToNextLevel,
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastObservationDate: streakResult.lastObservationDate,
        currentRarityStreak,
        longestRarityStreak,
        lastRareObservationDate,
        lastSyncedAt: syncTime,
        updatedAt: syncTime,
      },
      create: {
        userId,
        totalObservations: allObservations.length,
        totalSpecies,
        totalPoints,
        level,
        pointsToNextLevel,
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastObservationDate: streakResult.lastObservationDate,
        currentRarityStreak,
        longestRarityStreak,
        lastRareObservationDate,
        lastSyncedAt: syncTime,
      },
    });

    // Initialize weekly/monthly periods if this is the first sync
    if (!currentStats || !currentStats.weekStart || !currentStats.monthStart) {
      await initializeUserPeriods(userId);
    }

    // Auto-reset weekly/monthly leaderboards if period has changed
    const { resetWeeklyLeaderboard, resetMonthlyLeaderboard } = await import('@/lib/leaderboards/reset');
    const weeklyReset = await resetWeeklyLeaderboard();
    const monthlyReset = await resetMonthlyLeaderboard();

    if (weeklyReset.reset) {
      console.log(`Auto-reset weekly leaderboard for ${weeklyReset.count} users`);
    }
    if (monthlyReset.reset) {
      console.log(`Auto-reset monthly leaderboard for ${monthlyReset.count} users`);
    }

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

    // Check if leveled up
    const leveledUp = level > oldLevel;
    const newObservations = allObservations.length - oldObservationCount;

    console.log(`Sync complete: ${newObservations} new observations, level ${level}, ${newBadges.length} new badges`);

    return {
      newObservations,
      newBadges,
      completedQuests,
      leveledUp,
      newLevel: leveledUp ? level : undefined,
      levelTitle: leveledUp ? getTitle(level) : undefined,
      oldLevel,
      streakMilestone: streakResult.milestoneReached,
      streakData: {
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        streakAtRisk: streakResult.streakAtRisk,
        hoursUntilBreak: streakResult.hoursUntilBreak,
      },
      rareFinds: rareFindsToReport.slice(0, SYNC_CONFIG.MAX_RARE_FINDS_TO_REPORT),
    };
  } catch (error) {
    console.error('Error syncing observations:', error);
    throw error;
  }
}

/**
 * Calculate user level based on total points
 * Uses a simple exponential curve: points needed = BASE_POINTS * (level ^ EXPONENT)
 */
export function calculateLevel(totalPoints: number): {
  level: number;
  pointsToNextLevel: number;
} {
  let level = LEVEL_CONFIG.STARTING_LEVEL;
  let pointsNeeded = 0;

  while (pointsNeeded <= totalPoints) {
    level++;
    pointsNeeded = pointsForLevel(level);
  }

  level--; // Go back one level since we exceeded
  pointsNeeded = pointsForLevel(level + 1);
  const pointsToNextLevel = pointsNeeded - totalPoints;

  return { level, pointsToNextLevel };
}
