/**
 * Level and XP progression configuration for BioQuest
 *
 * This module defines the experience point requirements and rewards
 * for each level in the gamification system.
 */

export interface LevelConfig {
  level: number;
  minXP: number;
  maxXP: number;
  title?: string;
  unlocks?: string[];
}

/**
 * XP required for each level
 * Using a progressive curve: XP = level^2 * 500
 *
 * Examples:
 * - Level 1: 0 - 500 XP
 * - Level 2: 500 - 2,000 XP (1,500 XP needed)
 * - Level 5: 10,000 - 12,500 XP (2,500 XP needed)
 * - Level 10: 45,000 - 50,000 XP (5,000 XP needed)
 */
export function getXPForLevel(level: number): number {
  if (level <= 0) return 0;
  return Math.floor(Math.pow(level, 2) * 500);
}

/**
 * Calculate XP required to reach next level
 */
export function getXPToNextLevel(currentLevel: number, currentXP: number): number {
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return Math.max(0, nextLevelXP - currentXP);
}

/**
 * Calculate progress percentage to next level
 */
export function getLevelProgress(currentLevel: number, currentXP: number): number {
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);

  const xpIntoLevel = currentXP - currentLevelXP;
  const xpRequiredForLevel = nextLevelXP - currentLevelXP;

  if (xpRequiredForLevel <= 0) return 100;

  return Math.min(100, Math.max(0, (xpIntoLevel / xpRequiredForLevel) * 100));
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;

  // Find the highest level where minXP <= totalXP
  while (getXPForLevel(level + 1) <= totalXP) {
    level++;
  }

  return level;
}

/**
 * Get level configuration with metadata
 */
export function getLevelConfig(level: number): LevelConfig {
  return {
    level,
    minXP: getXPForLevel(level),
    maxXP: getXPForLevel(level + 1),
    title: getLevelTitle(level),
    unlocks: getLevelUnlocks(level),
  };
}

/**
 * Get title/rank for a level
 */
function getLevelTitle(level: number): string {
  if (level >= 50) return 'Legendary Naturalist';
  if (level >= 40) return 'Master Naturalist';
  if (level >= 30) return 'Expert Naturalist';
  if (level >= 20) return 'Advanced Naturalist';
  if (level >= 10) return 'Experienced Naturalist';
  if (level >= 5) return 'Naturalist';
  return 'Apprentice Naturalist';
}

/**
 * Get features/content unlocked at this level
 */
function getLevelUnlocks(level: number): string[] {
  const unlocks: string[] = [];

  if (level === 5) unlocks.push('Custom Quests');
  if (level === 10) unlocks.push('Advanced Statistics');
  if (level === 15) unlocks.push('Trip Planning');
  if (level === 20) unlocks.push('Expert Challenges');
  if (level === 25) unlocks.push('Leaderboard Badges');
  if (level === 30) unlocks.push('Mentor Status');

  return unlocks;
}

/**
 * Pre-calculated level table for common levels
 * For performance when displaying leaderboards, etc.
 */
export const LEVEL_TABLE: LevelConfig[] = Array.from({ length: 51 }, (_, i) =>
  getLevelConfig(i)
);
