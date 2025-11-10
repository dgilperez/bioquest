/**
 * Crash Recovery Tests
 *
 * Validates that the system automatically detects and recovers from incomplete syncs
 * after server crashes or restarts, without manual database intervention.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { verifySyncStatus, shouldVerifySyncStatus } from '@/lib/sync/verify-status';
import { processUserPendingReconciliation } from '@/lib/sync/reconciliation-queue';

// Mock the iNat client
// Returns empty results by default (for tests that don't need reconciliation)
// Tests that test deletion reconciliation will need to override this
let mockGetUserObservations = vi.fn().mockResolvedValue({
  results: [],
  total_results: 7000,
});

vi.mock('@/lib/inat/client', () => ({
  getINatClient: () => ({
    getUserObservations: (...args: any[]) => mockGetUserObservations(...args),
  }),
}));

describe('Crash Recovery - Sync Status Verification', () => {
  const testUserId = 'crash-recovery-test-user';
  const testUsername = 'crash-test-user';
  const testToken = 'test-token';

  beforeEach(async () => {
    // Clean up and create test user with stats
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.syncProgress.deleteMany({ where: { userId: testUserId } });
    await prisma.userStats.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });

    await prisma.user.create({
      data: {
        id: testUserId,
        inatId: 999999,
        inatUsername: testUsername,
        email: 'crash@test.com',
        stats: {
          create: {
            hasMoreToSync: false, // Incorrect flag from crashed sync
          },
        },
      },
    });
  });

  afterEach(async () => {
    await prisma.observation.deleteMany({ where: { userId: testUserId } });
    await prisma.syncProgress.deleteMany({ where: { userId: testUserId } });
    await prisma.userStats.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  describe('shouldVerifySyncStatus()', () => {
    it('should return true when hasMoreToSync=false and synced < 24h ago', () => {
      const recentSync = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      const result = shouldVerifySyncStatus(false, recentSync);
      expect(result).toBe(true);
    });

    it('should return false when hasMoreToSync=false and synced > 24h ago', () => {
      const oldSync = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const result = shouldVerifySyncStatus(false, oldSync);
      expect(result).toBe(false);
    });

    it('should return true when never synced before', () => {
      const result = shouldVerifySyncStatus(false, null);
      expect(result).toBe(true);
    });

    it('should return false when hasMoreToSync=true (already correct)', () => {
      const recentSync = new Date(Date.now() - 1 * 60 * 60 * 1000);
      const result = shouldVerifySyncStatus(true, recentSync);
      expect(result).toBe(false);
    });
  });

  describe('verifySyncStatus()', () => {
    it('should detect incomplete sync and correct hasMoreToSync=false to true', async () => {
      // SCENARIO: Server crashed after syncing 1000/7000 observations
      // Database incorrectly shows hasMoreToSync=false

      // Create 1000 local observations (partial sync)
      const observations = Array.from({ length: 1000 }, (_, i) => ({
        id: 1000 + i,
        userId: testUserId,
        observedOn: new Date('2024-01-01'),
        qualityGrade: 'needs_id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await prisma.observation.createMany({ data: observations as any });

      // Verify status (should detect local=1000, iNat=7000, and set hasMoreToSync=true)
      const result = await verifySyncStatus(testUserId, testUsername, testToken);

      expect(result.localCount).toBe(1000);
      expect(result.inatTotal).toBe(7000);
      expect(result.hasMoreToSync).toBe(true);
      expect(result.corrected).toBe(true); // Flag was corrected

      // Verify database was updated
      const userStats = await prisma.userStats.findUnique({
        where: { userId: testUserId },
        select: { hasMoreToSync: true },
      });
      expect(userStats?.hasMoreToSync).toBe(true);
    });

    it('should not change hasMoreToSync when it is already correct', async () => {
      // SCENARIO: User has all observations synced, hasMoreToSync correctly set to false

      // Update userStats to have correct flag
      await prisma.userStats.update({
        where: { userId: testUserId },
        data: { hasMoreToSync: false },
      });

      // Create 7000 local observations (full sync)
      const observations = Array.from({ length: 7000 }, (_, i) => ({
        id: 2000 + i,
        userId: testUserId,
        observedOn: new Date('2024-01-01'),
        qualityGrade: 'needs_id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await prisma.observation.createMany({ data: observations as any });

      // Verify status (should detect local=7000, iNat=7000, keep hasMoreToSync=false)
      const result = await verifySyncStatus(testUserId, testUsername, testToken);

      expect(result.localCount).toBe(7000);
      expect(result.inatTotal).toBe(7000);
      expect(result.hasMoreToSync).toBe(false);
      expect(result.corrected).toBe(false); // No correction needed

      // Verify database unchanged
      const userStats = await prisma.userStats.findUnique({
        where: { userId: testUserId },
        select: { hasMoreToSync: true },
      });
      expect(userStats?.hasMoreToSync).toBe(false);
    });

    it('should set hasMoreToSync=true when no observations synced yet', async () => {
      // SCENARIO: First sync hasn't started, user has 7000 observations on iNat

      // No local observations yet
      const localCount = await prisma.observation.count({ where: { userId: testUserId } });
      expect(localCount).toBe(0);

      // Verify status (should detect local=0, iNat=7000, set hasMoreToSync=true)
      const result = await verifySyncStatus(testUserId, testUsername, testToken);

      expect(result.localCount).toBe(0);
      expect(result.inatTotal).toBe(7000);
      expect(result.hasMoreToSync).toBe(true);
      expect(result.corrected).toBe(true);

      // Verify database was updated
      const userStats = await prisma.userStats.findUnique({
        where: { userId: testUserId },
        select: { hasMoreToSync: true },
      });
      expect(userStats?.hasMoreToSync).toBe(true);
    });

    it('should handle edge case: local count exceeds iNat total', async () => {
      // SCENARIO: User deleted some observations on iNat, local has extras
      // This test verifies that deletion reconciliation properly cleans up orphans

      // Create 7500 local observations
      const observations = Array.from({ length: 7500 }, (_, i) => ({
        id: 3000 + i,
        userId: testUserId,
        observedOn: new Date('2024-01-01'),
        qualityGrade: 'needs_id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await prisma.observation.createMany({ data: observations as any });

      // Mock iNat to return 7000 observations (IDs 3000-9999)
      // The first 7000 match local, last 500 are orphaned
      mockGetUserObservations = vi.fn().mockImplementation(async (_username, options) => {
        const page = options?.page || 1;
        const perPage = options?.per_page || 50;
        const start = (page - 1) * perPage;
        const end = Math.min(start + perPage, 7000);

        // Generate observation IDs that match the first 7000 local observations
        const results = Array.from({ length: end - start }, (_, i) => ({
          id: 3000 + start + i, // IDs 3000-9999 (first 7000 match)
        }));

        return {
          results,
          total_results: 7000,
          page,
          per_page: perPage,
        };
      });

      // Verify status - should detect deletion and QUEUE reconciliation (not immediate)
      const result = await verifySyncStatus(testUserId, testUsername, testToken);

      // After verification (reconciliation is QUEUED, not yet processed)
      expect(result.localCount).toBe(7500); // Before reconciliation
      expect(result.inatTotal).toBe(7000);
      expect(result.hasMoreToSync).toBe(false); // No more to sync
      expect(result.needsDeletionReconciliation).toBe(true);
      expect(result.reconciliationQueued).toBe(true); // Queued for lazy processing
      expect(result.deletionsReconciled).toBeUndefined(); // Not reconciled yet

      // BEFORE lazy processing, orphaned observations are still there
      const countBeforeQueue = await prisma.observation.count({ where: { userId: testUserId } });
      expect(countBeforeQueue).toBe(7500);

      // Lazy processing (THE FIX!) - simulates what AutoSync does on next page load
      const processed = await processUserPendingReconciliation(testUserId);
      expect(processed).toBe(true);

      // AFTER lazy processing, orphaned observations should be gone
      const countAfterQueue = await prisma.observation.count({ where: { userId: testUserId } });
      expect(countAfterQueue).toBe(7000);
    });
  });

  describe('Integration: Crash Recovery Flow', () => {
    it('should automatically recover after server crash mid-sync', async () => {
      // SIMULATE CRASH SCENARIO:
      // 1. Sync starts, fetches 1000 observations, stores them
      // 2. Server crashes before updating hasMoreToSync flag
      // 3. Server restarts
      // 4. User visits dashboard
      // 5. AutoSync component runs verification
      // 6. Verification detects incomplete sync and corrects flag
      // 7. AutoSync starts sync automatically

      // Step 1-2: Partial sync with incorrect flag
      await prisma.userStats.update({
        where: { userId: testUserId },
        data: {
          hasMoreToSync: false, // INCORRECT - left from crashed sync
          lastSyncedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        },
      });

      const observations = Array.from({ length: 1000 }, (_, i) => ({
        id: 4000 + i,
        userId: testUserId,
        observedOn: new Date('2024-01-01'),
        qualityGrade: 'needs_id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await prisma.observation.createMany({ data: observations as any });

      // Step 3-6: Server restarts, verification runs
      const userStats = await prisma.userStats.findUnique({
        where: { userId: testUserId },
        select: { hasMoreToSync: true, lastSyncedAt: true },
      });

      // Verification should be triggered (hasMoreToSync=false, synced recently)
      const shouldVerify = shouldVerifySyncStatus(
        userStats!.hasMoreToSync ?? false,
        userStats!.lastSyncedAt
      );
      expect(shouldVerify).toBe(true);

      // Run verification
      const result = await verifySyncStatus(testUserId, testUsername, testToken);

      // Step 7: Verification corrects the flag
      expect(result.corrected).toBe(true);
      expect(result.hasMoreToSync).toBe(true);

      // Verify the flag was updated in database
      const updatedStats = await prisma.userStats.findUnique({
        where: { userId: testUserId },
        select: { hasMoreToSync: true },
      });
      expect(updatedStats?.hasMoreToSync).toBe(true);

      // Now AutoSync will see hasMoreToSync=true and start the sync
      // This completes the automatic recovery without manual intervention
    });
  });

  describe('Deletion Detection & Reconciliation', () => {
    it('should actually queue and process large dataset reconciliation (not just say "queued")', async () => {
      // Test validates that ALL datasets are queued for lazy processing (new queue-only behavior)
      const largeDatasetSize = 50000;
      const inatTotal = 49000;

      // Clean up test user's observations (scoped for test isolation)
      await prisma.observation.deleteMany({ where: { userId: testUserId } });

      // Create 50k local observations
      const batchSize = 5000;
      for (let i = 0; i < largeDatasetSize / batchSize; i++) {
        await prisma.observation.createMany({
          data: Array.from({ length: batchSize }, (_, j) => ({
            id: 1000000 + i * batchSize + j,
            userId: testUserId,
            observedOn: new Date('2024-01-01'),
            qualityGrade: 'needs_id',
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        });
      }

      // Mock iNat to return 49k total (1k deletions detected)
      mockGetUserObservations = vi.fn().mockResolvedValue({
        results: [],
        total_results: inatTotal,
      });

      // Run verification - ALL datasets now queue for lazy processing
      const result = await verifySyncStatus(testUserId, testUsername, testToken);

      // Verification should queue reconciliation (not process immediately)
      expect(result.reconciliationQueued).toBe(true);
      expect(result.deletionsReconciled).toBeUndefined();
      expect(result.needsDeletionReconciliation).toBe(true);

      // Before lazy processing, orphaned observations are still there
      const countBeforeQueue = await prisma.observation.count({ where: { userId: testUserId } });
      expect(countBeforeQueue).toBe(largeDatasetSize);

      // Mock iNat to return paginated IDs for reconciliation
      mockGetUserObservations = vi.fn().mockImplementation(async (_username, options) => {
        const page = options?.page || 1;
        const perPage = options?.per_page || 50;
        const start = (page - 1) * perPage;
        const end = Math.min(start + perPage, inatTotal);

        const results = Array.from({ length: end - start }, (_, i) => ({
          id: 1000000 + start + i, // IDs 1000000-1049000 (unique range to avoid conflicts)
        }));

        return {
          results,
          total_results: inatTotal,
          page,
          per_page: perPage,
        };
      });

      // Lazy processing - simulates what AutoSync does on next page load
      const processed = await processUserPendingReconciliation(testUserId);
      expect(processed).toBe(true);

      // After lazy processing, orphaned observations should be gone
      const countAfterQueue = await prisma.observation.count({ where: { userId: testUserId } });
      expect(countAfterQueue).toBe(inatTotal);
    });

    it('should NOT block verification for ALL datasets (queue pattern prevents race)', async () => {
      // PERFORMANCE TEST: ALL datasets now queue immediately (new queue-only behavior)
      // Validates that verification completes quickly even for large datasets
      const largeDatasetSize = 50000;
      const inatTotal = 49000;

      // Clean up test user's observations (scoped for test isolation)
      await prisma.observation.deleteMany({ where: { userId: testUserId } });

      // Create 50k local observations (using different ID range to avoid conflicts)
      const batchSize = 5000;
      const idOffset = 100000; // Use IDs 100001-150000 to avoid conflict with other test
      for (let i = 0; i < largeDatasetSize / batchSize; i++) {
        await prisma.observation.createMany({
          data: Array.from({ length: batchSize }, (_, j) => ({
            id: idOffset + i * batchSize + j + 1,
            userId: testUserId,
            observedOn: new Date('2024-01-01'),
            qualityGrade: 'needs_id',
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        });
      }

      // Mock iNat to return 49k total
      mockGetUserObservations = vi.fn().mockResolvedValue({
        results: [],
        total_results: inatTotal,
      });

      // Verification should complete quickly by queueing (not processing immediately)
      const startTime = Date.now();
      const result = await verifySyncStatus(testUserId, testUsername, testToken);
      const duration = Date.now() - startTime;

      // Should detect deletions
      expect(result.localCount).toBe(largeDatasetSize);
      expect(result.inatTotal).toBe(inatTotal);
      expect(result.needsDeletionReconciliation).toBe(true);

      // Should queue for lazy processing (not reconcile immediately)
      expect(result.deletionsReconciled).toBeUndefined();
      expect(result.reconciliationQueued).toBe(true);

      // Should complete quickly by queueing (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should queue reconciliation (ALL datasets now use queue to avoid race conditions)', async () => {
      // ALL datasets are now queued to prevent race conditions with sync
      const smallDatasetSize = 7000;
      const inatTotal = 5000;

      await prisma.observation.createMany({
        data: Array.from({ length: smallDatasetSize }, (_, i) => ({
          id: 1 + i,
          userId: testUserId,
          observedOn: new Date('2024-01-01'),
          qualityGrade: 'needs_id',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });

      // Mock iNat to return paginated results
      mockGetUserObservations = vi.fn().mockImplementation(async (_username, options) => {
        const page = options?.page || 1;
        const perPage = options?.per_page || 50;
        const start = (page - 1) * perPage;
        const end = Math.min(start + perPage, inatTotal);

        const results = Array.from({ length: end - start }, (_, i) => ({
          id: 1 + start + i,
        }));

        return {
          results,
          total_results: inatTotal,
          page,
          per_page: perPage,
        };
      });

      const result = await verifySyncStatus(testUserId, testUsername, testToken);

      expect(result.needsDeletionReconciliation).toBe(true);
      expect(result.reconciliationQueued).toBe(true); // Queued for lazy processing
      expect(result.deletionsReconciled).toBeUndefined(); // Not reconciled yet

      // BEFORE lazy processing, orphaned observations are still there
      const countBeforeQueue = await prisma.observation.count({ where: { userId: testUserId } });
      expect(countBeforeQueue).toBe(smallDatasetSize);

      // Lazy processing - simulates what AutoSync does on next page load
      const processed = await processUserPendingReconciliation(testUserId);
      expect(processed).toBe(true);

      // AFTER lazy processing, orphaned observations should be gone
      const finalCount = await prisma.observation.count({ where: { userId: testUserId } });
      expect(finalCount).toBe(5000);
    });

    it('should detect when local count exceeds iNat total (deletions occurred)', async () => {
      // User has 5000 observations on iNat (deleted 2000 from original 7000)
      // Local DB still has all 7000 (IDs 1-7000)

      // Create 7000 local observations
      await prisma.observation.createMany({
        data: Array.from({ length: 7000 }, (_, i) => ({
          id: 1 + i,
          userId: testUserId,
          observedOn: new Date('2024-01-01'),
          qualityGrade: 'needs_id',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });

      // Mock iNat to return only 5000 observations (IDs 1-5000)
      // The last 2000 (IDs 5001-7000) are orphaned
      mockGetUserObservations = vi.fn().mockImplementation(async (_username, options) => {
        const page = options?.page || 1;
        const perPage = options?.per_page || 50;
        const start = (page - 1) * perPage;
        const end = Math.min(start + perPage, 5000);

        // Generate observation IDs that match the first 5000 local observations
        const results = Array.from({ length: end - start }, (_, i) => ({
          id: 1 + start + i, // IDs 1-5000
        }));

        return {
          results,
          total_results: 5000,
          page,
          per_page: perPage,
        };
      });

      const result = await verifySyncStatus(testUserId, testUsername, testToken);

      expect(result.localCount).toBe(7000);
      expect(result.inatTotal).toBe(5000);
      expect(result.hasMoreToSync).toBe(false); // No MORE to sync
      expect(result.needsDeletionReconciliation).toBe(true); // But need to delete orphans
      expect(result.reconciliationQueued).toBe(true); // Queued for lazy processing
      expect(result.deletionsReconciled).toBeUndefined(); // Not reconciled yet

      // BEFORE lazy processing, orphaned observations are still there
      const countBeforeQueue = await prisma.observation.count({ where: { userId: testUserId } });
      expect(countBeforeQueue).toBe(7000);

      // Lazy processing - simulates what AutoSync does on next page load
      const processed = await processUserPendingReconciliation(testUserId);
      expect(processed).toBe(true);

      // AFTER lazy processing, orphaned observations should be gone
      const finalCount = await prisma.observation.count({ where: { userId: testUserId } });
      expect(finalCount).toBe(5000);
    });
  });
});
