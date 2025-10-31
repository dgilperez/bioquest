'use client';

import { motion } from 'framer-motion';

interface ReptiliaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Gecko climbing with adhesive toe pads
 * Features: climbing pose, toe pads, dewlap, tail, skin texture
 * Famous for their wall-climbing abilities and regenerating tails
 */
export function ReptiliaIcon({ size = 32, className = '', animate = true }: ReptiliaIconProps) {
  const climbingWaveVariants = {
    idle: {
      y: [0, -3, 0, -2, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const legStepVariants = (delay: number) => ({
    idle: {
      y: [0, -2, 0],
      transition: {
        duration: 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  const toePadPulseVariants = (delay: number) => ({
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

  const eyeBlinkVariants = {
    idle: {
      scaleY: [1, 0.1, 1, 1, 1, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const tailSwayVariants = {
    idle: {
      rotate: [0, -8, 0, 8, 0],
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
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shadow on "wall" */}
      <ellipse
        cx="42"
        cy="72"
        rx="18"
        ry="3"
        fill="#2A3A2E"
        opacity="0.25"
      />

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={climbingWaveVariants}
      >
        {/* ===== TAIL (regenerating, prehensile) ===== */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={tailSwayVariants}
          style={{ transformOrigin: '38px 52px' }}
        >
          {/* Tail base */}
          <path
            d="M 38 52 Q 32 58, 28 64 Q 25 68, 24 72"
            stroke="#8B9D5A"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Tail pattern/texture */}
          <path
            d="M 38 52 Q 32 58, 28 64 Q 25 68, 24 72"
            stroke="#6A7D3A"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />

          {/* Tail segments */}
          <circle cx="36" cy="54" r="2" fill="#6A7D3A" opacity="0.5" />
          <circle cx="33" cy="59" r="2" fill="#6A7D3A" opacity="0.5" />
          <circle cx="30" cy="64" r="2" fill="#6A7D3A" opacity="0.5" />
          <circle cx="27" cy="68" r="2" fill="#6A7D3A" opacity="0.5" />
        </motion.g>

        {/* ===== REAR LEFT LEG ===== */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legStepVariants(0.3)}
        >
          {/* Thigh - extends sideways */}
          <path
            d="M 32 46 L 20 48"
            stroke="#7A8D4A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Shin - bends down */}
          <path
            d="M 20 48 L 14 56"
            stroke="#7A8D4A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Foot with splayed toes */}
          <motion.g
            animate={animate ? 'idle' : undefined}
            variants={toePadPulseVariants(0.3)}
            style={{ transformOrigin: '14px 56px' }}
          >
            <line x1="14" y1="56" x2="10" y2="54" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="56" x2="10" y2="58" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="56" x2="11" y2="60" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="56" x2="14" y2="62" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            {/* Toe pads (lamellae) */}
            <circle cx="10" cy="54" r="2" fill="#9AAD6A" />
            <circle cx="10" cy="58" r="2" fill="#9AAD6A" />
            <circle cx="11" cy="60" r="2" fill="#9AAD6A" />
            <circle cx="14" cy="62" r="2" fill="#9AAD6A" />
          </motion.g>
        </motion.g>

        {/* ===== REAR RIGHT LEG ===== */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legStepVariants(0.9)}
        >
          {/* Thigh - extends sideways */}
          <path
            d="M 48 46 L 60 48"
            stroke="#7A8D4A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Shin - bends down */}
          <path
            d="M 60 48 L 66 56"
            stroke="#7A8D4A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <motion.g
            animate={animate ? 'idle' : undefined}
            variants={toePadPulseVariants(0.9)}
            style={{ transformOrigin: '66px 56px' }}
          >
            <line x1="66" y1="56" x2="70" y2="54" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="66" y1="56" x2="70" y2="58" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="66" y1="56" x2="69" y2="60" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="66" y1="56" x2="66" y2="62" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="70" cy="54" r="2" fill="#9AAD6A" />
            <circle cx="70" cy="58" r="2" fill="#9AAD6A" />
            <circle cx="69" cy="60" r="2" fill="#9AAD6A" />
            <circle cx="66" cy="62" r="2" fill="#9AAD6A" />
          </motion.g>
        </motion.g>

        {/* ===== BODY ===== */}
        {/* Main body */}
        <ellipse
          cx="40"
          cy="42"
          rx="12"
          ry="8"
          fill="#8B9D5A"
        />

        {/* Body texture/pattern */}
        <ellipse
          cx="40"
          cy="41"
          rx="10"
          ry="6"
          fill="#9AAD6A"
          opacity="0.6"
        />

        {/* Skin texture spots */}
        <circle cx="36" cy="40" r="1.5" fill="#6A7D3A" opacity="0.5" />
        <circle cx="44" cy="40" r="1.5" fill="#6A7D3A" opacity="0.5" />
        <circle cx="40" cy="44" r="1.5" fill="#6A7D3A" opacity="0.5" />

        {/* ===== FRONT LEFT LEG ===== */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legStepVariants(0)}
        >
          {/* Thigh - extends sideways */}
          <path
            d="M 32 38 L 20 36"
            stroke="#7A8D4A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Shin - bends forward/up */}
          <path
            d="M 20 36 L 14 28"
            stroke="#7A8D4A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <motion.g
            animate={animate ? 'idle' : undefined}
            variants={toePadPulseVariants(0)}
            style={{ transformOrigin: '14px 28px' }}
          >
            <line x1="14" y1="28" x2="10" y2="26" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="28" x2="10" y2="30" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="28" x2="11" y2="32" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="14" y1="28" x2="14" y2="34" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="10" cy="26" r="2" fill="#9AAD6A" />
            <circle cx="10" cy="30" r="2" fill="#9AAD6A" />
            <circle cx="11" cy="32" r="2" fill="#9AAD6A" />
            <circle cx="14" cy="34" r="2" fill="#9AAD6A" />
          </motion.g>
        </motion.g>

        {/* ===== FRONT RIGHT LEG ===== */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legStepVariants(0.6)}
        >
          {/* Thigh - extends sideways */}
          <path
            d="M 48 38 L 60 36"
            stroke="#7A8D4A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Shin - bends forward/up */}
          <path
            d="M 60 36 L 66 28"
            stroke="#7A8D4A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <motion.g
            animate={animate ? 'idle' : undefined}
            variants={toePadPulseVariants(0.6)}
            style={{ transformOrigin: '66px 28px' }}
          >
            <line x1="66" y1="28" x2="70" y2="26" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="66" y1="28" x2="70" y2="30" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="66" y1="28" x2="69" y2="32" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="66" y1="28" x2="66" y2="34" stroke="#7A8D4A" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="70" cy="26" r="2" fill="#9AAD6A" />
            <circle cx="70" cy="30" r="2" fill="#9AAD6A" />
            <circle cx="69" cy="32" r="2" fill="#9AAD6A" />
            <circle cx="66" cy="34" r="2" fill="#9AAD6A" />
          </motion.g>
        </motion.g>

        {/* ===== HEAD ===== */}
        {/* Head shape */}
        <ellipse
          cx="40"
          cy="36"
          rx="8"
          ry="6"
          fill="#8B9D5A"
        />

        {/* Head top highlight */}
        <ellipse
          cx="40"
          cy="35"
          rx="6"
          ry="4"
          fill="#9AAD6A"
          opacity="0.6"
        />

        {/* ===== EYES (large, can move independently) ===== */}
        <motion.ellipse
          cx="37"
          cy="35"
          rx="3"
          ry="3.5"
          fill="#3A4A2A"
          animate={animate ? 'idle' : undefined}
          variants={eyeBlinkVariants}
        />
        <motion.ellipse
          cx="43"
          cy="35"
          rx="3"
          ry="3.5"
          fill="#3A4A2A"
          animate={animate ? 'idle' : undefined}
          variants={eyeBlinkVariants}
        />

        {/* Eye highlights */}
        <circle cx="37.5" cy="34" r="1" fill="#FFFFFF" opacity="0.7" />
        <circle cx="43.5" cy="34" r="1" fill="#FFFFFF" opacity="0.7" />

        {/* Pupils (vertical slits) */}
        <rect x="36.5" y="34" width="1" height="2" fill="#1A1A1A" rx="0.5" />
        <rect x="42.5" y="34" width="1" height="2" fill="#1A1A1A" rx="0.5" />

        {/* Nostrils */}
        <circle cx="38" cy="37" r="0.8" fill="#3A4A2A" />
        <circle cx="42" cy="37" r="0.8" fill="#3A4A2A" />

        {/* Mouth line */}
        <path
          d="M 36 38 Q 40 39, 44 38"
          stroke="#3A4A2A"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
        />

        {/* Dewlap hint (throat fan - subtle) */}
        <path
          d="M 38 39 Q 40 40, 42 39"
          stroke="#7A8D4A"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      </motion.g>

      {/* Gradient definitions */}
      <defs>
        <radialGradient id="geckoGradient">
          <stop offset="0%" stopColor="#9AAD6A" />
          <stop offset="100%" stopColor="#7A8D4A" />
        </radialGradient>
      </defs>
    </motion.svg>
  );
}
