'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface AsyncBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Combined ErrorBoundary + Suspense wrapper for async components
 */
export function AsyncBoundary({
  children,
  fallback,
  errorFallback,
  loadingFallback,
}: AsyncBoundaryProps) {
  const defaultLoadingFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600"></div>
    </div>
  );

  return (
    <ErrorBoundary fallback={errorFallback || fallback}>
      <Suspense fallback={loadingFallback || defaultLoadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
