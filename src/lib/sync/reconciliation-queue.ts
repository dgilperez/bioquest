/**
 * Reconciliation Queue Manager
 *
 * Handles background processing of deletion reconciliation for large datasets
 */

import { prisma } from '@/lib/db/prisma';
import { getINatClient } from '@/lib/inat/client';
import { updateProgress } from './progress';

/**
 * Queue a deletion reconciliation job for background processing
 */
export async function queueReconciliation(
  userId: string,
  inatUsername: string,
  accessToken: string,
  inatTotal: number
): Promise<string> {
  console.log(`📋 Queuing reconciliation for ${inatUsername} (${inatTotal} observations)`);

  // Upsert to avoid duplicates (one pending job per user max)
  const job = await prisma.reconciliationQueue.upsert({
    where: { userId },
    create: {
      userId,
      inatUsername,
      accessToken,
      inatTotal,
      status: 'pending',
    },
    update: {
      inatTotal, // Update with latest count
      status: 'pending',
      attempts: 0,
      lastError: null,
    },
  });

  console.log(`  ✅ Reconciliation job queued: ${job.id}`);
  return job.id;
}

/**
 * Process all pending reconciliation jobs
 * Returns number of jobs processed
 */
export async function processReconciliationQueue(): Promise<number> {
  console.log('🔄 Processing reconciliation queue...');

  // Get all pending jobs (oldest first)
  const jobs = await prisma.reconciliationQueue.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });

  if (jobs.length === 0) {
    console.log('  No pending reconciliation jobs');
    return 0;
  }

  console.log(`  Found ${jobs.length} pending job(s)`);

  let processed = 0;
  for (const job of jobs) {
    try {
      await processReconciliationJob(job.id);
      processed++;
    } catch (error) {
      console.error(`  ❌ Failed to process job ${job.id}:`, error);
      // Continue with next job
    }
  }

  console.log(`  ✅ Processed ${processed} reconciliation job(s)`);
  return processed;
}

/**
 * Process a single reconciliation job
 */
async function processReconciliationJob(jobId: string): Promise<void> {
  const job = await prisma.reconciliationQueue.findUnique({ where: { id: jobId } });
  if (!job) {
    console.log(`  Job ${jobId} not found`);
    return;
  }

  console.log(`  Processing job ${jobId} for user ${job.userId}...`);

  // Mark as processing
  await prisma.reconciliationQueue.update({
    where: { id: jobId },
    data: {
      status: 'processing',
      attempts: job.attempts + 1,
      lastAttemptAt: new Date(),
    },
  });

  try {
    // Run the actual reconciliation (copy from verify-status.ts)
    const deletionsProcessed = await reconcileDeletedObservations(
      job.userId,
      job.inatUsername,
      job.accessToken,
      job.inatTotal
    );

    // Mark as completed
    await prisma.reconciliationQueue.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        deletionsProcessed,
        completedAt: new Date(),
      },
    });

    console.log(`  ✅ Job ${jobId} completed: ${deletionsProcessed} deletions processed`);
  } catch (error: any) {
    console.error(`  ❌ Job ${jobId} failed:`, error);

    // Mark as failed
    await prisma.reconciliationQueue.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        lastError: error.message,
      },
    });

    throw error;
  }
}

/**
 * Reconcile deleted observations (extracted from verify-status.ts)
 */
async function reconcileDeletedObservations(
  userId: string,
  inatUsername: string,
  accessToken: string,
  inatTotal: number
): Promise<number> {
  console.log(`🗑️  Starting deletion reconciliation for ${inatUsername}...`);

  await updateProgress(userId, {
    status: 'syncing',
    phase: 'storing',
    message: 'Checking for deleted observations...',
  });

  const client = getINatClient(accessToken);
  const inatIds = new Set<number>();

  // 1. Fetch ALL observation IDs from iNaturalist (paginated)
  const perPage = 200;
  const totalPages = Math.ceil(inatTotal / perPage);

  console.log(`  Fetching ${inatTotal} observation IDs across ${totalPages} pages...`);

  await updateProgress(userId, {
    message: `Fetching observation IDs from iNaturalist (0/${totalPages} pages)...`,
  });

  for (let page = 1; page <= totalPages; page++) {
    const response = await client.getUserObservations(inatUsername, {
      per_page: perPage,
      page,
      order_by: 'id',
      order: 'asc',
    });

    for (const obs of response.results) {
      inatIds.add(obs.id);
    }

    if (page % 10 === 0) {
      console.log(`  Progress: ${page}/${totalPages} pages fetched (${inatIds.size} IDs)`);
      await updateProgress(userId, {
        message: `Fetching observation IDs from iNaturalist (${page}/${totalPages} pages)...`,
      });
    }
  }

  console.log(`  ✅ Fetched ${inatIds.size} observation IDs from iNaturalist`);

  await updateProgress(userId, {
    message: `Comparing with local database...`,
  });

  // 2. Get all local observation IDs
  const localObservations = await prisma.observation.findMany({
    where: { userId },
    select: { id: true },
  });

  const localIds = new Set(localObservations.map(obs => obs.id));
  console.log(`  Local database has ${localIds.size} observations`);

  // 3. Find orphaned IDs
  const orphanedIds: number[] = [];
  for (const localId of localIds) {
    if (!inatIds.has(localId)) {
      orphanedIds.push(localId);
    }
  }

  if (orphanedIds.length === 0) {
    console.log(`  ✅ No orphaned observations found`);
    await updateProgress(userId, {
      message: `No deleted observations found`,
    });
    return 0;
  }

  console.log(`  ⚠️  Found ${orphanedIds.length} orphaned observations to delete`);

  await updateProgress(userId, {
    message: `Deleting ${orphanedIds.length} orphaned observations...`,
  });

  // 4. Delete orphaned observations
  const deleteResult = await prisma.observation.deleteMany({
    where: {
      id: { in: orphanedIds },
      userId,
    },
  });

  console.log(`  ✅ Deleted ${deleteResult.count} orphaned observations`);

  // 5. Recalculate stats
  if (deleteResult.count > 0) {
    console.log(`  📊 Recalculating stats after deletion...`);

    await updateProgress(userId, {
      message: `Recalculating statistics after deletion...`,
    });

    const totalObservations = await prisma.observation.count({ where: { userId } });
    const distinctSpecies = await prisma.observation.groupBy({
      by: ['taxonId'],
      where: { userId },
    });
    const totalSpecies = distinctSpecies.length;

    const pointsSum = await prisma.observation.aggregate({
      where: { userId },
      _sum: { pointsAwarded: true },
    });
    const totalPoints = pointsSum._sum.pointsAwarded || 0;

    const rareCount = await prisma.observation.count({
      where: { userId, rarity: 'rare' },
    });
    const legendaryCount = await prisma.observation.count({
      where: { userId, rarity: 'legendary' },
    });

    await prisma.userStats.updateMany({
      where: { userId },
      data: {
        totalObservations,
        totalSpecies,
        totalPoints,
        rareObservations: rareCount,
        legendaryObservations: legendaryCount,
      },
    });

    console.log(`  ✅ Stats updated: ${totalObservations} obs, ${totalSpecies} species, ${totalPoints} points`);
  }

  return deleteResult.count;
}
