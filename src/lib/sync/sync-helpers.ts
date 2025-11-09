/**
 * Sync Helper Functions
 *
 * Extracted from syncUserObservations to improve maintainability and testability.
 * Each function has a single responsibility and can be unit tested in isolation.
 */

import { SYNC_CONFIG, getLevelTitle as getTitle } from '@/lib/gamification/constants';
import { EnrichedObservation } from './enrich-observations';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SyncContext {
  oldObservationCount: number;
  oldLevel: number;
  lastSyncedAt: Date | null | undefined;
  syncCursor: Date | null | undefined;
  isFirstSync: boolean;
  maxObservations: number;
}

export interface XPBreakdown {
  totalXP: number;
  newSpeciesCount: number;
  rareFindsCount: number;
  researchGradeCount: number;
}

export interface RareFind {
  observationId: number;
  taxonName: string;
  commonName?: string;
  rarity: string;
  bonusPoints: number;
  isFirstGlobal: boolean;
  isFirstRegional: boolean;
}

export interface StatsResult {
  level: number;
  pointsToNextLevel: number;
  totalSpecies: number;
  totalPoints: number;
  totalObservations: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    streakAtRisk: boolean;
    hoursUntilBreak: number;
  };
}

export interface AchievementsResult {
  newBadges: any[];
  completedQuests: any[];
  questMilestones: any[];
}

export interface SyncResult {
  success: boolean;
  newObservations: number;
  totalSynced: number;
  hasMore: boolean;
  totalAvailable?: number;
  newBadges: any[];
  completedQuests: any[];
  questMilestones: any[];
  leveledUp: boolean;
  newLevel?: number;
  levelTitle?: string;
  oldLevel?: number;
  streakData: StatsResult['streakData'];
  rareFinds: RareFind[];
  xpBreakdown: XPBreakdown;
  durationMs: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Prepare sync context from current user stats
 *
 * Determines if this is a first sync and sets appropriate observation limits.
 *
 * @param currentStats - Current user stats from database (can be null for new users)
 * @returns SyncContext with sync parameters
 */
export function prepareSyncContext(currentStats: any): SyncContext {
  const oldObservationCount = currentStats?.totalObservations || 0;
  const oldLevel = currentStats?.level || 1;
  const lastSyncedAt = currentStats?.lastSyncedAt;
  const syncCursor = currentStats?.syncCursor;

  // Determine if this is a first sync (no observations in DB)
  const isFirstSync = oldObservationCount === 0;
  const maxObservations = isFirstSync
    ? SYNC_CONFIG.FIRST_SYNC_LIMIT
    : SYNC_CONFIG.MAX_OBSERVATIONS_PER_SYNC;

  return {
    oldObservationCount,
    oldLevel,
    lastSyncedAt,
    syncCursor,
    isFirstSync,
    maxObservations,
  };
}

/**
 * Calculate total points from NEW observations only
 *
 * Prevents double-counting by only summing points from observations
 * that are actually new (not updates to existing observations).
 *
 * @param enrichedObservations - All enriched observations from this sync
 * @param newObservationIds - Set of IDs that are truly new (not in DB before)
 * @returns Total points to award
 */
export function calculatePointsForNewObservations(
  enrichedObservations: EnrichedObservation[],
  newObservationIds: Set<number>
): number {
  return enrichedObservations
    .filter(e => newObservationIds.has(e.observation.id))
    .reduce((sum, e) => sum + e.points, 0);
}

/**
 * Build XP breakdown for display
 *
 * Categorizes XP sources for user transparency.
 *
 * @param enrichedObservations - All enriched observations from this sync
 * @param newObservationIds - Set of IDs that are new
 * @param totalXP - Total XP earned this sync
 * @param newSpeciesCount - Number of new species discovered (calculated from stats difference)
 * @returns XP breakdown by category
 */
export function buildXPBreakdown(
  enrichedObservations: EnrichedObservation[],
  _newObservationIds: Set<number>,
  totalXP: number,
  newSpeciesCount: number
): XPBreakdown {
  // Count all from enriched observations (for display)
  // Note: rarity and research grade counts include ALL fetched observations, not just NEW ones
  const rareFindsCount = enrichedObservations.filter(e =>
    e.rarity && ['rare', 'epic', 'legendary', 'mythic'].includes(e.rarity)
  ).length;
  const researchGradeCount = enrichedObservations.filter(e =>
    e.observation.quality_grade === 'research'
  ).length;

  return {
    totalXP,
    newSpeciesCount,
    rareFindsCount,
    researchGradeCount,
  };
}

/**
 * Build final sync result object
 *
 * Assembles all sync data into the final result object returned to the client.
 *
 * @param params - All sync result data
 * @returns Complete sync result
 */
export function buildSyncResult(params: {
  achievements: AchievementsResult;
  stats: StatsResult;
  rareFinds: RareFind[];
  xpBreakdown: XPBreakdown;
  newObservations: number;
  totalSynced: number;
  hasMore: boolean;
  totalAvailable?: number;
  oldLevel: number;
  durationMs: number;
}): SyncResult {
  const {
    achievements,
    stats,
    rareFinds,
    xpBreakdown,
    newObservations,
    totalSynced,
    hasMore,
    totalAvailable,
    oldLevel,
    durationMs,
  } = params;

  const leveledUp = stats.level > oldLevel;

  return {
    success: true,
    newObservations,
    totalSynced,
    hasMore,
    totalAvailable,
    newBadges: achievements.newBadges,
    completedQuests: achievements.completedQuests,
    questMilestones: achievements.questMilestones,
    leveledUp,
    newLevel: leveledUp ? stats.level : undefined,
    levelTitle: leveledUp ? getTitle(stats.level) : undefined,
    oldLevel,
    streakData: stats.streakData,
    rareFinds: rareFinds.slice(0, SYNC_CONFIG.MAX_RARE_FINDS_TO_REPORT),
    xpBreakdown,
    durationMs,
  };
}
