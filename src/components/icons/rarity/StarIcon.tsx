'use client';

import { motion } from 'framer-motion';

interface StarIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Epic Rarity Star (🌟)
 * Features: pulsing glow, rotating star, golden shine
 */
export function StarIcon({ size = 16, className = '', animate = true }: StarIconProps) {
  const starRotateVariants = {
    idle: {
      rotate: [0, 360],
      scale: [1, 1.1, 1],
      transition: {
        rotate: {
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        },
        scale: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    },
  } as any;

  const glowVariants = {
    idle: {
      opacity: [0.3, 0.6, 0.3],
      scale: [1, 1.2, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as any;

  const shineVariants = {
    idle: {
      opacity: [0, 0.8, 0],
      x: [-20, 20],
      transition: {
        duration: 2.5,
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
      whileHover={{ scale: 1.2, rotate: 72 }}
      whileTap={{ scale: 0.9 }}
    >
      <defs>
        <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <radialGradient id="star-glow">
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
          fill="url(#star-glow)"
          variants={glowVariants}
          animate="idle"
        />
      )}

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={starRotateVariants}
      >
        {/* Main star - 5 pointed */}
        <path
          d="M12 2 L14.5 9 L22 9.5 L16 15 L18 22 L12 18 L6 22 L8 15 L2 9.5 L9.5 9 Z"
          fill="url(#star-gradient)"
          stroke="#fff"
          strokeWidth="0.5"
        />

        {/* Inner star highlight */}
        <path
          d="M12 5 L13.5 10 L18 10.5 L14 14 L15 19 L12 16 L9 19 L10 14 L6 10.5 L10.5 10 Z"
          fill="#fef3c7"
          opacity="0.6"
        />

        {/* Center highlight */}
        <circle
          cx="12"
          cy="12"
          r="2"
          fill="#fff"
          opacity="0.8"
        />
      </motion.g>

      {/* Animated shine effect */}
      {animate && (
        <motion.line
          x1="6"
          y1="6"
          x2="18"
          y2="18"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
          variants={shineVariants}
          animate="idle"
        />
      )}
    </motion.svg>
  );
}
