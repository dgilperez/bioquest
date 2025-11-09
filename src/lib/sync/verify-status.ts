/**
 * Sync Status Verification
 *
 * Automatically detects and corrects incomplete syncs after server crashes or restarts.
 * This makes the system resilient by comparing local observation count with iNaturalist total.
 */

import { prisma } from '@/lib/db/prisma';
import { getINatClient } from '@/lib/inat/client';
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

    // ALWAYS queue reconciliation to avoid race conditions with sync
    // Lazy processing (in AutoSync) will handle the queued job on next page load
    console.log(`  📋 Queuing reconciliation for lazy processing (prevents race with sync)`);

    // Queue the reconciliation job
    await queueReconciliation(userId, inatUsername, accessToken, inatTotal);
    reconciliationQueued = true;

    console.log(`  ✅ Reconciliation queued for lazy processing`);
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
