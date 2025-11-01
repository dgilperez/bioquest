'use client';

import { motion } from 'framer-motion';

interface AvesIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Simple blue tit in profile
 * Features: blue cap, yellow body, head tilt, wing flutter
 */
export function AvesIcon({ size = 32, className = '', animate = true }: AvesIconProps) {
  const bobVariants = {
    idle: {
      y: [0, -2, 0, -1, 0],
      rotate: [-2, 2, -2, 1, -2],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const wingFlutterVariants = (delay: number) => ({
    idle: {
      scaleY: animate ? [1, 0.9, 1] : 1,
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
      viewBox="0 0 80 80"
      className={className}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shadow */}
      <ellipse
        cx="40"
        cy="72"
        rx="15"
        ry="3"
        fill="#2A3A2E"
        opacity="0.2"
      />

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={bobVariants}
        style={{ transformOrigin: '40px 45px' }}
      >
        {/* ===== TAIL ===== */}
        <motion.ellipse
          cx="28"
          cy="55"
          rx="4"
          ry="10"
          fill="#3A5AAA"
          transform="rotate(-20 28 55)"
          animate={animate ? {
            rotate: [-20, -25, -20],
          } : undefined}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: '28px 55px' }}
        />

        {/* ===== BODY ===== */}
        {/* Body shadow */}
        <ellipse
          cx="40"
          cy="48"
          rx="13"
          ry="15"
          fill="#4A5A3A"
          opacity="0.3"
        />
        {/* Body base - yellow-green */}
        <ellipse
          cx="40"
          cy="47"
          rx="12"
          ry="14"
          fill="#B8C848"
        />
        {/* Belly - bright yellow */}
        <ellipse
          cx="40"
          cy="48"
          rx="9"
          ry="10"
          fill="#E8E858"
          opacity="0.9"
        />

        {/* ===== LEFT WING (far side) ===== */}
        <motion.ellipse
          cx="36"
          cy="45"
          rx="6"
          ry="12"
          fill="#4A7ACC"
          opacity="0.7"
          transform="rotate(15 36 45)"
          animate={animate ? 'idle' : undefined}
          variants={wingFlutterVariants(0)}
          style={{ transformOrigin: '36px 45px' }}
        />

        {/* ===== RIGHT WING (near side) ===== */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={wingFlutterVariants(0.1)}
          style={{ transformOrigin: '44px 45px' }}
        >
          <ellipse
            cx="44"
            cy="45"
            rx="6"
            ry="12"
            fill="#4A7ACC"
            transform="rotate(-15 44 45)"
          />
          {/* Wing bar - white stripe */}
          <ellipse
            cx="44"
            cy="44"
            rx="3"
            ry="4"
            fill="#FFFFFF"
            opacity="0.8"
            transform="rotate(-15 44 44)"
          />
        </motion.g>

        {/* ===== HEAD ===== */}
        <g id="head">
          {/* Head shadow */}
          <circle
            cx="48"
            cy="36"
            r="9"
            fill="#2A4A8A"
            opacity="0.3"
          />
          {/* Head base */}
          <circle
            cx="48"
            cy="35"
            r="8"
            fill="#E8E8D8"
          />

          {/* Blue cap */}
          <ellipse
            cx="48"
            cy="32"
            rx="7"
            ry="5"
            fill="#3A6ACC"
          />
          <ellipse
            cx="48"
            cy="31"
            rx="5"
            ry="3"
            fill="#5A8AEE"
            opacity="0.6"
          />

          {/* White cheek */}
          <ellipse
            cx="50"
            cy="36"
            rx="4"
            ry="4.5"
            fill="#FFFFFF"
          />

          {/* Black eye stripe */}
          <path
            d="M 48 34 Q 50 35, 52 36"
            stroke="#2A2A1A"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Eye */}
          <circle cx="51" cy="35" r="1.5" fill="#2A1A0E" />
          <circle cx="50.8" cy="34.7" r="0.6" fill="#FFFFFF" opacity="0.9" />

          {/* Beak - side view */}
          <path
            d="M 54 36 L 58 36 L 56 37.5 Z"
            fill="#3A3A2A"
          />
          <path
            d="M 54 36 L 56 37.5 L 54 37.5 Z"
            fill="#2A2A1A"
          />

          {/* Black throat/bib */}
          <ellipse
            cx="48"
            cy="40"
            rx="4"
            ry="3"
            fill="#2A2A1A"
          />
        </g>

        {/* ===== LEGS ===== */}
        <g id="legs">
          {/* Left leg */}
          <line
            x1="36"
            y1="58"
            x2="36"
            y2="67"
            stroke="#5A4A3A"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Left foot */}
          <path
            d="M 33 67 L 36 67 L 38 67"
            stroke="#5A4A3A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Right leg */}
          <line
            x1="42"
            y1="58"
            x2="42"
            y2="67"
            stroke="#5A4A3A"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Right foot */}
          <path
            d="M 40 67 L 42 67 L 45 67"
            stroke="#5A4A3A"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </motion.g>
    </motion.svg>
  );
}
