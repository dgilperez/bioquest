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

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { syncUserObservations } from '@/lib/stats/user-stats';
import { processUserQueue } from '@/lib/rarity-queue/processor';
import { createMockINatClient, generateMockObservations } from '@tests/helpers/mock-inat-client';
import { generateTestId, generateTestINatId, cleanupTestUser } from '@tests/helpers/db';
import { mockClassifyObservationRarityWithError, restoreRarityMocks } from '@tests/helpers/mock-rarity';

// Use a module-level counter to track ALL observations generated across ALL tests
// This ensures truly unique IDs across the entire test suite
let globalObservationCounter = Math.floor(Math.random() * 1000000000);

// Mock iNat client - generate new observations on each call with truly unique IDs
vi.mock('@/lib/inat/client', () => ({
  getINatClient: () => {
    const mockClient = createMockINatClient({
      observations: [],
      totalObservations: 2000,
      userInfo: {
        id: 123456,
        login: 'testuser',
        name: 'Test User',
      },
    });

    // Override getUserObservations to generate fresh observations with guaranteed unique IDs
    mockClient.getUserObservations = vi.fn().mockImplementation(async () => {
      // Use global counter and increment by 100 for each page
      // This ensures NO collisions across ALL calls in ALL tests
      const baseId = globalObservationCounter;
      globalObservationCounter += 100; // Reserve 100 IDs for this page

      return {
        total_results: 50,
        results: generateMockObservations(50, undefined, baseId),
      };
    });

    return mockClient;
  },
}));

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

describe('Background Processing Integration', () => {
  let testUserId: string;
  let testUsername: string;
  const testToken = 'mock-token';

  beforeEach(async () => {
    // Generate unique test ID
    testUserId = generateTestId('bg-proc-test');
    const testInatId = generateTestINatId();
    testUsername = `testuser-${testInatId}`; // Unique username per test

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        inatId: testInatId,
        inatUsername: testUsername,
        email: `test-${testInatId}@example.com`,
        accessToken: testToken,
      },
    });
  });

  afterEach(async () => {
    // Clean up using helper - this handles all related records
    await cleanupTestUser(testUserId);
  });

  it('should process ALL queued taxa after sync, not just first 20', async () => {
    // Sync triggers background processing. Wait for it to complete by polling.
    const syncResult = await syncUserObservations(testUserId, testUsername, testToken);
    expect(syncResult.newObservations).toBeGreaterThan(0);

    // Poll for queue completion (background processing from sync)
    let remaining = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    let attempts = 0;
    while (remaining > 0 && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
      attempts++;
    }

    expect(remaining).toBe(0);
    console.log(`✅ All taxa processed successfully in ${attempts}s`);
  }, 120000);

  it('should handle background processing continuation after interruption', async () => {
    // STEP 1: Sync observations
    await syncUserObservations(testUserId, testUsername, testToken);

    const initialCount = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    // STEP 2: Process ALL items (processUserQueue has internal continuation loop)
    // Even after "interruption", a single call should complete everything
    const result = await processUserQueue(testUserId, 20);

    expect(result.processed).toBe(initialCount);

    // STEP 3: Verify queue is empty
    const finalCount = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    expect(finalCount).toBe(0);

    console.log(`✅ Processed ${result.processed} taxa in one continuation`);
  }, 60000);

  it('should update stats after all taxa are classified', async () => {
    await syncUserObservations(testUserId, testUsername, testToken);

    const initialStats = await prisma.userStats.findUnique({
      where: { userId: testUserId },
    });
    const initialSpeciesCount = initialStats?.totalSpecies || 0;

    // Poll for background processing completion
    let remaining = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    let attempts = 0;
    while (remaining > 0 && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
      attempts++;
    }

    expect(remaining).toBe(0);

    const finalStats = await prisma.userStats.findUnique({
      where: { userId: testUserId },
    });

    expect(finalStats?.totalSpecies).toBeGreaterThanOrEqual(initialSpeciesCount);
  }, 120000);

  it('should handle rate limit errors gracefully', async () => {
    // Import queue manager
    const { queueTaxaForClassification } = await import('@/lib/rarity-queue/manager');

    // Queue some taxa manually
    await queueTaxaForClassification(testUserId, Array.from({ length: 5 }, (_, i) => ({
      taxonId: 50000 + i,
      taxonName: `Test Taxon ${i}`,
      priority: 5,
    })));

    const initialCount = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    expect(initialCount).toBe(5);

    // Mock rate limit error on classification AFTER queuing
    await mockClassifyObservationRarityWithError('rate_limit');

    // Process queue - should handle rate limit errors
    const result = await processUserQueue(testUserId, 20);

    // All items should fail due to rate limit error
    expect(result.failed).toBe(result.processed);
    expect(result.succeeded).toBe(0);

    // Verify items are marked as pending (transient error, will retry)
    const failedItems = await prisma.rarityClassificationQueue.findMany({
      where: { userId: testUserId, status: 'pending' },
    });

    // Items should have incremented attempts count
    failedItems.forEach(item => {
      expect(item.attempts).toBeGreaterThan(0);
      expect(item.lastError).toContain('429');
    });

    // Restore mocks for cleanup
    restoreRarityMocks();
  }, 120000);

  it('should prevent duplicate processing of same taxon', async () => {
    // Import queue manager and mock helpers
    const { queueTaxaForClassification } = await import('@/lib/rarity-queue/manager');
    const { mockClassifyObservationRarity, restoreRarityMocks: localRestore } = await import('@tests/helpers/mock-rarity');

    // Set up fresh mocks (ensure no pollution from previous tests)
    await mockClassifyObservationRarity({
      defaultRarity: 'common',
      defaultGlobalCount: 5000,
      defaultRegionalCount: 500,
    });

    // Create observations first (processor needs observations to update)
    const observations = Array.from({ length: 40 }, (_, i) => ({
      id: 60000 + i,
      userId: testUserId,
      observedOn: new Date(2025, 0, 1),
      latitude: 40.0,
      longitude: -3.0,
      taxonId: 70000 + i,
      taxonName: `Test Taxon ${i}`,
      taxonRank: 'species',
      iconicTaxon: 'Plantae',
      qualityGrade: 'research',
      rarity: 'common',
      rarityStatus: 'pending',
      pointsAwarded: 10,
      photosCount: 1,
    }));
    await prisma.observation.createMany({ data: observations });

    // Manually queue taxa (don't use sync which triggers background processing)
    const taxa = Array.from({ length: 40 }, (_, i) => ({
      taxonId: 70000 + i,
      taxonName: `Test Taxon ${i}`,
      priority: 5,
    }));

    await queueTaxaForClassification(testUserId, taxa);

    // Verify items are queued
    const queuedCount = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });
    expect(queuedCount).toBe(40);

    // Process same batch twice in parallel (simulate race condition)
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
    expect(completedItems.length).toBeGreaterThan(0); // At least some were processed

    // Cleanup mocks
    localRestore();
  }, 60000);
});
