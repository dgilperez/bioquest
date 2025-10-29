/**
 * Stats Calculation Service
 *
 * Handles stats aggregation, level calculation, and streak tracking
 */

import { prisma } from '@/lib/db/prisma';
import { getINatClient } from '@/lib/inat/client';
import { calculateStreak, StreakResult } from '@/lib/gamification/streaks';
import { updateStreaks } from '@/lib/gamification/streak-tracking';
import { calculateLevel } from './user-stats-helpers';

export interface StatsInput {
  userId: string;
  accessToken: string;
  inatUsername: string;
  totalPoints: number;
  totalObservations: number;
}

export interface StatsUpdateInput {
  totalObservations: number;
  totalPoints: number;
  stats: StatsResult;
}

export interface StatsResult {
  level: number;
  pointsToNextLevel: number;
  totalSpecies: number;
  streakResult: StreakResult;
  currentRarityStreak: number;
  longestRarityStreak: number;
  lastRareObservationDate: Date | null;
}

/**
 * Calculate user statistics including species count, level, and streaks
 */
export async function calculateUserStats(
  input: StatsInput,
  currentStats: any
): Promise<StatsResult> {
  const { userId, accessToken, inatUsername, totalPoints } = input;

  // Get species counts from iNaturalist
  const client = getINatClient(accessToken);
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

  return {
    level,
    pointsToNextLevel,
    totalSpecies,
    streakResult,
    currentRarityStreak,
    longestRarityStreak,
    lastRareObservationDate,
  };
}

/**
 * Update user stats in the database
 */
export async function updateUserStatsInDB(
  userId: string,
  updateInput: StatsUpdateInput
): Promise<void> {
  const { totalObservations, totalPoints, stats } = updateInput;
  const syncTime = new Date();

  await prisma.userStats.upsert({
    where: { userId },
    update: {
      totalObservations,
      totalSpecies: stats.totalSpecies,
      totalPoints,
      level: stats.level,
      pointsToNextLevel: stats.pointsToNextLevel,
      currentStreak: stats.streakResult.currentStreak,
      longestStreak: stats.streakResult.longestStreak,
      lastObservationDate: stats.streakResult.lastObservationDate,
      currentRarityStreak: stats.currentRarityStreak,
      longestRarityStreak: stats.longestRarityStreak,
      lastRareObservationDate: stats.lastRareObservationDate,
      lastSyncedAt: syncTime,
      updatedAt: syncTime,
    },
    create: {
      userId,
      totalObservations,
      totalSpecies: stats.totalSpecies,
      totalPoints,
      level: stats.level,
      pointsToNextLevel: stats.pointsToNextLevel,
      currentStreak: stats.streakResult.currentStreak,
      longestStreak: stats.streakResult.longestStreak,
      lastObservationDate: stats.streakResult.lastObservationDate,
      currentRarityStreak: stats.currentRarityStreak,
      longestRarityStreak: stats.longestRarityStreak,
      lastRareObservationDate: stats.lastRareObservationDate,
      lastSyncedAt: syncTime,
    },
  });
}
