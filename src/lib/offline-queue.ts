/**
 * Offline Queue Manager
 * Handles queuing of actions when offline and syncing when back online
 */

export interface QueuedAction {
  id: string;
  type: 'sync_observations' | 'update_observation' | 'mark_observation';
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'bioquest_offline_queue';
const MAX_RETRIES = 3;

/**
 * Add an action to the offline queue
 */
export function queueAction(type: QueuedAction['type'], payload: any): void {
  const queue = getQueue();
  const action: QueuedAction = {
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
    retries: 0,
  };

  queue.push(action);
  saveQueue(queue);

  // Try to register background sync if available
  if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
    navigator.serviceWorker.ready.then((registration: any) => {
      return registration.sync.register('sync-observations');
    }).catch((err: Error) => {
      console.error('Background sync registration failed:', err);
    });
  }
}

/**
 * Get all queued actions
 */
export function getQueue(): QueuedAction[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(QUEUE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse offline queue:', e);
    return [];
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(queue: QueuedAction[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Remove an action from the queue
 */
export function removeFromQueue(actionId: string): void {
  const queue = getQueue().filter(action => action.id !== actionId);
  saveQueue(queue);
}

/**
 * Process the queue - attempt to execute all pending actions
 */
export async function processQueue(): Promise<{
  succeeded: number;
  failed: number;
  errors: Array<{ action: QueuedAction; error: Error }>;
}> {
  const queue = getQueue();
  const results = {
    succeeded: 0,
    failed: 0,
    errors: [] as Array<{ action: QueuedAction; error: Error }>,
  };

  if (queue.length === 0) {
    return results;
  }

  // Process actions sequentially to maintain order
  for (const action of queue) {
    try {
      await executeAction(action);
      removeFromQueue(action.id);
      results.succeeded++;
    } catch (error) {
      console.error(`Failed to execute action ${action.id}:`, error);

      // Increment retry count
      action.retries++;

      if (action.retries >= MAX_RETRIES) {
        // Remove failed action after max retries
        removeFromQueue(action.id);
        results.failed++;
        results.errors.push({
          action,
          error: error as Error,
        });
      } else {
        // Update action with incremented retry count
        const updatedQueue = getQueue().map(a =>
          a.id === action.id ? action : a
        );
        saveQueue(updatedQueue);
        results.failed++;
      }
    }
  }

  return results;
}

/**
 * Execute a single queued action
 */
async function executeAction(action: QueuedAction): Promise<void> {
  switch (action.type) {
    case 'sync_observations':
      console.log('Executing sync_observations action with payload:', action.payload);
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload),
      }).then(res => {
        if (!res.ok) {
          console.error('Sync failed with status:', res.status, res.statusText);
          throw new Error(`Sync failed: ${res.statusText}`);
        }
        return res;
      });
      break;

    case 'update_observation':
      await fetch(`/api/observations/${action.payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload.data),
      }).then(res => {
        if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
        return res;
      });
      break;

    case 'mark_observation':
      await fetch(`/api/observations/${action.payload.id}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload.data),
      }).then(res => {
        if (!res.ok) throw new Error(`Mark failed: ${res.statusText}`);
        return res;
      });
      break;

    default:
      throw new Error(`Unknown action type: ${(action as any).type}`);
  }
}

/**
 * Get the count of pending actions
 */
export function getQueueCount(): number {
  return getQueue().length;
}

/**
 * Clear all queued actions (use with caution)
 */
export function clearQueue(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
}
