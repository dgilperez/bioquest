'use client';

import { motion } from 'framer-motion';

interface CircleIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Common Rarity Circle (⚪)
 * Features: subtle pulse, simple clean design
 */
export function CircleIcon({ size = 16, className = '', animate = true }: CircleIconProps) {
  const pulseVariants = {
    idle: {
      scale: [1, 1.05, 1],
      opacity: [0.9, 1, 0.9],
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
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <defs>
        <radialGradient id="circle-gradient">
          <stop offset="0%" stopColor="#f9fafb" />
          <stop offset="70%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#d1d5db" />
        </radialGradient>
      </defs>

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={pulseVariants}
      >
        {/* Main circle */}
        <circle
          cx="12"
          cy="12"
          r="8"
          fill="url(#circle-gradient)"
          stroke="#9ca3af"
          strokeWidth="0.5"
        />

        {/* Highlight */}
        <ellipse
          cx="10"
          cy="10"
          rx="3"
          ry="4"
          fill="#fff"
          opacity="0.5"
        />
      </motion.g>
    </motion.svg>
  );
}
