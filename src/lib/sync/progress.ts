/**
 * Sync Progress Tracking
 *
 * Manages progress state for long-running sync operations.
 * Now persisted in database to survive page reloads.
 */

import { prisma } from '@/lib/db/prisma';
import { MessageRotator } from './messages';

// Global message rotators per user (in-memory, resets on server restart)
const messageRotators = new Map<string, MessageRotator>();

function getMessageRotator(userId: string): MessageRotator {
  if (!messageRotators.has(userId)) {
    messageRotators.set(userId, new MessageRotator(7000)); // Rotate every 7 seconds
  }
  return messageRotators.get(userId)!;
}

export interface SyncProgress {
  userId: string;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  phase: 'fetching' | 'enriching' | 'storing' | 'calculating' | 'done';
  currentStep: number;
  totalSteps: number;
  message: string;
  funnyMessage?: string; // Rotating naturalist humor message
  observationsProcessed: number;
  observationsTotal: number;
  estimatedTimeRemaining?: number; // seconds
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  lastObservationDate?: Date | null;
}

export async function initProgress(userId: string, totalObservations: number): Promise<void> {
  // ATOMIC check-and-lock: Use raw SQL with WHERE clause to prevent race conditions
  // This will only update if status is NOT 'syncing', otherwise it throws
  try {
    const result = await prisma.$executeRaw`
      UPDATE sync_progress
      SET
        status = 'syncing',
        phase = 'fetching',
        currentStep = 0,
        totalSteps = 4,
        message = 'Starting sync...',
        observationsProcessed = 0,
        observationsTotal = ${totalObservations},
        error = NULL,
        completedAt = NULL,
        startedAt = ${new Date()},
        updatedAt = ${new Date()}
      WHERE userId = ${userId}
        AND (status IS NULL OR status != 'syncing')
    `;

    // If no rows updated, either record doesn't exist or sync is already in progress
    if (result === 0) {
      // Try to create a new record
      try {
        await prisma.syncProgress.create({
          data: {
            userId,
            status: 'syncing',
            phase: 'fetching',
            currentStep: 0,
            totalSteps: 4,
            message: 'Starting sync...',
            observationsProcessed: 0,
            observationsTotal: totalObservations,
            startedAt: new Date(),
          },
        });
      } catch (error) {
        // Unique constraint violation - sync already in progress
        throw new Error('Sync already in progress for this user');
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Sync already in progress')) {
      throw error;
    }
    // Some other error - rethrow
    throw error;
  }
}

export async function updateProgress(
  userId: string,
  updates: Partial<Omit<SyncProgress, 'userId'>>
): Promise<void> {
  const current = await prisma.syncProgress.findUnique({ where: { userId } });
  if (!current) return;

  // Calculate estimated time remaining
  let estimatedTimeRemaining = updates.estimatedTimeRemaining;
  if (!estimatedTimeRemaining && current.observationsProcessed > 0) {
    const elapsed = Date.now() - current.startedAt.getTime();
    const processed = updates.observationsProcessed ?? current.observationsProcessed;
    if (processed > 0) {
      const rate = processed / (elapsed / 1000);
      const remaining = current.observationsTotal - processed;
      estimatedTimeRemaining = Math.round(remaining / rate);
    }
  }

  await prisma.syncProgress.update({
    where: { userId },
    data: {
      ...updates,
      estimatedTimeRemaining,
    },
  });
}

export async function getProgress(userId: string): Promise<SyncProgress | null> {
  const progress = await prisma.syncProgress.findUnique({ where: { userId } });
  if (!progress) return null;

  // Get rotating funny message (only during active sync)
  const funnyMessage = progress.status === 'syncing'
    ? getMessageRotator(userId).getMessage()
    : undefined;

  return {
    userId: progress.userId,
    status: progress.status as any,
    phase: progress.phase as any,
    currentStep: progress.currentStep,
    totalSteps: progress.totalSteps,
    message: progress.message,
    funnyMessage,
    observationsProcessed: progress.observationsProcessed,
    observationsTotal: progress.observationsTotal,
    estimatedTimeRemaining: progress.estimatedTimeRemaining ?? undefined,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt ?? undefined,
    error: progress.error ?? undefined,
    lastObservationDate: progress.lastObservationDate,
  };
}

export async function completeProgress(userId: string): Promise<void> {
  const current = await prisma.syncProgress.findUnique({ where: { userId } });
  if (!current) return;

  await prisma.syncProgress.update({
    where: { userId },
    data: {
      status: 'completed',
      phase: 'done',
      currentStep: current.totalSteps,
      message: 'Sync completed successfully!',
      observationsProcessed: current.observationsTotal,
      completedAt: new Date(),
    },
  });

  // Clean up after 5 minutes (optional, can keep for history)
  setTimeout(async () => {
    await prisma.syncProgress.delete({ where: { userId } }).catch(() => {});
  }, 5 * 60 * 1000);
}

export async function errorProgress(userId: string, error: string): Promise<void> {
  await prisma.syncProgress.updateMany({
    where: { userId },
    data: {
      status: 'error',
      message: 'Sync failed',
      error,
      completedAt: new Date(),
    },
  });
}

export async function clearProgress(userId: string): Promise<void> {
  await prisma.syncProgress.delete({ where: { userId } }).catch(() => {});
  // Clean up message rotator
  messageRotators.delete(userId);
}
