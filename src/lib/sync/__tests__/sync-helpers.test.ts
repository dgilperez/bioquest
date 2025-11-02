/**
 * Unit Tests for Sync Helper Functions
 *
 * Tests for individual helper functions extracted from syncUserObservations
 * to improve maintainability and testability.
 */

import { describe, it, expect } from 'vitest';
import {
  prepareSyncContext,
  calculatePointsForNewObservations,
  buildXPBreakdown,
  buildSyncResult,
} from '@/lib/sync/sync-helpers';
import { SYNC_CONFIG } from '@/lib/gamification/constants';

describe('prepareSyncContext', () => {
  it('should identify first sync when totalObservations is 0', () => {
    const currentStats = {
      totalObservations: 0,
      level: 1,
      lastSyncedAt: null,
      syncCursor: null,
    };

    const result = prepareSyncContext(currentStats);

    expect(result.oldObservationCount).toBe(0);
    expect(result.oldLevel).toBe(1);
    expect(result.lastSyncedAt).toBeNull();
    expect(result.syncCursor).toBeNull();
    expect(result.isFirstSync).toBe(true);
    expect(result.maxObservations).toBe(SYNC_CONFIG.FIRST_SYNC_LIMIT);
  });

  it('should identify subsequent sync when totalObservations > 0', () => {
    const currentStats = {
      totalObservations: 250,
      level: 5,
      lastSyncedAt: new Date('2025-01-01T00:00:00Z'),
      syncCursor: null,
    };

    const result = prepareSyncContext(currentStats);

    expect(result.oldObservationCount).toBe(250);
    expect(result.oldLevel).toBe(5);
    expect(result.lastSyncedAt).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(result.isFirstSync).toBe(false);
    expect(result.maxObservations).toBe(SYNC_CONFIG.MAX_OBSERVATIONS_PER_SYNC);
  });

  it('should handle null currentStats (new user)', () => {
    const result = prepareSyncContext(null);

    expect(result.oldObservationCount).toBe(0);
    expect(result.oldLevel).toBe(1);
    expect(result.lastSyncedAt).toBeUndefined();
    expect(result.syncCursor).toBeUndefined();
    expect(result.isFirstSync).toBe(true);
    expect(result.maxObservations).toBe(SYNC_CONFIG.FIRST_SYNC_LIMIT);
  });

  it('should preserve syncCursor when present', () => {
    const cursorDate = new Date('2025-01-15T12:00:00Z');
    const currentStats = {
      totalObservations: 500,
      level: 7,
      lastSyncedAt: new Date('2025-01-01T00:00:00Z'),
      syncCursor: cursorDate,
    };

    const result = prepareSyncContext(currentStats);

    expect(result.syncCursor).toEqual(cursorDate);
  });
});

describe('calculatePointsForNewObservations', () => {
  it('should only count points from NEW observations', () => {
    const enrichedObservations = [
      { observation: { id: 1 }, points: 50, rarity: 'rare', isNewSpecies: true },
      { observation: { id: 2 }, points: 10, rarity: 'common', isNewSpecies: false },
      { observation: { id: 3 }, points: 100, rarity: 'legendary', isNewSpecies: true },
      { observation: { id: 4 }, points: 10, rarity: 'common', isNewSpecies: false },
      { observation: { id: 5 }, points: 10, rarity: 'common', isNewSpecies: false },
    ];

    // Only observations 1, 3, 5 are NEW (not in DB before)
    const newObservationIds = new Set([1, 3, 5]);

    const totalPoints = calculatePointsForNewObservations(enrichedObservations, newObservationIds);

    // Should be: 50 (obs 1) + 100 (obs 3) + 10 (obs 5) = 160
    expect(totalPoints).toBe(160);
  });

  it('should return 0 when no observations are new', () => {
    const enrichedObservations = [
      { observation: { id: 1 }, points: 50, rarity: 'rare', isNewSpecies: true },
      { observation: { id: 2 }, points: 10, rarity: 'common', isNewSpecies: false },
    ];

    const newObservationIds = new Set<number>(); // Empty - all are updates

    const totalPoints = calculatePointsForNewObservations(enrichedObservations, newObservationIds);

    expect(totalPoints).toBe(0);
  });

  it('should handle empty enrichedObservations', () => {
    const totalPoints = calculatePointsForNewObservations([], new Set([1, 2, 3]));

    expect(totalPoints).toBe(0);
  });
});

