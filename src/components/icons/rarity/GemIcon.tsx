'use client';

import { motion } from 'framer-motion';

interface GemIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Rare Rarity Gem (💠)
 * Features: rotating facets, purple shimmer, subtle sparkle
 */
export function GemIcon({ size = 16, className = '', animate = true }: GemIconProps) {
  const gemRotateVariants = {
    idle: {
      rotate: [0, 360],
      scale: [1, 1.05, 1],
      transition: {
        rotate: {
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        },
        scale: {
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    },
  };

  const glowVariants = {
    idle: {
      opacity: [0.2, 0.4, 0.2],
      scale: [1, 1.15, 1],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const sparkleVariants = (delay: number) => ({
    idle: {
      scale: [0, 1, 0],
      opacity: [0, 0.8, 0],
      transition: {
        duration: 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      whileHover={{ scale: 1.2, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
    >
      <defs>
        <linearGradient id="gem-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <radialGradient id="gem-glow">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer glow */}
      {animate && (
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          fill="url(#gem-glow)"
          variants={glowVariants}
          animate="idle"
        />
      )}

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={gemRotateVariants}
      >
        {/* Hexagonal gem shape */}
        <path
          d="M12 3 L18 7 L18 17 L12 21 L6 17 L6 7 Z"
          fill="url(#gem-gradient)"
          stroke="#fff"
          strokeWidth="0.5"
        />

        {/* Top facet */}
        <path
          d="M12 3 L15 6 L12 9 L9 6 Z"
          fill="#e9d5ff"
          opacity="0.5"
        />

        {/* Upper left facet */}
        <path
          d="M6 7 L9 6 L12 9 L12 12 Z"
          fill="#c084fc"
          opacity="0.4"
        />

        {/* Upper right facet */}
        <path
          d="M18 7 L15 6 L12 9 L12 12 Z"
          fill="#a855f7"
          opacity="0.5"
        />

        {/* Lower left facet */}
        <path
          d="M6 17 L9 18 L12 15 L12 12 Z"
          fill="#9333ea"
          opacity="0.4"
        />

        {/* Lower right facet */}
        <path
          d="M18 17 L15 18 L12 15 L12 12 Z"
          fill="#a855f7"
          opacity="0.3"
        />

        {/* Bottom facet */}
        <path
          d="M12 21 L15 18 L12 15 L9 18 Z"
          fill="#7e22ce"
          opacity="0.5"
        />

        {/* Center highlight */}
        <ellipse
          cx="12"
          cy="10"
          rx="2"
          ry="2.5"
          fill="#fff"
          opacity="0.6"
        />
      </motion.g>

      {/* Sparkles */}
      {animate && (
        <>
          <motion.circle
            cx="5"
            cy="10"
            r="1"
            fill="#fff"
            variants={sparkleVariants(0)}
            animate="idle"
          />
          <motion.circle
            cx="19"
            cy="14"
            r="1"
            fill="#fff"
            variants={sparkleVariants(0.8)}
            animate="idle"
          />
        </>
      )}
    </motion.svg>
  );
}
