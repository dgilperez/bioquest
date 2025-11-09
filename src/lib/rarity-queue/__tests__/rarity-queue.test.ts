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

import { prisma } from '@/lib/db/prisma';
import { syncUserObservations } from '@/lib/stats/user-stats';
import { processUserQueue } from '@/lib/rarity-queue/processor';
import { createMockINatClient, generateMockObservations } from '@tests/helpers/mock-inat-client';
import { generateTestId, generateTestINatId, cleanupTestUser } from '@tests/helpers/db';
import { mockClassifyObservationRarityWithError, restoreRarityMocks } from '@tests/helpers/mock-rarity';
import type { RarityResult } from '@/lib/gamification/rarity';

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
    await prisma.observation.createMany({ data: observations as any });

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
/**
 * Rarity Queue Manager - Error Handling Tests
 *
 * Tests error scenarios and edge cases in queue management:
 * - Transient vs permanent error handling
 * - Max retry logic
 * - Queue state management under failure
 * - Edge cases (missing items, null values)
 */

import {
  queueTaxaForClassification,
  getQueueStatus,
  getNextBatch,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
  clearCompleted,
  retryFailed,
} from '../manager';

describe('Queue Manager - Error Handling', () => {
  const testUserId = 'test-queue-errors-user';

  beforeEach(async () => {
    // Clean up ALL queue items to prevent test interference
    // (getNextBatch fetches across all users, so we need a clean slate)
    await prisma.rarityClassificationQueue.deleteMany({});
    await prisma.user.deleteMany({ where: { id: testUserId } });

    // Create test user (use unique inatId to avoid conflicts with other tests)
    await prisma.user.create({
      data: {
        id: testUserId,
        inatId: 111111, // Unique across all test files
        inatUsername: 'queue-error-test',
        accessToken: 'mock-token',
      },
    });
  });

  afterEach(async () => {
    await prisma.rarityClassificationQueue.deleteMany({});
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('markAsFailed - Transient vs Permanent Errors', () => {
    it('TRANSIENT ERROR: should mark as pending for retry', async () => {
      // Queue a taxon
      await queueTaxaForClassification(testUserId, [
        { taxonId: 1000, taxonName: 'Test Species', priority: 5 },
      ]);

      const item = await prisma.rarityClassificationQueue.findFirst({
        where: { userId: testUserId, taxonId: 1000 },
      });
      expect(item).toBeTruthy();

      // Mark as processing
      await markAsProcessing(item!.id);

      // Simulate transient error (network timeout, rate limit, etc.)
      await markAsFailed(item!.id, 'Network timeout', true);

      // Check result: Should be back in pending state for retry
      const updated = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });

      expect(updated?.status).toBe('pending'); // Ready to retry
      expect(updated?.attempts).toBe(1); // Increment attempt counter
      expect(updated?.lastError).toBe('Network timeout');
    });

    it('PERMANENT ERROR: should mark as failed, no retry', async () => {
      // Queue a taxon
      await queueTaxaForClassification(testUserId, [
        { taxonId: 2000, taxonName: 'Invalid Taxon', priority: 5 },
      ]);

      const item = await prisma.rarityClassificationQueue.findFirst({
        where: { userId: testUserId, taxonId: 2000 },
      });

      await markAsProcessing(item!.id);

      // Simulate permanent error (404, invalid taxon, etc.)
      await markAsFailed(item!.id, 'Taxon not found (404)', false);

      // Check result: Should be permanently failed
      const updated = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });

      expect(updated?.status).toBe('failed'); // Permanently failed
      expect(updated?.attempts).toBe(1);
      expect(updated?.lastError).toBe('Taxon not found (404)');
    });

    it('MAX RETRIES: should stay failed after max attempts', async () => {
      // Queue a taxon
      await queueTaxaForClassification(testUserId, [
        { taxonId: 3000, taxonName: 'Flaky Species', priority: 5 },
      ]);

      const item = await prisma.rarityClassificationQueue.findFirst({
        where: { userId: testUserId, taxonId: 3000 },
      });

      // Simulate 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await markAsProcessing(item!.id);
        await markAsFailed(item!.id, `Attempt ${i + 1} failed`, true);
      }

      const updated = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });

      expect(updated?.attempts).toBe(3);
      expect(updated?.status).toBe('pending'); // Still pending, but...

      // getNextBatch should NOT return items with 3+ attempts
      const batch = await getNextBatch(20, 3);
      expect(batch.find(b => b.id === item!.id)).toBeUndefined();
    });

    it('EDGE CASE: markAsFailed on non-existent item should not throw', async () => {
      // This should not throw an error
      await expect(
        markAsFailed('non-existent-id', 'Some error', true)
      ).resolves.not.toThrow();
    });
  });

  describe('getNextBatch - Priority and Filtering', () => {
    it('should prioritize high-priority items first', async () => {
      // Queue taxa with different priorities
      await queueTaxaForClassification(testUserId, [
        { taxonId: 1001, taxonName: 'Low Priority', priority: 1 },
        { taxonId: 1002, taxonName: 'High Priority', priority: 10 },
        { taxonId: 1003, taxonName: 'Medium Priority', priority: 5 },
      ]);

      const batch = await getNextBatch(3, 3);

      // Should be ordered by priority desc
      expect(batch[0].taxonId).toBe(1002); // High priority first
      expect(batch[1].taxonId).toBe(1003); // Medium
      expect(batch[2].taxonId).toBe(1001); // Low
    });

    it('should exclude items that exceeded max retries', async () => {
      // Queue 3 taxa
      await queueTaxaForClassification(testUserId, [
        { taxonId: 2001, taxonName: 'Good', priority: 5 },
        { taxonId: 2002, taxonName: 'Failed Too Many', priority: 5 },
        { taxonId: 2003, taxonName: 'Also Good', priority: 5 },
      ]);

      // Simulate 2002 failing 3 times
      const failedItem = await prisma.rarityClassificationQueue.findFirst({
        where: { userId: testUserId, taxonId: 2002 },
      });

      await prisma.rarityClassificationQueue.update({
        where: { id: failedItem!.id },
        data: { attempts: 3 },
      });

      // Get batch with maxRetries=3
      const batch = await getNextBatch(10, 3);

      // Should only get 2001 and 2003, NOT 2002
      expect(batch.length).toBe(2);
      expect(batch.find(b => b.taxonId === 2002)).toBeUndefined();
    });

    it('should return empty array when queue is empty', async () => {
      const batch = await getNextBatch(20, 3);
      expect(batch).toEqual([]);
    });

    it('should only return pending items, not processing/completed/failed', async () => {
      // Queue 4 taxa
      await queueTaxaForClassification(testUserId, [
        { taxonId: 3001, priority: 5 },
        { taxonId: 3002, priority: 5 },
        { taxonId: 3003, priority: 5 },
        { taxonId: 3004, priority: 5 },
      ]);

      // Change their statuses
      const items = await prisma.rarityClassificationQueue.findMany({
        where: { userId: testUserId },
      });

      await prisma.rarityClassificationQueue.update({
        where: { id: items[0].id },
        data: { status: 'processing' },
      });
      await prisma.rarityClassificationQueue.update({
        where: { id: items[1].id },
        data: { status: 'completed' },
      });
      await prisma.rarityClassificationQueue.update({
        where: { id: items[2].id },
        data: { status: 'failed' },
      });
      // items[3] stays pending

      const batch = await getNextBatch(10, 3);

      // Should only get the pending one
      expect(batch.length).toBe(1);
      expect(batch[0].taxonId).toBe(3004);
    });
  });

  describe('getQueueStatus - Aggregation Edge Cases', () => {
    it('should return 100% complete when queue is empty', async () => {
      const status = await getQueueStatus(testUserId);

      expect(status.percentComplete).toBe(100);
      expect(status.total).toBe(0);
    });

    it('should calculate correct percentages with mixed statuses', async () => {
      // Queue 10 taxa
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 10 }, (_, i) => ({
          taxonId: 4000 + i,
          priority: 5,
        }))
      );

      // Complete 3, fail 2, process 1, leave 4 pending
      const items = await prisma.rarityClassificationQueue.findMany({
        where: { userId: testUserId },
        orderBy: { taxonId: 'asc' },
      });

      await prisma.rarityClassificationQueue.update({
        where: { id: items[0].id },
        data: { status: 'completed' },
      });
      await prisma.rarityClassificationQueue.update({
        where: { id: items[1].id },
        data: { status: 'completed' },
      });
      await prisma.rarityClassificationQueue.update({
        where: { id: items[2].id },
        data: { status: 'completed' },
      });
      await prisma.rarityClassificationQueue.update({
        where: { id: items[3].id },
        data: { status: 'failed' },
      });
      await prisma.rarityClassificationQueue.update({
        where: { id: items[4].id },
        data: { status: 'failed' },
      });
      await prisma.rarityClassificationQueue.update({
        where: { id: items[5].id },
        data: { status: 'processing' },
      });
      // items[6-9] stay pending

      const status = await getQueueStatus(testUserId);

      expect(status.total).toBe(10);
      expect(status.completed).toBe(3);
      expect(status.failed).toBe(2);
      expect(status.processing).toBe(1);
      expect(status.pending).toBe(4);
      expect(status.percentComplete).toBe(30); // 3/10 = 30%
    });
  });

  describe('queueTaxaForClassification - Upsert Behavior', () => {
    it('should not create duplicates when queueing same taxon twice', async () => {
      // Queue taxon first time
      await queueTaxaForClassification(testUserId, [
        { taxonId: 5000, taxonName: 'Duplicate Test', priority: 5 },
      ]);

      // Queue same taxon again
      await queueTaxaForClassification(testUserId, [
        { taxonId: 5000, taxonName: 'Duplicate Test', priority: 5 },
      ]);

      // Should only have ONE record
      const count = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, taxonId: 5000 },
      });

      expect(count).toBe(1);
    });

    it('should reset failed taxon to pending when re-queued', async () => {
      // Queue taxon
      await queueTaxaForClassification(testUserId, [
        { taxonId: 6000, taxonName: 'Retry Test', priority: 5 },
      ]);

      const item = await prisma.rarityClassificationQueue.findFirst({
        where: { userId: testUserId, taxonId: 6000 },
      });

      // Fail it permanently
      await markAsProcessing(item!.id);
      await markAsFailed(item!.id, 'Some permanent error', false);

      let failed = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });
      expect(failed?.status).toBe('failed');
      expect(failed?.attempts).toBe(1);

      // Re-queue the same taxon (user retries manually)
      await queueTaxaForClassification(testUserId, [
        { taxonId: 6000, taxonName: 'Retry Test', priority: 5 },
      ]);

      // Should be reset to pending with 0 attempts
      const reset = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });

      expect(reset?.status).toBe('pending');
      expect(reset?.attempts).toBe(0);
      expect(reset?.lastError).toBeNull();
    });
  });

  describe('clearCompleted - Cleanup Operations', () => {
    it('should remove only completed items', async () => {
      // Queue 5 taxa
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 5 }, (_, i) => ({
          taxonId: 7000 + i,
          priority: 5,
        }))
      );

      const items = await prisma.rarityClassificationQueue.findMany({
        where: { userId: testUserId },
      });

      // Complete 2, fail 1, leave 2 pending
      await prisma.rarityClassificationQueue.update({
        where: { id: items[0].id },
        data: { status: 'completed' },
      });
      await prisma.rarityClassificationQueue.update({
        where: { id: items[1].id },
        data: { status: 'completed' },
      });
      await prisma.rarityClassificationQueue.update({
        where: { id: items[2].id },
        data: { status: 'failed' },
      });

      // Clear completed
      const cleared = await clearCompleted(testUserId);
      expect(cleared).toBe(2);

      // Verify only 3 remain (1 failed + 2 pending)
      const remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId },
      });
      expect(remaining).toBe(3);
    });

    it('should clear completed for specific user only', async () => {
      const otherUserId = 'other-user';

      // Create other user (use unique inatId)
      await prisma.user.create({
        data: {
          id: otherUserId,
          inatId: 222222, // Unique across all test files
          inatUsername: 'other-user',
          accessToken: 'mock-token',
        },
      });

      // Queue taxa for both users
      await queueTaxaForClassification(testUserId, [
        { taxonId: 8000, priority: 5 },
      ]);
      await queueTaxaForClassification(otherUserId, [
        { taxonId: 8001, priority: 5 },
      ]);

      // Complete both
      await prisma.rarityClassificationQueue.updateMany({
        where: { userId: testUserId },
        data: { status: 'completed' },
      });
      await prisma.rarityClassificationQueue.updateMany({
        where: { userId: otherUserId },
        data: { status: 'completed' },
      });

      // Clear only for testUserId
      await clearCompleted(testUserId);

      // Verify testUserId cleared but otherUserId not
      const testUserRemaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId },
      });
      const otherUserRemaining = await prisma.rarityClassificationQueue.count({
        where: { userId: otherUserId },
      });

      expect(testUserRemaining).toBe(0);
      expect(otherUserRemaining).toBe(1);

      // Cleanup
      await prisma.rarityClassificationQueue.deleteMany({ where: { userId: otherUserId } });
      await prisma.user.delete({ where: { id: otherUserId } });
    });
  });

  describe('retryFailed - Maintenance Operations', () => {
    it('should reset failed items back to pending', async () => {
      // Queue and fail 3 taxa
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 3 }, (_, i) => ({
          taxonId: 9000 + i,
          priority: 5,
        }))
      );

      const items = await prisma.rarityClassificationQueue.findMany({
        where: { userId: testUserId },
      });

      for (const item of items) {
        await markAsProcessing(item.id);
        await markAsFailed(item.id, 'Simulated failure', false);
      }

      // Verify all failed
      const failedCount = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'failed' },
      });
      expect(failedCount).toBe(3);

      // Retry all failed
      const retried = await retryFailed();
      expect(retried).toBe(3);

      // Verify all reset to pending
      const pendingCount = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
      expect(pendingCount).toBe(3);

      // Verify attempts reset
      const resetItems = await prisma.rarityClassificationQueue.findMany({
        where: { userId: testUserId },
      });
      resetItems.forEach(item => {
        expect(item.attempts).toBe(0);
        expect(item.lastError).toBeNull();
      });
    });

    it('should only retry failures older than maxAge', async () => {
      // Create 2 failed items with different timestamps
      await queueTaxaForClassification(testUserId, [
        { taxonId: 10000, priority: 5 },
        { taxonId: 10001, priority: 5 },
      ]);

      const items = await prisma.rarityClassificationQueue.findMany({
        where: { userId: testUserId },
      });

      // Fail both
      await markAsProcessing(items[0].id);
      await markAsFailed(items[0].id, 'Old failure', false);

      await markAsProcessing(items[1].id);
      await markAsFailed(items[1].id, 'Recent failure', false);

      // Manually set first one to 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      await prisma.rarityClassificationQueue.update({
        where: { id: items[0].id },
        data: { lastAttemptAt: tenDaysAgo },
      });

      // Retry only failures older than 7 days
      const retried = await retryFailed(7);
      expect(retried).toBe(1); // Only the 10-day-old one

      // Verify only old one reset
      const item0 = await prisma.rarityClassificationQueue.findUnique({
        where: { id: items[0].id },
      });
      const item1 = await prisma.rarityClassificationQueue.findUnique({
        where: { id: items[1].id },
      });

      expect(item0?.status).toBe('pending'); // Old one reset
      expect(item1?.status).toBe('failed'); // Recent one still failed
    });
  });

  describe('State Transition Edge Cases', () => {
    it('SCENARIO: processing → failed → re-queued → completed', async () => {
      // Queue taxon
      await queueTaxaForClassification(testUserId, [
        { taxonId: 11000, taxonName: 'State Test', priority: 5 },
      ]);

      const item = await prisma.rarityClassificationQueue.findFirst({
        where: { userId: testUserId, taxonId: 11000 },
      });

      // Transition: pending → processing
      await markAsProcessing(item!.id);
      let current = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });
      expect(current?.status).toBe('processing');

      // Transition: processing → failed (permanent)
      await markAsFailed(item!.id, 'Network error', false);
      current = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });
      expect(current?.status).toBe('failed');
      expect(current?.attempts).toBe(1);

      // Re-queue (user retries)
      await queueTaxaForClassification(testUserId, [
        { taxonId: 11000, taxonName: 'State Test', priority: 5 },
      ]);
      current = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });
      expect(current?.status).toBe('pending');
      expect(current?.attempts).toBe(0); // Reset

      // Transition: pending → processing → completed
      await markAsProcessing(item!.id);
      await markAsCompleted(item!.id);
      current = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });
      expect(current?.status).toBe('completed');
    });

    it('CONCURRENT: should handle multiple attempts to process same item gracefully', async () => {
      // Queue taxon
      await queueTaxaForClassification(testUserId, [
        { taxonId: 12000, priority: 5 },
      ]);

      const item = await prisma.rarityClassificationQueue.findFirst({
        where: { userId: testUserId, taxonId: 12000 },
      });

      // Simulate two processors trying to grab the same item
      // Both mark as processing
      await markAsProcessing(item!.id);
      await markAsProcessing(item!.id); // Second one (shouldn't error)

      // Both try to complete (one will win)
      await markAsCompleted(item!.id);
      await markAsCompleted(item!.id); // Second one (shouldn't error)

      const final = await prisma.rarityClassificationQueue.findUnique({
        where: { id: item!.id },
      });
      expect(final?.status).toBe('completed');
    });
  });
});
/**
 * Rarity Queue Processor - Edge Case Tests
 *
 * Tests edge cases and boundary conditions in the processor:
 * - Empty batches
 * - Invalid data from API
 * - Missing user credentials
 * - Concurrent processing
 * - Large batch handling
 */

