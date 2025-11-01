'use client';

import React, { Component, ReactNode } from 'react';

interface AnimatedIconErrorBoundaryProps {
  children: ReactNode;
  iconName?: string;
  fallback?: ReactNode;
}

interface AnimatedIconErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for animated icon components
 * Catches Framer Motion SVG animation errors and provides detailed debugging info
 */
export class AnimatedIconErrorBoundary extends Component<
  AnimatedIconErrorBoundaryProps,
  AnimatedIconErrorBoundaryState
> {
  constructor(props: AnimatedIconErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AnimatedIconErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { iconName } = this.props;

    // Enhanced error logging for animation issues
    console.group(`=4 Animation Error in ${iconName || 'Icon'}`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.info('Component Stack:', errorInfo.componentStack);

    // Check for common Framer Motion SVG errors
    if (error.message.includes('attribute') && error.message.includes('undefined')) {
      console.warn('=¡ Common causes:');
      console.warn('  1. SVG geometric attributes (cx, cy, r, d) being animated without initial values');
      console.warn('  2. Missing initial={false} on motion elements with prop-based initial values');
      console.warn('  3. Variants missing "initial" state when using animate={animate ? "idle" : undefined}');
      console.warn(`  4. Check: src/components/icons/animated/${iconName}Icon.tsx`);
    }

    console.groupEnd();

    // Also log to help with debugging in production
    if (process.env.NODE_ENV === 'production') {
      // You could send this to an error tracking service like Sentry
      // logErrorToService({ error, errorInfo, iconName });
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback, iconName } = this.props;

      // Show fallback or a simple placeholder
      if (fallback) {
        return fallback;
      }

      // Default fallback: simple SVG placeholder
      return (
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          title={`Error loading ${iconName || 'icon'}`}
        >
          <circle cx="16" cy="16" r="15" stroke="#ff6b6b" strokeWidth="2" fill="none" />
          <text
            x="16"
            y="20"
            textAnchor="middle"
            fontSize="20"
            fill="#ff6b6b"
          >
            !
          </text>
        </svg>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to catch and report Framer Motion render errors
 * Use this in development to get better error messages
 */
export function useAnimationErrorReporting(componentName: string) {
  React.useEffect(() => {
    // Override console.error temporarily to catch Framer Motion errors
    const originalError = console.error;

    console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || '';

      // Check if this is a Framer Motion SVG error
      if (
        errorMessage.includes('attribute') &&
        (errorMessage.includes('Expected length') ||
         errorMessage.includes('Expected moveto') ||
         errorMessage.includes('undefined'))
      ) {
        console.group(`<¯ Framer Motion Error in ${componentName}`);
        originalError.apply(console, args);

        // Extract attribute name from error
        const attrMatch = errorMessage.match(/<(\w+)> attribute (\w+):/);
        if (attrMatch) {
          const [, element, attr] = attrMatch;
          console.warn(`\n=¡ Issue detected:`);
          console.warn(`   Element: <${element}>`);
          console.warn(`   Attribute: ${attr}`);
          console.warn(`   Problem: Value is "undefined"\n`);
          console.warn(`=Ë Quick fixes:`);

          if (attr === 'd') {
            console.warn(`   1. Add initial={false} to <motion.path>`);
            console.warn(`   2. Or add "initial" state to variants with proper d value`);
            console.warn(`   3. Ensure d prop is set before animation starts`);
          } else if (['cx', 'cy', 'r'].includes(attr)) {
            console.warn(`   1. Use CSS transforms (x, y, scale) instead of ${attr}`);
            console.warn(`   2. Or add initial={false} to preserve prop value`);
            console.warn(`   3. Set transformOrigin if using transforms`);
          }

          console.warn(`\n=Í File: src/components/icons/animated/${componentName}.tsx`);
        }

        console.groupEnd();
      } else {
        originalError.apply(console, args);
      }
    };

    return () => {
      console.error = originalError;
    };
  }, [componentName]);
}
