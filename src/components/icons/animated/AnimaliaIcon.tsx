'use client';

import { motion } from 'framer-motion';

interface AnimaliaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Bear icon in profile
 * Features: lumbering walk, head bob, massive build
 * Represents Animalia with an iconic mammal
 */
export function AnimaliaIcon({ size = 32, className = '', animate = true }: AnimaliaIconProps) {
  const lumberVariants = {
    idle: {
      x: [0, 0.5, 0, -0.5, 0],
      y: [0, -0.5, 0, -0.3, 0],
      rotate: [-0.5, 0.5, -0.5],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const legWalkVariants = (delay: number, direction: 1 | -1) => ({
    rotate: animate ? [0, 10 * direction, 0, -8 * direction, 0] : 0,
    transition: {
      duration: 2.5,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  });

  const headBobVariants = {
    idle: {
      y: [0, -1, 0, -0.5, 0],
      rotate: [-1, 1, -1],
      transition: {
        duration: 2.5,
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
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shadow */}
      <ellipse
        cx="40"
        cy="73"
        rx="28"
        ry="3"
        fill="#2A3A2E"
        opacity="0.2"
      />

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={lumberVariants}
        style={{ transformOrigin: '40px 46px' }}
      >
        {/* ===== BODY (massive) ===== */}
        {/* Body shadow */}
        <ellipse
          cx="44"
          cy="46"
          rx="18"
          ry="14"
          fill="#3A2A1E"
          opacity="0.3"
        />
        {/* Body base */}
        <ellipse
          cx="44"
          cy="44"
          rx="17"
          ry="13"
          fill="#5B4A3A"
        />
        {/* Body highlight */}
        <ellipse
          cx="43"
          cy="42"
          rx="15"
          ry="11"
          fill="#6B5A4A"
          opacity="0.6"
        />
        {/* Belly */}
        <ellipse
          cx="42"
          cy="46"
          rx="13"
          ry="9"
          fill="#7B6A5A"
          opacity="0.5"
        />

        {/* Hump (shoulder) */}
        <ellipse
          cx="50"
          cy="38"
          rx="8"
          ry="6"
          fill="#5B4A3A"
        />
        <ellipse
          cx="49"
          cy="37"
          rx="6"
          ry="4"
          fill="#6B5A4A"
          opacity="0.7"
        />

        {/* ===== HEAD ===== */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={headBobVariants}
          style={{ transformOrigin: '26px 36px' }}
        >
          {/* Head shadow */}
          <ellipse
            cx="26"
            cy="37"
            rx="11"
            ry="10"
            fill="#3A2A1E"
            opacity="0.3"
          />
          {/* Head base */}
          <ellipse
            cx="26"
            cy="36"
            rx="10.5"
            ry="9.5"
            fill="#5B4A3A"
          />
          {/* Head highlight */}
          <ellipse
            cx="25"
            cy="35"
            rx="9"
            ry="8"
            fill="#6B5A4A"
            opacity="0.6"
          />

          {/* Snout/muzzle */}
          <ellipse
            cx="19"
            cy="37"
            rx="5"
            ry="4.5"
            fill="#6B5A4A"
          />
          <ellipse
            cx="18.5"
            cy="36.5"
            rx="4"
            ry="3.5"
            fill="#7B6A5A"
            opacity="0.7"
          />

          {/* Nose */}
          <ellipse
            cx="16"
            cy="37"
            rx="2.5"
            ry="2"
            fill="#2A1A0E"
          />
          <ellipse
            cx="15.5"
            cy="36.5"
            rx="1"
            ry="0.8"
            fill="#FFFFFF"
            opacity="0.4"
          />

          {/* Eye */}
          <circle
            cx="26"
            cy="33"
            r="2"
            fill="#2A1A0E"
          />
          <circle
            cx="25.5"
            cy="32.5"
            r="0.8"
            fill="#FFFFFF"
            opacity="0.6"
          />

          {/* Ear - round */}
          <g>
            <circle
              cx="28"
              cy="28"
              r="4"
              fill="#5B4A3A"
            />
            <circle
              cx="28"
              cy="28"
              r="2.5"
              fill="#6B5A4A"
              opacity="0.6"
            />
          </g>
        </motion.g>

        {/* Short stubby tail */}
        <ellipse
          cx="62"
          cy="42"
          rx="3"
          ry="2.5"
          fill="#5B4A3A"
        />
        <ellipse
          cx="61.5"
          cy="41.5"
          rx="2"
          ry="1.8"
          fill="#6B5A4A"
          opacity="0.6"
        />

        {/* ===== LEGS (thick and sturdy) ===== */}
        {/* Front left leg (far) */}
        <motion.g
          animate={legWalkVariants(0, 1)}
          style={{ transformOrigin: '32px 52px' }}
        >
          <rect
            x="29"
            y="52"
            width="6"
            height="16"
            rx="3"
            fill="#4B3A2A"
          />
          <rect
            x="29.5"
            y="52"
            width="4"
            height="16"
            fill="#5B4A3A"
            opacity="0.7"
          />
          {/* Paw */}
          <ellipse
            cx="32"
            cy="68"
            rx="4"
            ry="2.5"
            fill="#3A2A1E"
          />
          <ellipse
            cx="32"
            cy="67.5"
            rx="3"
            ry="1.8"
            fill="#4A3A2E"
            opacity="0.6"
          />
        </motion.g>

        {/* Front right leg (near) */}
        <motion.g
          animate={legWalkVariants(0.625, -1)}
          style={{ transformOrigin: '40px 52px' }}
        >
          <rect
            x="37"
            y="52"
            width="6"
            height="16"
            rx="3"
            fill="#5B4A3A"
          />
          <rect
            x="37.5"
            y="52"
            width="4"
            height="16"
            fill="#6B5A4A"
            opacity="0.7"
          />
          {/* Paw with pads */}
          <ellipse
            cx="40"
            cy="68"
            rx="4"
            ry="2.5"
            fill="#4A3A2E"
          />
          <ellipse
            cx="40"
            cy="67.5"
            rx="3"
            ry="1.8"
            fill="#5B4A3A"
            opacity="0.6"
          />
          {/* Paw pads */}
          <circle cx="39" cy="68" r="0.8" fill="#2A1A0E" opacity="0.5" />
          <circle cx="41" cy="68" r="0.8" fill="#2A1A0E" opacity="0.5" />
        </motion.g>

        {/* Back left leg (far) */}
        <motion.g
          animate={legWalkVariants(0.3125, -1)}
          style={{ transformOrigin: '50px 52px' }}
        >
          <rect
            x="47"
            y="52"
            width="6"
            height="16"
            rx="3"
            fill="#4B3A2A"
          />
          <rect
            x="47.5"
            y="52"
            width="4"
            height="16"
            fill="#5B4A3A"
            opacity="0.7"
          />
          {/* Paw */}
          <ellipse
            cx="50"
            cy="68"
            rx="4"
            ry="2.5"
            fill="#3A2A1E"
          />
          <ellipse
            cx="50"
            cy="67.5"
            rx="3"
            ry="1.8"
            fill="#4A3A2E"
            opacity="0.6"
          />
        </motion.g>

        {/* Back right leg (near) */}
        <motion.g
          animate={legWalkVariants(0.9375, 1)}
          style={{ transformOrigin: '58px 52px' }}
        >
          <rect
            x="55"
            y="52"
            width="6"
            height="16"
            rx="3"
            fill="#5B4A3A"
          />
          <rect
            x="55.5"
            y="52"
            width="4"
            height="16"
            fill="#6B5A4A"
            opacity="0.7"
          />
          {/* Paw with pads */}
          <ellipse
            cx="58"
            cy="68"
            rx="4"
            ry="2.5"
            fill="#4A3A2E"
          />
          <ellipse
            cx="58"
            cy="67.5"
            rx="3"
            ry="1.8"
            fill="#5B4A3A"
            opacity="0.6"
          />
          {/* Paw pads */}
          <circle cx="57" cy="68" r="0.8" fill="#2A1A0E" opacity="0.5" />
          <circle cx="59" cy="68" r="0.8" fill="#2A1A0E" opacity="0.5" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
