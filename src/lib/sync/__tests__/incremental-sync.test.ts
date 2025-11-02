/**
 * Comprehensive Sync System Tests
 *
 * Tests for incremental sync, background classification, and continuous sync behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncUserObservations } from '@/lib/stats/user-stats';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback: any) => {
      // Default mock transaction - just execute the callback with prisma as tx
      const mockTx = {
        observation: {
          findMany: vi.fn(),
          createMany: vi.fn(),
          update: vi.fn(),
          count: vi.fn(),
        },
        userStats: {
          upsert: vi.fn(),
        },
      };
      return callback(mockTx);
    }),
    userStats: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    observation: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/sync/fetch-observations', () => ({
  fetchUserObservations: vi.fn(),
  updateUserLocation: vi.fn(),
}));

vi.mock('@/lib/sync/enrich-observations', () => ({
  enrichObservations: vi.fn(),
}));

vi.mock('@/lib/sync/store-observations', () => ({
  storeObservations: vi.fn(),
}));

vi.mock('@/lib/sync/calculate-stats', () => ({
  calculateUserStats: vi.fn(),
  updateUserStatsInDB: vi.fn(),
}));

vi.mock('@/lib/sync/check-achievements', () => ({
  checkAchievements: vi.fn(),
  manageLeaderboards: vi.fn(),
}));

vi.mock('@/lib/sync/progress', () => ({
  initProgress: vi.fn(),
  updateProgress: vi.fn(),
  completeProgress: vi.fn(),
  errorProgress: vi.fn(),
}));

vi.mock('@/lib/rarity-queue/manager', () => ({
  queueTaxaForClassification: vi.fn(),
}));

vi.mock('@/lib/rarity-queue/processor', () => ({
  processUserQueue: vi.fn().mockResolvedValue({ succeeded: 10, failed: 0 }),
}));

vi.mock('@/lib/inat/client', () => ({
  getINatClient: vi.fn(() => ({
    getUserSpeciesCounts: vi.fn().mockResolvedValue({ total_results: 100 }),
  })),
}));

describe('Incremental Sync System', () => {
  const mockUserId = 'test-user-id';
  const mockInatUsername = 'testuser';
  const mockAccessToken = 'mock-token';

  let fetchUserObservations: any;
  let enrichObservations: any;
  let storeObservations: any;
  let calculateUserStats: any;
  let updateUserStatsInDB: any;
  let checkAchievements: any;
  let manageLeaderboards: any;
  let queueTaxaForClassification: any;
  let processUserQueue: any;
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import mocked modules
    const fetchModule = await import('@/lib/sync/fetch-observations');
    const enrichModule = await import('@/lib/sync/enrich-observations');
    const storeModule = await import('@/lib/sync/store-observations');
    const statsModule = await import('@/lib/sync/calculate-stats');
    const achievementsModule = await import('@/lib/sync/check-achievements');
    const queueModule = await import('@/lib/rarity-queue/manager');
    const processorModule = await import('@/lib/rarity-queue/processor');
    const prismaModule = await import('@/lib/db/prisma');

    fetchUserObservations = fetchModule.fetchUserObservations;
    enrichObservations = enrichModule.enrichObservations;
    storeObservations = storeModule.storeObservations;
    calculateUserStats = statsModule.calculateUserStats;
    updateUserStatsInDB = statsModule.updateUserStatsInDB;
    checkAchievements = achievementsModule.checkAchievements;
    manageLeaderboards = achievementsModule.manageLeaderboards;
    queueTaxaForClassification = queueModule.queueTaxaForClassification;
    processUserQueue = processorModule.processUserQueue;
    prisma = prismaModule.prisma;

    // Default mock implementations
    prisma.userStats.findUnique.mockResolvedValue({
      userId: mockUserId,
      totalObservations: 0,
      totalSpecies: 0,
      totalPoints: 0,
      level: 1,
      lastSyncedAt: null,
      currentStreak: 0,
      longestStreak: 0,
    });

    prisma.user.findUnique.mockResolvedValue({
      id: mockUserId,
      inatId: 123,
    });

    prisma.observation.findMany.mockResolvedValue([]);
    prisma.observation.count.mockResolvedValue(0);

    calculateUserStats.mockResolvedValue({
      level: 1,
      pointsToNextLevel: 100,
      totalSpecies: 10,
      streakResult: {
        currentStreak: 0,
        longestStreak: 0,
        lastObservationDate: new Date(),
        streakAtRisk: false,
        hoursUntilBreak: 24,
        milestoneReached: undefined,
      },
      currentRarityStreak: 0,
      longestRarityStreak: 0,
      lastRareObservationDate: null,
    });

    checkAchievements.mockResolvedValue({
      newBadges: [],
      completedQuests: [],
      questMilestones: [],
    });

    // Ensure storeObservations is always set to succeed by default
    // Return the new format with newCount, updatedCount, and newObservationIds
    storeObservations.mockResolvedValue({
      newCount: 100,
      updatedCount: 0,
      newObservationIds: new Set([1, 2, 3, 4, 5]),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Incremental Sync - Batch Fetching', () => {
    it('should fetch observations in batches until all historical observations are synced', async () => {
      // Simulate a user with 300 total observations on iNat
      // First sync fetches 100, second fetches 100, third fetches 100

      // First batch: 100 obs, not all fetched
      fetchUserObservations.mockResolvedValueOnce({
        observations: Array(100).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 300,
        fetchedAll: false,
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(100).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      const result = await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      // Verify first batch result
      expect(result.newObservations).toBe(100);
      expect(result.hasMore).toBe(true);
      expect(result.totalAvailable).toBe(300);

      // Verify lastSyncedAt was NOT set (because fetchedAll is false)
      const updateCall = updateUserStatsInDB.mock.calls[0][1];
      expect(updateCall.fetchedAll).toBe(false);
    });

    it('should mark sync as complete when all observations are fetched', async () => {
      // Simulate final batch where all observations are fetched
      fetchUserObservations.mockResolvedValue({
        observations: Array(50).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 50,
        fetchedAll: true, // All observations fetched
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(50).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 500,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      const result = await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      // Verify completion
      expect(result.hasMore).toBe(false);
      expect(result.totalAvailable).toBe(50);

      // Verify lastSyncedAt WAS set (because fetchedAll is true)
      const updateCall = updateUserStatsInDB.mock.calls[0][1];
      expect(updateCall.fetchedAll).toBe(true);
    });
  });

  describe('lastSyncedAt Conditional Update', () => {
    it('should NOT update lastSyncedAt when fetchedAll is false', async () => {
      fetchUserObservations.mockResolvedValue({
        observations: Array(100).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 500,
        fetchedAll: false, // Not all fetched
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(100).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      // Check that updateUserStatsInDB was called with fetchedAll: false
      // Note: Third parameter is the transaction context
      expect(updateUserStatsInDB).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          fetchedAll: false,
        }),
        expect.anything() // Transaction context
      );
    });

    it('should update lastSyncedAt when fetchedAll is true', async () => {
      fetchUserObservations.mockResolvedValue({
        observations: Array(100).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 100,
        fetchedAll: true, // All fetched
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(100).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      // Check that updateUserStatsInDB was called with fetchedAll: true
      // Note: Third parameter is the transaction context
      expect(updateUserStatsInDB).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          fetchedAll: true,
        }),
        expect.anything() // Transaction context
      );
    });

    it('should allow incremental syncs after partial sync', async () => {
      // First sync: partial
      prisma.userStats.findUnique.mockResolvedValueOnce({
        userId: mockUserId,
        totalObservations: 100,
        lastSyncedAt: null, // No lastSyncedAt because previous sync was partial
      });

      fetchUserObservations.mockResolvedValue({
        observations: Array(100).fill({ taxon: { id: 2, name: 'Species 2' } }),
        isIncrementalSync: false, // Still not incremental because lastSyncedAt is null
        totalAvailable: 200,
        fetchedAll: false,
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(100).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      const result = await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      // Should continue fetching historical observations
      expect(result.hasMore).toBe(true);
      expect(fetchUserObservations).toHaveBeenCalledWith(
        expect.objectContaining({
          lastSyncedAt: undefined, // Not using updated_since filter
        })
      );
    });
  });

  describe('Automatic Background Classification', () => {
    it('should automatically queue and process unclassified taxa', async () => {
      fetchUserObservations.mockResolvedValue({
        observations: Array(100).fill({ taxon: { id: 123, name: 'Rare Species' } }),
        isIncrementalSync: false,
        totalAvailable: 100,
        fetchedAll: true,
      });

      // Simulate some taxa being unclassified
      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(100).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [123, 456, 789], // 3 unclassified taxa
      });

      await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      // Verify taxa were queued
      expect(queueTaxaForClassification).toHaveBeenCalledWith(
        mockUserId,
        expect.arrayContaining([
          expect.objectContaining({ taxonId: 123 }),
        ])
      );

      // Verify background processing was automatically triggered
      expect(processUserQueue).toHaveBeenCalledWith(mockUserId, 20);
    });

    it('should not queue taxa when all are classified', async () => {
      fetchUserObservations.mockResolvedValue({
        observations: Array(100).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 100,
        fetchedAll: true,
      });

      // No unclassified taxa
      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(100).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [], // All classified
      });

      await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      // Verify no queueing happened
      expect(queueTaxaForClassification).not.toHaveBeenCalled();
      expect(processUserQueue).not.toHaveBeenCalled();
    });

    it('should prioritize taxa by observation count', async () => {
      const observations = [
        { taxon: { id: 123, name: 'Common Species' } }, // 5 observations
        { taxon: { id: 123, name: 'Common Species' } },
        { taxon: { id: 123, name: 'Common Species' } },
        { taxon: { id: 123, name: 'Common Species' } },
        { taxon: { id: 123, name: 'Common Species' } },
        { taxon: { id: 456, name: 'Rare Species' } }, // 1 observation
      ];

      fetchUserObservations.mockResolvedValue({
        observations,
        isIncrementalSync: false,
        totalAvailable: 6,
        fetchedAll: true,
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(6).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 60,
        rareFinds: [],
        unclassifiedTaxa: [123, 456],
      });

      await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      // Verify higher priority for taxon with more observations
      const queueCall = queueTaxaForClassification.mock.calls[0];
      const queuedTaxa = queueCall[1];

      const taxon123 = queuedTaxa.find((t: any) => t.taxonId === 123);
      const taxon456 = queuedTaxa.find((t: any) => t.taxonId === 456);

      expect(taxon123.priority).toBe(5); // 5 observations
      expect(taxon456.priority).toBe(1); // 1 observation
    });
  });

  describe('Environment-Dependent Configuration', () => {
    it('should use development limits when ENABLE_DEV_SYNC_LIMITS=true', async () => {
      const originalEnv = process.env.ENABLE_DEV_SYNC_LIMITS;
      process.env.ENABLE_DEV_SYNC_LIMITS = 'true';

      // Force reimport to pick up new env
      vi.resetModules();
      const { SYNC_CONFIG } = await import('@/lib/gamification/constants');

      expect(SYNC_CONFIG.MAX_OBSERVATIONS_PER_SYNC).toBe(200);
      expect(SYNC_CONFIG.FIRST_SYNC_LIMIT).toBe(100);
      expect(SYNC_CONFIG.CHUNK_SIZE).toBe(200);

      process.env.ENABLE_DEV_SYNC_LIMITS = originalEnv;
      vi.resetModules();
    });

    it('should use production limits when ENABLE_DEV_SYNC_LIMITS is not set', async () => {
      const originalEnv = process.env.ENABLE_DEV_SYNC_LIMITS;
      delete process.env.ENABLE_DEV_SYNC_LIMITS;

      // Force reimport to pick up new env
      vi.resetModules();
      const { SYNC_CONFIG } = await import('@/lib/gamification/constants');

      expect(SYNC_CONFIG.MAX_OBSERVATIONS_PER_SYNC).toBe(1000);
      expect(SYNC_CONFIG.FIRST_SYNC_LIMIT).toBe(1000);
      expect(SYNC_CONFIG.CHUNK_SIZE).toBe(1000);

      process.env.ENABLE_DEV_SYNC_LIMITS = originalEnv;
      vi.resetModules();
    });
  });

  describe('Sync Completion Detection', () => {
    it('should return hasMore: false when all observations are synced', async () => {
      fetchUserObservations.mockResolvedValue({
        observations: Array(50).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 50,
        fetchedAll: true,
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(50).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 500,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      const result = await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      expect(result.hasMore).toBe(false);
      expect(result.totalAvailable).toBe(50);
    });

    it('should return hasMore: true when partial sync occurs', async () => {
      fetchUserObservations.mockResolvedValue({
        observations: Array(100).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 1000,
        fetchedAll: false,
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(100).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      const result = await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      expect(result.hasMore).toBe(true);
      expect(result.totalAvailable).toBe(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      fetchUserObservations.mockRejectedValue(new Error('API Error'));

      await expect(
        syncUserObservations(mockUserId, mockInatUsername, mockAccessToken)
      ).rejects.toThrow('API Error');
    });

    it('should handle enrichment errors gracefully', async () => {
      fetchUserObservations.mockResolvedValue({
        observations: Array(10).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 10,
        fetchedAll: true,
      });

      enrichObservations.mockRejectedValue(new Error('Enrichment Error'));

      await expect(
        syncUserObservations(mockUserId, mockInatUsername, mockAccessToken)
      ).rejects.toThrow('Enrichment Error');
    });

    it('should handle storage errors gracefully', async () => {
      fetchUserObservations.mockResolvedValue({
        observations: Array(10).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 10,
        fetchedAll: true,
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(10).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 100,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      storeObservations.mockRejectedValueOnce(new Error('Storage Error'));

      await expect(
        syncUserObservations(mockUserId, mockInatUsername, mockAccessToken)
      ).rejects.toThrow('Storage Error');

      // Reset the mock for subsequent tests
      storeObservations.mockResolvedValue({
        newCount: 100,
        updatedCount: 0,
        newObservationIds: new Set([1, 2, 3, 4, 5]),
      });
    });

    it('should not block sync when background processing fails', async () => {
      fetchUserObservations.mockResolvedValue({
        observations: Array(10).fill({ taxon: { id: 123, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 10,
        fetchedAll: true,
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(10).fill({ points: 10, rarity: 'common', observation: { quality_grade: 'research' } }),
        totalPoints: 100,
        rareFinds: [],
        unclassifiedTaxa: [123],
      });

      // Override default storeObservations mock for this test
      storeObservations.mockResolvedValueOnce({
        newCount: 10,
        updatedCount: 0,
        newObservationIds: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      });

      // Background processing fails
      processUserQueue.mockRejectedValue(new Error('Background Processing Error'));

      // Sync should still succeed (background processing is non-blocking)
      const result = await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      expect(result.newObservations).toBe(10);
      expect(queueTaxaForClassification).toHaveBeenCalled();
    });
  });

  describe('XP Breakdown', () => {
    it('should calculate correct XP breakdown for new species', async () => {
      prisma.userStats.findUnique.mockResolvedValue({
        userId: mockUserId,
        totalSpecies: 50, // User had 50 species before
      });

      calculateUserStats.mockResolvedValue({
        level: 2,
        pointsToNextLevel: 100,
        totalSpecies: 55, // Now has 55 species (5 new)
        streakResult: {
          currentStreak: 1,
          longestStreak: 1,
          lastObservationDate: new Date(),
          streakAtRisk: false,
          hoursUntilBreak: 24,
          milestoneReached: undefined,
        },
        currentRarityStreak: 0,
        longestRarityStreak: 0,
        lastRareObservationDate: null,
      });

      fetchUserObservations.mockResolvedValue({
        observations: Array(10).fill({ taxon: { id: 1, name: 'Species 1' } }),
        isIncrementalSync: false,
        totalAvailable: 10,
        fetchedAll: true,
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: [
          { points: 60, rarity: 'rare', observation: { quality_grade: 'research', taxon: { id: 1 } } },
          { points: 60, rarity: 'rare', observation: { quality_grade: 'research', taxon: { id: 2 } } },
          { points: 35, rarity: 'common', observation: { quality_grade: 'research', taxon: { id: 3 } } },
          { points: 35, rarity: 'common', observation: { quality_grade: 'research', taxon: { id: 4 } } },
          { points: 10, rarity: 'common', observation: { quality_grade: 'casual', taxon: { id: 5 } } },
        ],
        totalPoints: 200,
        rareFinds: [
          { observationId: 1, taxonName: 'Rare 1', rarity: 'rare', bonusPoints: 100, isFirstGlobal: false, isFirstRegional: false },
          { observationId: 2, taxonName: 'Rare 2', rarity: 'rare', bonusPoints: 100, isFirstGlobal: false, isFirstRegional: false },
        ],
        unclassifiedTaxa: [],
      });

      const result = await syncUserObservations(mockUserId, mockInatUsername, mockAccessToken);

      // Verify XP breakdown
      expect(result.xpBreakdown).toBeDefined();
      expect(result.xpBreakdown?.newSpeciesCount).toBe(5); // 55 - 50
      expect(result.xpBreakdown?.rareFindsCount).toBe(2);
      expect(result.xpBreakdown?.researchGradeCount).toBe(4);
      expect(result.xpBreakdown?.totalXP).toBe(200);
    });
  });
});
