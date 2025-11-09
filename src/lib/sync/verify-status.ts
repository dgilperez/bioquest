/**
 * Sync Status Verification
 *
 * Automatically detects and corrects incomplete syncs after server crashes or restarts.
 * This makes the system resilient by comparing local observation count with iNaturalist total.
 */

import { prisma } from '@/lib/db/prisma';
import { getINatClient } from '@/lib/inat/client';
import { updateProgress } from './progress';
import { queueReconciliation } from './reconciliation-queue';

export interface SyncVerificationResult {
  hasMoreToSync: boolean;
  localCount: number;
  inatTotal: number;
  corrected: boolean; // true if we had to fix the flag
  needsDeletionReconciliation?: boolean; // true if local > iNat (deletions occurred)
  deletionsReconciled?: number; // number of orphaned observations deleted
  reconciliationQueued?: boolean; // true if reconciliation queued for background (large dataset)
}

/**
 * Reconcile deleted observations
 *
 * When user deletes observations on iNaturalist, local DB may have orphaned records.
 * This function fetches all current iNat observation IDs, compares with local,
 * and deletes observations that no longer exist on iNat.
 *
 * @param userId - User ID
 * @param inatUsername - iNaturalist username
 * @param accessToken - iNaturalist access token
 * @param inatTotal - Total observations on iNat (from verifySyncStatus)
 * @returns Number of observations deleted
 */
