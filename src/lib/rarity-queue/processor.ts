/**
 * Background Rarity Classification Processor
 *
 * Processes queued taxa to classify their rarity in the background.
 * Handles retries, errors, and updates observations with results.
 */

import { prisma } from '@/lib/db/prisma';
import { INatError, RateLimitError, ErrorCode } from '@/lib/errors';
import { POINTS_CONFIG, RARITY_BONUS_POINTS } from '@/lib/gamification/constants';
import { calculateLevel } from '@/lib/sync/user-stats-helpers';
import {
  getNextBatch,
  markAsProcessing,
  markAsFailed,
} from './manager';

/**
 * Determine if an error is transient (retry) or persistent (fail)
 */
function isTransientError(error: Error): boolean {
  // Network errors - retry
  if (error instanceof INatError && error.code === ErrorCode.API_NETWORK) {
    return true;
  }

  // Rate limit - retry (with backoff)
  if (error instanceof RateLimitError) {
    return true;
  }

  // 5xx server errors - retry
  if (error.message.includes('500') || error.message.includes('503')) {
    return true;
  }

  // 404, 401, 400 - persistent, don't retry
  return false;
}

/**
 * Classify a single taxon's rarity
 *
 * OPTIMIZATION: Uses taxon cache (via classifyObservationRarity) to reduce API calls by 90-95%
 */
async function classifyTaxonRarity(
  taxonId: number,
  userId: string,
  placeId?: number
): Promise<{
  rarity: string;
  globalCount: number;
  regionalCount?: number;
  isFirstGlobal: boolean;
  isFirstRegional: boolean;
  bonusPoints: number;
}> {
  // Get user's access token from User table
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessToken: true },
  });

  if (!user?.accessToken) {
    throw new Error('No access token found for user');
  }

  // Import rarity classification logic (which uses taxon cache)
  const { classifyObservationRarity } = await import('@/lib/gamification/rarity');

  // Create a mock observation for classification
  const mockObs = {
    id: 0,
    taxon: { id: taxonId, name: '' },
  } as any;

  const result = await classifyObservationRarity(mockObs, user.accessToken, placeId);

  return {
    rarity: result.rarity,
    globalCount: result.globalCount,
    regionalCount: result.regionalCount,
    isFirstGlobal: result.isFirstGlobal,
    isFirstRegional: result.isFirstRegional,
    bonusPoints: result.bonusPoints,
  };
}

/**
 * Process a batch of queued taxa
 */