describe('buildXPBreakdown', () => {
  it('should correctly categorize XP sources', () => {
    const enrichedObservations = [
      {
        observation: { id: 1, quality_grade: 'research' },
        points: 60, // 10 base + 50 new species
        rarity: 'common',
        isNewSpecies: true,
      },
      {
        observation: { id: 2, quality_grade: 'research' },
        points: 35, // 10 base + 25 research grade
        rarity: 'common',
        isNewSpecies: false,
      },
      {
        observation: { id: 3, quality_grade: 'needs_id' },
        points: 110, // 10 base + 100 rare bonus
        rarity: 'rare',
        isNewSpecies: false,
      },
      {
        observation: { id: 4, quality_grade: 'casual' },
        points: 510, // 10 base + 500 legendary bonus
        rarity: 'legendary',
        isNewSpecies: false,
      },
    ];

    const newObservationIds = new Set([1, 2, 3, 4]);
    const totalXP = 60 + 35 + 110 + 510;
    const newSpeciesCount = 3; // Calculated from stats difference (simulated)

    const breakdown = buildXPBreakdown(enrichedObservations, newObservationIds, totalXP, newSpeciesCount);

    expect(breakdown.totalXP).toBe(715);
    expect(breakdown.newSpeciesCount).toBe(3); // Passed in value
    expect(breakdown.rareFindsCount).toBe(2); // Observations 3 and 4
    expect(breakdown.researchGradeCount).toBe(2); // Observations 1 and 2
  });

  it('should count display stats from ALL observations but only actual XP from NEW', () => {
    const enrichedObservations = [
      {
        observation: { id: 1, quality_grade: 'research' },
        points: 60,
        rarity: 'rare',
        isNewSpecies: true,
      },
      {
        observation: { id: 2, quality_grade: 'research' },
        points: 35,
        rarity: 'common',
        isNewSpecies: false,
      },
    ];

    // Only observation 1 is NEW - so we only award 60 XP
    // But counts (research grade, rare) include ALL fetched observations for display
    const newObservationIds = new Set([1]);
    const newSpeciesCount = 1;

    const breakdown = buildXPBreakdown(enrichedObservations, newObservationIds, 60, newSpeciesCount);

    expect(breakdown.newSpeciesCount).toBe(1); // Passed in value
    expect(breakdown.rareFindsCount).toBe(1); // Only observation 1 is rare
    expect(breakdown.researchGradeCount).toBe(2); // BOTH observations are research grade (counts ALL)
    expect(breakdown.totalXP).toBe(60); // Only NEW observations' XP
  });

  it('should handle zero XP scenario', () => {
    const breakdown = buildXPBreakdown([], new Set(), 0, 0);

    expect(breakdown.totalXP).toBe(0);
    expect(breakdown.newSpeciesCount).toBe(0);
    expect(breakdown.rareFindsCount).toBe(0);
    expect(breakdown.researchGradeCount).toBe(0);
  });
});

