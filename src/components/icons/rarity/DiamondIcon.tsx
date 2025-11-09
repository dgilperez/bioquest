'use client';

import { motion } from 'framer-motion';

interface DiamondIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Mythic Rarity Diamond (💎)
 * Features: rotating sparkles, rainbow shimmer, pulsing glow
 */
export function DiamondIcon({ size = 16, className = '', animate = true }: DiamondIconProps) {
  const gemRotateVariants = {
    idle: {
      rotate: [0, 5, -5, 0],
      scale: [1, 1.05, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as any;

  const sparkleVariants = (delay: number) => ({
    idle: {
      scale: [0, 1.2, 0],
      opacity: [0, 1, 0],
      transition: {
        duration: 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as any);

  const glowVariants = {
    idle: {
      opacity: [0.3, 0.7, 0.3],
      scale: [1, 1.2, 1],
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
      whileHover={{ scale: 1.2, rotate: 180 }}
      whileTap={{ scale: 0.9 }}
    >
      <defs>
        <linearGradient id="diamond-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="33%" stopColor="#a855f7" />
          <stop offset="66%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <radialGradient id="diamond-glow">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer glow */}
      {animate && (
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          fill="url(#diamond-glow)"
          variants={glowVariants}
          animate="idle"
        />
      )}

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={gemRotateVariants}
      >
        {/* Main diamond shape */}
        <path
          d="M12 2 L18 8 L12 22 L6 8 Z"
          fill="url(#diamond-gradient)"
          stroke="#fff"
          strokeWidth="0.5"
        />

        {/* Top facet */}
        <path
          d="M12 2 L15 6 L12 10 L9 6 Z"
          fill="#fdf4ff"
          opacity="0.4"
        />

        {/* Left facet */}
        <path
          d="M6 8 L9 6 L12 10 L12 22 Z"
          fill="#e879f9"
          opacity="0.3"
        />

        {/* Right facet */}
        <path
          d="M18 8 L15 6 L12 10 L12 22 Z"
          fill="#a855f7"
          opacity="0.4"
        />

        {/* Center highlight */}
        <ellipse
          cx="12"
          cy="8"
          rx="2"
          ry="3"
          fill="#fff"
          opacity="0.6"
        />
      </motion.g>

      {/* Sparkles */}
      {animate && (
        <>
          <motion.g variants={sparkleVariants(0) as any} animate="idle">
            <path
              d="M4 6 L4.5 7 L5 6 L4.5 5 Z"
              fill="#fff"
            />
          </motion.g>
          <motion.g variants={sparkleVariants(0.7) as any} animate="idle">
            <path
              d="M19 4 L19.5 5 L20 4 L19.5 3 Z"
              fill="#fff"
            />
          </motion.g>
          <motion.g variants={sparkleVariants(1.4) as any} animate="idle">
            <path
              d="M20 16 L20.5 17 L21 16 L20.5 15 Z"
              fill="#fff"
            />
          </motion.g>
        </>
      )}
    </motion.svg>
  );
}
