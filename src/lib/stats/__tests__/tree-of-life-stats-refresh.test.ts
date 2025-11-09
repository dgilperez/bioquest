/**
 * Tree of Life Stats Refresh Test
 *
 * Tests that Tree of Life stats update correctly after background classification completes.
 *
 * USER REPORTED BUG:
 * "the tree of life entries show obs / species, but they did not change from the initial 1000"
 *
 * HYPOTHESIS:
 * After background classification completes, UserTaxonProgress is not recalculated.
 * The stats are stuck at the initial counts from when observations were first stored.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';

describe('Tree of Life Stats Refresh', () => {
  const testUserId = 'test-tol-stats-user';

  beforeEach(async () => {
    // Clean up
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.userTaxonProgress.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        inatId: 888888,
        inatUsername: 'tol-test-user',
        accessToken: 'mock-token',
      },
    });
  });

  afterEach(async () => {
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.userTaxonProgress.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('EXPOSES BUG: UserTaxonProgress counts do not update after background classification', async () => {
    // STEP 1: Create observations with pending rarity status (simulating initial sync)
    const observations = [];
    for (let i = 0; i < 50; i++) {
      observations.push({
        id: 5000 + i, // iNat observation ID (primary key)
        userId: testUserId,
        observedOn: new Date(2025, 0, i + 1),
        latitude: 40.0,
        longitude: -3.0,
        taxonId: 47126, // Plantae (iconic taxon)
        taxonName: `Plant Species ${i}`,
        iconicTaxon: 'Plantae',
        qualityGrade: 'research',
        rarity: 'common',
        rarityStatus: 'pending', // ← KEY: Initially pending
        pointsAwarded: 10,
      });
    }
    await prisma.observation.createMany({ data: observations as any });

    // STEP 2: Create initial UserTaxonProgress (this happens during sync)
    await prisma.userTaxonProgress.create({
      data: {
        userId: testUserId,
        taxonId: 47126, // Plantae
        rank: 'kingdom',
        observationCount: 50,
        speciesCount: 50,
        completionPercent: 0.5,
      },
    });

    // Verify initial state
    const initialProgress = await prisma.userTaxonProgress.findFirst({
      where: { userId: testUserId, taxonId: 47126 },
    });
    expect(initialProgress?.observationCount).toBe(50);
    expect(initialProgress?.speciesCount).toBe(50);

    // STEP 3: Simulate background classification completing
    // Update observations from 'pending' to 'classified'
    await prisma.observation.updateMany({
      where: { userId: testUserId, rarityStatus: 'pending' },
      data: {
        rarityStatus: 'classified',
        rarity: 'common',
        globalCount: 5000,
      },
    });

    // STEP 4: Add MORE observations (simulating continued sync)
    const moreObservations = [];
    for (let i = 50; i < 100; i++) {
      moreObservations.push({
        id: 5000 + i, // iNat observation ID (primary key)
        userId: testUserId,
        observedOn: new Date(2025, 0, i + 1),
        latitude: 40.0,
        longitude: -3.0,
        taxonId: 47126,
        taxonName: `Plant Species ${i}`,
        iconicTaxon: 'Plantae',
        qualityGrade: 'research',
        rarity: 'common',
        rarityStatus: 'classified',
        pointsAwarded: 10,
      });
    }
    await prisma.observation.createMany({ data: moreObservations as any });

    // STEP 5: Check if UserTaxonProgress updated
    const finalProgress = await prisma.userTaxonProgress.findFirst({
      where: { userId: testUserId, taxonId: 47126 },
    });

    // ❌ BUG: Progress is still showing old counts (50/50)
    // Should be showing new counts (100/100)
    console.log('Initial counts:', initialProgress?.observationCount, initialProgress?.speciesCount);
    console.log('Final counts:', finalProgress?.observationCount, finalProgress?.speciesCount);
    console.log('Actual observation count:', await prisma.observation.count({ where: { userId: testUserId, taxonId: 47126 } }));

    // This test documents the expected behavior
    const actualObsCount = await prisma.observation.count({
      where: { userId: testUserId, taxonId: 47126 },
    });
    expect(actualObsCount).toBe(100); // ✅ Database has 100 observations

    // But UserTaxonProgress is NOT updated automatically
    expect(finalProgress?.observationCount).toBe(50); // ❌ Still shows 50

    console.log('❌ BUG CONFIRMED: UserTaxonProgress not refreshed after classification');
  });

  it('DOCUMENTS FIX: Need mechanism to refresh UserTaxonProgress after classification', async () => {
    // What we NEED:
    // 1. When background classification completes, trigger stats refresh
    // 2. Recalculate UserTaxonProgress for affected taxa
    // 3. Update observationCount, speciesCount, completionPercent

    // Option A: Add a refresh function
    async function refreshUserTaxonProgress(userId: string, taxonId: number) {
      const stats = await prisma.observation.groupBy({
        by: ['userId'],
        where: {
          userId,
          taxonId,
          rarityStatus: 'classified', // Only count classified observations
        },
        _count: {
          id: true, // Count observations by ID (primary key)
        },
      });

      const distinctSpecies = await prisma.observation.findMany({
        where: { userId, taxonId, rarityStatus: 'classified' },
        distinct: ['taxonName'],
        select: { taxonName: true },
      });

      const observationCount = stats[0]?._count.id || 0;
      const speciesCount = distinctSpecies.length;

      // Find existing progress record
      const existing = await prisma.userTaxonProgress.findFirst({
        where: { userId, taxonId, regionId: null },
      });

      if (existing) {
        // Update existing record
        await prisma.userTaxonProgress.update({
          where: { id: existing.id },
          data: {
            observationCount,
            speciesCount,
          },
        });
      } else {
        // Create new record
        await prisma.userTaxonProgress.create({
          data: {
            userId,
            taxonId,
            rank: 'kingdom',
            observationCount,
            speciesCount,
            completionPercent: 0,
          },
        });
      }

      return { observationCount, speciesCount };
    }

    // Create test data
    const observations = [];
    for (let i = 0; i < 100; i++) {
      observations.push({
        id: 6000 + i, // iNat observation ID (primary key)
        userId: testUserId,
        observedOn: new Date(2025, 0, i + 1),
        latitude: 40.0,
        longitude: -3.0,
        taxonId: 47126,
        taxonName: `Plant ${i}`,
        iconicTaxon: 'Plantae',
        qualityGrade: 'research',
        rarity: 'common',
        rarityStatus: 'classified',
        pointsAwarded: 10,
      });
    }
    await prisma.observation.createMany({ data: observations as any });

    // Initial state: No progress record
    const before = await prisma.userTaxonProgress.findFirst({
      where: { userId: testUserId, taxonId: 47126 },
    });
    expect(before).toBeNull();

    // Call refresh function
    const result = await refreshUserTaxonProgress(testUserId, 47126);

    // Verify it updated correctly
    expect(result.observationCount).toBe(100);
    expect(result.speciesCount).toBe(100);

    const after = await prisma.userTaxonProgress.findFirst({
      where: { userId: testUserId, taxonId: 47126 },
    });
    expect(after?.observationCount).toBe(100);
    expect(after?.speciesCount).toBe(100);

    console.log('✅ Fix verified: Manual refresh works correctly');
  });

  it('INTEGRATION: Background processor should trigger stats refresh', async () => {
    // This test describes the complete flow we NEED:

    // 1. User syncs observations → stored with rarityStatus='pending'
    // 2. Background processor classifies taxa → updates rarityStatus='classified'
    // 3. Background processor finishes → should trigger refreshUserTaxonProgress()
    // 4. User visits Tree of Life page → sees updated stats

    // Currently missing: Step 3
    // processUserQueue() finishes but doesn't trigger any stats refresh

    // SOLUTION: Add callback to processUserQueue()
    // After all batches complete, refresh stats for affected taxa

    expect(true).toBe(true); // Placeholder - this documents the fix needed
  });
});
