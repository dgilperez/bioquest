'use client';

import { motion } from 'framer-motion';

interface MolluscaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Detailed nautilus icon in profile view
 * Features: chambered shell cross-section, multiple tentacles, swimming motion
 * Shows the iconic spiral structure with visible internal chambers
 */
export function MolluscaIcon({ size = 32, className = '', animate = true }: MolluscaIconProps) {
  const swimVariants = {
    idle: {
      y: [0, -3, 0, -1.5, 0],
      x: [0, 1, 0, -1, 0],
      rotate: [-2, 2, -2, 1, -2],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const tentacleWaveVariants = (delay: number) => ({
    rotate: animate ? [-8, 8, -8] : 0,
    scaleY: animate ? [1, 1.08, 1] : 1,
    transition: {
      duration: 1.8,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  });

  const chamberGlowVariants = (delay: number) => ({
    opacity: animate ? [0.15, 0.3, 0.15] : 0.15,
    transition: {
      duration: 2.5,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  });

  const eyeShineVariants = {
    idle: {
      opacity: [0.8, 0.4, 0.8],
      scale: [1, 0.9, 1],
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
      whileTap={{ scale: 0.9, rotate: -5 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shadow */}
      <ellipse
        cx="40"
        cy="74"
        rx="22"
        ry="3"
        fill="#2A3A4E"
        opacity="0.2"
      />

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={swimVariants}
        style={{ transformOrigin: '40px 40px' }}
      >
        {/* ===== SHELL PROFILE ===== */}
        {/* Outermost shell layer - shadow */}
        <path
          d="M 48 62
             C 48 62, 70 55, 74 38
             C 78 20, 68 10, 52 8
             C 36 6, 22 14, 18 28
             C 14 42, 22 56, 38 60
             L 48 62 Z"
          fill="#7B6B5A"
          opacity="0.3"
        />

        {/* Outer shell wall */}
        <path
          d="M 48 60
             C 48 60, 68 54, 72 38
             C 76 22, 66 12, 52 10
             C 38 8, 24 16, 20 30
             C 16 44, 24 54, 38 58
             L 48 60 Z"
          fill="#A89878"
          stroke="#8B7A6A"
          strokeWidth="1.5"
        />

        {/* Shell mid-tone layer */}
        <path
          d="M 48 60
             C 48 60, 68 54, 72 38
             C 76 22, 66 12, 52 10
             C 38 8, 24 16, 20 30
             C 16 44, 24 54, 38 58
             L 48 60 Z"
          fill="#C8B8A8"
          opacity="0.5"
        />

        {/* ===== INTERNAL CHAMBERS (visible in cross-section) ===== */}
        {/* Chamber 1 - largest, most recent */}
        <motion.path
          d="M 48 60 L 42 52 C 38 50, 30 48, 26 42 C 22 36, 22 32, 24 28 L 20 30 C 16 44, 24 54, 38 58 Z"
          fill="#E8D8C8"
          stroke="#A89878"
          strokeWidth="1"
          animate={chamberGlowVariants(0)}
        />

        {/* Chamber 2 */}
        <motion.path
          d="M 42 52 L 38 44 C 34 40, 30 36, 28 32 L 24 28 C 22 32, 22 36, 26 42 C 30 48, 38 50, 42 52 Z"
          fill="#D8C8B8"
          stroke="#A89878"
          strokeWidth="0.9"
          animate={chamberGlowVariants(0.3)}
        />

        {/* Chamber 3 */}
        <motion.path
          d="M 38 44 L 36 38 C 34 34, 32 30, 32 28 L 28 32 C 30 36, 34 40, 38 44 Z"
          fill="#C8B8A8"
          stroke="#A89878"
          strokeWidth="0.8"
          animate={chamberGlowVariants(0.6)}
        />

        {/* Chamber 4 */}
        <motion.path
          d="M 36 38 L 36 34 C 36 32, 36 30, 38 28 L 32 28 C 32 30, 34 34, 36 38 Z"
          fill="#B8A898"
          stroke="#A89878"
          strokeWidth="0.7"
          animate={chamberGlowVariants(0.9)}
        />

        {/* Chamber 5 - smallest, oldest */}
        <motion.path
          d="M 36 34 L 38 32 C 40 30, 42 28, 44 26 L 38 28 C 36 30, 36 32, 36 34 Z"
          fill="#A89888"
          stroke="#A89878"
          strokeWidth="0.6"
          animate={chamberGlowVariants(1.2)}
        />

        {/* Chamber septa (walls between chambers) - darker lines */}
        <path d="M 42 52 L 48 60" stroke="#7B6B5A" strokeWidth="1.2" opacity="0.6" />
        <path d="M 38 44 L 42 52" stroke="#7B6B5A" strokeWidth="1.1" opacity="0.6" />
        <path d="M 36 38 L 38 44" stroke="#7B6B5A" strokeWidth="1" opacity="0.6" />
        <path d="M 36 34 L 36 38" stroke="#7B6B5A" strokeWidth="0.9" opacity="0.6" />
        <path d="M 38 32 L 36 34" stroke="#7B6B5A" strokeWidth="0.8" opacity="0.6" />

        {/* Siphuncle (tube running through chambers) */}
        <path
          d="M 48 60 Q 42 50, 40 42 Q 38 34, 40 28"
          stroke="#8B7A6A"
          strokeWidth="1.2"
          fill="none"
          opacity="0.4"
        />

        {/* Shell growth lines (ribbing) */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
          const t = i / 9;
          const startX = 48 + (52 - 48) * t;
          const startY = 60 + (10 - 60) * t;
          const endX = 48 + (72 - 48) * t;
          const endY = 60 + (38 - 60) * t;

          return (
            <path
              key={`growth-${i}`}
              d={`M ${startX} ${startY} Q ${(startX + endX) / 2 + 2} ${(startY + endY) / 2}, ${endX} ${endY}`}
              stroke="#9B8A7A"
              strokeWidth="0.5"
              fill="none"
              opacity="0.3"
            />
          );
        })}

        {/* Shell highlights */}
        <ellipse
          cx="56"
          cy="30"
          rx="10"
          ry="12"
          fill="#FFFFFF"
          opacity="0.15"
        />
        <ellipse
          cx="54"
          cy="28"
          rx="6"
          ry="7"
          fill="#FFFFFF"
          opacity="0.1"
        />

        {/* Shell texture spots */}
        {[
          { cx: 50, cy: 20, r: 0.8 },
          { cx: 60, cy: 32, r: 1 },
          { cx: 48, cy: 42, r: 0.9 },
          { cx: 64, cy: 44, r: 0.7 },
        ].map((spot, i) => (
          <circle
            key={`spot-${i}`}
            cx={spot.cx}
            cy={spot.cy}
            r={spot.r}
            fill="#8B7A6A"
            opacity="0.3"
          />
        ))}

        {/* ===== BODY/HEAD ===== */}
        {/* Body shadow */}
        <ellipse
          cx="28"
          cy="58"
          rx="14"
          ry="10"
          fill="#A68978"
          opacity="0.3"
        />

        {/* Body base - mantle */}
        <ellipse
          cx="28"
          cy="56"
          rx="13"
          ry="9"
          fill="#C8A898"
        />

        {/* Body highlight */}
        <ellipse
          cx="27"
          cy="55"
          rx="10"
          ry="7"
          fill="#D8B8A8"
          opacity="0.6"
        />

        {/* Hood opening */}
        <ellipse
          cx="24"
          cy="56"
          rx="5"
          ry="6"
          fill="#A68978"
          opacity="0.4"
        />

        {/* ===== EYE ===== */}
        <g id="eye">
          {/* Eye base */}
          <circle
            cx="28"
            cy="52"
            r="3.5"
            fill="#F5E8D0"
          />
          {/* Eye outline */}
          <circle
            cx="28"
            cy="52"
            r="3.5"
            fill="none"
            stroke="#8B7A6A"
            strokeWidth="0.6"
          />
          {/* Pupil */}
          <circle
            cx="28"
            cy="52"
            r="2"
            fill="#2A1A0E"
          />
          {/* Eye shine */}
          <motion.circle
            cx="27"
            cy="51"
            r="1"
            fill="#FFFFFF"
            animate={animate ? 'idle' : undefined}
            variants={eyeShineVariants}
          />
        </g>

        {/* ===== TENTACLES (emerging from hood) ===== */}
        {/* Tentacle 1 - Top */}
        <motion.g
          animate={tentacleWaveVariants(0)}
          style={{ transformOrigin: '20px 52px' }}
        >
          <path
            d="M 20 52 Q 14 50, 10 48 Q 8 47, 6 46"
            stroke="#C8A898"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 52 Q 14 50, 10 48 Q 8 47, 6 46"
            stroke="#D8B8A8"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </motion.g>

        {/* Tentacle 2 - Upper middle */}
        <motion.g
          animate={tentacleWaveVariants(0.2)}
          style={{ transformOrigin: '20px 54px' }}
        >
          <path
            d="M 20 54 Q 14 53, 9 52 Q 7 52, 5 51"
            stroke="#C8A898"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 54 Q 14 53, 9 52 Q 7 52, 5 51"
            stroke="#D8B8A8"
            strokeWidth="1.7"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </motion.g>

        {/* Tentacle 3 - Center */}
        <motion.g
          animate={tentacleWaveVariants(0.4)}
          style={{ transformOrigin: '20px 56px' }}
        >
          <path
            d="M 20 56 Q 13 56, 8 56 Q 6 56, 4 56"
            stroke="#C8A898"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 56 Q 13 56, 8 56 Q 6 56, 4 56"
            stroke="#D8B8A8"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </motion.g>

        {/* Tentacle 4 - Lower middle */}
        <motion.g
          animate={tentacleWaveVariants(0.6)}
          style={{ transformOrigin: '20px 58px' }}
        >
          <path
            d="M 20 58 Q 14 59, 9 60 Q 7 60, 5 61"
            stroke="#C8A898"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 58 Q 14 59, 9 60 Q 7 60, 5 61"
            stroke="#D8B8A8"
            strokeWidth="1.7"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </motion.g>

        {/* Tentacle 5 - Bottom */}
        <motion.g
          animate={tentacleWaveVariants(0.8)}
          style={{ transformOrigin: '20px 60px' }}
        >
          <path
            d="M 20 60 Q 14 62, 10 64 Q 8 65, 6 66"
            stroke="#C8A898"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 20 60 Q 14 62, 10 64 Q 8 65, 6 66"
            stroke="#D8B8A8"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />
        </motion.g>

        {/* Connection between body and shell */}
        <path
          d="M 38 58 Q 35 57, 32 56"
          stroke="#B89888"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </motion.g>
    </motion.svg>
  );
}
