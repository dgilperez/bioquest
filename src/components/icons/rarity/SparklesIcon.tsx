'use client';

import { motion } from 'framer-motion';

interface SparklesIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Legendary Rarity Sparkles (✨)
 * Features: twinkling stars, golden shimmer, cascading sparkles
 */
export function SparklesIcon({ size = 16, className = '', animate = true }: SparklesIconProps) {
  const sparkleVariants = (delay: number, scale: number) => ({
    idle: {
      scale: [0, scale, 0],
      opacity: [0, 1, 0],
      rotate: [0, 180, 360],
      transition: {
        duration: 1.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  const glowVariants = {
    idle: {
      opacity: [0.2, 0.5, 0.2],
      scale: [1, 1.3, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as any;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      whileHover={{ scale: 1.2, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
    >
      <defs>
        <radialGradient id="sparkle-glow">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer glow */}
      {animate && (
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          fill="url(#sparkle-glow)"
          variants={glowVariants}
          animate="idle"
        />
      )}

      {/* Large central sparkle */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={sparkleVariants(0, 1) as any}
      >
        <path
          d="M12 2 L13 11 L22 12 L13 13 L12 22 L11 13 L2 12 L11 11 Z"
          fill="#fbbf24"
          stroke="#fff"
          strokeWidth="0.5"
        />
        <path
          d="M12 5 L12.5 10.5 L18 11 L12.5 11.5 L12 17 L11.5 11.5 L6 11 L11.5 10.5 Z"
          fill="#fef3c7"
          opacity="0.8"
        />
      </motion.g>

      {/* Top right sparkle */}
      {animate && (
        <motion.g variants={sparkleVariants(0.3, 0.6) as any} animate="idle">
          <path
            d="M18 4 L18.5 7 L21 7.5 L18.5 8 L18 11 L17.5 8 L15 7.5 L17.5 7 Z"
            fill="#fbbf24"
            stroke="#fff"
            strokeWidth="0.3"
          />
        </motion.g>
      )}

      {/* Bottom left sparkle */}
      {animate && (
        <motion.g variants={sparkleVariants(0.6, 0.5) as any} animate="idle">
          <path
            d="M6 16 L6.5 18 L8 18.5 L6.5 19 L6 21 L5.5 19 L4 18.5 L5.5 18 Z"
            fill="#fbbf24"
            stroke="#fff"
            strokeWidth="0.3"
          />
        </motion.g>
      )}

      {/* Top left small sparkle */}
      {animate && (
        <motion.g variants={sparkleVariants(0.9, 0.4) as any} animate="idle">
          <path
            d="M5 6 L5.3 7 L6 7.3 L5.3 7.6 L5 9 L4.7 7.6 L4 7.3 L4.7 7 Z"
            fill="#fef3c7"
            opacity="0.8"
          />
        </motion.g>
      )}

      {/* Bottom right small sparkle */}
      {animate && (
        <motion.g variants={sparkleVariants(1.2, 0.4) as any} animate="idle">
          <path
            d="M19 17 L19.3 18 L20 18.3 L19.3 18.6 L19 20 L18.7 18.6 L18 18.3 L18.7 18 Z"
            fill="#fef3c7"
            opacity="0.8"
          />
        </motion.g>
      )}
    </motion.svg>
  );
}
