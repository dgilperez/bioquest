/**
 * Sync Cursor Logic Tests
 *
 * Tests for the cursor-based pagination system that allows incremental syncs.
 *
 * CRITICAL BUG FOUND: syncCursor was always being set to null (fetchedAll ? null : null)
 * It should be: fetchedAll ? null : newestObservationDate
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUserStatsInDB } from '@/lib/sync/calculate-stats';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    userStats: {
      upsert: vi.fn(),
    },
  },
}));

describe('Sync Cursor Logic', () => {
  let prisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const prismaModule = await import('@/lib/db/prisma');
    prisma = prismaModule.prisma;
  });

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
          lastObservationDate: null,
          streakAtRisk: false,
          hoursUntilBreak: 24,
        },
        currentRarityStreak: 0,
        longestRarityStreak: 0,
        lastRareObservationDate: null,
      },
      fetchedAll: false,
      newestObservationDate: null, // No observations fetched
    });

    const upsertCall = prisma.userStats.upsert.mock.calls[0][0];

    // Should handle null gracefully
    expect(upsertCall.update.syncCursor).toBeNull();
  });
});
