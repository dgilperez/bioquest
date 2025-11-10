/**
 * Stale Sync Status Test
 *
 * CRITICAL BUG: When server restarts mid-sync, stale status='syncing' blocks new syncs
 *
 * Scenario:
 * 1. Sync starts, sets status='syncing' in database
 * 2. Server crashes or is restarted
 * 3. User visits dashboard and tries to sync again
 * 4. initProgress sees status='syncing' and returns silently (assumes sync in progress)
 * 5. But no actual sync is running - the previous one died with the server
 * 6. User is permanently stuck with "Sync in progress" message
 *
 * This test documents the bug and will fail until we implement stale sync detection.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { initProgress, getProgress } from '@/lib/sync/progress';

describe('Stale Sync Status Detection', () => {
  const testUserId = 'stale-sync-test-user';

  beforeEach(async () => {
    // Clean up and create test user
    await prisma.syncProgress.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    // Also clean up any users with the same inatId to prevent unique constraint errors
    await prisma.user.deleteMany({ where: { inatId: 888888 } });

    await prisma.user.create({
      data: {
        id: testUserId,
        inatId: 888888,
        inatUsername: 'stale-test-user',
        email: 'stale@test.com',
      },
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.syncProgress.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('should detect and override stale "syncing" status after server restart', async () => {
    // SIMULATE: Server crash scenario
    // 1. Previous sync started 15 minutes ago
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    await prisma.syncProgress.create({
      data: {
        userId: testUserId,
        status: 'syncing',
        phase: 'fetching',
        currentStep: 1,
        totalSteps: 4,
        message: 'Fetching observations...',
        observationsProcessed: 500,
        observationsTotal: 7775,
        startedAt: fifteenMinutesAgo, // Started 15 minutes ago, then server crashed
      },
    });

    // 2. Server restarted, user visits dashboard and triggers new sync
    // This should detect the stale sync (>10 min old) and start fresh
    await initProgress(testUserId, 7775);

    // 3. Verify new sync was initiated (status should still be 'syncing' but with new timestamp)
    const progress = await getProgress(testUserId);

    expect(progress).toBeTruthy();
    expect(progress!.status).toBe('syncing');

    // CRITICAL: startedAt should be recent (within last 5 seconds), not 15 minutes ago
    const timeSinceStart = Date.now() - progress!.startedAt!.getTime();
    expect(timeSinceStart).toBeLessThan(5000); // Should be < 5 seconds (fresh start)

    // Progress should be reset
    expect(progress!.observationsProcessed).toBe(0);
    expect(progress!.currentStep).toBe(0);
  });

  it('should NOT override active sync (started < 5 minutes ago)', async () => {
    // SIMULATE: Active sync in progress
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    await prisma.syncProgress.create({
      data: {
        userId: testUserId,
        status: 'syncing',
        phase: 'enriching',
        currentStep: 2,
        totalSteps: 4,
        message: 'Enriching observations...',
        observationsProcessed: 300,
        observationsTotal: 1000,
        startedAt: twoMinutesAgo,
      },
    });

    // Try to start new sync - should be rejected (sync already in progress)
    await initProgress(testUserId, 1000);

    // Verify original sync is still active and unchanged
    const progress = await getProgress(testUserId);

    expect(progress).toBeTruthy();
    expect(progress!.status).toBe('syncing');
    expect(progress!.phase).toBe('enriching'); // Still on original phase
    expect(progress!.observationsProcessed).toBe(300); // Original progress preserved

    // startedAt should still be ~2 minutes ago
    const timeSinceStart = Date.now() - progress!.startedAt!.getTime();
    expect(timeSinceStart).toBeGreaterThan(100000); // > 100 seconds (close to 2 min)
    expect(timeSinceStart).toBeLessThan(150000); // < 150 seconds (within tolerance)
  });
});
