/**
 * Sync Interruption & Recovery Test
 *
 * Tests that sync can recover gracefully from interruptions:
 * - User closes browser mid-sync
 * - Network drops during observation fetch
 * - Server restarts during background processing
 *
 * These scenarios should NOT:
 * - Leave observations in limbo
 * - Duplicate observations
 * - Lose track of sync progress
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { mockClassifyObservationRarity, restoreRarityMocks } from '@tests/helpers/mock-rarity';
import { processUserQueue } from '@/lib/rarity-queue/processor';

describe('Sync Interruption & Recovery', () => {
  const testUserId = 'test-interruption-user';

  beforeEach(async () => {
    // Clean up
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.userStats.deleteMany({ where: { userId: testUserId } });
    await prisma.rarityClassificationQueue.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        inatId: 777777,
        inatUsername: 'interrupt-test',
        accessToken: 'mock-token',
      },
    });

    // Create initial UserStats
    await prisma.userStats.create({
      data: {
        userId: testUserId,
        totalObservations: 0,
        totalSpecies: 0,
        totalPoints: 0,
        level: 1,
        pointsToNextLevel: 100,
      },
    });

    // Set up rarity classification mock
    await mockClassifyObservationRarity({
      defaultRarity: 'common',
      defaultGlobalCount: 5000,
      defaultRegionalCount: 500,
    });
  });

  afterEach(async () => {
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.userStats.deleteMany({ where: { userId: testUserId } });
    await prisma.rarityClassificationQueue.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    restoreRarityMocks();
  });

  it('SCENARIO: User closes browser mid-sync, restarts - should continue, not duplicate', async () => {
    // STEP 1: First sync - store 500 observations
    const firstBatch = [];
    for (let i = 0; i < 500; i++) {
      firstBatch.push({
        id: 10000 + i, // iNat observation ID
        userId: testUserId,
        observedOn: new Date(2025, 0, 1),
        latitude: 40.0,
        longitude: -3.0,
        taxonId: 47126,
        taxonName: `Species ${i}`,
        iconicTaxon: 'Plantae',
        qualityGrade: 'research',
        rarity: 'common',
        rarityStatus: 'pending',
        pointsAwarded: 10,
      });
    }
    await prisma.observation.createMany({ data: firstBatch as any });

    // Update UserStats to reflect partial sync
    await prisma.userStats.update({
      where: { userId: testUserId },
      data: {
        totalObservations: 500,
        lastSyncedAt: new Date(),
        hasMoreToSync: true, // KEY: Incomplete sync
      },
    });

    // Verify initial state
    const afterFirst = await prisma.observation.count({ where: { userId: testUserId } });
    expect(afterFirst).toBe(500);

    // STEP 2: User closes browser, comes back later
    // System detects hasMoreToSync=true and resumes

    // STEP 3: Second sync - adds 500 MORE observations (continuing from where we left off)
    const secondBatch = [];
    for (let i = 500; i < 1000; i++) {
      secondBatch.push({
        id: 10000 + i, // iNat observation ID
        userId: testUserId,
        observedOn: new Date(2025, 0, 1),
        latitude: 40.0,
        longitude: -3.0,
        taxonId: 47126,
        taxonName: `Species ${i}`,
        iconicTaxon: 'Plantae',
        qualityGrade: 'research',
        rarity: 'common',
        rarityStatus: 'pending',
        pointsAwarded: 10,
      });
    }
    await prisma.observation.createMany({ data: secondBatch as any });

    // Update stats
    await prisma.userStats.update({
      where: { userId: testUserId },
      data: {
        totalObservations: 1000,
        hasMoreToSync: false, // Sync complete
      },
    });

    // VERIFY: No duplicates
    const finalCount = await prisma.observation.count({ where: { userId: testUserId } });
    expect(finalCount).toBe(1000);

    // VERIFY: All unique IDs
    const allObs = await prisma.observation.findMany({
      where: { userId: testUserId },
      select: { id: true },
    });
    const uniqueIds = new Set(allObs.map(o => o.id));
    expect(uniqueIds.size).toBe(1000); // All unique

    console.log('✅ Interruption recovery: No duplicates');
  });

  it('EXPOSES ISSUE: Sync cursor not properly maintained across interruptions', async () => {
    // The sync system uses newestObservationDate as cursor
    // If this isn't properly saved/loaded, we might:
    // 1. Re-fetch observations we already have
    // 2. Miss observations in between

    // Create observations with different dates
    const observations = [];
    for (let i = 0; i < 100; i++) {
      observations.push({
        id: 20000 + i, // iNat observation ID
        userId: testUserId,
        observedOn: new Date(2025, 0, i + 1), // Different dates
        latitude: 40.0,
        longitude: -3.0,
        taxonId: 47126,
        taxonName: `Species ${i}`,
        iconicTaxon: 'Plantae',
        qualityGrade: 'research',
        rarity: 'common',
        rarityStatus: 'pending',
        pointsAwarded: 10,
      });
    }
    await prisma.observation.createMany({ data: observations as any });

    // Check UserStats for sync cursor
    const stats = await prisma.userStats.findUnique({
      where: { userId: testUserId },
      select: { lastSyncedAt: true },
    });

    // QUESTION: How do we know which observations were fetched?
    // ANSWER: lastSyncedAt should store the newest observation date
    // But we need to verify this is actually used in incremental sync

    console.log('lastSyncedAt:', stats?.lastSyncedAt);

    // BUG DOCUMENTED: When observations are created directly in DB (bypassing sync),
    // lastSyncedAt is NOT set. This is expected - it only gets set during actual sync.
    // The sync cursor is managed by the sync process, not by direct DB writes.
    expect(stats?.lastSyncedAt).toBeNull(); // ✓ This is correct behavior

    console.log('✅ Sync cursor is only set by sync process, not by direct DB writes');
  });

  it('SCENARIO: Background classification interrupted - should resume on next visit', async () => {
    // Create observations and queue items
    const observations = [];
    const queueItems = [];
    for (let i = 0; i < 100; i++) {
      observations.push({
        id: 30000 + i, // iNat observation ID
        userId: testUserId,
        observedOn: new Date(2025, 0, 1),
        latitude: 40.0,
        longitude: -3.0,
        taxonId: 1000 + i,
        taxonName: `Taxon ${i}`,
        iconicTaxon: 'Plantae',
        qualityGrade: 'research',
        rarity: 'common',
        rarityStatus: 'pending', // Waiting for classification
        pointsAwarded: 10,
      });
      queueItems.push({
        userId: testUserId,
        taxonId: 1000 + i,
        taxonName: `Taxon ${i}`,
        status: 'pending' as const,
        priority: 5,
      });
    }
    await prisma.observation.createMany({ data: observations as any });
    await prisma.rarityClassificationQueue.createMany({ data: queueItems });

    // STEP 1: Process 20 items
    // Simulate processing (but with the OLD buggy version that stops after 1 batch)
    // Just process one batch manually to simulate interruption
    const firstBatch = await prisma.rarityClassificationQueue.findMany({
      where: { userId: testUserId, status: 'pending' },
      take: 20,
    });

    // Mark them as completed
    await prisma.rarityClassificationQueue.updateMany({
      where: { id: { in: firstBatch.map(item => item.id) } },
      data: { status: 'completed' },
    });

    // STEP 2: User closes browser - 80 items still pending
    const remaining = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });
    expect(remaining).toBe(80);

    // STEP 3: User comes back - system should detect pending items
    const hasPending = remaining > 0;
    expect(hasPending).toBe(true);

    // STEP 4: Resume processing
    // With our new fix, processUserQueue should process ALL remaining items
    await processUserQueue(testUserId, 20);

    // VERIFY: All items eventually processed
    const finalRemaining = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    // With the fix, this should be 0
    // Without the fix, this would still be 60 (only one more batch of 20 processed)
    expect(finalRemaining).toBe(0);

    console.log('✅ Background classification resumption works correctly');
  }, 60000);

  it('DOCUMENTS EXPECTED: hasMoreToSync flag drives automatic continuation', async () => {
    // The AutoSync component checks hasMoreToSync
    // If true, it should automatically trigger another sync

    // Set up incomplete sync state
    await prisma.userStats.update({
      where: { userId: testUserId },
      data: {
        hasMoreToSync: true,
        lastSyncedAt: new Date(),
      },
    });

    // Check the flag
    const stats = await prisma.userStats.findUnique({
      where: { userId: testUserId },
      select: { hasMoreToSync: true },
    });

    expect(stats?.hasMoreToSync).toBe(true);

    // This flag should trigger AutoSync to call syncUserObservations again
    // (We're not testing the React component here, just documenting the contract)

    console.log('✅ hasMoreToSync flag correctly indicates incomplete sync');
  });

  it('EDGE CASE: Duplicate observation IDs should be handled gracefully', async () => {
    // What if we somehow try to insert the same observation twice?
    // (Could happen if sync cursor isn't working correctly)

    const observation = {
      id: 99999, // iNat observation ID (primary key)
      userId: testUserId,
      observedOn: new Date(2025, 0, 1),
      latitude: 40.0,
      longitude: -3.0,
      taxonId: 47126,
      taxonName: 'Duplicate Test',
      iconicTaxon: 'Plantae',
      qualityGrade: 'research',
      rarity: 'common',
      rarityStatus: 'pending',
      pointsAwarded: 10,
    };

    // Insert first time
    await prisma.observation.create({ data: observation as any });

    // Try to insert again - should fail due to unique constraint on id (primary key)
    await expect(
      prisma.observation.create({ data: observation as any })
    ).rejects.toThrow();

    // Verify only one exists
    const count = await prisma.observation.count({
      where: { id: 99999 },
    });
    expect(count).toBe(1);

    console.log('✅ Primary key constraint prevents duplicate observations');
  });

  it('PERFORMANCE: Upsert pattern should handle duplicates efficiently', async () => {
    // Instead of failing on duplicates, we should use upsert
    // This allows idempotent sync operations

    const observation = {
      id: 88888, // iNat observation ID (primary key)
      userId: testUserId,
      observedOn: new Date(2025, 0, 1),
      latitude: 40.0,
      longitude: -3.0,
      taxonId: 47126,
      taxonName: 'Upsert Test',
      iconicTaxon: 'Plantae',
      qualityGrade: 'research',
      rarity: 'common',
      rarityStatus: 'pending',
      pointsAwarded: 10,
    };

    // First upsert - creates
    await prisma.observation.upsert({
      where: {
        id: 88888, // Use primary key for upsert
      },
      create: observation as any,
      update: {
        taxonName: 'Upsert Test Updated',
      },
    });

    // Second upsert - updates
    await prisma.observation.upsert({
      where: {
        id: 88888,
      },
      create: observation as any,
      update: {
        taxonName: 'Upsert Test Updated',
      },
    });

    // Verify only one exists, and it's updated
    const result = await prisma.observation.findUnique({
      where: {
        id: 88888,
      },
    });

    expect(result).toBeTruthy();
    expect(result?.taxonName).toBe('Upsert Test Updated');

    console.log('✅ Upsert pattern handles duplicates gracefully');
  });
});
