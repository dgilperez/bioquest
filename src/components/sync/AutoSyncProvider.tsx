'use client';

import { useState } from 'react';
import { useSyncWithIndicator } from '@/hooks/useSyncWithIndicator';
import { SyncIndicator } from './SyncIndicator';

export function AutoSyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);

  // Run auto-sync on mount with indicator
  useSyncWithIndicator(setIsSyncing);

  return (
    <>
      <SyncIndicator isVisible={isSyncing} />
      {children}
    </>
  );
}
