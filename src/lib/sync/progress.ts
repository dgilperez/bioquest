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

// Track cleanup timers to prevent memory leaks
const progressCleanupTimers = new Map<string, NodeJS.Timeout>();

// Throttle progress updates to prevent SQLite lock contention
const progressUpdateTimers = new Map<string, NodeJS.Timeout>();
const pendingUpdates = new Map<string, Partial<Omit<SyncProgress, 'userId'>>>();
const PROGRESS_UPDATE_THROTTLE_MS = 500; // Max one update per 500ms

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
  // Allow update if:
  // 1. Status is NOT 'syncing' (normal case), OR
  // 2. Status IS 'syncing' BUT it's stale (started > 10 min ago = server crash/restart)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

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
        AND (
          status IS NULL
          OR status != 'syncing'
          OR (status = 'syncing' AND startedAt < ${tenMinutesAgo})
        )
    `;

    // If no rows updated, either record doesn't exist or sync is already in progress (and NOT stale)
    if (result === 0) {
      // Check if sync is already in progress before creating
      const existing = await prisma.syncProgress.findUnique({ where: { userId } });

      if (existing && existing.status === 'syncing') {
        // Check if it's stale (shouldn't happen since we check in WHERE clause, but defensive)
        const isStale = existing.startedAt && existing.startedAt < tenMinutesAgo;

        if (isStale) {
          // Stale sync - force reset (shouldn't reach here due to WHERE clause, but handle it)
          console.log(`⚠️ Stale sync detected for ${userId}, resetting...`);
          await prisma.syncProgress.update({
            where: { userId },
            data: {
              status: 'syncing',
              phase: 'fetching',
              currentStep: 0,
              totalSteps: 4,
              message: 'Starting sync...',
              observationsProcessed: 0,
              observationsTotal: totalObservations,
              error: null,
              completedAt: null,
              startedAt: new Date(),
            },
          });
          return;
        }

        // Active sync in progress - this is OK, just return silently
        console.log(`⚠️ Sync already in progress for ${userId}, skipping initProgress`);
        return;
      }

      // No record exists, create a new one
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
        // Race condition: another process created the record between our check and create
        // This is OK, the other sync will proceed
        console.log(`⚠️ Race condition in initProgress for ${userId}, another sync started first`);
        return;
      }
    }
  } catch (error) {
    // Log but don't throw - sync can proceed even if progress tracking fails
    console.error('Error in initProgress:', error);
  }
}

/**
 * Flush pending updates to database immediately
 * Used internally by the throttle mechanism
 */
async function flushProgressUpdate(userId: string): Promise<void> {
  const updates = pendingUpdates.get(userId);
  if (!updates) return;

  // Clear pending updates before writing
  pendingUpdates.delete(userId);
  progressUpdateTimers.delete(userId);

  try {
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

    // Use updateMany to avoid race condition if record is deleted
    await prisma.syncProgress.updateMany({
      where: { userId },
      data: {
        ...updates,
        estimatedTimeRemaining,
      },
    });
  } catch (error: any) {
    // Gracefully handle SQLite timeout errors (P1008)
    // These are non-critical - sync can succeed even if progress updates fail
    if (error?.code === 'P1008') {
      console.warn(`[Progress] SQLite timeout for user ${userId}, skipping update (non-critical)`);
    } else {
      // Log other errors but don't throw - progress tracking is non-critical
      console.error('[Progress] Update failed:', error);
    }
  }
}

/**
 * Update sync progress (throttled to prevent database lock contention)
 *
 * Updates are batched and written at most once every 500ms to prevent
 * SQLite lock contention when many updates happen rapidly (e.g., during
 * rarity classification where we update for each taxon processed).
 */
export async function updateProgress(
  userId: string,
  updates: Partial<Omit<SyncProgress, 'userId'>>
): Promise<void> {
  // Merge with any pending updates
  const existing = pendingUpdates.get(userId) || {};
  pendingUpdates.set(userId, { ...existing, ...updates });

  // Clear any existing timer
  const existingTimer = progressUpdateTimers.get(userId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Schedule flush after throttle period
  const timer = setTimeout(async () => {
    await flushProgressUpdate(userId);
  }, PROGRESS_UPDATE_THROTTLE_MS);

  progressUpdateTimers.set(userId, timer);
}

export async function getProgress(userId: string): Promise<SyncProgress | null> {
  const progress = await prisma.syncProgress.findUnique({ where: { userId } });
  if (!progress) return null;

  // CRITICAL: Detect and auto-clear stale syncs (from server crashes/restarts)
  // If status is 'syncing' but sync started >10 minutes ago, it's stale
  if (progress.status === 'syncing' && progress.startedAt) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const isStale = progress.startedAt < tenMinutesAgo;

    if (isStale) {
      console.log(`⚠️ Detected stale sync in getProgress for ${userId} (started ${Math.round((Date.now() - progress.startedAt.getTime()) / 1000 / 60)} min ago), clearing...`);

      // Clear the stale sync record
      await prisma.syncProgress.delete({ where: { userId } }).catch(() => {});
      messageRotators.delete(userId);

      // Return idle state instead of stale sync
      return null;
    }
  }

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
  // Flush any pending progress updates before marking complete
  const updateTimer = progressUpdateTimers.get(userId);
  if (updateTimer) {
    clearTimeout(updateTimer);
    await flushProgressUpdate(userId);
  }

  const current = await prisma.syncProgress.findUnique({ where: { userId } });
  if (!current) return;

  // Clear any existing cleanup timer
  const existingTimer = progressCleanupTimers.get(userId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    progressCleanupTimers.delete(userId);
  }

  // Use updateMany to avoid race condition if record is deleted between check and update
  const result = await prisma.syncProgress.updateMany({
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

  // Only schedule cleanup if update succeeded
  // Defensive check: result might be undefined in edge cases (e.g., database issues)
  if (result && result.count > 0) {
    // Store timer reference so it can be cancelled
    const timer = setTimeout(async () => {
      await prisma.syncProgress.delete({ where: { userId } }).catch(() => {});
      progressCleanupTimers.delete(userId);
      messageRotators.delete(userId);
    }, 5 * 60 * 1000);

    progressCleanupTimers.set(userId, timer);
  }
}

export async function errorProgress(userId: string, error: string): Promise<void> {
  // Clear any existing cleanup timer
  const existingTimer = progressCleanupTimers.get(userId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    progressCleanupTimers.delete(userId);
  }

  await prisma.syncProgress.updateMany({
    where: { userId },
    data: {
      status: 'error',
      message: 'Sync failed',
      error,
      completedAt: new Date(),
    },
  });

  // Clean up message rotator
  messageRotators.delete(userId);
}

export async function clearProgress(userId: string): Promise<void> {
  // Clear any existing cleanup timer
  const existingTimer = progressCleanupTimers.get(userId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    progressCleanupTimers.delete(userId);
  }

  await prisma.syncProgress.delete({ where: { userId } }).catch(() => {});

  // Clean up message rotator
  messageRotators.delete(userId);
}
