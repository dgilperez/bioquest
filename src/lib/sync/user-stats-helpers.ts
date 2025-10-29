/**
 * Helper functions extracted from user-stats.ts for use in sync services
 */

import { LEVEL_CONFIG, pointsForLevel } from '@/lib/gamification/constants';

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
