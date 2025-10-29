/**
 * Streak Calculation Logic
 *
 * Tracks user observation streaks to encourage daily/weekly engagement
 */

import { STREAK_MILESTONES, STREAK_CONFIG } from './constants';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastObservationDate: Date;
  streakAtRisk: boolean; // True if user hasn't observed today yet
  hoursUntilBreak: number; // Hours until streak breaks
  milestoneReached?: StreakMilestone;
  bonusPoints: number;
}

export interface StreakMilestone {
  days: number;
  title: string;
  bonusPoints: number;
  badgeCode?: string;
}

/**
 * Calculate streak information for a user
 */
export function calculateStreak(
  observations: Array<{ observedOn: Date }>,
  previousStreak: number = 0,
  previousLongest: number = 0
): StreakResult {
  if (observations.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: previousLongest,
      lastObservationDate: new Date(0),
      streakAtRisk: false,
      hoursUntilBreak: 0,
      bonusPoints: 0,
    };
  }

  // Sort observations by date (newest first)
  const sorted = [...observations].sort(
    (a, b) => new Date(b.observedOn).getTime() - new Date(a.observedOn).getTime()
  );

  const latestObs = sorted[0];
  const lastObservationDate = new Date(latestObs.observedOn);

  // Get unique days (in user's local timezone)
  const uniqueDays = new Set<string>();
  observations.forEach(obs => {
    const date = new Date(obs.observedOn);
    const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    uniqueDays.add(dayKey);
  });

  const observationDays = Array.from(uniqueDays).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  // Check if there's an observation today or yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

  let startIndex = 0;
  if (observationDays[0] === todayKey) {
    currentStreak = 1;
    startIndex = 1;
  } else if (observationDays[0] === yesterdayKey) {
    currentStreak = 1;
    startIndex = 1;
  } else {
    // Streak broken - no observation today or yesterday
    return {
      currentStreak: 0,
      longestStreak: Math.max(previousLongest, previousStreak),
      lastObservationDate,
      streakAtRisk: false,
      hoursUntilBreak: 0,
      bonusPoints: 0,
    };
  }

  // Count consecutive days
  for (let i = startIndex; i < observationDays.length; i++) {
    const currentDay = new Date(observationDays[i]);
    const expectedDay = new Date(observationDays[i - 1]);
    expectedDay.setDate(expectedDay.getDate() - 1);

    const currentDayKey = `${currentDay.getFullYear()}-${currentDay.getMonth() + 1}-${currentDay.getDate()}`;
    const expectedDayKey = `${expectedDay.getFullYear()}-${expectedDay.getMonth() + 1}-${expectedDay.getDate()}`;

    if (currentDayKey === expectedDayKey) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate time until streak breaks
  const streakAtRisk = observationDays[0] !== todayKey;
  const now = new Date();
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const hoursUntilBreak = Math.max(0, (endOfToday.getTime() - now.getTime()) / (1000 * 60 * 60));

  // Check if milestone reached
  const previousMilestone = STREAK_MILESTONES.filter(m => m.days <= previousStreak).pop();
  const currentMilestone = STREAK_MILESTONES.filter(m => m.days <= currentStreak).pop();

  let milestoneReached: StreakMilestone | undefined;
  let bonusPoints = 0;

  if (currentMilestone && currentMilestone !== previousMilestone) {
    milestoneReached = currentMilestone;
    bonusPoints = currentMilestone.bonusPoints;
  }

  // Update longest streak
  const longestStreak = Math.max(previousLongest, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastObservationDate,
    streakAtRisk,
    hoursUntilBreak,
    milestoneReached,
    bonusPoints,
  };
}

/**
 * Get streak display color based on length
 */
export function getStreakColor(days: number): string {
  if (days >= 365) return 'from-yellow-400 via-yellow-500 to-yellow-600'; // Golden
  if (days >= 100) return 'from-purple-400 via-pink-400 to-purple-500'; // Rainbow
  if (days >= 30) return 'from-purple-500 via-purple-600 to-purple-700'; // Purple
  if (days >= 7) return 'from-blue-500 via-blue-600 to-blue-700'; // Blue
  return 'from-orange-500 via-red-500 to-orange-600'; // Orange/Red
}

/**
 * Get streak emoji based on length
 */
export function getStreakEmoji(days: number): string {
  if (days >= 365) return '✨'; // Legendary golden
  if (days >= 100) return '🌈'; // Rainbow
  if (days >= 30) return '💜'; // Purple flame
  if (days >= 7) return '🔵'; // Blue flame
  return '🔥'; // Orange flame
}

/**
 * Get next milestone for motivation
 */
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  const next = STREAK_MILESTONES.find(m => m.days > currentStreak);
  return next || null;
}

/**
 * Format streak message for display
 */
export function getStreakMessage(streakResult: StreakResult): string {
  const { currentStreak, streakAtRisk, hoursUntilBreak } = streakResult;

  if (currentStreak === 0) {
    return 'Start your streak today! 🌱';
  }

  if (streakAtRisk && hoursUntilBreak < STREAK_CONFIG.URGENT_WARNING_HOURS) {
    return `🚨 ${currentStreak} day streak expires in ${Math.floor(hoursUntilBreak)}h!`;
  }

  if (streakAtRisk) {
    return `⚠️ Keep your ${currentStreak} day streak alive today!`;
  }

  if (currentStreak === 1) {
    return '🔥 Streak started! Come back tomorrow!';
  }

  const nextMilestone = getNextMilestone(currentStreak);
  if (nextMilestone) {
    const daysToNext = nextMilestone.days - currentStreak;
    return `${getStreakEmoji(currentStreak)} ${currentStreak} day streak! ${daysToNext} days to ${nextMilestone.title}`;
  }

  return `${getStreakEmoji(currentStreak)} Amazing ${currentStreak} day streak!`;
}
