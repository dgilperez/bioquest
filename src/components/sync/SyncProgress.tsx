'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';

interface SyncProgress {
  status: 'idle' | 'syncing' | 'completed' | 'error';
  phase: 'fetching' | 'enriching' | 'storing' | 'calculating' | 'done';
  currentStep: number;
  totalSteps: number;
  message: string;
  observationsProcessed: number;
  observationsTotal: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

export function SyncProgress() {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollProgress = async () => {
      try {
        const res = await fetch('/api/sync/progress');
        const data = await res.json();

        setProgress(data);

        // Stop polling if sync is completed or errored
        if (data.status === 'completed' || data.status === 'error') {
          setIsPolling(false);

          // Hide the toast after showing the message
          if (data.status === 'completed') {
            // Hide success message after 3 seconds
            // Note: AutoSync component handles data refresh via router.refresh()
            setTimeout(() => setProgress(null), 3000);
          } else {
            // Error: hide after 5 seconds
            setTimeout(() => setProgress(null), 5000);
          }
        } else if (data.status === 'syncing') {
          setIsPolling(true);
        }
      } catch (error) {
        console.error('Failed to poll progress:', error);
      }
    };

    // Only poll when actively syncing
    if (isPolling) {
      interval = setInterval(pollProgress, 2000); // Poll every 2 seconds
      // Initial poll when polling starts
      pollProgress();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling]);

  // Trigger polling when sync starts
  useEffect(() => {
    const handleSyncStart = () => {
      setIsPolling(true);
    };

    window.addEventListener('sync-started', handleSyncStart);
    return () => window.removeEventListener('sync-started', handleSyncStart);
  }, []);

  if (!progress || progress.status === 'idle') {
    return null;
  }

  const percentage = progress.observationsTotal > 0
    ? Math.round((progress.observationsProcessed / progress.observationsTotal) * 100)
    : (progress.currentStep / progress.totalSteps) * 100;

  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const phaseLabels = {
    fetching: 'Fetching from iNaturalist',
    enriching: 'Classifying Rarity',
    storing: 'Saving to Database',
    calculating: 'Calculating Stats',
    done: 'Complete',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-card p-4 shadow-lg">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          {progress.status === 'syncing' && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          {progress.status === 'completed' && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {progress.status === 'error' && (
            <XCircle className="h-5 w-5 text-destructive" />
          )}
          <h3 className="font-semibold">
            {progress.status === 'syncing' && 'Syncing Observations...'}
            {progress.status === 'completed' && 'Sync Complete!'}
            {progress.status === 'error' && 'Sync Failed'}
          </h3>
        </div>

        {/* Progress Bar */}
        {progress.status === 'syncing' && (
          <>
            <Progress value={percentage} className="h-2" />

            {/* Stats */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {progress.observationsProcessed} / {progress.observationsTotal} observations
              </span>
              <span>{percentage}%</span>
            </div>

            {/* Current Phase */}
            <div className="text-sm">
              <div className="font-medium">{phaseLabels[progress.phase]}</div>
              <div className="text-muted-foreground">{progress.message}</div>
            </div>

            {/* Time Estimate */}
            {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 5 && (
              <div className="text-sm text-muted-foreground">
                Est. {formatTime(progress.estimatedTimeRemaining)} remaining
              </div>
            )}
          </>
        )}

        {/* Completion Message */}
        {progress.status === 'completed' && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Processed {progress.observationsTotal} observations successfully
            </div>
            <Link
              href="/profile/how-xp-works"
              className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Sparkles className="h-4 w-4" />
              Check your dashboard to see XP earned!
            </Link>
          </div>
        )}

        {/* Error Message */}
        {progress.status === 'error' && (
          <div className="text-sm text-destructive">
            {progress.error || 'An error occurred during sync'}
          </div>
        )}
      </div>
    </div>
  );
}
