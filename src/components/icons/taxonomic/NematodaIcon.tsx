'use client';

import { motion } from 'framer-motion';

interface NematodaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Playful roundworm (nematode) with undulating movement
 * Features: cylindrical unsegmented body, tapered ends, sinusoidal movement
 * One of the most abundant animals on Earth!
 */
export function NematodaIcon({ size = 32, className = '', animate = true }: NematodaIconProps) {
  const wormWiggleVariants = {
    idle: {
      d: [
        // Starting S-curve
        'M 25 30 Q 35 25, 40 35 Q 45 45, 50 40 Q 55 35, 60 45',
        // Wiggle right
        'M 25 35 Q 35 30, 40 40 Q 45 50, 50 45 Q 55 40, 60 48',
        // Peak wiggle
        'M 25 40 Q 35 35, 40 45 Q 45 55, 50 50 Q 55 45, 60 52',
        // Wiggle left
        'M 25 35 Q 35 28, 40 38 Q 45 48, 50 43 Q 55 38, 60 47',
        // Return to start
        'M 25 30 Q 35 25, 40 35 Q 45 45, 50 40 Q 55 35, 60 45',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const segmentPulseVariants = (delay: number) => ({
    idle: {
      opacity: [0.3, 0.5, 0.3],
      transition: {
        duration: 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  const eyeWinkVariants = {
    idle: {
      scaleY: [1, 0.2, 1, 1, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      whileTap={{ scale: 0.9, rotate: -10 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shadow */}
      <ellipse
        cx="42"
        cy="72"
        rx="20"
        ry="3"
        fill="#2A3A2E"
        opacity="0.2"
      />

      {/* ===== WORM BODY ===== */}
      {/* Main body path with gradient */}
      <motion.path
        d="M 25 30 Q 35 25, 40 35 Q 45 45, 50 40 Q 55 35, 60 45"
        initial={false}
        animate={animate ? 'idle' : undefined}
        variants={wormWiggleVariants}
        stroke="url(#wormGradient)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />

      {/* Body outline (darker) */}
      <motion.path
        d="M 25 30 Q 35 25, 40 35 Q 45 45, 50 40 Q 55 35, 60 45"
        initial={false}
        animate={animate ? 'idle' : undefined}
        variants={wormWiggleVariants}
        stroke="#8B7355"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.3"
      />

      {/* Segment rings to show body texture */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={segmentPulseVariants(0)}
      >
        <ellipse
          cx="28"
          cy="32"
          rx="6"
          ry="8"
          fill="none"
          stroke="#6B5345"
          strokeWidth="1"
          opacity="0.4"
        />
      </motion.g>

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={segmentPulseVariants(0.3)}
      >
        <ellipse
          cx="38"
          cy="38"
          rx="6"
          ry="8"
          fill="none"
          stroke="#6B5345"
          strokeWidth="1"
          opacity="0.4"
        />
      </motion.g>

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={segmentPulseVariants(0.6)}
      >
        <ellipse
          cx="48"
          cy="44"
          rx="6"
          ry="8"
          fill="none"
          stroke="#6B5345"
          strokeWidth="1"
          opacity="0.4"
        />
      </motion.g>

      {/* ===== HEAD (anterior end) ===== */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            x: [-2, 0, -2],
            y: [-1, 1, -1],
            transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
        }}
      >
        {/* Head cap */}
        <circle
          cx="25"
          cy="30"
          r="7"
          fill="#A0826D"
        />

        {/* Mouth opening */}
        <circle
          cx="24"
          cy="30"
          r="2"
          fill="#6B5345"
        />

        {/* Simple eye spots */}
        <motion.circle
          cx="26"
          cy="28"
          r="1.5"
          fill="#2A1A1A"
          animate={animate ? 'idle' : undefined}
          variants={eyeWinkVariants}
        />

        {/* Sensory bristles */}
        <path
          d="M 23 27 L 20 25"
          stroke="#8B7355"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M 23 33 L 20 35"
          stroke="#8B7355"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </motion.g>

      {/* ===== TAIL (posterior end) ===== */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            x: [2, 0, 2],
            y: [1, -1, 1],
            transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
        }}
      >
        {/* Tail tip */}
        <ellipse
          cx="60"
          cy="45"
          rx="4"
          ry="5"
          fill="#A0826D"
        />

        {/* Tail point */}
        <path
          d="M 60 45 Q 62 45, 64 46"
          stroke="#8B7355"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>

      {/* Happy face decoration */}
      <motion.path
        d="M 23 31 Q 25 32, 27 31"
        stroke="#5A4A3A"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            x: [-2, 0, -2],
            y: [-1, 1, -1],
            transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
        }}
      />

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="wormGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C8A882" />
          <stop offset="50%" stopColor="#D4B896" />
          <stop offset="100%" stopColor="#B89968" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
