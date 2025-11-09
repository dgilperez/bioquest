'use client';

import { motion } from 'framer-motion';

interface DiamondShapeIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Uncommon Rarity Diamond Shape (🔷)
 * Features: gentle pulse, blue shimmer, simple elegance
 */
export function DiamondShapeIcon({ size = 16, className = '', animate = true }: DiamondShapeIconProps) {
  const pulseVariants = {
    idle: {
      scale: [1, 1.08, 1],
      opacity: [1, 0.9, 1],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as any;

  const glowVariants = {
    idle: {
      opacity: [0.2, 0.35, 0.2],
      scale: [1, 1.1, 1],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  } as any;

  const shineVariants = {
    idle: {
      opacity: [0, 0.5, 0],
      x: [-10, 10],
      transition: {
        duration: 3,
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
      whileHover={{ scale: 1.15, rotate: 45 }}
      whileTap={{ scale: 0.9 }}
    >
      <defs>
        <linearGradient id="diamond-shape-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <radialGradient id="diamond-shape-glow">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer glow */}
      {animate && (
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          fill="url(#diamond-shape-glow)"
          variants={glowVariants}
          animate="idle"
        />
      )}

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={pulseVariants}
      >
        {/* Main diamond shape (rotated square) */}
        <path
          d="M12 4 L20 12 L12 20 L4 12 Z"
          fill="url(#diamond-shape-gradient)"
          stroke="#fff"
          strokeWidth="0.5"
        />

        {/* Top facet */}
        <path
          d="M12 4 L16 12 L12 12 L8 12 Z"
          fill="#dbeafe"
          opacity="0.4"
        />

        {/* Left facet */}
        <path
          d="M4 12 L12 12 L12 20 Z"
          fill="#60a5fa"
          opacity="0.3"
        />

        {/* Right facet */}
        <path
          d="M20 12 L12 12 L12 20 Z"
          fill="#3b82f6"
          opacity="0.4"
        />

        {/* Center highlight */}
        <ellipse
          cx="12"
          cy="10"
          rx="2.5"
          ry="3"
          fill="#fff"
          opacity="0.5"
        />
      </motion.g>

      {/* Shine effect */}
      {animate && (
        <motion.line
          x1="8"
          y1="8"
          x2="16"
          y2="16"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
          variants={shineVariants}
          animate="idle"
        />
      )}
    </motion.svg>
  );
}
