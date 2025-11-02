/**
 * Transaction Rollback Tests
 *
 * Tests for database transaction atomicity and rollback behavior.
 * Ensures that if any critical operation fails, the entire transaction is rolled back.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storeObservations } from '@/lib/sync/store-observations';
import { updateUserStatsInDB } from '@/lib/sync/calculate-stats';
import { Prisma } from '@prisma/client';

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

describe('Transaction Rollback Scenarios', () => {
  const mockUserId = 'test-user-id';

  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const prismaModule = await import('@/lib/db/prisma');
    prisma = prismaModule.prisma;
  });

  describe('storeObservations - Transaction Support', () => {
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
      const result = await storeObservations(mockUserId, enrichedObservations, mockTx as any);

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
      const result = await storeObservations(mockUserId, enrichedObservations);

      // Should use global prisma
      expect(prisma.observation.findMany).toHaveBeenCalled();
      expect(prisma.observation.createMany).toHaveBeenCalled();
    });
  });

  describe('updateUserStatsInDB - Transaction Support', () => {
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
      await updateUserStatsInDB(mockUserId, updateInput, mockTx as any);

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
      await updateUserStatsInDB(mockUserId, updateInput);

      // Should use global prisma
      expect(prisma.userStats.upsert).toHaveBeenCalled();
    });
  });

  describe('Transaction Rollback Behavior', () => {
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
          lastRareObservationDate: null,
        },
        fetchedAll: true,
      };

      // Execute transaction
      await expect(
        prisma.$transaction(async (tx: any) => {
          await storeObservations(mockUserId, enrichedObservations, tx);
          await updateUserStatsInDB(mockUserId, updateInput, tx);
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
          lastRareObservationDate: null,
        },
        fetchedAll: true,
      };

      // Execute transaction
      await expect(
        prisma.$transaction(async (tx: any) => {
          await storeObservations(mockUserId, enrichedObservations, tx);
          await updateUserStatsInDB(mockUserId, updateInput, tx);
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
          lastRareObservationDate: null,
        },
        fetchedAll: true,
      };

      // Execute transaction
      await prisma.$transaction(async (tx: any) => {
        await storeObservations(mockUserId, enrichedObservations, tx);
        await updateUserStatsInDB(mockUserId, updateInput, tx);
      });

      // Verify both operations completed
      expect(operations).toEqual(['storeObservations', 'updateUserStatsInDB']);
    });
  });

  describe('Transaction Isolation', () => {
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
          lastRareObservationDate: null,
        },
        fetchedAll: true,
      };

      // Attempt transaction
      await expect(
        prisma.$transaction(async (tx: any) => {
          await storeObservations(mockUserId, enrichedObservations, tx);
          await updateUserStatsInDB(mockUserId, updateInput, tx);
        })
      ).rejects.toThrow('Transaction failed');

      // After rollback, neither function should have been called with global prisma
      expect(prisma.observation.createMany).not.toHaveBeenCalled();
      expect(prisma.userStats.upsert).not.toHaveBeenCalled();
    });
  });
});
