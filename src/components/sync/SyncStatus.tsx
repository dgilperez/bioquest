'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { useEffect, useState } from 'react';

export function SyncStatus() {
  const { queueCount, isProcessing, tryProcessQueue, lastSyncResult } = useOfflineQueue();
  const [showNotification, setShowNotification] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show notification when queue count changes or sync completes
  useEffect(() => {
    if (queueCount > 0 || lastSyncResult) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [queueCount, lastSyncResult]);

  // Don't show anything if queue is empty and not processing
  if (queueCount === 0 && !isProcessing && !lastSyncResult) {
    return null;
  }

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed bottom-20 right-4 z-40 max-w-sm"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-nature-200 dark:border-nature-700 p-4">
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-2xl"
                >
                  ↻
                </motion.div>
                <div>
                  <p className="font-display font-semibold text-sm">
                    Syncing...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Processing {queueCount} pending {queueCount === 1 ? 'action' : 'actions'}
                  </p>
                </div>
              </div>
            ) : lastSyncResult && lastSyncResult.timestamp > Date.now() - 5000 ? (
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {lastSyncResult.failed === 0 ? '✓' : '⚠'}
                </div>
                <div>
                  <p className="font-display font-semibold text-sm">
                    Sync Complete
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lastSyncResult.succeeded} succeeded
                    {lastSyncResult.failed > 0 && `, ${lastSyncResult.failed} failed`}
                  </p>
                </div>
              </div>
            ) : queueCount > 0 ? (
              <div className="flex items-center gap-3">
                <div className="text-2xl">⚡</div>
                <div className="flex-1">
                  <p className="font-display font-semibold text-sm">
                    {queueCount} Pending {queueCount === 1 ? 'Action' : 'Actions'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isOnline
                      ? 'Will sync when possible'
                      : "Will sync when you're back online"}
                  </p>
                </div>
                {isOnline && (
                  <button
                    onClick={tryProcessQueue}
                    className="px-3 py-1 text-xs bg-nature-600 hover:bg-nature-700 text-white rounded font-display font-semibold transition-colors"
                  >
                    Sync Now
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