async function reconcileDeletedObservations(
  userId: string,
  inatUsername: string,
  accessToken: string,
  inatTotal: number
): Promise<number> {
  console.log(`🗑️  Starting deletion reconciliation for ${inatUsername}...`);

  // Update progress to show in UI
  await updateProgress(userId, {
    status: 'syncing',
    phase: 'storing',
    message: 'Checking for deleted observations...',
  });

  const client = getINatClient(accessToken);
  const inatIds = new Set<number>();

  // 1. Fetch ALL observation IDs from iNaturalist (paginated)
  const perPage = 200; // Maximum allowed by API
  const totalPages = Math.ceil(inatTotal / perPage);

  console.log(`  Fetching ${inatTotal} observation IDs across ${totalPages} pages...`);

  await updateProgress(userId, {
    message: `Fetching observation IDs from iNaturalist (0/${totalPages} pages)...`,
  });

  for (let page = 1; page <= totalPages; page++) {
    try {
      const response = await client.getUserObservations(inatUsername, {
        per_page: perPage,
        page,
        order_by: 'id', // Consistent ordering
        order: 'asc',
      });

      // Extract IDs from results
      for (const obs of response.results) {
        inatIds.add(obs.id);
      }

      if (page % 10 === 0) {
        console.log(`  Progress: ${page}/${totalPages} pages fetched (${inatIds.size} IDs)`);
        await updateProgress(userId, {
          message: `Fetching observation IDs from iNaturalist (${page}/${totalPages} pages)...`,
        });
      }
    } catch (error) {
      console.error(`  Error fetching page ${page}:`, error);
      throw error;
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

  // 3. Find orphaned IDs (local but not in iNat)
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
      userId, // Safety: only delete for this user
    },
  });

  console.log(`  ✅ Deleted ${deleteResult.count} orphaned observations`);

  // 5. Recalculate stats after deletion
  if (deleteResult.count > 0) {
    console.log(`  📊 Recalculating stats after deletion...`);

    await updateProgress(userId, {
      message: `Recalculating statistics after deletion...`,
    });

    // Count remaining observations
    const totalObservations = await prisma.observation.count({
      where: { userId },
    });

    // Count distinct species
    const distinctSpecies = await prisma.observation.groupBy({
      by: ['taxonId'],
      where: { userId },
    });
    const totalSpecies = distinctSpecies.length;

    // Sum points
    const pointsSum = await prisma.observation.aggregate({
      where: { userId },
      _sum: { pointsAwarded: true },
    });
    const totalPoints = pointsSum._sum.pointsAwarded || 0;

    // Count rare/legendary observations
    const rareCount = await prisma.observation.count({
      where: { userId, rarity: 'rare' },
    });
    const legendaryCount = await prisma.observation.count({
      where: { userId, rarity: 'legendary' },
    });

    // Update UserStats with recalculated values
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

/**
 * Verify that hasMoreToSync flag is accurate by comparing local vs iNat counts
 *
 * CRITICAL for crash recovery:
 * - If server crashes mid-sync, hasMoreToSync may be stale/incorrect
 * - This function checks actual counts and corrects the flag
 * - Called on page load and before sync decisions
 *
 * @param userId - User ID
 * @param inatUsername - iNaturalist username
 * @param accessToken - iNaturalist access token
 * @returns Verification result with corrected hasMoreToSync flag
 */
export async function verifySyncStatus(
  userId: string,
  inatUsername: string,
  accessToken: string
): Promise<SyncVerificationResult> {
  console.log(`🔍 Verifying sync status for ${inatUsername}...`);

  // 1. Get local observation count
  const localCount = await prisma.observation.count({
    where: { userId },
  });

  // 2. Fetch total count from iNaturalist
  // This is a lightweight API call - only fetches metadata, not observations
  const client = getINatClient(accessToken);
  const response = await client.getUserObservations(inatUsername, {
    per_page: 1, // Only need total count, not actual data
    page: 1,
  });
  const inatTotal = response.total_results;

  console.log(`  Local: ${localCount}, iNat: ${inatTotal}`);

  // 3. Determine correct hasMoreToSync value
  const hasMoreToSync = localCount < inatTotal;

  // 3a. Check if deletions occurred (local has more than iNat)
  const needsDeletionReconciliation = localCount > inatTotal;
  let deletionsReconciled: number | undefined;
  let reconciliationQueued: boolean | undefined;

  if (needsDeletionReconciliation) {
    const deletionCount = localCount - inatTotal;
    console.log(`  ⚠️  Deletions detected: local has ${deletionCount} more observations than iNat`);

    // PERFORMANCE: Use threshold to decide between immediate vs background reconciliation
    // The expensive operation is fetching ALL observation IDs from iNat (not the deletion count)
    // Small datasets (<= 10k total obs on iNat): Reconcile immediately (~50 API requests, ~1 min)
    // Large datasets (> 10k total obs on iNat): Queue for background (>50 API requests, >1 min, would block)
    const IMMEDIATE_RECONCILIATION_THRESHOLD = 10000;

    if (inatTotal > IMMEDIATE_RECONCILIATION_THRESHOLD) {
      console.log(`  📋 Large dataset (iNat has ${inatTotal} > ${IMMEDIATE_RECONCILIATION_THRESHOLD} obs), queuing for background processing`);

      // Queue the reconciliation job
      await queueReconciliation(userId, inatUsername, accessToken, inatTotal);
      reconciliationQueued = true;

      console.log(`  ✅ Reconciliation queued for background processing`);
    } else {
      console.log(`  🔄 Small dataset (iNat has ${inatTotal} <= ${IMMEDIATE_RECONCILIATION_THRESHOLD} obs), reconciling immediately`);

      // Automatically reconcile deletions
      try {
        deletionsReconciled = await reconcileDeletedObservations(
          userId,
          inatUsername,
          accessToken,
          inatTotal
        );
        console.log(`  ✅ Reconciliation complete: ${deletionsReconciled} observations deleted`);
      } catch (error) {
        console.error(`  ❌ Failed to reconcile deletions:`, error);
        // Don't throw - verification can continue even if reconciliation fails
      }
    }
  }

  // 4. Get current flag from database (it's in UserStats, not User)
  const userStats = await prisma.userStats.findUnique({
    where: { userId },
    select: { hasMoreToSync: true },
  });

  const currentFlag = userStats?.hasMoreToSync ?? false;

  // 5. Correct the flag if needed
  let corrected = false;
  if (currentFlag !== hasMoreToSync) {
    console.log(`  ⚠️  Correcting hasMoreToSync: ${currentFlag} → ${hasMoreToSync}`);

    // Use upsert in case UserStats doesn't exist yet
    await prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        hasMoreToSync,
      },
      update: {
        hasMoreToSync,
      },
    });
    corrected = true;
  } else {
    console.log(`  ✅ hasMoreToSync is correct: ${hasMoreToSync}`);
  }

  return {
    hasMoreToSync,
    localCount,
    inatTotal,
    corrected,
    needsDeletionReconciliation,
    deletionsReconciled,
    reconciliationQueued,
  };
}

/**
 * Check if sync verification is needed
 *
 * To avoid unnecessary API calls, only verify when:
 * - hasMoreToSync is false (suspicious if sync was incomplete)
 * - Last sync was recent (< 24 hours ago)
 * - OR never synced before
 *
 * @param hasMoreToSync - Current hasMoreToSync flag
 * @param lastSyncedAt - Last sync timestamp
 * @returns true if verification should run
 */
export function shouldVerifySyncStatus(
  hasMoreToSync: boolean,
  lastSyncedAt: Date | null
): boolean {
  // Always verify if hasMoreToSync is false and last sync was recent
  // This catches the crash scenario: sync started, crashed, left hasMoreToSync=false
  if (!hasMoreToSync && lastSyncedAt) {
    const hoursSinceSync = (Date.now() - new Date(lastSyncedAt).getTime()) / 1000 / 60 / 60;
    if (hoursSinceSync < 24) {
      console.log(`🔍 Verification needed: hasMoreToSync=false but synced ${hoursSinceSync.toFixed(1)}h ago`);
      return true;
    }
  }

  // Always verify if never synced before (to set initial state)
  if (!lastSyncedAt) {
    console.log('🔍 Verification needed: never synced before');
    return true;
  }

  // Otherwise, trust the flag
  return false;
}
