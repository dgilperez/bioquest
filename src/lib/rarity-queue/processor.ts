/**
 * Background Rarity Classification Processor
 *
 * Processes queued taxa to classify their rarity in the background.
 * Handles retries, errors, and updates observations with results.
 */

import { prisma } from '@/lib/db/prisma';
import { getINatClient } from '@/lib/inat/client';
import { INatError, RateLimitError, ErrorCode } from '@/lib/errors';
import {
  getNextBatch,
  markAsProcessing,
  markAsCompleted,
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

  const client = getINatClient(user.accessToken);

  // Import rarity classification logic
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

      // Update all observations with this taxon for this user
      const updateResult = await prisma.observation.updateMany({
        where: {
          userId: item.userId,
          taxonId: item.taxonId,
          rarityStatus: 'pending', // Only update pending ones
        },
        data: {
          rarity: classification.rarity as any,
          rarityStatus: 'classified',
          globalCount: classification.globalCount,
          regionalCount: classification.regionalCount,
          isFirstGlobal: classification.isFirstGlobal,
          isFirstRegional: classification.isFirstRegional,
          // Note: pointsAwarded was already calculated during initial sync
        },
      });

      console.log(`  📝 Updated ${updateResult.count} observations`);

      // Mark queue item as completed
      await markAsCompleted(item.id);
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
 */
export async function processUserQueue(
  userId: string,
  batchSize: number = 20
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  console.log(`🎯 Processing queue for user ${userId}...`);

  // Get user's pending items
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

  if (batch.length === 0) {
    console.log('✨ No pending taxa for this user');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const item of batch) {
    try {
      await markAsProcessing(item.id);
      const classification = await classifyTaxonRarity(item.taxonId, userId);

      await prisma.observation.updateMany({
        where: {
          userId,
          taxonId: item.taxonId,
          rarityStatus: 'pending',
        },
        data: {
          rarity: classification.rarity as any,
          rarityStatus: 'classified',
          globalCount: classification.globalCount,
          regionalCount: classification.regionalCount,
          isFirstGlobal: classification.isFirstGlobal,
          isFirstRegional: classification.isFirstRegional,
        },
      });

      await markAsCompleted(item.id);
      succeeded++;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isTransient = isTransientError(error as Error);
      await markAsFailed(item.id, errorMessage, isTransient);
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return {
    processed: batch.length,
    succeeded,
    failed,
  };
}
