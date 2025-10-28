import { Rarity } from '@/types';
import { getRarityIndex } from './rarity';

export interface StreakUpdate {
  currentStreak: number;
  longestStreak: number;
  currentRarityStreak: number;
  longestRarityStreak: number;
  lastObservationDate: Date;
  lastRareObservationDate: Date | null;
}

/**
 * Check if an observation continues a streak
 * Streaks continue if observations are made on consecutive days
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isConsecutiveDay(lastDate: Date, newDate: Date): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor((newDate.getTime() - lastDate.getTime()) / oneDayMs);
  return daysDiff === 1;
}

/**
 * Check if a rarity qualifies for rarity streak (rare or higher)
 */
function isRareOrHigher(rarity: Rarity): boolean {
  return getRarityIndex(rarity) >= getRarityIndex('rare');
}

/**
 * Update observation streaks based on a new observation
 *
 * @param currentStats - Current user streak statistics
 * @param observationDate - Date of the new observation
 * @param rarity - Rarity tier of the observation
 * @returns Updated streak values
 */
export function updateStreaks(
  currentStats: {
    currentStreak: number;
    longestStreak: number;
    currentRarityStreak: number;
    longestRarityStreak: number;
    lastObservationDate: Date | null;
    lastRareObservationDate: Date | null;
  },
  observationDate: Date,
  rarity: Rarity
): StreakUpdate {
  const {
    currentStreak,
    longestStreak,
    currentRarityStreak,
    longestRarityStreak,
    lastObservationDate,
    lastRareObservationDate,
  } = currentStats;

  // Update observation streak
  let newCurrentStreak = currentStreak;
  let newLongestStreak = longestStreak;

  if (!lastObservationDate) {
    // First observation ever
    newCurrentStreak = 1;
  } else if (isSameDay(observationDate, lastObservationDate)) {
    // Same day - streak continues but doesn't increment
    newCurrentStreak = currentStreak;
  } else if (isConsecutiveDay(lastObservationDate, observationDate)) {
    // Consecutive day - increment streak
    newCurrentStreak = currentStreak + 1;
  } else {
    // Streak broken - start new streak
    newCurrentStreak = 1;
  }

  // Update longest streak if needed
  if (newCurrentStreak > longestStreak) {
    newLongestStreak = newCurrentStreak;
  }

  // Update rarity streak (only for rare+ observations)
  let newCurrentRarityStreak = currentRarityStreak;
  let newLongestRarityStreak = longestRarityStreak;
  let newLastRareObservationDate = lastRareObservationDate;

  if (isRareOrHigher(rarity)) {
    if (!lastRareObservationDate) {
      // First rare observation ever
      newCurrentRarityStreak = 1;
    } else if (isSameDay(observationDate, lastRareObservationDate)) {
      // Same day - another rare on same day increments streak
      newCurrentRarityStreak = currentRarityStreak + 1;
    } else if (isConsecutiveDay(lastRareObservationDate, observationDate)) {
      // Consecutive day with rare - increment streak
      newCurrentRarityStreak = currentRarityStreak + 1;
    } else {
      // Gap in rare observations - start new streak
      newCurrentRarityStreak = 1;
    }

    // Update longest rarity streak if needed
    if (newCurrentRarityStreak > longestRarityStreak) {
      newLongestRarityStreak = newCurrentRarityStreak;
    }

    newLastRareObservationDate = observationDate;
  }

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    currentRarityStreak: newCurrentRarityStreak,
    longestRarityStreak: newLongestRarityStreak,
    lastObservationDate: observationDate,
    lastRareObservationDate: newLastRareObservationDate,
  };
}

/**
 * Get a display message for the current rarity streak
 */
export function getRarityStreakMessage(currentRarityStreak: number): string {
  if (currentRarityStreak === 0) {
    return 'Find a rare+ species to start your streak!';
  }
  if (currentRarityStreak === 1) {
    return '🔥 1 rare+ observation - keep going!';
  }
  if (currentRarityStreak < 5) {
    return `🔥 ${currentRarityStreak} rare+ observations in a row!`;
  }
  if (currentRarityStreak < 10) {
    return `🔥🔥 ${currentRarityStreak} rare+ observations - impressive streak!`;
  }
  return `🔥🔥🔥 ${currentRarityStreak} rare+ observations - legendary streak!`;
}

/**
 * Check if user is at risk of breaking their streak
 * Returns true if last observation was yesterday
 */
export function isStreakAtRisk(lastObservationDate: Date | null): boolean {
  if (!lastObservationDate) return false;

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  return isSameDay(lastObservationDate, yesterday);
}

/**
 * Calculate days until streak expires
 * Returns 0 if streak is already broken
 */
export function daysUntilStreakExpires(lastObservationDate: Date | null): number {
  if (!lastObservationDate) return 0;

  const now = new Date();
  const lastDate = new Date(lastObservationDate);

  // Set times to midnight for accurate day comparison
  lastDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));

  if (daysDiff === 0) {
    // Observation today - streak safe for today
    return 1;
  } else if (daysDiff === 1) {
    // Observation yesterday - need to observe today to continue
    return 0;
  } else {
    // Streak already broken
    return 0;
  }
}
