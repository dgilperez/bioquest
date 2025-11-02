/**
 * Progress Tracking and Race Condition Tests
 *
 * Critical tests for:
 * 1. Atomic progress locking to prevent duplicate syncs
 * 2. Double-counting prevention (NEW vs UPDATED observations)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initProgress, getProgress, completeProgress, errorProgress } from '@/lib/sync/progress';
import { syncUserObservations } from '@/lib/stats/user-stats';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => {
  const mockPrisma = {
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
    syncProgress: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    userStats: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    observation: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $executeRaw: vi.fn(),
  };
  return {
    prisma: mockPrisma,
  };
});

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

vi.mock('@/lib/rarity-queue/manager', () => ({
  queueTaxaForClassification: vi.fn(),
}));

vi.mock('@/lib/rarity-queue/processor', () => ({
  processUserQueue: vi.fn().mockResolvedValue({ succeeded: 0, failed: 0 }),
}));

vi.mock('@/lib/inat/client', () => ({
  getINatClient: vi.fn(() => ({
    getUserSpeciesCounts: vi.fn().mockResolvedValue({ total_results: 100 }),
  })),
}));

describe('Progress Tracking and Race Conditions', () => {
  const mockUserId = 'test-user-id';

  let prisma: any;
  let $executeRaw: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const prismaModule = await import('@/lib/db/prisma');
    prisma = prismaModule.prisma;
    $executeRaw = prisma.$executeRaw;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initProgress - Atomic Locking', () => {
    it('should successfully initialize progress when no sync is in progress', async () => {
      // Simulate successful UPDATE (1 row affected)
      $executeRaw.mockResolvedValue(1);

      await expect(initProgress(mockUserId, 1000)).resolves.not.toThrow();

      // Verify raw SQL was called (Prisma uses tagged template literal, so args are in array)
      expect($executeRaw).toHaveBeenCalled();

      // Verify the SQL contains the atomic WHERE clause
      const sqlCall = $executeRaw.mock.calls[0];
      const sqlString = sqlCall[0].join(''); // Reconstruct SQL from template parts

      expect(sqlString).toContain('UPDATE sync_progress');
      expect(sqlString).toContain('WHERE userId =');
      expect(sqlString).toContain("AND (status IS NULL OR status != 'syncing')");
    });

    it('should successfully create progress when record does not exist', async () => {
      // Simulate UPDATE affecting 0 rows (no record exists)
      $executeRaw.mockResolvedValue(0);

      // Simulate successful CREATE
      prisma.syncProgress.create.mockResolvedValue({
        userId: mockUserId,
        status: 'syncing',
        phase: 'fetching',
      });

      await expect(initProgress(mockUserId, 1000)).resolves.not.toThrow();

      expect(prisma.syncProgress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            status: 'syncing',
            phase: 'fetching',
          }),
        })
      );
    });

    it('should throw error when sync is already in progress (atomic lock)', async () => {
      // Simulate UPDATE affecting 0 rows (record exists but status is 'syncing')
      $executeRaw.mockResolvedValue(0);

      // Simulate CREATE failing due to unique constraint (sync already in progress)
      prisma.syncProgress.create.mockRejectedValue(
        new Error('Unique constraint failed')
      );

      await expect(initProgress(mockUserId, 1000)).rejects.toThrow(
        'Sync already in progress for this user'
      );

      // Verify we tried to create after UPDATE returned 0
      expect(prisma.syncProgress.create).toHaveBeenCalled();
    });

    it('should prevent race condition: two concurrent initProgress calls', async () => {
      // First call: UPDATE succeeds (returns 1)
      // Second call: UPDATE fails (returns 0), CREATE fails
      const callResults = [1, 0]; // First succeeds, second fails

      $executeRaw.mockImplementation(() => {
        return Promise.resolve(callResults.shift());
      });

      prisma.syncProgress.create.mockRejectedValue(
        new Error('Unique constraint failed')
      );

      // First call should succeed
      const firstCall = initProgress(mockUserId, 1000);
      await expect(firstCall).resolves.not.toThrow();

      // Second concurrent call should fail
      const secondCall = initProgress(mockUserId, 1000);
      await expect(secondCall).rejects.toThrow(
        'Sync already in progress for this user'
      );
    });
  });

  describe('Double-Counting Prevention', () => {
    let fetchUserObservations: any;
    let enrichObservations: any;
    let storeObservations: any;
    let calculateUserStats: any;
    let updateUserStatsInDB: any;
    let checkAchievements: any;

    beforeEach(async () => {
      const fetchModule = await import('@/lib/sync/fetch-observations');
      const enrichModule = await import('@/lib/sync/enrich-observations');
      const storeModule = await import('@/lib/sync/store-observations');
      const statsModule = await import('@/lib/sync/calculate-stats');
      const achievementsModule = await import('@/lib/sync/check-achievements');

      fetchUserObservations = fetchModule.fetchUserObservations;
      enrichObservations = enrichModule.enrichObservations;
      storeObservations = storeModule.storeObservations;
      calculateUserStats = statsModule.calculateUserStats;
      updateUserStatsInDB = statsModule.updateUserStatsInDB;
      checkAchievements = achievementsModule.checkAchievements;

      // Default mocks for sync flow
      prisma.userStats.findUnique.mockResolvedValue({
        userId: mockUserId,
        totalObservations: 100, // User already has 100 observations
        totalPoints: 1000, // User already has 1000 points
        level: 2,
      });

      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        inatId: 123,
      });

      prisma.observation.count.mockResolvedValue(0);

      calculateUserStats.mockResolvedValue({
        level: 2,
        pointsToNextLevel: 500,
        totalSpecies: 50,
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

      checkAchievements.mockResolvedValue({
        newBadges: [],
        completedQuests: [],
        questMilestones: [],
      });

      // Mock progress tracking to succeed
      $executeRaw.mockResolvedValue(1);
    });

    it('should NOT double-count points from UPDATED observations', async () => {
      // Scenario: User syncs 50 observations
      // 30 are NEW (never seen before) -> should count points
      // 20 are UPDATED (already in DB) -> should NOT count points again

      fetchUserObservations.mockResolvedValue({
        observations: Array(50).fill({ id: 1, taxon: { id: 1, name: 'Species 1' } }),
        fetchedAll: true,
        totalAvailable: 50,
        newestObservationDate: new Date(),
      });

      // Create 50 enriched observations with unique IDs (1-50)
      const enriched = Array.from({ length: 50 }, (_, i) => ({
        points: 10,
        rarity: 'common',
        observation: { id: i + 1, quality_grade: 'research', taxon: { id: 1 } },
      }));

      enrichObservations.mockResolvedValue({
        enrichedObservations: enriched,
        totalPoints: 500,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      // storeObservations returns: 30 NEW, 20 UPDATED
      // Only the 30 NEW observations have IDs in newObservationIds (IDs 1-30)
      const newObsIds = new Set(Array.from({ length: 30 }, (_, i) => i + 1));

      storeObservations.mockResolvedValue({
        newCount: 30,
        updatedCount: 20,
        newObservationIds: newObsIds,
      });

      const result = await syncUserObservations(
        mockUserId,
        'testuser',
        'mock-token'
      );

      // Verify:
      // - newObservations should be 30 (not 50)
      // - totalSynced should be 100 + 50 FETCHED = 150 (cumulative from iNat)
      expect(result.newObservations).toBe(30);
      expect(result.totalSynced).toBe(150); // 100 old + 50 fetched from iNat

      // Verify updateUserStatsInDB was called with correct totals
      const updateCall = updateUserStatsInDB.mock.calls[0];
      expect(updateCall[1].totalObservations).toBe(130); // 100 + 30 NEW

      // IMPORTANT: Points calculation
      // enrichedObservations contains 50 items, each worth 10 points = 500 total XP
      // But only 30 are NEW observations (in newObservationIds set)
      // So we filter: enrichedObservations.filter(e => newObservationIds.has(e.observation.id))
      // This gives us 30 observations * 10 points = 300 XP
      // Total points should be 1000 (initial) + 300 (NEW only) = 1300
      expect(updateCall[1].totalPoints).toBe(1300); // 1000 + 300 (only NEW observations)
    });

    it('should correctly handle subsequent syncs with mix of NEW and UPDATED', async () => {
      // First sync: 100 observations, all NEW
      prisma.userStats.findUnique.mockResolvedValueOnce({
        userId: mockUserId,
        totalObservations: 0,
        totalPoints: 0,
        level: 1,
      });

      fetchUserObservations.mockResolvedValueOnce({
        observations: Array(100).fill({ id: 1, taxon: { id: 1 } }),
        fetchedAll: false,
        totalAvailable: 200,
        newestObservationDate: new Date(),
      });

      enrichObservations.mockResolvedValueOnce({
        enrichedObservations: Array(100).fill({ points: 10, observation: { id: 1 } }),
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      storeObservations.mockResolvedValueOnce({
        newCount: 100,
        updatedCount: 0,
        newObservationIds: new Set(Array.from({ length: 100 }, (_, i) => i)),
      });

      $executeRaw.mockResolvedValue(1); // Allow sync to start

      const firstResult = await syncUserObservations(mockUserId, 'testuser', 'mock-token');

      expect(firstResult.newObservations).toBe(100);
      expect(firstResult.totalSynced).toBe(100);

      // Second sync: 100 more observations, but first 50 are UPDATED (refetched), next 50 are NEW
      vi.clearAllMocks();

      prisma.userStats.findUnique.mockResolvedValueOnce({
        userId: mockUserId,
        totalObservations: 100,
        totalPoints: 1000,
        level: 2,
      });

      fetchUserObservations.mockResolvedValueOnce({
        observations: Array(100).fill({ id: 1, taxon: { id: 1 } }),
        fetchedAll: true,
        totalAvailable: 150,
        newestObservationDate: new Date(),
      });

      enrichObservations.mockResolvedValueOnce({
        enrichedObservations: Array(100).fill({ points: 10, observation: { id: 1 } }),
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      storeObservations.mockResolvedValueOnce({
        newCount: 50, // Only 50 are truly NEW
        updatedCount: 50, // 50 are UPDATED (already in DB)
        newObservationIds: new Set(Array.from({ length: 50 }, (_, i) => i + 100)), // IDs 100-149
      });

      $executeRaw.mockResolvedValue(1);
      calculateUserStats.mockResolvedValue({
        level: 3,
        pointsToNextLevel: 1000,
        totalSpecies: 75,
        streakResult: {
          currentStreak: 2,
          longestStreak: 2,
          lastObservationDate: new Date(),
          streakAtRisk: false,
          hoursUntilBreak: 24,
        },
        currentRarityStreak: 0,
        longestRarityStreak: 0,
        lastRareObservationDate: null,
      });

      const secondResult = await syncUserObservations(mockUserId, 'testuser', 'mock-token');

      // Verify only NEW observations are counted
      expect(secondResult.newObservations).toBe(50); // Only NEW count
      expect(secondResult.totalSynced).toBe(200); // Cumulative: 100 + 100 fetched from iNat

      // Verify points only added for the 50 NEW observations
      const updateCall = updateUserStatsInDB.mock.calls[0];
      expect(updateCall[1].totalObservations).toBe(150);
      expect(updateCall[1].totalPoints).toBeLessThan(2000); // Not 1000 + 1000 (all 100)
    });

    it('should correctly track totalSynced even when ALL observations are duplicates', async () => {
      // CRITICAL EDGE CASE: First sync with 1000 observations, but ALL are duplicates
      // This is the bug that caused infinite loop in production
      // totalSynced should be 1000 (fetched from iNat), NOT 0 (new count)

      prisma.userStats.findUnique.mockResolvedValue({
        userId: mockUserId,
        totalObservations: 0, // Fresh user
        totalPoints: 0,
        level: 1,
      });

      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        inatId: 123,
      });

      prisma.observation.count.mockResolvedValue(0);

      // Fetch 1000 observations from iNat
      fetchUserObservations.mockResolvedValue({
        observations: Array(1000).fill({ id: 1, taxon: { id: 1, name: 'Species 1' } }),
        fetchedAll: false, // More to sync
        totalAvailable: 7740,
        newestObservationDate: new Date(),
      });

      const enriched = Array.from({ length: 1000 }, (_, i) => ({
        points: 10,
        rarity: 'common',
        observation: { id: i + 1, quality_grade: 'research', taxon: { id: 1 } },
      }));

      enrichObservations.mockResolvedValue({
        enrichedObservations: enriched,
        totalPoints: 10000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      // CRITICAL: ALL observations are duplicates (stored but not counted as new)
      // This can happen if sync was interrupted or observations were pre-existing
      storeObservations.mockResolvedValue({
        newCount: 0, // NO new observations
        updatedCount: 1000, // ALL are updates
        newObservationIds: new Set(), // Empty set
      });

      calculateUserStats.mockResolvedValue({
        level: 1,
        pointsToNextLevel: 1000,
        totalSpecies: 0,
        streakResult: {
          currentStreak: 0,
          longestStreak: 0,
          lastObservationDate: null,
          streakAtRisk: false,
          hoursUntilBreak: 48,
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

      $executeRaw.mockResolvedValue(1);

      const result = await syncUserObservations(mockUserId, 'testuser', 'mock-token');

      // CRITICAL ASSERTIONS:
      expect(result.newObservations).toBe(0); // No NEW observations
      expect(result.totalSynced).toBe(1000); // But we DID sync 1000 from iNat!
      expect(result.hasMore).toBe(true); // More to sync (7740 total)
      expect(result.totalAvailable).toBe(7740);

      // This ensures AutoSync can track progress correctly:
      // - First sync: totalSynced = 1000, totalAvailable = 7740 (6740 remaining)
      // - Second sync: totalSynced = 2000, totalAvailable = 7740 (5740 remaining)
      // Without this fix, totalSynced would be 0 forever = infinite loop!
    });

    it('should correctly track totalSynced when fetching MORE than newCount', async () => {
      // Another edge case: Fetch 100, but only 10 are NEW
      // totalSynced should count FETCHED (100), not NEW (10)

      prisma.userStats.findUnique.mockResolvedValue({
        userId: mockUserId,
        totalObservations: 500, // User already has 500
        totalPoints: 5000,
        level: 3,
      });

      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        inatId: 123,
      });

      prisma.observation.count.mockResolvedValue(0);

      // Fetch 100 observations
      fetchUserObservations.mockResolvedValue({
        observations: Array(100).fill({ id: 1, taxon: { id: 1 } }),
        fetchedAll: false,
        totalAvailable: 1000,
        newestObservationDate: new Date(),
      });

      const enriched = Array.from({ length: 100 }, (_, i) => ({
        points: 10,
        rarity: 'common',
        observation: { id: i + 1, quality_grade: 'research', taxon: { id: 1 } },
      }));

      enrichObservations.mockResolvedValue({
        enrichedObservations: enriched,
        totalPoints: 1000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      // Only 10 NEW, 90 UPDATED
      const newObsIds = new Set(Array.from({ length: 10 }, (_, i) => i + 1));
      storeObservations.mockResolvedValue({
        newCount: 10,
        updatedCount: 90,
        newObservationIds: newObsIds,
      });

      calculateUserStats.mockResolvedValue({
        level: 3,
        pointsToNextLevel: 500,
        totalSpecies: 100,
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

      checkAchievements.mockResolvedValue({
        newBadges: [],
        completedQuests: [],
        questMilestones: [],
      });

      $executeRaw.mockResolvedValue(1);

      const result = await syncUserObservations(mockUserId, 'testuser', 'mock-token');

      // CRITICAL: totalSynced = oldCount (500) + FETCHED (100) = 600
      // NOT oldCount (500) + NEW (10) = 510
      expect(result.newObservations).toBe(10);
      expect(result.totalSynced).toBe(600); // 500 + 100 fetched
      expect(result.hasMore).toBe(true);
      expect(result.totalAvailable).toBe(1000);

      // Database should only add 10 NEW observations
      const updateCall = updateUserStatsInDB.mock.calls[0];
      expect(updateCall[1].totalObservations).toBe(510); // 500 + 10 NEW
    });

    it('should track totalSynced correctly across multiple sync batches', async () => {
      // Simulate multiple syncs to verify cumulative tracking
      // Batch 1: 0 + 1000 = 1000
      // Batch 2: 1000 + 1000 = 2000
      // Batch 3: 2000 + 1000 = 3000

      // First batch
      prisma.userStats.findUnique.mockResolvedValueOnce({
        userId: mockUserId,
        totalObservations: 0,
        totalPoints: 0,
        level: 1,
      });

      fetchUserObservations.mockResolvedValueOnce({
        observations: Array(1000).fill({ id: 1 }),
        fetchedAll: false,
        totalAvailable: 3000,
        newestObservationDate: new Date(),
      });

      enrichObservations.mockResolvedValue({
        enrichedObservations: Array(1000).fill({ points: 10, observation: { id: 1 } }),
        totalPoints: 10000,
        rareFinds: [],
        unclassifiedTaxa: [],
      });

      storeObservations.mockResolvedValueOnce({
        newCount: 1000,
        updatedCount: 0,
        newObservationIds: new Set(Array.from({ length: 1000 }, (_, i) => i)),
      });

      calculateUserStats.mockResolvedValue({
        level: 2,
        pointsToNextLevel: 500,
        totalSpecies: 100,
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

      checkAchievements.mockResolvedValue({
        newBadges: [],
        completedQuests: [],
        questMilestones: [],
      });

      prisma.user.findUnique.mockResolvedValue({ id: mockUserId, inatId: 123 });
      prisma.observation.count.mockResolvedValue(0);
      $executeRaw.mockResolvedValue(1);

      const batch1 = await syncUserObservations(mockUserId, 'testuser', 'mock-token');
      expect(batch1.totalSynced).toBe(1000);
      expect(batch1.hasMore).toBe(true);

      // Second batch
      vi.clearAllMocks();
      prisma.userStats.findUnique.mockResolvedValueOnce({
        userId: mockUserId,
        totalObservations: 1000,
        totalPoints: 10000,
        level: 2,
      });

      fetchUserObservations.mockResolvedValueOnce({
        observations: Array(1000).fill({ id: 1 }),
        fetchedAll: false,
        totalAvailable: 3000,
        newestObservationDate: new Date(),
      });

      storeObservations.mockResolvedValueOnce({
        newCount: 1000,
        updatedCount: 0,
        newObservationIds: new Set(Array.from({ length: 1000 }, (_, i) => i + 1000)),
      });

      calculateUserStats.mockResolvedValue({
        level: 3,
        pointsToNextLevel: 500,
        totalSpecies: 200,
        streakResult: {
          currentStreak: 2,
          longestStreak: 2,
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

      prisma.user.findUnique.mockResolvedValue({ id: mockUserId, inatId: 123 });
      prisma.observation.count.mockResolvedValue(0);
      $executeRaw.mockResolvedValue(1);

      const batch2 = await syncUserObservations(mockUserId, 'testuser', 'mock-token');
      expect(batch2.totalSynced).toBe(2000); // 1000 + 1000
      expect(batch2.hasMore).toBe(true);

      // Third batch
      vi.clearAllMocks();
      prisma.userStats.findUnique.mockResolvedValueOnce({
        userId: mockUserId,
        totalObservations: 2000,
        totalPoints: 20000,
        level: 3,
      });

      fetchUserObservations.mockResolvedValueOnce({
        observations: Array(1000).fill({ id: 1 }),
        fetchedAll: true, // Last batch
        totalAvailable: 3000,
        newestObservationDate: new Date(),
      });

      storeObservations.mockResolvedValueOnce({
        newCount: 1000,
        updatedCount: 0,
        newObservationIds: new Set(Array.from({ length: 1000 }, (_, i) => i + 2000)),
      });

      calculateUserStats.mockResolvedValue({
        level: 4,
        pointsToNextLevel: 500,
        totalSpecies: 300,
        streakResult: {
          currentStreak: 3,
          longestStreak: 3,
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

      prisma.user.findUnique.mockResolvedValue({ id: mockUserId, inatId: 123 });
      prisma.observation.count.mockResolvedValue(0);
      $executeRaw.mockResolvedValue(1);

      const batch3 = await syncUserObservations(mockUserId, 'testuser', 'mock-token');
      expect(batch3.totalSynced).toBe(3000); // 2000 + 1000
      expect(batch3.hasMore).toBe(false); // All done!
      expect(batch3.totalAvailable).toBe(3000);
    });
  });

  describe('getProgress', () => {
    it('should return progress with funny message during active sync', async () => {
      prisma.syncProgress.findUnique.mockResolvedValue({
        userId: mockUserId,
        status: 'syncing',
        phase: 'enriching',
        currentStep: 2,
        totalSteps: 4,
        message: 'Processing observations...',
        observationsProcessed: 50,
        observationsTotal: 100,
        startedAt: new Date(),
        completedAt: null,
        error: null,
        lastObservationDate: null,
        estimatedTimeRemaining: 30,
      });

      const progress = await getProgress(mockUserId);

      expect(progress).toBeDefined();
      expect(progress?.status).toBe('syncing');
      expect(progress?.funnyMessage).toBeDefined(); // Should include rotating message
    });

    it('should NOT return funny message when sync is not active', async () => {
      prisma.syncProgress.findUnique.mockResolvedValue({
        userId: mockUserId,
        status: 'completed',
        phase: 'done',
        currentStep: 4,
        totalSteps: 4,
        message: 'Sync completed',
        observationsProcessed: 100,
        observationsTotal: 100,
        startedAt: new Date(),
        completedAt: new Date(),
        error: null,
        lastObservationDate: null,
      });

      const progress = await getProgress(mockUserId);

      expect(progress?.funnyMessage).toBeUndefined(); // No funny message when done
    });
  });

  describe('completeProgress and errorProgress', () => {
    it('should mark sync as completed', async () => {
      prisma.syncProgress.findUnique.mockResolvedValue({
        userId: mockUserId,
        totalSteps: 4,
        observationsTotal: 100,
      });

      prisma.syncProgress.update.mockResolvedValue({});

      await completeProgress(mockUserId);

      expect(prisma.syncProgress.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: expect.objectContaining({
          status: 'completed',
          phase: 'done',
          currentStep: 4,
          message: 'Sync completed successfully!',
        }),
      });
    });

    it('should mark sync as errored', async () => {
      await errorProgress(mockUserId, 'Test error');

      expect(prisma.syncProgress.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: expect.objectContaining({
          status: 'error',
          message: 'Sync failed',
          error: 'Test error',
        }),
      });
    });
  });
});
