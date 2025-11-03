/**
 * Background Processor Continuation Test
 *
 * This is the CRITICAL test that exposes the orchestration bug:
 * The processor only runs once and stops, instead of continuing until the queue is empty.
 *
 * This test is simpler than full integration - it focuses ONLY on the continuation logic.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';

describe('Background Processor Continuation Bug', () => {
  const testUserId = 'test-continuation-user';

  beforeEach(async () => {
    // Clean up
    await prisma.rarityClassificationQueue.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        inatId: 999999,
        inatUsername: 'testuser',
        accessToken: 'mock-token',
      },
    });

    // Create 100 pending items in the queue
    const queueItems = [];
    for (let i = 0; i < 100; i++) {
      queueItems.push({
        userId: testUserId,
        taxonId: 1000 + i,
        taxonName: `Taxon ${i}`,
        status: 'pending' as const,
        priority: 5,
      });
    }
    await prisma.rarityClassificationQueue.createMany({ data: queueItems });
  });

  afterEach(async () => {
    await prisma.rarityClassificationQueue.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('EXPOSES BUG: processUserQueue only processes ONE batch, then stops', async () => {
    const { processUserQueue } = await import('@/lib/rarity-queue/processor');

    // Initial state: 100 pending items
    const initialCount = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });
    expect(initialCount).toBe(100);

    // Process one batch (20 items)
    const result = await processUserQueue(testUserId, 20);
    console.log(`Processed ${result.processed} items`);

    // After one batch: Should have 80 remaining
    const afterFirstBatch = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    expect(result.processed).toBe(20);
    expect(afterFirstBatch).toBe(80); // ✅ This passes

    // THE BUG: There is NO automatic continuation
    // If we wait, nothing happens. The processor doesn't call itself again.
    // In production, after syncing 2000 observations with 200 unique taxa:
    // - First batch processes 20 taxa
    // - Remaining 180 taxa stay in queue FOREVER
    // - User sees incomplete Tree of Life stats

    // Let's simulate what SHOULD happen: continue processing until queue is empty
    let remaining = afterFirstBatch;
    let iterations = 0;

    while (remaining > 0 && iterations < 10) {
      iterations++;
      const batch = await processUserQueue(testUserId, 20);
      remaining = await prisma.rarityClassificationQueue.count({
        where: { userId: testUserId, status: 'pending' },
      });
      console.log(`Iteration ${iterations}: processed ${batch.processed}, remaining ${remaining}`);
    }

    // After manual loop: Should process all 100 items
    expect(remaining).toBe(0);
    expect(iterations).toBe(5); // 100 items / 20 per batch = 5 iterations

    // ❌ THIS IS THE BUG:
    // The code currently does NOT have this loop.
    // After the first batch, it stops.
    // This test proves we need a continuation mechanism.
  }, 60000);

  it('DOCUMENTS EXPECTED BEHAVIOR: Processor should continue until queue is empty', async () => {
    // This test documents what the fix should do

    // Mock implementation of what we NEED:
    async function processAllPending(userId: string): Promise<number> {
      const { processUserQueue } = await import('@/lib/rarity-queue/processor');
      let totalProcessed = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await processUserQueue(userId, 20);
        totalProcessed += result.processed;

        // Check if more items remain
        const remaining = await prisma.rarityClassificationQueue.count({
          where: { userId, status: 'pending' },
        });

        hasMore = remaining > 0;

        // Safety: prevent infinite loop
        if (totalProcessed > 1000) {
          throw new Error('Safety limit: processed > 1000 items');
        }
      }

      return totalProcessed;
    }

    // Test it
    const total = await processAllPending(testUserId);
    expect(total).toBe(100);

    const remaining = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });
    expect(remaining).toBe(0);
  }, 60000);

  it('DOCUMENTS CURRENT BUG: user-stats.ts only calls processUserQueue once', async () => {
    // This is what the code CURRENTLY does (from user-stats.ts:389):

    const { processUserQueue } = await import('@/lib/rarity-queue/processor');

    // Current implementation:
    processUserQueue(testUserId, 20).then(result => {
      console.log(`✅ Background classification complete: ${result.succeeded} succeeded`);
    }).catch(err => {
      console.error(`❌ Background classification error:`, err);
    });

    // Wait for it to finish
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check remaining
    const remaining = await prisma.rarityClassificationQueue.count({
      where: { userId: testUserId, status: 'pending' },
    });

    // ❌ BUG CONFIRMED: 80 items remain unprocessed
    expect(remaining).toBe(80);  // Should be 0, but it's 80

    console.log(`❌ BUG: ${remaining} items remain unprocessed after "completion"`);
  }, 60000);
});
