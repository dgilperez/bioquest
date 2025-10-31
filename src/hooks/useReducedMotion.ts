'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * Respects the prefers-reduced-motion media query
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Get transition settings based on reduced motion preference
 * Returns significantly reduced durations and disabled repeating animations
 */
export function getTransition(
  normalTransition: any,
  reducedMotion: boolean
): any {
  if (!reducedMotion) {
    return normalTransition;
  }

  // For reduced motion: instant or very quick transitions
  return {
    ...normalTransition,
    duration: 0.01, // Nearly instant
    repeat: 0, // No repeating animations
    delay: 0, // No delays
  };
}

/**
 * Get animation variants based on reduced motion preference
 * Returns static states when reduced motion is enabled
 */
export function getAnimationProps(
  normalProps: any,
  reducedMotion: boolean
): any {
  if (!reducedMotion) {
    return normalProps;
  }

  // For reduced motion: remove animations, just show final state
  return {
    initial: normalProps.animate || {},
    animate: normalProps.animate || {},
    transition: { duration: 0 },
  };
}
