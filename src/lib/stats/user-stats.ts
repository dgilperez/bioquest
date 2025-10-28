import { prisma } from '@/lib/db/prisma';
import { getINatClient } from '@/lib/inat/client';
import { checkAndUnlockBadges } from '@/lib/gamification/badges/unlock';
import { updateAllQuestProgress } from '@/lib/gamification/quests/progress';
import { assignAvailableQuestsToUser } from '@/lib/gamification/quests/generation';
import { calculateStreak, StreakMilestone } from '@/lib/gamification/streaks';
import { Badge, Quest, Rarity } from '@/types';

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
        level: 1,
        pointsToNextLevel: 100,
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

    // Get observations (incremental if possible)
    const response = await client.getUserObservations(inatUsername, {
      per_page: 200,
      page: 1,
      // Use updated_since for incremental sync to get only new/updated observations
      updated_since: isIncrementalSync ? lastSyncedAt.toISOString() : undefined,
    });

    const { total_results } = response;

    // Get species counts
    const speciesResponse = await client.getUserSpeciesCounts(inatUsername);
    const totalSpecies = speciesResponse.total_results;

    // Calculate points (simplified - base points only for now)
    const basePointsPerObs = 10;
    const totalPoints = total_results * basePointsPerObs;

    // Calculate level
    const { level, pointsToNextLevel } = calculateLevel(totalPoints);

    // Calculate streaks
    const observations = await prisma.observation.findMany({
      where: { userId },
      select: { observedOn: true },
      orderBy: { observedOn: 'desc' },
    });

    const streakResult = calculateStreak(
      observations,
      currentStats?.currentStreak || 0,
      currentStats?.longestStreak || 0
    );

    // Get rare finds (uncommon or rarer)
    const rareObservations = await prisma.observation.findMany({
      where: {
        userId,
        rarity: {
          in: ['uncommon', 'rare', 'epic', 'legendary', 'mythic'],
        },
      },
      orderBy: { observedOn: 'desc' },
      take: 10, // Last 10 rare finds
    });

    const rareFinds: RareFind[] = rareObservations.map(obs => ({
      observationId: obs.id,
      taxonName: obs.taxonName || obs.speciesGuess || 'Unknown',
      commonName: obs.commonName || undefined,
      rarity: obs.rarity as Rarity,
      bonusPoints: obs.pointsAwarded || 0,
      isFirstGlobal: obs.isFirstGlobal,
      isFirstRegional: obs.isFirstRegional,
    }));

    // Update stats and track sync time
    const syncTime = new Date();
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalObservations: total_results,
        totalSpecies,
        totalPoints,
        level,
        pointsToNextLevel,
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastObservationDate: streakResult.lastObservationDate,
        lastSyncedAt: syncTime,
        updatedAt: syncTime,
      },
      create: {
        userId,
        totalObservations: total_results,
        totalSpecies,
        totalPoints,
        level,
        pointsToNextLevel,
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastObservationDate: streakResult.lastObservationDate,
        lastSyncedAt: syncTime,
      },
    });

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
    const newObservations = total_results - oldObservationCount;

    return {
      newObservations,
      newBadges,
      completedQuests,
      leveledUp,
      newLevel: leveledUp ? level : undefined,
      levelTitle: leveledUp ? getLevelTitle(level) : undefined,
      oldLevel,
      streakMilestone: streakResult.milestoneReached,
      streakData: {
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        streakAtRisk: streakResult.streakAtRisk,
        hoursUntilBreak: streakResult.hoursUntilBreak,
      },
      rareFinds,
    };
  } catch (error) {
    console.error('Error syncing observations:', error);
    throw error;
  }
}

/**
 * Calculate user level based on total points
 * Uses a simple exponential curve: points needed = 100 * (level ^ 1.5)
 */
export function calculateLevel(totalPoints: number): {
  level: number;
  pointsToNextLevel: number;
} {
  let level = 1;
  let pointsNeeded = 0;

  while (pointsNeeded <= totalPoints) {
    level++;
    pointsNeeded = Math.floor(100 * Math.pow(level, 1.5));
  }

  level--; // Go back one level since we exceeded
  pointsNeeded = Math.floor(100 * Math.pow(level + 1, 1.5));
  const pointsToNextLevel = pointsNeeded - totalPoints;

  return { level, pointsToNextLevel };
}

/**
 * Get level title based on level number
 */
export function getLevelTitle(level: number): string {
  if (level < 5) return 'Novice Naturalist';
  if (level < 10) return 'Amateur Naturalist';
  if (level < 15) return 'Field Naturalist';
  if (level < 20) return 'Expert Naturalist';
  if (level < 30) return 'Master Naturalist';
  if (level < 40) return 'Elite Naturalist';
  return 'Legendary Naturalist';
}