export async function processRarityQueue(
  batchSize: number = 20,
  maxRetries: number = 3
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}> {
  console.log('🔄 Starting background rarity classification processor...');

  const batch = await getNextBatch(batchSize, maxRetries);

  if (batch.length === 0) {
    console.log('✨ No taxa to process in queue');
    return { processed: 0, succeeded: 0, failed: 0, errors: [] };
  }

  console.log(`📦 Processing batch of ${batch.length} taxa...`);

  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const item of batch) {
    try {
      console.log(`🔎 Classifying taxon ${item.taxonId} (${item.taxonName || 'unknown'}) for user ${item.userId}...`);

      // Mark as processing
      await markAsProcessing(item.id);

      // Classify the taxon
      const classification = await classifyTaxonRarity(
        item.taxonId,
        item.userId
      );

      console.log(`  ✓ Classified as ${classification.rarity} (${classification.globalCount} global observations)`);

      // ATOMIC TRANSACTION: Update observations + recalculate points + mark as completed
      // If any step fails, all roll back - prevents orphaned queue items or incorrect points
      const updateResult = await prisma.$transaction(async (tx) => {
        // STEP 1: Fetch observations to recalculate points
        const observations = await tx.observation.findMany({
          where: {
            userId: item.userId,
            taxonId: item.taxonId,
            rarityStatus: 'pending', // Only update pending ones
          },
          select: {
            id: true,
            photosCount: true,
            qualityGrade: true,
            pointsAwarded: true,
          },
        });

        if (observations.length === 0) {
          // No observations to update (edge case)
          await tx.rarityClassificationQueue.updateMany({
            where: { id: item.id },
            data: { status: 'completed', lastAttemptAt: new Date() },
          });
          return { count: 0, pointsDelta: 0 };
        }

        // STEP 2: Calculate correct points for each observation
        const rarityBonus = RARITY_BONUS_POINTS[classification.rarity.toLowerCase() as keyof typeof RARITY_BONUS_POINTS] || 0;

        let totalPointsDelta = 0;

        // STEP 3: Update each observation with corrected points
        for (const obs of observations) {
          // Calculate new points
          const basePoints = POINTS_CONFIG.BASE_OBSERVATION_POINTS;
          const photoBonus = Math.min(obs.photosCount, POINTS_CONFIG.MAX_PHOTO_BONUS) * POINTS_CONFIG.PHOTO_POINTS;
          const researchBonus = obs.qualityGrade === 'research' ? POINTS_CONFIG.RESEARCH_GRADE_BONUS : 0;
          const firstGlobalBonus = classification.isFirstGlobal ? 5000 : 0;
          const firstRegionalBonus = classification.isFirstRegional ? 1000 : 0;

          const newPoints = basePoints + photoBonus + researchBonus + rarityBonus + firstGlobalBonus + firstRegionalBonus;
          const pointsDelta = newPoints - obs.pointsAwarded;

          totalPointsDelta += pointsDelta;

          // Update observation with new rarity data and corrected points
          await tx.observation.update({
            where: { id: obs.id },
            data: {
              rarity: classification.rarity as any,
              rarityStatus: 'classified',
              globalCount: classification.globalCount,
              regionalCount: classification.regionalCount,
              isFirstGlobal: classification.isFirstGlobal,
              isFirstRegional: classification.isFirstRegional,
              pointsAwarded: newPoints, // FIXED: Now recalculated with correct rarity bonus
            },
          });
        }

        // STEP 4: Update user's total points with the delta AND recalculate level
        if (totalPointsDelta !== 0) {
          // Fetch current stats to calculate new level
          const currentStats = await tx.userStats.findUnique({
            where: { userId: item.userId },
            select: { totalPoints: true },
          });

          const newTotalPoints = (currentStats?.totalPoints || 0) + totalPointsDelta;
          const { level, pointsToNextLevel } = calculateLevel(newTotalPoints);

          // Use upsert to handle case where UserStats doesn't exist yet
          await tx.userStats.upsert({
            where: { userId: item.userId },
            update: {
              totalPoints: newTotalPoints,
              level,
              pointsToNextLevel,
            },
            create: {
              userId: item.userId,
              totalObservations: 0,
              totalSpecies: 0,
              totalPoints: newTotalPoints,
              level,
              pointsToNextLevel,
            },
          });
        }

        // STEP 5: Mark queue item as completed
        await tx.rarityClassificationQueue.updateMany({
          where: { id: item.id },
          data: {
            status: 'completed',
            lastAttemptAt: new Date(),
          },
        });

        return { count: observations.length, pointsDelta: totalPointsDelta };
      }, {
        timeout: 30000, // 30 second timeout for transaction
      });

      console.log(`  📝 Updated ${updateResult.count} observations`);
      succeeded++;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTransient = isTransientError(error as Error);

      console.error(`  ❌ Failed to classify taxon ${item.taxonId}:`, errorMessage);
      console.error(`     Transient: ${isTransient}`);

      // Mark as failed (will retry if transient and under max attempts)
      await markAsFailed(item.id, errorMessage, isTransient);

      failed++;
      errors.push(`Taxon ${item.taxonId}: ${errorMessage}`);
    }

    // Small delay between taxa to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`✅ Batch complete: ${succeeded} succeeded, ${failed} failed`);

  return {
    processed: batch.length,
    succeeded,
    failed,
    errors,
  };
}

/**
 * Process queue for a specific user (e.g., when they request it)
 *
 * NEW: This function now loops internally until all pending items are processed
 * or a safety limit is reached. This fixes the bug where only one batch (20 items)
 * was processed, leaving remaining items unprocessed forever.
 */
