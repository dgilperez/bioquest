'use client';

import { useEffect } from 'react';
import { setupDevTools } from '@/lib/debug/animation-error-reporter';

/**
 * Provider component that initializes development tools
 * Only active in development mode
 */
export function DevToolsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupDevTools();
  }, []);

  return <>{children}</>;
}
