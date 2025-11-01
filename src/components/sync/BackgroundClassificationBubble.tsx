'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface QueueStatus {
  userId: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  percentComplete: number;
}

export function BackgroundClassificationBubble() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll queue status every 10 seconds
  const { data: status, refetch } = useQuery<QueueStatus>({
    queryKey: ['rarity-queue-status'],
    queryFn: async () => {
      const res = await fetch('/api/rarity-queue/status');
      if (!res.ok) {
        throw new Error('Failed to fetch queue status');
      }
      return res.json();
    },
    refetchInterval: 10000, // Poll every 10s
    enabled: !isDismissed, // Don't poll if dismissed
  });

  // Manual queue processing
  const handleProcessQueue = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/rarity-queue/process?batchSize=50', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to process queue');
      }
      // Refetch status immediately
      await refetch();
    } catch (error) {
      console.error('Error processing queue:', error);
      alert('Failed to process queue. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-dismiss when all complete
  useEffect(() => {
    if (status && status.pending === 0 && status.processing === 0 && status.total > 0) {
      // Everything is done!
      const timer = setTimeout(() => setIsDismissed(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Don't show if no items in queue or dismissed
  if (!status || (status.pending === 0 && status.processing === 0) || isDismissed) {
    return null;
  }

  const remainingCount = status.pending + status.processing;
  const classifiedCount = status.completed;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-6 right-6 z-50"
      >
        {/* Compact Bubble (collapsed) */}
        {!isExpanded && (
          <motion.button
            onClick={() => setIsExpanded(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 bg-gradient-to-r from-nature-600 to-nature-700 text-white rounded-full px-6 py-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <div className="text-left">
              <div className="text-sm font-semibold">Classifying species...</div>
              <div className="text-xs opacity-90">
                {classifiedCount}/{status.total} complete ({status.percentComplete}%)
              </div>
            </div>
            <ChevronUp className="w-4 h-4 opacity-70" />
          </motion.button>
        )}

        {/* Expanded Panel */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-80 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-nature-600 to-nature-700 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Background Classification</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-nature-600 dark:text-nature-400">
                    {status.percentComplete}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-nature-500 to-nature-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${status.percentComplete}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Completed</div>
                  <div className="text-xl font-bold text-nature-600 dark:text-nature-400">
                    {classifiedCount}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Remaining</div>
                  <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                    {remainingCount}
                  </div>
                </div>
              </div>

              {status.failed > 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                  {status.failed} species couldn't be classified (will retry later)
                </div>
              )}

              {/* Info Text */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Species rarity is being classified in the background. You can continue using the app.
              </p>

              {/* Process Queue Button */}
              {remainingCount > 0 && (
                <button
                  onClick={handleProcessQueue}
                  disabled={isProcessing}
                  className="w-full bg-nature-600 hover:bg-nature-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Process Now (50 species)
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