export async function processUserQueue(
  userId: string,
  batchSize: number = 20,
  maxIterations: number = 50 // Safety: max 50 batches = 1000 items
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  console.log(`🎯 Processing queue for user ${userId}...`);

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  let iteration = 0;

  // CONTINUATION LOOP: Process batches until queue is empty
  while (iteration < maxIterations) {
    iteration++;

    // Get user's pending items for this batch
    const batch = await prisma.rarityClassificationQueue.findMany({
      where: {
        userId,
        status: 'pending',
        attempts: { lt: 3 },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: batchSize,
    });

    // No more items - we're done!
    if (batch.length === 0) {
      if (iteration === 1) {
        console.log('✨ No pending taxa for this user');
      } else {
        console.log(`✅ Queue empty after ${iteration - 1} batches`);
      }
      break;
    }

    console.log(`📦 Batch ${iteration}: Processing ${batch.length} taxa...`);

    let succeeded = 0;
    let failed = 0;

    for (const item of batch) {
      try {
        await markAsProcessing(item.id);
        const classification = await classifyTaxonRarity(item.taxonId, userId);

        // ATOMIC TRANSACTION: Update observations + recalculate points + mark as completed
        await prisma.$transaction(async (tx) => {
          // Fetch observations to recalculate points
          const observations = await tx.observation.findMany({
            where: {
              userId,
              taxonId: item.taxonId,
              rarityStatus: 'pending',
            },
            select: {
              id: true,
              photosCount: true,
              qualityGrade: true,
              pointsAwarded: true,
            },
          });

          if (observations.length > 0) {
            // Calculate correct points for each observation
            const rarityBonus = RARITY_BONUS_POINTS[classification.rarity.toLowerCase() as keyof typeof RARITY_BONUS_POINTS] || 0;

            let totalPointsDelta = 0;

            // Update each observation with corrected points
            for (const obs of observations) {
              const basePoints = POINTS_CONFIG.BASE_OBSERVATION_POINTS;
              const photoBonus = Math.min(obs.photosCount, POINTS_CONFIG.MAX_PHOTO_BONUS) * POINTS_CONFIG.PHOTO_POINTS;
              const researchBonus = obs.qualityGrade === 'research' ? POINTS_CONFIG.RESEARCH_GRADE_BONUS : 0;
              const firstGlobalBonus = classification.isFirstGlobal ? 5000 : 0;
              const firstRegionalBonus = classification.isFirstRegional ? 1000 : 0;

              const newPoints = basePoints + photoBonus + researchBonus + rarityBonus + firstGlobalBonus + firstRegionalBonus;
              const pointsDelta = newPoints - obs.pointsAwarded;

              totalPointsDelta += pointsDelta;

              await tx.observation.update({
                where: { id: obs.id },
                data: {
                  rarity: classification.rarity as any,
                  rarityStatus: 'classified',
                  globalCount: classification.globalCount,
                  regionalCount: classification.regionalCount,
                  isFirstGlobal: classification.isFirstGlobal,
                  isFirstRegional: classification.isFirstRegional,
                  pointsAwarded: newPoints,
                },
              });
            }

            // Update user's total points AND recalculate level
            if (totalPointsDelta !== 0) {
              // Fetch current stats to calculate new level
              const currentStats = await tx.userStats.findUnique({
                where: { userId },
                select: { totalPoints: true },
              });

              const newTotalPoints = (currentStats?.totalPoints || 0) + totalPointsDelta;
              const { level, pointsToNextLevel } = calculateLevel(newTotalPoints);

              // Use upsert to handle case where UserStats doesn't exist yet
              await tx.userStats.upsert({
                where: { userId },
                update: {
                  totalPoints: newTotalPoints,
                  level,
                  pointsToNextLevel,
                },
                create: {
                  userId,
                  totalObservations: 0,
                  totalSpecies: 0,
                  totalPoints: newTotalPoints,
                  level,
                  pointsToNextLevel,
                },
              });
            }
          }

          await tx.rarityClassificationQueue.updateMany({
            where: { id: item.id },
            data: {
              status: 'completed',
              lastAttemptAt: new Date(),
            },
          });
        }, {
          timeout: 30000,
        });

        succeeded++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isTransient = isTransientError(error as Error);
        await markAsFailed(item.id, errorMessage, isTransient);
        failed++;
      }

      // Small delay between taxa to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    totalProcessed += batch.length;
    totalSucceeded += succeeded;
    totalFailed += failed;

    console.log(`  ✓ Batch ${iteration} complete: ${succeeded} succeeded, ${failed} failed`);

    // Check if more items remain
    const remainingCount = await prisma.rarityClassificationQueue.count({
      where: { userId, status: 'pending' },
    });

    if (remainingCount === 0) {
      console.log(`✅ All taxa processed after ${iteration} batches`);
      break;
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (iteration >= maxIterations) {
    console.warn(`⚠️  Hit safety limit: ${maxIterations} batches processed`);
  }

  return {
    processed: totalProcessed,
    succeeded: totalSucceeded,
    failed: totalFailed,
  };
}
