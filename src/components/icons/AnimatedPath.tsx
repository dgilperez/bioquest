'use client';

import { motion, Variants } from 'framer-motion';
import { SVGMotionProps } from 'framer-motion';

interface AnimatedPathProps extends Omit<SVGMotionProps<SVGPathElement>, 'variants' | 'animate'> {
  /**
   * Whether the animation should play. When false, the element appears in its static state.
   */
  animate?: boolean;

  /**
   * Framer Motion variants object, or a function that takes a delay and returns variants.
   */
  variants: Variants | ((delay: number) => Variants);

  /**
   * Delay in seconds before the animation starts (used when variants is a function).
   */
  delay?: number;

  /**
   * The animation state to animate to (defaults to 'idle').
   */
  animationState?: string;
}

/**
 * Wrapper for motion.path that safely handles SVG attribute animations.
 *
 * This component automatically sets initial={false} to prevent undefined attribute errors
 * when animating SVG-specific attributes like `d`, `points`, `cx`, `cy`, etc.
 *
 * Why initial={false}?
 * - Framer Motion tries to interpolate from an initial state to the animated state
 * - For SVG attributes like `d`, if no initial value is provided, it becomes undefined
 * - Setting initial={false} tells Framer Motion to use the prop value directly without interpolation
 *
 * @example
 * ```tsx
 * // Simple usage with inline variants
 * <AnimatedPath
 *   d="M 0 0 L 100 100"
 *   stroke="black"
 *   strokeWidth={2}
 *   animate={true}
 *   variants={{
 *     idle: {
 *       pathLength: [0, 1],
 *       transition: { duration: 1 }
 *     }
 *   }}
 * />
 *
 * // Usage with variant factory function
 * const drawVariants = (delay: number) => ({
 *   idle: {
 *     pathLength: 1,
 *     opacity: 1,
 *     transition: { duration: 0.6, delay }
 *   }
 * });
 *
 * <AnimatedPath
 *   d="M 10 10 L 50 50"
 *   stroke="blue"
 *   animate={shouldAnimate}
 *   variants={drawVariants}
 *   delay={0.2}
 * />
 * ```
 */
export function AnimatedPath({
  animate = true,
  variants,
  delay = 0,
  animationState = 'idle',
  ...pathProps
}: AnimatedPathProps) {
  const resolvedVariants = typeof variants === 'function' ? variants(delay) : variants;

  return (
    <motion.path
      {...pathProps}
      initial={false}
      animate={animate ? animationState : undefined}
      variants={resolvedVariants}
    />
  );
}
