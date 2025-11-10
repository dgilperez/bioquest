/**
 * Background Classification Banner
 *
 * Shows progress of background rarity classification process.
 * Displays when observations/taxa are still being classified.
 */

'use client';

import { useClassificationStatus } from '@/hooks/useClassificationStatus';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackgroundClassificationBannerProps {
  /**
   * Show minimal version (just icon + text)
   * @default false
   */
  minimal?: boolean;
}

export function BackgroundClassificationBanner({ minimal = false }: BackgroundClassificationBannerProps) {
  const { status, isLoading } = useClassificationStatus({
    pollInterval: 5000,
    enabled: true,
  });

  // Don't show anything while loading initial status
  if (isLoading) {
    return null;
  }

  // Don't show if classification is complete
  if (!status || status.isComplete) {
    return null;
  }

  // Calculate progress
  const progress = status.percentComplete;
  const hasQueue = status.total > 0;
  const pendingCount = status.pending + status.processing;

  if (minimal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm border border-purple-200 dark:border-purple-800"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Classifying rarity...</span>
        {hasQueue && <span className="font-semibold">{progress}%</span>}
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-purple-950/20 p-4 shadow-sm"
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                Background Classification In Progress
              </h3>
              {hasQueue && (
                <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-semibold">{progress}%</span>
                </div>
              )}
            </div>

            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
              {hasQueue ? (
                <>
                  Classifying <span className="font-semibold">{pendingCount}</span> taxa for rarity status.
                  Stats will update automatically when complete.
                </>
              ) : (
                <>
                  Finalizing rarity classification for your observations.
                  This may take a few moments.
                </>
              )}
            </p>

            {/* Progress bar */}
            {hasQueue && (
              <div className="w-full bg-purple-200 dark:bg-purple-900/30 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            )}

            {/* Details */}
            {hasQueue && (
              <div className="mt-3 flex items-center gap-4 text-xs text-purple-600 dark:text-purple-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{status.completed} completed</span>
                </div>
                {status.failed > 0 && (
                  <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                    <span>• {status.failed} need retry</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
