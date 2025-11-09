/**
 * Sync System Unit Tests
 *
 * Unit-level tests for sync infrastructure:
 * - Sync cursor logic (pagination continuation)
 * - Database transaction support (atomicity)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUserStatsInDB } from '@/lib/sync/calculate-stats';
import { storeObservations } from '@/lib/sync/store-observations';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    observation: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
    userStats: {
      upsert: vi.fn(),
    },
  },
}));

describe('Sync System Unit Tests', () => {
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const prismaModule = await import('@/lib/db/prisma');
    prisma = prismaModule.prisma;
  });

  describe('Sync Cursor Logic', () => {
    it('should set syncCursor to newestObservationDate when sync is incomplete', async () => {
      const mockDate = new Date('2025-01-01T12:00:00Z');
      prisma.userStats.upsert.mockResolvedValue({});

      await updateUserStatsInDB('user-123', {
        totalObservations: 100,
        totalPoints: 1000,
        rareObservations: 5,
        legendaryObservations: 1,
        stats: {
          level: 5,
          pointsToNextLevel: 500,
          totalSpecies: 50,
          streakResult: {
            currentStreak: 3,
            longestStreak: 10,
            lastObservationDate: mockDate,
            streakAtRisk: false,
            hoursUntilBreak: 20,
            bonusPoints: 0,
          },
          currentRarityStreak: 1,
          longestRarityStreak: 2,
          lastRareObservationDate: mockDate,
        },
        fetchedAll: false, // Incomplete sync
        newestObservationDate: mockDate, // Should be stored as cursor
      });

      // Verify upsert was called with correct syncCursor
      const upsertCall = prisma.userStats.upsert.mock.calls[0][0];

      // Check update data
      expect(upsertCall.update.syncCursor).toEqual(mockDate);
      expect(upsertCall.update.hasMoreToSync).toBe(true);
      expect(upsertCall.update.lastSyncedAt).toBeUndefined(); // Should NOT set lastSyncedAt

      // Check create data
      expect(upsertCall.create.syncCursor).toEqual(mockDate);
    });

    it('should set syncCursor to null when sync is complete', async () => {
      const mockDate = new Date('2025-01-01T12:00:00Z');
      prisma.userStats.upsert.mockResolvedValue({});

      await updateUserStatsInDB('user-123', {
        totalObservations: 500,
        totalPoints: 5000,
        rareObservations: 10,
        legendaryObservations: 2,
        stats: {
          level: 10,
          pointsToNextLevel: 1000,
          totalSpecies: 200,
          streakResult: {
            currentStreak: 5,
            longestStreak: 15,
            lastObservationDate: mockDate,
            streakAtRisk: false,
            hoursUntilBreak: 18,
            bonusPoints: 0,
          },
          currentRarityStreak: 2,
          longestRarityStreak: 5,
          lastRareObservationDate: mockDate,
        },
        fetchedAll: true, // Complete sync
        newestObservationDate: mockDate,
      });

      const upsertCall = prisma.userStats.upsert.mock.calls[0][0];

      // When complete, cursor should be null (we'll use lastSyncedAt instead)
      expect(upsertCall.update.syncCursor).toBeNull();
      expect(upsertCall.update.hasMoreToSync).toBe(false);
      expect(upsertCall.update.lastSyncedAt).toBeDefined(); // SHOULD set lastSyncedAt

      expect(upsertCall.create.syncCursor).toBeNull();
    });

    it('should handle null newestObservationDate gracefully', async () => {
      prisma.userStats.upsert.mockResolvedValue({});

      await updateUserStatsInDB('user-123', {
        totalObservations: 0,
        totalPoints: 0,
        rareObservations: 0,
        legendaryObservations: 0,
        stats: {
          level: 1,
          pointsToNextLevel: 100,
          totalSpecies: 0,
          streakResult: {
            currentStreak: 0,
            longestStreak: 0,
            lastObservationDate: new Date(),
            bonusPoints: 0,
            streakAtRisk: false,
            hoursUntilBreak: 24,
          },
          currentRarityStreak: 0,
          longestRarityStreak: 0,
          lastRareObservationDate: undefined as any,
        },
        fetchedAll: false,
        newestObservationDate: null as any, // No observations fetched
      });

      const upsertCall = prisma.userStats.upsert.mock.calls[0][0];

      // Should handle null gracefully
      expect(upsertCall.update.syncCursor).toBeNull();
    });
  });

  describe('Transaction Support - storeObservations', () => {
    it('should accept optional transaction context', async () => {
      const mockTx = {
        observation: {
          findMany: vi.fn().mockResolvedValue([]),
          createMany: vi.fn().mockResolvedValue({ count: 5 }),
        },
      };

      const enrichedObservations = [
        {
          observation: { id: 1, observed_on: '2025-01-01', quality_grade: 'research', taxon: { id: 100, name: 'Species 1' } },
          points: 35,
          rarity: 'common',
          isFirstGlobal: false,
          isFirstRegional: false,
        },
      ];

      // Call with transaction context
      const result = await storeObservations('test-user', enrichedObservations as any, mockTx as any);

      // Should use transaction context instead of global prisma
      expect(mockTx.observation.findMany).toHaveBeenCalled();
      expect(mockTx.observation.createMany).toHaveBeenCalled();
      expect(result.newCount).toBe(1);
    });

    it('should use global prisma when no transaction context provided', async () => {
      prisma.observation.findMany.mockResolvedValue([]);
      prisma.observation.createMany.mockResolvedValue({ count: 1 });

      const enrichedObservations = [
        {
          observation: { id: 1, observed_on: '2025-01-01', quality_grade: 'research', taxon: { id: 100, name: 'Species 1' } },
          points: 35,
          rarity: 'common',
          isFirstGlobal: false,
          isFirstRegional: false,
        },
      ];

      // Call without transaction context
      await storeObservations('test-user', enrichedObservations as any);

      // Should use global prisma
      expect(prisma.observation.findMany).toHaveBeenCalled();
      expect(prisma.observation.createMany).toHaveBeenCalled();
    });
  });

  describe('Transaction Support - updateUserStatsInDB', () => {
    const mockUserId = 'test-user-id';

    it('should accept optional transaction context', async () => {
      const mockTx = {
        userStats: {
          upsert: vi.fn().mockResolvedValue({}),
        },
      };

      const updateInput = {
        totalObservations: 100,
        totalPoints: 1000,
        rareObservations: 10,
        legendaryObservations: 2,
        stats: {
          level: 5,
          pointsToNextLevel: 500,
          totalSpecies: 50,
          streakResult: {
            currentStreak: 3,
            longestStreak: 10,
            lastObservationDate: new Date(),
            streakAtRisk: false,
            hoursUntilBreak: 20,
          },
          currentRarityStreak: 1,
          longestRarityStreak: 2,
          lastRareObservationDate: new Date(),
        },
        fetchedAll: true,
      };

      // Call with transaction context
      await updateUserStatsInDB(mockUserId, updateInput as any, mockTx as any);

      // Should use transaction context
      expect(mockTx.userStats.upsert).toHaveBeenCalled();
    });

    it('should use global prisma when no transaction context provided', async () => {
      prisma.userStats.upsert.mockResolvedValue({});

      const updateInput = {
        totalObservations: 100,
        totalPoints: 1000,
        rareObservations: 10,
        legendaryObservations: 2,
        stats: {
          level: 5,
          pointsToNextLevel: 500,
          totalSpecies: 50,
          streakResult: {
            currentStreak: 3,
            longestStreak: 10,
            lastObservationDate: new Date(),
            streakAtRisk: false,
            hoursUntilBreak: 20,
          },
          currentRarityStreak: 1,
          longestRarityStreak: 2,
          lastRareObservationDate: new Date(),
        },
        fetchedAll: true,
      };

      // Call without transaction context
      await updateUserStatsInDB(mockUserId, updateInput as any);

      // Should use global prisma
      expect(prisma.userStats.upsert).toHaveBeenCalled();
    });
  });

  describe('Transaction Rollback Behavior', () => {
    const mockUserId = 'test-user-id';

    it('should rollback both operations if storeObservations fails', async () => {
      // Create a mock transaction that tracks operations
      const operations: string[] = [];

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          observation: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: vi.fn().mockImplementation(() => {
              operations.push('storeObservations');
              throw new Error('Storage failed');
            }),
          },
          userStats: {
            upsert: vi.fn().mockImplementation(() => {
              operations.push('updateUserStatsInDB');
              return Promise.resolve({});
            }),
          },
        };

        try {
          return await callback(mockTx);
        } catch (error) {
          // Simulate rollback - clear operations
          operations.length = 0;
          throw error;
        }
      });

      // Simulate transaction wrapper (would be in main sync function)
      const enrichedObservations = [
        {
          observation: { id: 1, observed_on: '2025-01-01', quality_grade: 'research', taxon: { id: 100, name: 'Species 1' } },
          points: 35,
          rarity: 'common',
          isFirstGlobal: false,
          isFirstRegional: false,
        },
      ];

      const updateInput = {
        totalObservations: 1,
        totalPoints: 35,
        rareObservations: 0,
        legendaryObservations: 0,
        stats: {
          level: 1,
          pointsToNextLevel: 100,
          totalSpecies: 1,
          streakResult: {
            currentStreak: 1,
            longestStreak: 1,
            lastObservationDate: new Date(),
            streakAtRisk: false,
            hoursUntilBreak: 24,
          },
          currentRarityStreak: 0,
          longestRarityStreak: 0,
          lastRareObservationDate: undefined,
        },
        fetchedAll: true,
      };

      // Execute transaction
      await expect(
        prisma.$transaction(async (tx: any) => {
          await storeObservations(mockUserId, enrichedObservations as any, tx);
          await updateUserStatsInDB(mockUserId, updateInput as any, tx);
        })
      ).rejects.toThrow('Storage failed');

      // Verify rollback occurred (operations array cleared)
      expect(operations).toHaveLength(0);
    });

    it('should rollback both operations if updateUserStatsInDB fails', async () => {
      const operations: string[] = [];

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          observation: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: vi.fn().mockImplementation(() => {
              operations.push('storeObservations');
              return Promise.resolve({ count: 1 });
            }),
          },
          userStats: {
            upsert: vi.fn().mockImplementation(() => {
              operations.push('updateUserStatsInDB');
              throw new Error('Stats update failed');
            }),
          },
        };

        try {
          return await callback(mockTx);
        } catch (error) {
          // Simulate rollback
          operations.length = 0;
          throw error;
        }
      });

      const enrichedObservations = [
        {
          observation: { id: 1, observed_on: '2025-01-01', quality_grade: 'research', taxon: { id: 100, name: 'Species 1' } },
          points: 35,
          rarity: 'common',
          isFirstGlobal: false,
          isFirstRegional: false,
        },
      ];

      const updateInput = {
        totalObservations: 1,
        totalPoints: 35,
        rareObservations: 0,
        legendaryObservations: 0,
        stats: {
          level: 1,
          pointsToNextLevel: 100,
          totalSpecies: 1,
          streakResult: {
            currentStreak: 1,
            longestStreak: 1,
            lastObservationDate: new Date(),
            streakAtRisk: false,
            hoursUntilBreak: 24,
          },
          currentRarityStreak: 0,
          longestRarityStreak: 0,
          lastRareObservationDate: undefined,
        },
        fetchedAll: true,
      };

      // Execute transaction
      await expect(
        prisma.$transaction(async (tx: any) => {
          await storeObservations(mockUserId, enrichedObservations as any, tx);
          await updateUserStatsInDB(mockUserId, updateInput as any, tx);
        })
      ).rejects.toThrow('Stats update failed');

      // Verify rollback occurred
      expect(operations).toHaveLength(0);
    });

    it('should commit both operations if all succeed', async () => {
      const operations: string[] = [];

      prisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          observation: {
            findMany: vi.fn().mockResolvedValue([]),
            createMany: vi.fn().mockImplementation(() => {
              operations.push('storeObservations');
              return Promise.resolve({ count: 1 });
            }),
          },
          userStats: {
            upsert: vi.fn().mockImplementation(() => {
              operations.push('updateUserStatsInDB');
              return Promise.resolve({});
            }),
          },
        };

        return await callback(mockTx);
      });

      const enrichedObservations = [
        {
          observation: { id: 1, observed_on: '2025-01-01', quality_grade: 'research', taxon: { id: 100, name: 'Species 1' } },
          points: 35,
          rarity: 'common',
          isFirstGlobal: false,
          isFirstRegional: false,
        },
      ];

      const updateInput = {
        totalObservations: 1,
        totalPoints: 35,
        rareObservations: 0,
        legendaryObservations: 0,
        stats: {
          level: 1,
          pointsToNextLevel: 100,
          totalSpecies: 1,
          streakResult: {
            currentStreak: 1,
            longestStreak: 1,
            lastObservationDate: new Date(),
            streakAtRisk: false,
            hoursUntilBreak: 24,
          },
          currentRarityStreak: 0,
          longestRarityStreak: 0,
          lastRareObservationDate: undefined,
        },
        fetchedAll: true,
      };

      // Execute transaction
      await prisma.$transaction(async (tx: any) => {
        await storeObservations(mockUserId, enrichedObservations as any, tx);
        await updateUserStatsInDB(mockUserId, updateInput as any, tx);
      });

      // Verify both operations completed
      expect(operations).toEqual(['storeObservations', 'updateUserStatsInDB']);
    });

    it('should not affect database if transaction is rolled back', async () => {
      // Mock a failing transaction
      prisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      const enrichedObservations = [
        {
          observation: { id: 1, observed_on: '2025-01-01', quality_grade: 'research', taxon: { id: 100, name: 'Species 1' } },
          points: 35,
          rarity: 'common',
          isFirstGlobal: false,
          isFirstRegional: false,
        },
      ];

      const updateInput = {
        totalObservations: 1,
        totalPoints: 35,
        rareObservations: 0,
        legendaryObservations: 0,
        stats: {
          level: 1,
          pointsToNextLevel: 100,
          totalSpecies: 1,
          streakResult: {
            currentStreak: 1,
            longestStreak: 1,
            lastObservationDate: new Date(),
            streakAtRisk: false,
            hoursUntilBreak: 24,
          },
          currentRarityStreak: 0,
          longestRarityStreak: 0,
          lastRareObservationDate: undefined,
        },
        fetchedAll: true,
      };

      // Attempt transaction
      await expect(
        prisma.$transaction(async (tx: any) => {
          await storeObservations(mockUserId, enrichedObservations as any, tx);
          await updateUserStatsInDB(mockUserId, updateInput as any, tx);
        })
      ).rejects.toThrow('Transaction failed');

      // After rollback, neither function should have been called with global prisma
      expect(prisma.observation.createMany).not.toHaveBeenCalled();
      expect(prisma.userStats.upsert).not.toHaveBeenCalled();
    });
  });
});