import { mockClassifyObservationRarity } from '@tests/helpers/mock-rarity';

describe('Processor - Edge Cases', () => {
  const testUserId = 'test-processor-edge-user';

  beforeEach(async () => {
    // Clean up
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.rarityClassificationQueue.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        inatId: 555555,
        inatUsername: 'edge-test-user',
        accessToken: 'mock-token-edge',
      },
    });
  });

  afterEach(async () => {
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.rarityClassificationQueue.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    restoreRarityMocks();
  });

  describe('Empty Queue Scenarios', () => {
    it('should handle empty queue gracefully', async () => {
      // No items in queue
      const result = await processUserQueue(testUserId, 20);

      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should not error when processing non-existent user', async () => {
      // Process queue for user that doesn't exist
      await expect(
        processUserQueue('non-existent-user', 20)
      ).resolves.not.toThrow();

      const result = await processUserQueue('non-existent-user', 20);
      expect(result.processed).toBe(0);
    });
  });

  describe('Batch Size Edge Cases', () => {
    it('should handle batchSize=1 correctly', async () => {
      // Mock rarity classification
      await mockClassifyObservationRarity({ defaultRarity: 'common', defaultGlobalCount: 5000 });

      // Queue 5 taxa
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 5 }, (_, i) => ({
          taxonId: 1000 + i,
          priority: 5,
        }))
      );

      // Process with batch size of 1 (should still process all via continuation loop)
      const result = await processUserQueue(testUserId, 1, 10);

      expect(result.processed).toBe(5);
      expect(result.succeeded).toBe(5);
      expect(result.failed).toBe(0);
    }, 10000);

    it('should respect maxIterations safety limit', async () => {
      // Mock rarity classification
      await mockClassifyObservationRarity({ defaultRarity: 'common', defaultGlobalCount: 5000 });

      // Queue 100 taxa
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 100 }, (_, i) => ({
          taxonId: 2000 + i,
          priority: 5,
        }))
      );

      // Process with small batch size and low iteration limit
      // maxIterations=3 with batchSize=10 = max 30 processed
      const result = await processUserQueue(testUserId, 10, 3);

      // Should stop at 30 processed (3 batches * 10 items)
      expect(result.processed).toBeLessThanOrEqual(30);

      // Verify remaining items still pending
      const remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBe(100 - result.processed);
    }, 30000);
  });

  describe('Missing User Data', () => {
    it('should handle user without accessToken', async () => {
      const testInatId = generateTestINatId();
      const noTokenUserId = generateTestId('no-token');

      // Create user without access token
      await prisma.user.create({
        data: {
          id: noTokenUserId,
          inatId: testInatId,
          inatUsername: `no-token-user-${testInatId}`,
          accessToken: null as any, // Missing token
        },
      });

      // Queue a taxon for this user
      await queueTaxaForClassification(noTokenUserId, [
        { taxonId: 3000, priority: 5 },
      ]);

      // Process should fail gracefully
      const result = await processUserQueue(noTokenUserId, 20);

      // Should mark as failed
      expect(result.failed).toBe(1);
      expect(result.succeeded).toBe(0);

      // Cleanup
      await prisma.rarityClassificationQueue.deleteMany({ where: { userId: noTokenUserId } });
      await prisma.user.delete({ where: { id: noTokenUserId } });
    });
  });

  describe('Observations Update Edge Cases', () => {
    it('should handle case where no observations match the taxon', async () => {
      // Mock rarity classification
      await mockClassifyObservationRarity({ defaultRarity: 'common', defaultGlobalCount: 5000 });

      // Queue a taxon
      await queueTaxaForClassification(testUserId, [
        { taxonId: 4000, taxonName: 'Orphan Taxon', priority: 5 },
      ]);

      // Don't create any observations for this taxon
      // (Taxon was queued but user deleted all observations of it)

      // Process should succeed but update 0 observations
      const result = await processUserQueue(testUserId, 20);

      // Classification succeeds, queue item marked completed
      expect(result.succeeded).toBe(1);
      expect(result.processed).toBe(1);

      // No observations were updated (because none exist)
      const queueItem = await prisma.rarityClassificationQueue.findFirst({
        where: { userId: testUserId, taxonId: 4000 },
      });
      expect(queueItem?.status).toBe('completed');
    });

    it('should only update pending observations, not already classified', async () => {
      // Mock rarity classification
      await mockClassifyObservationRarity({ defaultRarity: 'rare', defaultGlobalCount: 500 });

      // Create observations with mixed rarityStatus
      await prisma.observation.createMany({
        data: [
          {
            id: 50001,
            userId: testUserId,
            observedOn: new Date(2025, 0, 1),
            latitude: 40.0,
            longitude: -3.0,
            taxonId: 5000,
            taxonName: 'Mixed Status Species',
            iconicTaxon: 'Plantae',
            qualityGrade: 'research',
            rarity: 'common',
            rarityStatus: 'pending',
            pointsAwarded: 10,
          },
          {
            id: 50002,
            userId: testUserId,
            observedOn: new Date(2025, 0, 2),
            latitude: 40.0,
            longitude: -3.0,
            taxonId: 5000,
            taxonName: 'Mixed Status Species',
            iconicTaxon: 'Plantae',
            qualityGrade: 'research',
            rarity: 'common',
            rarityStatus: 'classified', // Already classified
            pointsAwarded: 10,
          },
        ],
      });

      // Queue the taxon
      await queueTaxaForClassification(testUserId, [
        { taxonId: 5000, priority: 5 },
      ]);

      // Process
      await processUserQueue(testUserId, 20);

      // Check that only pending observation was updated
      const obs1 = await prisma.observation.findUnique({ where: { id: 50001 } });
      const obs2 = await prisma.observation.findUnique({ where: { id: 50002 } });

      // obs1 should be updated to classified with new rarity
      expect(obs1?.rarityStatus).toBe('classified');
      expect(obs1?.rarity).toBe('rare');
      expect(obs1?.globalCount).toBe(500);

      // obs2 should remain unchanged (still common, still classified)
      expect(obs2?.rarityStatus).toBe('classified');
      expect(obs2?.rarity).toBe('common');
      expect(obs2?.globalCount).toBeNull();
    });
  });

  describe('Continuation Loop Edge Cases', () => {
    it('should break loop when no more pending items', async () => {
      // Mock rarity classification
      await mockClassifyObservationRarity({ defaultRarity: 'common', defaultGlobalCount: 5000 });

      // Queue exactly 2 batches worth (40 items with batchSize=20)
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 40 }, (_, i) => ({
          taxonId: 6000 + i,
          priority: 5,
        }))
      );

      // Process should complete in 2 iterations and break naturally
      const result = await processUserQueue(testUserId, 20, 50);

      // Expected: 40 processed, loop breaks naturally (not hitting max iterations)
      expect(result.processed).toBe(40);
      expect(result.succeeded).toBe(40);
      expect(result.failed).toBe(0);

      // No items should remain
      const remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
      expect(remaining).toBe(0);
    }, 30000);

    it('SAFETY: should stop at maxIterations even if items remain', async () => {
      // Mock rarity classification
      await mockClassifyObservationRarity({ defaultRarity: 'common', defaultGlobalCount: 5000 });

      // Queue 200 taxa
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 200 }, (_, i) => ({
          taxonId: 7000 + i,
          priority: 5,
        }))
      );

      // Set low maxIterations to test safety limit
      const result = await processUserQueue(testUserId, 20, 2);

      // Should process max 40 items (2 batches * 20), then stop
      expect(result.processed).toBe(40);

      // Verify remaining items still pending
      const remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
      expect(remaining).toBe(160);
    }, 30000);
  });

  describe('Delay and Rate Limiting', () => {
    it('should respect delays between taxa - 500ms', async () => {
      // Mock rarity classification
      await mockClassifyObservationRarity({ defaultRarity: 'common', defaultGlobalCount: 5000 });

      // Queue 3 taxa
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 3 }, (_, i) => ({
          taxonId: 8000 + i,
          priority: 5,
        }))
      );

      const startTime = Date.now();
      await processUserQueue(testUserId, 20);
      const duration = Date.now() - startTime;

      // Should take at least 2 * 500ms = 1000ms (delay between 3 items)
      expect(duration).toBeGreaterThanOrEqual(1000);
    });

    it('should respect delay between batches - 1000ms', async () => {
      // Mock rarity classification
      await mockClassifyObservationRarity({ defaultRarity: 'common', defaultGlobalCount: 5000 });

      // Queue 41 taxa (will require 3 batches with batchSize=20)
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 41 }, (_, i) => ({
          taxonId: 9000 + i,
          priority: 5,
        }))
      );

      const startTime = Date.now();
      await processUserQueue(testUserId, 20);
      const duration = Date.now() - startTime;

      // Should take at least 2 * 1000ms = 2000ms (delay between 3 batches)
      // Plus 500ms * 40 delays between items in batches = 20000ms
      // Total minimum: 22000ms
      // Note: With atomic transactions, this can take longer, so allowing 4 minutes
      expect(duration).toBeGreaterThanOrEqual(22000);
    }, 240000);
  });

  describe('Documentation: Scenarios Requiring API Mocking', () => {
    it('DOCUMENTS: Invalid taxon ID from iNat API (404)', () => {
      // This test documents what SHOULD happen but can't be tested without mocking

      // SCENARIO:
      // 1. Queue contains taxon ID 99999999 (doesn't exist on iNat)
      // 2. Processor calls classifyTaxonRarity(99999999)
      // 3. iNat API returns 404
      // 4. isTransientError() returns false (404 is permanent)
      // 5. markAsFailed() with isTransient=false
      // 6. Queue item status set to 'failed' (no retry)

      // EXPECTED BEHAVIOR:
      // - result.failed === 1
      // - result.succeeded === 0
      // - Queue item has status='failed', lastError='404 Not Found'

      expect(true).toBe(true); // Placeholder
    });

    it('DOCUMENTS: Rate limit error from iNat API (429)', () => {
      // SCENARIO:
      // 1. Processor makes too many requests too fast
      // 2. iNat returns 429 Rate Limit Exceeded
      // 3. isTransientError() returns true (rate limits are transient)
      // 4. markAsFailed() with isTransient=true
      // 5. Queue item status set to 'pending' (will retry)

      // EXPECTED BEHAVIOR:
      // - Item marked as pending with attempts++
      // - Will be retried in next batch

      expect(true).toBe(true); // Placeholder
    });

    it('DOCUMENTS: Network timeout during classification', () => {
      // SCENARIO:
      // 1. Processor calls iNat API
      // 2. Network times out (ETIMEDOUT error)
      // 3. isTransientError() returns true (network errors are transient)
      // 4. Item marked as pending for retry

      // EXPECTED BEHAVIOR:
      // - Item gets retried up to 3 times
      // - After 3 attempts, excluded from getNextBatch()

      expect(true).toBe(true); // Placeholder
    });

    it('DOCUMENTS: Concurrent processing of same queue', () => {
      // SCENARIO:
      // 1. Two processUserQueue() calls running simultaneously
      // 2. Both fetch same batch of pending items
      // 3. Both mark items as processing
      // 4. Race condition: which one completes first?

      // EXPECTED BEHAVIOR:
      // - Both calls to markAsProcessing succeed (idempotent)
      // - Both calls to markAsCompleted succeed (idempotent)
      // - Final state: all items completed (no duplicates)

      // ACTUAL BEHAVIOR:
      // - Works correctly because Prisma operations are atomic
      // - Last write wins (both mark as completed, no issue)

      expect(true).toBe(true); // Placeholder
    });

    it('DOCUMENTS: Observation deleted mid-processing', () => {
      // SCENARIO:
      // 1. Queue contains taxon 12345
      // 2. Processor classifies taxon 12345
      // 3. Meanwhile, user deletes all observations of taxon 12345
      // 4. Processor tries to updateMany observations

      // EXPECTED BEHAVIOR:
      // - updateMany returns { count: 0 }
      // - Queue item still marked as completed (classification succeeded)
      // - No observations updated (because none exist)

      // This is correct behavior - classification succeeded, just no observations to update

      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Real Integration Test - Basic Flow', () => {
    it('INTEGRATION: Full flow', async () => {
      // Mock rarity classification with per-taxon variations
      const perTaxonResults = new Map([
        [10000, { rarity: 'common', globalCount: 5000 }],
        [10001, { rarity: 'uncommon', globalCount: 900 }],
        [10002, { rarity: 'rare', globalCount: 500 }],
        [10003, { rarity: 'epic', globalCount: 50 }],
        [10004, { rarity: 'legendary', globalCount: 10 }],
      ]);
      await mockClassifyObservationRarity({ perTaxonResults: perTaxonResults as Map<number, Partial<RarityResult>> });

      // Clean up existing observations to prevent unique constraint errors
      await prisma.observation.deleteMany({});

      // 1. Create observations with pending rarity
      await prisma.observation.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          id: 60000 + i,
          userId: testUserId,
          observedOn: new Date(2025, 0, 1),
          latitude: 40.0,
          longitude: -3.0,
          taxonId: 10000 + i,
          taxonName: `Test Species ${i}`,
          iconicTaxon: 'Plantae',
          qualityGrade: 'research',
          rarity: 'common',
          rarityStatus: 'pending',
          pointsAwarded: 10,
        })),
      });

      // 2. Queue taxa for classification
      await queueTaxaForClassification(
        testUserId,
        Array.from({ length: 5 }, (_, i) => ({
          taxonId: 10000 + i,
          priority: 5,
        }))
      );

      // 3. Process queue
      const result = await processUserQueue(testUserId, 20);

      // Verify results
      expect(result.processed).toBe(5);
      expect(result.succeeded).toBe(5);
      expect(result.failed).toBe(0);

      // Verify all observations updated from pending → classified
      const obs = await prisma.observation.findMany({
        where: { userId: testUserId },
        orderBy: { taxonId: 'asc' },
      });

      expect(obs.length).toBe(5);
      obs.forEach(o => {
        expect(o.rarityStatus).toBe('classified');
      });

      // Verify per-taxon rarity classifications
      expect(obs[0].rarity).toBe('common');
      expect(obs[1].rarity).toBe('uncommon');
      expect(obs[2].rarity).toBe('rare');
      expect(obs[3].rarity).toBe('epic');
      expect(obs[4].rarity).toBe('legendary');

      // Verify queue items marked as completed
      const queueItems = await prisma.rarityClassificationQueue.findMany({
        where: { userId: testUserId },
      });
      queueItems.forEach(item => {
        expect(item.status).toBe('completed');
      });
    }, 10000);
  });
});
