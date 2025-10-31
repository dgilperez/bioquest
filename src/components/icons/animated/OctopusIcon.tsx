'use client';

import { motion } from 'framer-motion';

interface OctopusIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Detailed octopus icon with waving tentacles
 * Features: 8 individually animated tentacles with suckers, pulsing mantle, expressive eyes
 */
export function OctopusIcon({ size = 32, className = '', animate = true }: OctopusIconProps) {
  const mantlePulseVariants = {
    idle: {
      scale: [1, 1.08, 1, 1.04, 1],
      rotate: [-1, 1, -1, 0.5, -1],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const tentacleWaveVariants = (delay: number, amplitude: number) => ({
    rotate: animate ? [-amplitude, amplitude, -amplitude] : 0,
    scaleY: animate ? [1, 1.1, 1] : 1,
    transition: {
      duration: 2,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  });

  const suckerPulseVariants = (delay: number) => ({
    scale: animate ? [1, 1.3, 1] : 1,
    opacity: animate ? [0.6, 0.8, 0.6] : 0.6,
    transition: {
      duration: 1.5,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  });

  const eyeBlinkVariants = {
    idle: {
      scaleY: [1, 0.1, 1, 1, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const skinTextureShimmer = (delay: number) => ({
    opacity: animate ? [0.3, 0.5, 0.3] : 0.3,
    transition: {
      duration: 2,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.15 }}
    >
      {/* Shadow */}
      <ellipse
        cx="40"
        cy="74"
        rx="28"
        ry="4"
        fill="#2A3A4E"
        opacity="0.25"
      />

      {/* ===== TENTACLES (8 total) ===== */}
      {/* Tentacle 1 - Front Left */}
      <motion.g
        animate={tentacleWaveVariants(0, 15)}
        style={{ transformOrigin: '32px 55px' }}
      >
        <path
          d="M 32 55 Q 24 58, 20 64 Q 18 68, 16 72"
          stroke="#C77D6B"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 32 55 Q 24 58, 20 64 Q 18 68, 16 72"
          stroke="#D89B8A"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* Suckers on tentacle 1 */}
        {[{ x: 26, y: 58 }, { x: 22, y: 62 }, { x: 19, y: 66 }, { x: 17, y: 70 }].map((sucker, i) => (
          <motion.circle
            key={`t1-sucker-${i}`}
            cx={sucker.x}
            cy={sucker.y}
            r="1.8"
            fill="#A65B4A"
            animate={suckerPulseVariants(i * 0.15)}
          />
        ))}
      </motion.g>

      {/* Tentacle 2 - Front Left-Center */}
      <motion.g
        animate={tentacleWaveVariants(0.2, 12)}
        style={{ transformOrigin: '35px 56px' }}
      >
        <path
          d="M 35 56 Q 30 60, 26 66 Q 24 70, 22 74"
          stroke="#C77D6B"
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 35 56 Q 30 60, 26 66 Q 24 70, 22 74"
          stroke="#D89B8A"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {[{ x: 32, y: 59 }, { x: 28, y: 64 }, { x: 25, y: 69 }].map((sucker, i) => (
          <motion.circle
            key={`t2-sucker-${i}`}
            cx={sucker.x}
            cy={sucker.y}
            r="1.6"
            fill="#A65B4A"
            animate={suckerPulseVariants(0.2 + i * 0.15)}
          />
        ))}
      </motion.g>

      {/* Tentacle 3 - Front Right-Center */}
      <motion.g
        animate={tentacleWaveVariants(0.4, 10)}
        style={{ transformOrigin: '45px 56px' }}
      >
        <path
          d="M 45 56 Q 50 60, 54 66 Q 56 70, 58 74"
          stroke="#C77D6B"
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 45 56 Q 50 60, 54 66 Q 56 70, 58 74"
          stroke="#D89B8A"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {[{ x: 48, y: 59 }, { x: 52, y: 64 }, { x: 55, y: 69 }].map((sucker, i) => (
          <motion.circle
            key={`t3-sucker-${i}`}
            cx={sucker.x}
            cy={sucker.y}
            r="1.6"
            fill="#A65B4A"
            animate={suckerPulseVariants(0.4 + i * 0.15)}
          />
        ))}
      </motion.g>

      {/* Tentacle 4 - Front Right */}
      <motion.g
        animate={tentacleWaveVariants(0.6, 15)}
        style={{ transformOrigin: '48px 55px' }}
      >
        <path
          d="M 48 55 Q 56 58, 60 64 Q 62 68, 64 72"
          stroke="#C77D6B"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 48 55 Q 56 58, 60 64 Q 62 68, 64 72"
          stroke="#D89B8A"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {[{ x: 54, y: 58 }, { x: 58, y: 62 }, { x: 61, y: 66 }, { x: 63, y: 70 }].map((sucker, i) => (
          <motion.circle
            key={`t4-sucker-${i}`}
            cx={sucker.x}
            cy={sucker.y}
            r="1.8"
            fill="#A65B4A"
            animate={suckerPulseVariants(0.6 + i * 0.15)}
          />
        ))}
      </motion.g>

      {/* Tentacle 5 - Back Left */}
      <motion.g
        animate={tentacleWaveVariants(0.8, 18)}
        style={{ transformOrigin: '28px 52px' }}
      >
        <path
          d="M 28 52 Q 18 54, 12 60 Q 8 64, 6 68"
          stroke="#B86C5A"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M 28 52 Q 18 54, 12 60 Q 8 64, 6 68"
          stroke="#C77D6B"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        {[{ x: 22, y: 54 }, { x: 15, y: 58 }, { x: 10, y: 63 }].map((sucker, i) => (
          <motion.circle
            key={`t5-sucker-${i}`}
            cx={sucker.x}
            cy={sucker.y}
            r="1.5"
            fill="#A65B4A"
            opacity="0.7"
            animate={suckerPulseVariants(0.8 + i * 0.15)}
          />
        ))}
      </motion.g>

      {/* Tentacle 6 - Back Left-Center */}
      <motion.g
        animate={tentacleWaveVariants(1, 14)}
        style={{ transformOrigin: '33px 53px' }}
      >
        <path
          d="M 33 53 Q 26 56, 20 62 Q 16 66, 14 70"
          stroke="#B86C5A"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M 33 53 Q 26 56, 20 62 Q 16 66, 14 70"
          stroke="#C77D6B"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        {[{ x: 29, y: 55 }, { x: 23, y: 60 }, { x: 18, y: 65 }].map((sucker, i) => (
          <motion.circle
            key={`t6-sucker-${i}`}
            cx={sucker.x}
            cy={sucker.y}
            r="1.4"
            fill="#A65B4A"
            opacity="0.7"
            animate={suckerPulseVariants(1 + i * 0.15)}
          />
        ))}
      </motion.g>

      {/* Tentacle 7 - Back Right-Center */}
      <motion.g
        animate={tentacleWaveVariants(1.2, 14)}
        style={{ transformOrigin: '47px 53px' }}
      >
        <path
          d="M 47 53 Q 54 56, 60 62 Q 64 66, 66 70"
          stroke="#B86C5A"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M 47 53 Q 54 56, 60 62 Q 64 66, 66 70"
          stroke="#C77D6B"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        {[{ x: 51, y: 55 }, { x: 57, y: 60 }, { x: 62, y: 65 }].map((sucker, i) => (
          <motion.circle
            key={`t7-sucker-${i}`}
            cx={sucker.x}
            cy={sucker.y}
            r="1.4"
            fill="#A65B4A"
            opacity="0.7"
            animate={suckerPulseVariants(1.2 + i * 0.15)}
          />
        ))}
      </motion.g>

      {/* Tentacle 8 - Back Right */}
      <motion.g
        animate={tentacleWaveVariants(1.4, 18)}
        style={{ transformOrigin: '52px 52px' }}
      >
        <path
          d="M 52 52 Q 62 54, 68 60 Q 72 64, 74 68"
          stroke="#B86C5A"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M 52 52 Q 62 54, 68 60 Q 72 64, 74 68"
          stroke="#C77D6B"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        {[{ x: 58, y: 54 }, { x: 65, y: 58 }, { x: 70, y: 63 }].map((sucker, i) => (
          <motion.circle
            key={`t8-sucker-${i}`}
            cx={sucker.x}
            cy={sucker.y}
            r="1.5"
            fill="#A65B4A"
            opacity="0.7"
            animate={suckerPulseVariants(1.4 + i * 0.15)}
          />
        ))}
      </motion.g>

      {/* ===== MANTLE (head/body) ===== */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={mantlePulseVariants}
        style={{ transformOrigin: '40px 38px' }}
      >
        {/* Mantle shadow */}
        <ellipse
          cx="40"
          cy="40"
          rx="21"
          ry="19"
          fill="#A65B4A"
          opacity="0.3"
        />
        {/* Mantle base */}
        <ellipse
          cx="40"
          cy="38"
          rx="20"
          ry="18"
          fill="#D89B8A"
        />
        {/* Mantle mid-tone */}
        <ellipse
          cx="40"
          cy="36"
          rx="18"
          ry="16"
          fill="#E8B0A0"
          opacity="0.6"
        />
        {/* Mantle top highlight */}
        <ellipse
          cx="38"
          cy="32"
          rx="12"
          ry="10"
          fill="#F5C8B8"
          opacity="0.4"
        />

        {/* Skin texture bumps */}
        {[
          { cx: 32, cy: 30, r: 2.5 },
          { cx: 48, cy: 32, r: 2.2 },
          { cx: 38, cy: 26, r: 1.8 },
          { cx: 45, cy: 28, r: 2 },
          { cx: 35, cy: 36, r: 1.5 },
          { cx: 46, cy: 38, r: 1.6 },
        ].map((bump, i) => (
          <motion.circle
            key={`bump-${i}`}
            cx={bump.cx}
            cy={bump.cy}
            r={bump.r}
            fill="#C77D6B"
            opacity="0.3"
            animate={skinTextureShimmer(i * 0.2)}
          />
        ))}

        {/* Mantle spots for texture */}
        {[
          { cx: 28, cy: 35, r: 1.2 },
          { cx: 52, cy: 36, r: 1.3 },
          { cx: 40, cy: 28, r: 1.1 },
          { cx: 34, cy: 42, r: 1 },
          { cx: 46, cy: 43, r: 1.1 },
        ].map((spot, i) => (
          <circle
            key={`spot-${i}`}
            cx={spot.cx}
            cy={spot.cy}
            r={spot.r}
            fill="#B86C5A"
            opacity="0.4"
          />
        ))}
      </motion.g>

      {/* ===== EYES ===== */}
      {/* Left eye */}
      <g id="left-eye">
        {/* Eye white */}
        <ellipse
          cx="32"
          cy="36"
          rx="6"
          ry="7"
          fill="#F5E8D0"
        />
        {/* Eye outline */}
        <ellipse
          cx="32"
          cy="36"
          rx="6"
          ry="7"
          fill="none"
          stroke="#A65B4A"
          strokeWidth="0.8"
        />
        {/* Iris */}
        <ellipse
          cx="33"
          cy="36"
          rx="4"
          ry="5"
          fill="#8B6B5A"
        />
        {/* Pupil */}
        <motion.ellipse
          cx="33"
          cy="36"
          rx="2.5"
          ry="3.5"
          fill="#2A1A0E"
          animate={animate ? 'idle' : undefined}
          variants={eyeBlinkVariants}
          style={{ transformOrigin: '33px 36px' }}
        />
        {/* Eye shine */}
        <ellipse
          cx="31"
          cy="34"
          rx="1.5"
          ry="2"
          fill="#FFFFFF"
          opacity="0.7"
        />
        <circle
          cx="34"
          cy="37"
          r="0.8"
          fill="#FFFFFF"
          opacity="0.4"
        />
      </g>

      {/* Right eye */}
      <g id="right-eye">
        {/* Eye white */}
        <ellipse
          cx="48"
          cy="36"
          rx="6"
          ry="7"
          fill="#F5E8D0"
        />
        {/* Eye outline */}
        <ellipse
          cx="48"
          cy="36"
          rx="6"
          ry="7"
          fill="none"
          stroke="#A65B4A"
          strokeWidth="0.8"
        />
        {/* Iris */}
        <ellipse
          cx="47"
          cy="36"
          rx="4"
          ry="5"
          fill="#8B6B5A"
        />
        {/* Pupil */}
        <motion.ellipse
          cx="47"
          cy="36"
          rx="2.5"
          ry="3.5"
          fill="#2A1A0E"
          animate={animate ? 'idle' : undefined}
          variants={eyeBlinkVariants}
          style={{ transformOrigin: '47px 36px' }}
        />
        {/* Eye shine */}
        <ellipse
          cx="45"
          cy="34"
          rx="1.5"
          ry="2"
          fill="#FFFFFF"
          opacity="0.7"
        />
        <circle
          cx="48"
          cy="37"
          r="0.8"
          fill="#FFFFFF"
          opacity="0.4"
        />
      </g>

      {/* Beak/mouth area (subtle) */}
      <ellipse
        cx="40"
        cy="48"
        rx="3"
        ry="2"
        fill="#A65B4A"
        opacity="0.5"
      />
      <path
        d="M 38 48 Q 40 50, 42 48"
        stroke="#8B5B4A"
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
    </motion.svg>
  );
}
