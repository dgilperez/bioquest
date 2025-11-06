/**
 * Rarity Classification Queue Manager
 *
 * Manages the background queue for classifying observation rarity.
 * Allows adding taxa to queue, checking status, and prioritizing work.
 */

import { prisma } from '@/lib/db/prisma';

export interface QueueStatus {
  userId: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  percentComplete: number;
}

export interface QueueTaxon {
  taxonId: number;
  taxonName?: string;
  priority: number; // Higher = process first
}

/**
 * Add taxa to the classification queue
 */
export async function queueTaxaForClassification(
  userId: string,
  taxa: QueueTaxon[]
): Promise<void> {
  console.log(`📥 Queueing ${taxa.length} taxa for background classification (user: ${userId})`);

  // Batch upsert to avoid duplicates
  await prisma.$transaction(
    taxa.map(taxon =>
      prisma.rarityClassificationQueue.upsert({
        where: {
          userId_taxonId: {
            userId,
            taxonId: taxon.taxonId,
          },
        },
        create: {
          userId,
          taxonId: taxon.taxonId,
          taxonName: taxon.taxonName,
          priority: taxon.priority,
          status: 'pending',
        },
        update: {
          // If already exists and failed, reset to pending
          status: 'pending',
          priority: taxon.priority,
          attempts: 0,
          lastError: null,
        },
      })
    )
  );

  console.log(`✅ Queued ${taxa.length} taxa successfully`);
}

/**
 * Get queue status for a user
 */
export async function getQueueStatus(userId: string): Promise<QueueStatus> {
  const counts = await prisma.rarityClassificationQueue.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
  });

  const statusMap: Record<string, number> = {};
  counts.forEach(({ status, _count }) => {
    statusMap[status] = _count;
  });

  const total = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
  const completed = statusMap['completed'] || 0;
  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 100;

  return {
    userId,
    pending: statusMap['pending'] || 0,
    processing: statusMap['processing'] || 0,
    completed,
    failed: statusMap['failed'] || 0,
    total,
    percentComplete,
  };
}

/**
 * Get next batch of taxa to process from the queue
 */
export async function getNextBatch(
  batchSize: number = 20,
  maxRetries: number = 3
): Promise<Array<{ id: string; userId: string; taxonId: number; taxonName?: string }>> {
  return prisma.rarityClassificationQueue.findMany({
    where: {
      status: 'pending',
      attempts: { lt: maxRetries },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
    take: batchSize,
    select: {
      id: true,
      userId: true,
      taxonId: true,
      taxonName: true,
    },
  });
}

/**
 * Mark queue item as processing
 */
export async function markAsProcessing(queueItemId: string): Promise<void> {
  // Use updateMany to avoid race condition if record is deleted
  await prisma.rarityClassificationQueue.updateMany({
    where: { id: queueItemId },
    data: { status: 'processing' },
  });
}

/**
 * Mark queue item as completed
 */
export async function markAsCompleted(queueItemId: string): Promise<void> {
  // Use updateMany to avoid race condition if record is deleted
  await prisma.rarityClassificationQueue.updateMany({
    where: { id: queueItemId },
    data: {
      status: 'completed',
      lastAttemptAt: new Date(),
    },
  });
}

/**
 * Mark queue item as failed (with retry info)
 */
export async function markAsFailed(
  queueItemId: string,
  error: string,
  isTransient: boolean
): Promise<void> {
  const item = await prisma.rarityClassificationQueue.findUnique({
    where: { id: queueItemId },
  });

  if (!item) return;

  const newAttempts = item.attempts + 1;

  // Use updateMany to avoid race condition if record is deleted between check and update
  await prisma.rarityClassificationQueue.updateMany({
    where: { id: queueItemId },
    data: {
      status: isTransient ? 'pending' : 'failed', // Retry transient, fail persistent
      attempts: newAttempts,
      lastAttemptAt: new Date(),
      lastError: error,
    },
  });
}

/**
 * Clear completed queue items (for cleanup)
 */
export async function clearCompleted(userId?: string): Promise<number> {
  const result = await prisma.rarityClassificationQueue.deleteMany({
    where: {
      status: 'completed',
      ...(userId && { userId }),
    },
  });

  return result.count;
}

/**
 * Reset failed taxa to retry (e.g., weekly maintenance)
 */
export async function retryFailed(maxAge?: number): Promise<number> {
  const where: any = { status: 'failed' };

  if (maxAge) {
    // Only retry failures older than maxAge (in days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);
    where.lastAttemptAt = { lt: cutoffDate };
  }

  const result = await prisma.rarityClassificationQueue.updateMany({
    where,
    data: {
      status: 'pending',
      attempts: 0,
      lastError: null,
    },
  });

  return result.count;
}
