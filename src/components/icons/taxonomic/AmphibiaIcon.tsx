'use client';

import { motion } from 'framer-motion';

interface AmphibiaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Frog - representing amphibians
 * Features: throat pulsing, eye blinking, leg hopping motion
 * Based on Twemoji frog emoji (CC-BY 4.0)
 */
export function AmphibiaIcon({ size = 32, className = '', animate = true }: AmphibiaIconProps) {
  const hopVariants = {
    idle: {
      y: [0, -4, 0, -2, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const throatPulseVariants = {
    idle: {
      scaleY: [1, 1.15, 1, 1.08, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const blinkVariants = {
    idle: {
      scaleY: [1, 0.2, 1, 1, 1, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const nostrilTwitchVariants = (delay: number) => ({
    idle: {
      scale: [1, 1.2, 1],
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
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={className}
      whileTap={{ scale: 0.85, y: -5 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shadow */}
      <ellipse
        cx="18"
        cy="34"
        rx="14"
        ry="2"
        fill="#2A3A2E"
        opacity="0.3"
      />

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={hopVariants as any}
      >
        {/* Main body - lower half */}
        <path
          fill="#C6E5B3"
          d="M36 22c0 7.456-8.059 12-18 12S0 29.456 0 22 8.059 7 18 7s18 7.544 18 15z"
        />

        {/* Upper body/head - darker green */}
        <motion.path
          fill="#77B255"
          d="M31.755 12.676C33.123 11.576 34 9.891 34 8c0-3.313-2.687-6-6-6-2.861 0-5.25 2.004-5.851 4.685-1.288-.483-2.683-.758-4.149-.758-1.465 0-2.861.275-4.149.758C13.25 4.004 10.861 2 8 2 4.687 2 2 4.687 2 8c0 1.891.877 3.576 2.245 4.676C1.6 15.356 0 18.685 0 22c0 7.456 8.059 1 18 1s18 6.456 18-1c0-3.315-1.6-6.644-4.245-9.324z"
          animate={animate ? 'idle' : undefined}
          variants={throatPulseVariants as any}
          style={{ transformOrigin: '18px 15px' }}
        />

        {/* Left eye white */}
        <circle fill="#FFF" cx="7.5" cy="7.5" r="3.5" />

        {/* Left pupil */}
        <motion.circle
          fill="#292F33"
          cx="7.5"
          cy="7.5"
          r="1.5"
          animate={animate ? 'idle' : undefined}
          variants={blinkVariants as any}
        />

        {/* Right eye white */}
        <circle fill="#FFF" cx="28.5" cy="7.5" r="3.5" />

        {/* Right pupil */}
        <motion.circle
          fill="#292F33"
          cx="28.5"
          cy="7.5"
          r="1.5"
          animate={animate ? 'idle' : undefined}
          variants={blinkVariants as any}
        />

        {/* Left nostril */}
        <motion.circle
          fill="#5C913B"
          cx="14"
          cy="20"
          r="1"
          animate={animate ? 'idle' : undefined}
          variants={nostrilTwitchVariants(0) as any}
        />

        {/* Right nostril */}
        <motion.circle
          fill="#5C913B"
          cx="22"
          cy="20"
          r="1"
          animate={animate ? 'idle' : undefined}
          variants={nostrilTwitchVariants(0.3) as any}
        />
      </motion.g>
    </motion.svg>
  );
}
