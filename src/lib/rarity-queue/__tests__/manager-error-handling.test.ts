/**
 * Rarity Queue Manager - Error Handling Tests
 *
 * Tests error scenarios and edge cases in queue management:
 * - Transient vs permanent error handling
 * - Max retry logic
 * - Queue state management under failure
 * - Edge cases (missing items, null values)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
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
