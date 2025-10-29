/**
 * Sync Progress Tracking
 *
 * Manages progress state for long-running sync operations
 */

export interface SyncProgress {
  userId: string;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  phase: 'fetching' | 'enriching' | 'storing' | 'calculating' | 'done';
  currentStep: number;
  totalSteps: number;
  message: string;
  observationsProcessed: number;
  observationsTotal: number;
  estimatedTimeRemaining?: number; // seconds
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// In-memory progress store (in production, use Redis or similar)
const progressStore = new Map<string, SyncProgress>();

export function initProgress(userId: string, totalObservations: number): void {
  progressStore.set(userId, {
    userId,
    status: 'syncing',
    phase: 'fetching',
    currentStep: 0,
    totalSteps: 4, // fetching, enriching, storing, calculating
    message: 'Starting sync...',
    observationsProcessed: 0,
    observationsTotal: totalObservations,
    startedAt: new Date(),
  });
}

export function updateProgress(
  userId: string,
  updates: Partial<Omit<SyncProgress, 'userId'>>
): void {
  const current = progressStore.get(userId);
  if (!current) return;

  const updated = { ...current, ...updates };

  // Calculate estimated time remaining
  if (updated.startedAt && updated.observationsProcessed > 0) {
    const elapsed = Date.now() - updated.startedAt.getTime();
    const rate = updated.observationsProcessed / (elapsed / 1000); // obs per second
    const remaining = updated.observationsTotal - updated.observationsProcessed;
    updated.estimatedTimeRemaining = remaining / rate;
  }

  progressStore.set(userId, updated);
}

export function getProgress(userId: string): SyncProgress | null {
  return progressStore.get(userId) || null;
}

export function completeProgress(userId: string): void {
  const current = progressStore.get(userId);
  if (!current) return;

  progressStore.set(userId, {
    ...current,
    status: 'completed',
    phase: 'done',
    currentStep: current.totalSteps,
    message: 'Sync completed successfully!',
    observationsProcessed: current.observationsTotal,
    completedAt: new Date(),
  });

  // Clean up after 5 minutes
  setTimeout(() => {
    progressStore.delete(userId);
  }, 5 * 60 * 1000);
}

export function errorProgress(userId: string, error: string): void {
  const current = progressStore.get(userId);
  if (!current) return;

  progressStore.set(userId, {
    ...current,
    status: 'error',
    message: 'Sync failed',
    error,
    completedAt: new Date(),
  });
}

export function clearProgress(userId: string): void {
  progressStore.delete(userId);
}
