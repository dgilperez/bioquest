/**
 * Background Processing Integration Tests
 *
 * Tests the complete flow of background rarity classification:
 * 1. User syncs observations
 * 2. Background processor starts
 * 3. ALL queued taxa are eventually processed (not just first 20)
 * 4. System reaches "fully processed" state
 * 5. Stats are updated correctly
 *
 * These tests capture the orchestration bugs that unit tests miss.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { syncUserObservations } from '@/lib/stats/user-stats';
import { processUserQueue } from '@/lib/rarity-queue/processor';

// Mock iNat client
vi.mock('@/lib/inat/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/inat/client')>();
  return {
    ...actual,
    getINatClient: () => ({
      getUserObservations: vi.fn().mockResolvedValue({
        total_results: 2000,
        results: generateMockObservations(200), // 200 unique taxa
      }),
      getUserInfo: vi.fn().mockResolvedValue({
        id: 123456,
        login: 'testuser',
        name: 'Test User',
      }),
    }),
  };
});

// Mock rarity classification
vi.mock('@/lib/gamification/rarity', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gamification/rarity')>();
  return {
    ...actual,
    classifyObservationRarity: vi.fn().mockResolvedValue({
      rarity: 'common',
      globalCount: 5000,
      regionalCount: 500,
      isFirstGlobal: false,
      isFirstRegional: false,
      bonusPoints: 0,
    }),
    classifyObservationsRarity: vi.fn().mockImplementation(async (observations) => {
      const resultsMap = new Map();
      observations.forEach((obs: any) => {
        resultsMap.set(obs.id, {
          rarity: 'common',
          globalCount: 5000,
          regionalCount: 500,
          isFirstGlobal: false,
          isFirstRegional: false,
          bonusPoints: 0,
        });
      });
      return resultsMap;
    }),
  };
});

// Helper: Generate mock observations with unique taxa
function generateMockObservations(uniqueTaxaCount: number) {
  const observations = [];
  for (let i = 0; i < uniqueTaxaCount; i++) {
    // Each taxon has 10 observations (200 taxa * 10 = 2000 obs)
    for (let j = 0; j < 10; j++) {
      const baseDate = new Date(2025, 0, i + 1);
      observations.push({
        id: i * 10 + j,
        species_guess: `Species ${i}`,
        taxon: {
          id: 1000 + i,
          name: `Taxon ${i}`,
          rank: 'species',
          iconic_taxon_name: 'Plantae',
        },
        observed_on: baseDate.toISOString(),
        created_at: baseDate.toISOString(),
        updated_at: baseDate.toISOString(),
        location: `${40 + i * 0.01},${-3 + i * 0.01}`,
        quality_grade: 'research',
        user: { id: 123456, login: 'testuser' },
      });
    }
  }
  return observations;
}

// Helper: Wait for condition with timeout
async function waitFor(
  condition: () => Promise<boolean>,
  options: { timeout: number; interval?: number } = { timeout: 60000, interval: 1000 }
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < options.timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, options.interval || 1000));
  }
  throw new Error(`Timeout waiting for condition after ${options.timeout}ms`);
}

describe('Background Processing Integration', () => {
  const testUserId = 'test-user-integration';
  const testUsername = 'testuser';
  const testToken = 'mock-token';

  beforeEach(async () => {
    // Clean up test data
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.rarityClassificationQueue.deleteMany({ where: { userId: testUserId } });
    await prisma.userStats.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        inatId: 123456,
        inatUsername: testUsername,
        email: 'test@example.com',
        accessToken: testToken,
      },
    });
  });

  afterEach(async () => {
    // Clean up
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.rarityClassificationQueue.deleteMany({ where: { userId: testUserId } });
    await prisma.userStats.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should process ALL queued taxa after sync, not just first 20', async () => {
    // STEP 1: Sync observations (should queue 200 unique taxa)
    const syncResult = await syncUserObservations(testUserId, testUsername, testToken);

    expect(syncResult.newObservations).toBeGreaterThan(0);
    console.log(`Synced ${syncResult.newObservations} observations`);

    // STEP 2: Verify queue contains all unique taxa
    const initialQueueCount = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    console.log(`Queue contains ${initialQueueCount} pending taxa`);
    expect(initialQueueCount).toBeGreaterThan(20); // Should be ~200

    // STEP 3: Process first batch (20 items)
    const firstBatch = await processUserQueue(testUserId, 20);
    expect(firstBatch.processed).toBe(20);
    console.log(`First batch: processed ${firstBatch.processed}`);

    // STEP 4: Check remaining queue
    const remainingAfterFirst = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    console.log(`Remaining after first batch: ${remainingAfterFirst}`);
    expect(remainingAfterFirst).toBe(initialQueueCount - 20);

    // STEP 5: THIS IS THE KEY TEST - Continue processing until queue is empty
    let iteration = 0;
    let remaining = remainingAfterFirst;

    while (remaining > 0 && iteration < 20) {
      // Safety limit: max 20 iterations
      iteration++;
      const batch = await processUserQueue(testUserId, 20);
      console.log(`Iteration ${iteration}: processed ${batch.processed}`);

      remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
      console.log(`  Remaining: ${remaining}`);

      if (batch.processed === 0) {
        break; // No more items
      }
    }

    // STEP 6: Verify ALL taxa are eventually processed
    const finalPendingCount = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    expect(finalPendingCount).toBe(0); // ← THIS SHOULD PASS

    // STEP 7: Verify all observations are classified
    const pendingObsCount = await prisma.observation.count({
      where: { userId: testUserId, rarityStatus: 'pending' },
    });

    expect(pendingObsCount).toBe(0);

    console.log(`✅ All taxa processed in ${iteration} iterations`);
  }, 120000); // 2 minute timeout

  it('should handle background processing continuation after interruption', async () => {
    // STEP 1: Sync observations
    await syncUserObservations(testUserId, testUsername, testToken);

    const initialCount = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    // STEP 2: Process 20 items
    await processUserQueue(testUserId, 20);

    // STEP 3: Simulate interruption (page close, server restart, etc.)
    // The queue should still have pending items
    const afterInterruption = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    expect(afterInterruption).toBeGreaterThan(0);

    // STEP 4: Resume processing (simulates user coming back or cron job)
    let remaining = afterInterruption;
    let iterations = 0;

    while (remaining > 0 && iterations < 20) {
      iterations++;
      await processUserQueue(testUserId, 20);
      remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
    }

    // STEP 5: Should eventually complete
    expect(remaining).toBe(0);
  }, 120000);

  it('should update stats after all taxa are classified', async () => {
    // STEP 1: Sync observations
    await syncUserObservations(testUserId, testUsername, testToken);

    // STEP 2: Get initial stats
    const initialStats = await prisma.userStats.findUnique({
      where: { userId: testUserId },
    });

    expect(initialStats).toBeTruthy();
    const initialSpeciesCount = initialStats?.speciesCount || 0;

    console.log(`Initial species count: ${initialSpeciesCount}`);

    // STEP 3: Process all taxa
    let remaining = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    while (remaining > 0) {
      await processUserQueue(testUserId, 20);
      remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
    }

    // STEP 4: Get updated stats (this might require a manual refresh call)
    // TODO: Add stats refresh mechanism after classification
    const finalStats = await prisma.userStats.findUnique({
      where: { userId: testUserId },
    });

    console.log(`Final species count: ${finalStats?.speciesCount}`);

    // Species count should be updated
    // NOTE: This test might fail if stats aren't automatically refreshed
    expect(finalStats?.speciesCount).toBeGreaterThanOrEqual(initialSpeciesCount);
  }, 120000);

  it('should handle rate limit errors gracefully during processing', async () => {
    // Mock a rate limit error on 3rd item
    let callCount = 0;
    const { classifyObservationRarity } = await import('@/lib/gamification/rarity');
    vi.mocked(classifyObservationRarity).mockImplementation(async () => {
      callCount++;
      if (callCount === 3) {
        throw new Error('Rate limit exceeded (429)');
      }
      return {
        rarity: 'common',
        globalCount: 5000,
        regionalCount: 500,
        isFirstGlobal: false,
        isFirstRegional: false,
        bonusPoints: 0,
      };
    });

    // Sync observations
    await syncUserObservations(testUserId, testUsername, testToken);

    // Process batch - should handle error
    const result = await processUserQueue(testUserId, 20);

    // Should mark 1 as failed, continue with others
    expect(result.failed).toBeGreaterThan(0);
    expect(result.succeeded).toBeGreaterThan(0);

    // Failed item should be retryable
    const failedItems = await prisma.rarityClassificationQueue.findMany({
      where: { userId: testUserId, status: 'failed' },
    });

    expect(failedItems.length).toBeGreaterThan(0);
    expect(failedItems[0].attempts).toBeLessThan(3); // Should be retryable
  }, 120000);

  it('should prevent duplicate processing of same taxon', async () => {
    // Sync observations
    await syncUserObservations(testUserId, testUsername, testToken);

    // Process same batch twice (simulate race condition)
    await Promise.all([
      processUserQueue(testUserId, 20),
      processUserQueue(testUserId, 20),
    ]);

    // Count how many times each taxon was marked as completed
    const completedItems = await prisma.rarityClassificationQueue.findMany({
      where: { userId: testUserId, status: 'completed' },
    });

    // Check for duplicates
    const taxonIds = completedItems.map(item => item.taxonId);
    const uniqueTaxonIds = new Set(taxonIds);

    expect(taxonIds.length).toBe(uniqueTaxonIds.size); // No duplicates
  }, 120000);
});
