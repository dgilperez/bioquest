/**
 * Game Balance Constants
 *
 * Central configuration for all gamification parameters.
 * Adjust these values to fine-tune game balance and difficulty.
 */

// ============================================================================
// POINTS CONFIGURATION
// ============================================================================

export const POINTS_CONFIG = {
  /** Base points awarded for any observation */
  BASE_OBSERVATION_POINTS: 10,

  /** Bonus points for observing a new species for the user */
  NEW_SPECIES_BONUS: 50,

  /** Bonus points for research-grade observations */
  RESEARCH_GRADE_BONUS: 25,

  /** Points per photo (up to max) */
  PHOTO_POINTS: 5,

  /** Maximum number of photos that count for bonus */
  MAX_PHOTO_BONUS: 3,
} as const;

// ============================================================================
// RARITY THRESHOLDS
// ============================================================================

/**
 * Observation count thresholds for each rarity tier.
 * Based on global observation counts on iNaturalist.
 */
export const RARITY_THRESHOLDS = {
  /** < 10 observations globally - almost extinct or newly discovered */
  MYTHIC: 10,

  /** < 100 observations - extremely rare */
  LEGENDARY: 100,

  /** < 500 observations - very rare */
  EPIC: 500,

  /** < 2000 observations - rare */
  RARE: 2000,

  /** < 10000 observations - uncommon */
  UNCOMMON: 10000,

  // >= 10000 = COMMON
} as const;

/**
 * Bonus points awarded for each rarity tier
 */
export const RARITY_BONUS_POINTS = {
  mythic: 2000,
  legendary: 500,
  epic: 250,
  rare: 100,
  uncommon: 25,
  common: 0,
} as const;

/**
 * Special bonuses for first observations
 */
export const FIRST_OBSERVATION_BONUSES = {
  /** Bonus for first global observation ever */
  FIRST_GLOBAL: 5000,

  /** Bonus for first regional observation */
  FIRST_REGIONAL: 1000,
} as const;

// ============================================================================
// LEVEL CONFIGURATION
// ============================================================================

export const LEVEL_CONFIG = {
  /** Base points needed for level 2 */
  BASE_POINTS: 100,

  /** Exponential scaling factor for level calculation */
  EXPONENT: 1.5,

  /** Starting level for new users */
  STARTING_LEVEL: 1,
} as const;

/**
 * Level titles based on level ranges
 */
export const LEVEL_TITLES = [
  { minLevel: 40, title: 'Legendary Naturalist' },
  { minLevel: 30, title: 'Elite Naturalist' },
  { minLevel: 20, title: 'Master Naturalist' },
  { minLevel: 15, title: 'Expert Naturalist' },
  { minLevel: 10, title: 'Field Naturalist' },
  { minLevel: 5, title: 'Amateur Naturalist' },
  { minLevel: 0, title: 'Novice Naturalist' },
] as const;

// ============================================================================
// STREAK CONFIGURATION
// ============================================================================

/**
 * Streak milestone definitions with rewards
 */
export const STREAK_MILESTONES = [
  { days: 3, title: '3-Day Streak', bonusPoints: 25 },
  { days: 7, title: 'Week Warrior', bonusPoints: 100, badgeCode: 'daily_naturalist' },
  { days: 14, title: 'Fortnight Champion', bonusPoints: 200 },
  { days: 30, title: 'Monthly Master', bonusPoints: 500, badgeCode: 'dedicated_observer' },
  { days: 60, title: '2-Month Marvel', bonusPoints: 1000 },
  { days: 100, title: 'Centurion', bonusPoints: 2000 },
  { days: 365, title: 'Year-Long Legend', bonusPoints: 10000 },
  { days: 730, title: 'Two-Year Titan', bonusPoints: 25000 },
  { days: 1000, title: 'Millennium Naturalist', bonusPoints: 50000 },
] as const;

/**
 * Streak warning thresholds
 */
export const STREAK_CONFIG = {
  /** Hours remaining to show urgent warning */
  URGENT_WARNING_HOURS: 6,

  /** Hours allowed between observations to maintain streak */
  STREAK_WINDOW_HOURS: 24,
} as const;

// ============================================================================
// SYNC CONFIGURATION
// ============================================================================

export const SYNC_CONFIG = {
  /** Number of observations to fetch per API page */
  OBSERVATIONS_PER_PAGE: 200,

  /** Delay between API pages (milliseconds) */
  PAGE_DELAY_MS: 500,

  /** Batch size for rarity classification */
  RARITY_BATCH_SIZE: 10,

  /** Delay between rarity batches (milliseconds) */
  RARITY_BATCH_DELAY_MS: 1000,

  /** Max rare finds to report in sync result */
  MAX_RARE_FINDS_TO_REPORT: 10,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate points needed for a specific level
 */
export function pointsForLevel(level: number): number {
  return Math.floor(LEVEL_CONFIG.BASE_POINTS * Math.pow(level, LEVEL_CONFIG.EXPONENT));
}

/**
 * Get level title for a specific level number
 */
export function getLevelTitle(level: number): string {
  const titleConfig = LEVEL_TITLES.find(t => level >= t.minLevel);
  return titleConfig?.title || 'Novice Naturalist';
}

/**
 * Check if a rarity tier should be tracked
 */
export function isRarityTracked(rarity: string): boolean {
  return ['uncommon', 'rare', 'epic', 'legendary', 'mythic'].includes(rarity);
}