describe('buildSyncResult', () => {
  it('should correctly build sync result with level up', () => {
    const mockAchievements = {
      newBadges: [{ id: 'badge-1', name: 'First Steps' }],
      completedQuests: [],
      questMilestones: [{ questId: 'quest-1', milestone: 'halfway' }],
    };

    const mockStats = {
      level: 5,
      pointsToNextLevel: 500,
      totalSpecies: 100,
      totalPoints: 2500,
      totalObservations: 250,
      streakData: {
        currentStreak: 7,
        longestStreak: 10,
        streakAtRisk: false,
        hoursUntilBreak: 18,
      },
    };

    const mockRareFinds = [
      {
        observationId: 123,
        taxonName: 'Rare Bird',
        rarity: 'rare',
        bonusPoints: 100,
        isFirstGlobal: false,
        isFirstRegional: true,
      },
    ];

    const mockXpBreakdown = {
      totalXP: 500,
      newSpeciesCount: 5,
      rareFindsCount: 1,
      researchGradeCount: 10,
    };

    const result = buildSyncResult({
      achievements: mockAchievements,
      stats: mockStats,
      rareFinds: mockRareFinds,
      xpBreakdown: mockXpBreakdown,
      newObservations: 15,
      totalSynced: 250,
      hasMore: false,
      totalAvailable: 250,
      oldLevel: 4,
      durationMs: 3500,
    });

    expect(result.success).toBe(true);
    expect(result.newObservations).toBe(15);
    expect(result.totalSynced).toBe(250);
    expect(result.hasMore).toBe(false);
    expect(result.totalAvailable).toBe(250);
    expect(result.leveledUp).toBe(true); // 4 -> 5
    expect(result.newLevel).toBe(5);
    expect(result.oldLevel).toBe(4);
    expect(result.levelTitle).toBeDefined();
    expect(result.newBadges).toHaveLength(1);
    expect(result.completedQuests).toHaveLength(0);
    expect(result.questMilestones).toHaveLength(1);
    expect(result.streakData).toEqual(mockStats.streakData);
    expect(result.rareFinds).toEqual(mockRareFinds);
    expect(result.xpBreakdown).toEqual(mockXpBreakdown);
    expect(result.durationMs).toBe(3500);
  });

  it('should not indicate level up when level stays the same', () => {
    const mockAchievements = {
      newBadges: [],
      completedQuests: [],
      questMilestones: [],
    };

    const mockStats = {
      level: 3,
      pointsToNextLevel: 800,
      totalSpecies: 50,
      totalPoints: 1200,
      totalObservations: 100,
      streakData: {
        currentStreak: 2,
        longestStreak: 5,
        streakAtRisk: true,
        hoursUntilBreak: 4,
      },
    };

    const result = buildSyncResult({
      achievements: mockAchievements,
      stats: mockStats,
      rareFinds: [],
      xpBreakdown: {
        totalXP: 100,
        newSpeciesCount: 2,
        rareFindsCount: 0,
        researchGradeCount: 5,
      },
      newObservations: 5,
      totalSynced: 100,
      hasMore: true,
      totalAvailable: 500,
      oldLevel: 3,
      durationMs: 2000,
    });

    expect(result.leveledUp).toBe(false);
    expect(result.newLevel).toBeUndefined(); // No level up, so newLevel not set
    expect(result.oldLevel).toBe(3);
    expect(result.levelTitle).toBeUndefined();
  });

  it('should handle sync with no new observations', () => {
    const mockAchievements = {
      newBadges: [],
      completedQuests: [],
      questMilestones: [],
    };

    const mockStats = {
      level: 2,
      pointsToNextLevel: 500,
      totalSpecies: 30,
      totalPoints: 500,
      totalObservations: 50,
      streakData: {
        currentStreak: 1,
        longestStreak: 3,
        streakAtRisk: false,
        hoursUntilBreak: 20,
      },
    };

    const result = buildSyncResult({
      achievements: mockAchievements,
      stats: mockStats,
      rareFinds: [],
      xpBreakdown: {
        totalXP: 0,
        newSpeciesCount: 0,
        rareFindsCount: 0,
        researchGradeCount: 0,
      },
      newObservations: 0,
      totalSynced: 50,
      hasMore: false,
      oldLevel: 2,
      durationMs: 1000,
    });

    expect(result.success).toBe(true);
    expect(result.newObservations).toBe(0);
    expect(result.leveledUp).toBe(false);
    expect(result.xpBreakdown.totalXP).toBe(0);
  });
});
