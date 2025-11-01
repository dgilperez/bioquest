'use client';

import { motion } from 'framer-motion';

interface InsectaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Detailed beetle icon with accurate insect anatomy
 * Features: 6 segmented legs, elytra with texture, segmented antennae, compound eyes
 */
export function InsectaIcon({ size = 32, className = '', animate = true }: InsectaIconProps) {
  const legVariants = (delay: number) => ({
    idle: {
      pathLength: animate ? [0, 1] : 1,
      opacity: animate ? [0, 1] : 1,
      transition: {
        duration: 0.6,
        delay,
        ease: 'easeOut',
      },
    },
  });

  const antennaWaveVariants = {
    idle: {
      rotate: [-12, 12, -12],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const legWalkVariants = (delay: number) => ({
    idle: {
      y: animate ? [0, -2, 0, -1, 0] : 0,
      x: animate ? [0, 0.5, 0, -0.5, 0] : 0,
      transition: {
        duration: 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  const bodyWiggleVariants = {
    idle: {
      rotate: [-1, 1, -1],
      scaleY: [1, 1.03, 1],
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const elytraShimmerVariants = {
    idle: {
      opacity: [0.5, 0.7, 0.5],
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
      whileTap={{ scale: 0.9, rotate: -3 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Ground shadow */}
      <ellipse
        cx="40"
        cy="74"
        rx="11"
        ry="2.5"
        fill="#000000"
        opacity="0.15"
      />

      {/* ===== 6 SEGMENTED LEGS ===== */}
      {/* Front left leg - coxa, femur, tibia, tarsus */}
      <motion.g id="front-left-leg"
        animate={animate ? 'idle' : undefined}
        variants={legWalkVariants(0)}>
        <motion.path
          d="M 33 32 L 30 34"
          stroke="#7A5530"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.1)}
        />
        <circle cx="30" cy="34" r="0.9" fill="#7A5530" />
        <motion.path
          d="M 30 34 Q 26 37, 23 41"
          stroke="#8B6338"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.15)}
        />
        <circle cx="23" cy="41" r="0.7" fill="#7A5530" />
        <motion.path
          d="M 23 41 Q 21 43, 20 46"
          stroke="#8B6338"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.2)}
        />
        <motion.path
          d="M 20 46 L 19 47 L 18 48"
          stroke="#7A5530"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.25)}
        />
      </motion.g>

      {/* Middle left leg */}
      <motion.g id="middle-left-leg"
        animate={animate ? 'idle' : undefined}
        variants={legWalkVariants(0.3)}>
        <motion.path
          d="M 32 43 L 29 45"
          stroke="#7A5530"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.3)}
        />
        <circle cx="29" cy="45" r="0.9" fill="#7A5530" />
        <motion.path
          d="M 29 45 Q 25 48, 22 52"
          stroke="#8B6338"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.35)}
        />
        <circle cx="22" cy="52" r="0.7" fill="#7A5530" />
        <motion.path
          d="M 22 52 Q 20 54, 19 57"
          stroke="#8B6338"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.4)}
        />
        <motion.path
          d="M 19 57 L 18 58 L 17 59"
          stroke="#7A5530"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.45)}
        />
      </motion.g>

      {/* Back left leg */}
      <motion.g id="back-left-leg"
        animate={animate ? 'idle' : undefined}
        variants={legWalkVariants(0.6)}>
        <motion.path
          d="M 33 52 L 30 54"
          stroke="#7A5530"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.5)}
        />
        <circle cx="30" cy="54" r="0.9" fill="#7A5530" />
        <motion.path
          d="M 30 54 Q 27 57, 25 62"
          stroke="#8B6338"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.55)}
        />
        <circle cx="25" cy="62" r="0.7" fill="#7A5530" />
        <motion.path
          d="M 25 62 Q 24 64, 23 67"
          stroke="#8B6338"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.6)}
        />
        <motion.path
          d="M 23 67 L 22 68 L 21 69"
          stroke="#7A5530"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.65)}
        />
      </motion.g>

      {/* Front right leg */}
      <motion.g id="front-right-leg"
        animate={animate ? 'idle' : undefined}
        variants={legWalkVariants(0.15)}>
        <motion.path
          d="M 47 32 L 50 34"
          stroke="#7A5530"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.12)}
        />
        <circle cx="50" cy="34" r="0.9" fill="#7A5530" />
        <motion.path
          d="M 50 34 Q 54 37, 57 41"
          stroke="#8B6338"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.17)}
        />
        <circle cx="57" cy="41" r="0.7" fill="#7A5530" />
        <motion.path
          d="M 57 41 Q 59 43, 60 46"
          stroke="#8B6338"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.22)}
        />
        <motion.path
          d="M 60 46 L 61 47 L 62 48"
          stroke="#7A5530"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.27)}
        />
      </motion.g>

      {/* Middle right leg */}
      <motion.g id="middle-right-leg"
        animate={animate ? 'idle' : undefined}
        variants={legWalkVariants(0.45)}>
        <motion.path
          d="M 48 43 L 51 45"
          stroke="#7A5530"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.32)}
        />
        <circle cx="51" cy="45" r="0.9" fill="#7A5530" />
        <motion.path
          d="M 51 45 Q 55 48, 58 52"
          stroke="#8B6338"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.37)}
        />
        <circle cx="58" cy="52" r="0.7" fill="#7A5530" />
        <motion.path
          d="M 58 52 Q 60 54, 61 57"
          stroke="#8B6338"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.42)}
        />
        <motion.path
          d="M 61 57 L 62 58 L 63 59"
          stroke="#7A5530"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.47)}
        />
      </motion.g>

      {/* Back right leg */}
      <motion.g id="back-right-leg"
        animate={animate ? 'idle' : undefined}
        variants={legWalkVariants(0.75)}>
        <motion.path
          d="M 47 52 L 50 54"
          stroke="#7A5530"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.52)}
        />
        <circle cx="50" cy="54" r="0.9" fill="#7A5530" />
        <motion.path
          d="M 50 54 Q 53 57, 55 62"
          stroke="#8B6338"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.57)}
        />
        <circle cx="55" cy="62" r="0.7" fill="#7A5530" />
        <motion.path
          d="M 55 62 Q 56 64, 57 67"
          stroke="#8B6338"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.62)}
        />
        <motion.path
          d="M 57 67 L 58 68 L 59 69"
          stroke="#7A5530"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? 'idle' : undefined}
          variants={legVariants(0.67)}
        />
      </motion.g>

      {/* ===== ABDOMEN (segmented) ===== */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={bodyWiggleVariants}
        style={{ transformOrigin: '40px 50px' }}
      >
      <ellipse cx="40" cy="50" rx="12" ry="17" fill="#A87340" />
      <ellipse cx="40" cy="49.5" rx="11.5" ry="16.5" fill="#B8834C" opacity="0.8" />

      {/* Abdomen segments */}
      {[38, 43, 48, 53, 58, 62].map((y, i) => (
        <path
          key={`abdomen-seg-${i}`}
          d={`M 29 ${y} Q 40 ${y + 0.5}, 51 ${y}`}
          stroke="#9C6D3C"
          strokeWidth="0.5"
          fill="none"
          opacity="0.5"
        />
      ))}

      {/* Abdomen shadow */}
      <ellipse cx="40" cy="50" rx="10" ry="15" fill="#8B6338" opacity="0.3" />
      </motion.g>

      {/* ===== THORAX (pronotum) ===== */}
      <ellipse cx="40" cy="30" rx="8.5" ry="9.5" fill="#C89454" />
      <ellipse cx="40" cy="29.5" rx="7.8" ry="9" fill="#D4A05C" opacity="0.85" />

      {/* Thorax segments */}
      <path
        d="M 33 25 Q 40 25.5, 47 25"
        stroke="#B8834C"
        strokeWidth="0.6"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 32 35 Q 40 35.5, 48 35"
        stroke="#B8834C"
        strokeWidth="0.6"
        fill="none"
        opacity="0.6"
      />

      {/* Thorax highlight */}
      <ellipse cx="38" cy="28" rx="4" ry="5" fill="#FFFFFF" opacity="0.2" />

      {/* ===== HEAD ===== */}
      <ellipse cx="40" cy="20" rx="5.8" ry="6.5" fill="#B8834C" />
      <ellipse cx="40" cy="19.5" rx="5.5" ry="6.2" fill="#C89454" opacity="0.9" />

      {/* Mandibles */}
      <path
        d="M 38 17 Q 37 15, 36 13"
        stroke="#8B6338"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 42 17 Q 43 15, 44 13"
        stroke="#8B6338"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Compound eyes */}
      <ellipse cx="37" cy="20" rx="1.4" ry="1.6" fill="#4A3020" />
      <ellipse cx="43" cy="20" rx="1.4" ry="1.6" fill="#4A3020" />
      <circle cx="37" cy="19.5" r="0.5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="43" cy="19.5" r="0.5" fill="#FFFFFF" opacity="0.6" />

      {/* ===== ELYTRA (wing cases) ===== */}
      {/* Left elytron */}
      <motion.path
        animate={animate ? 'idle' : undefined}
        variants={elytraShimmerVariants}
        d="M 40 27
           C 36 28, 32 31, 30 35
           C 28 39, 28 45, 28 51
           C 28 57, 29 62, 32 65
           C 33 66, 35 67, 37 67
           L 40 67
           Z"
        fill="#A87340"
        opacity="0.5"
      />
      <path
        d="M 40 27
           C 36.5 28, 33 31, 31 35
           C 29 39, 29 45, 29 51
           C 29 57, 30 62, 33 65"
        stroke="#8B6338"
        strokeWidth="1.2"
        fill="none"
      />

      {/* Right elytron */}
      <motion.path
        animate={animate ? 'idle' : undefined}
        variants={elytraShimmerVariants}
        d="M 40 27
           C 44 28, 48 31, 50 35
           C 52 39, 52 45, 52 51
           C 52 57, 51 62, 48 65
           C 47 66, 45 67, 43 67
           L 40 67
           Z"
        fill="#A87340"
        opacity="0.5"
      />
      <path
        d="M 40 27
           C 43.5 28, 47 31, 49 35
           C 51 39, 51 45, 51 51
           C 51 57, 50 62, 47 65"
        stroke="#8B6338"
        strokeWidth="1.2"
        fill="none"
      />

      {/* Elytra central split */}
      <path
        d="M 40 27 L 40 67"
        stroke="#7A5530"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Elytra texture lines - left */}
      {[
        { d: 'M 33 34 Q 34 40, 34 46 Q 34 52, 35 58', opacity: 0.5 },
        { d: 'M 36 31 Q 37 40, 37 49 Q 37 56, 38 63', opacity: 0.45 },
        { d: 'M 38.5 29 Q 39 40, 39 50 Q 39 60, 39.5 66', opacity: 0.4 },
      ].map((line, i) => (
        <path
          key={`elytron-left-${i}`}
          d={line.d}
          stroke="#9C6D3C"
          strokeWidth="0.6"
          fill="none"
          opacity={line.opacity}
        />
      ))}

      {/* Elytra texture lines - right */}
      {[
        { d: 'M 47 34 Q 46 40, 46 46 Q 46 52, 45 58', opacity: 0.5 },
        { d: 'M 44 31 Q 43 40, 43 49 Q 43 56, 42 63', opacity: 0.45 },
        { d: 'M 41.5 29 Q 41 40, 41 50 Q 41 60, 40.5 66', opacity: 0.4 },
      ].map((line, i) => (
        <path
          key={`elytron-right-${i}`}
          d={line.d}
          stroke="#9C6D3C"
          strokeWidth="0.6"
          fill="none"
          opacity={line.opacity}
        />
      ))}

      {/* Elytra highlights */}
      <ellipse cx="35" cy="38" rx="3" ry="6" fill="#FFFFFF" opacity="0.12" />
      <ellipse cx="45" cy="38" rx="3" ry="6" fill="#FFFFFF" opacity="0.12" />

      {/* Elytra punctures */}
      {[
        { cx: 34, cy: 40 },
        { cx: 46, cy: 40 },
        { cx: 33.5, cy: 48 },
        { cx: 46.5, cy: 48 },
        { cx: 34, cy: 55 },
        { cx: 46, cy: 55 },
        { cx: 35, cy: 61 },
        { cx: 45, cy: 61 },
      ].map((dot, i) => (
        <circle
          key={`puncture-${i}`}
          cx={dot.cx}
          cy={dot.cy}
          r="0.5"
          fill="#8B6338"
          opacity="0.4"
        />
      ))}

      {/* ===== SEGMENTED ANTENNAE ===== */}
      {/* Left antenna */}
      <motion.g
        id="left-antenna"
        animate={animate ? 'idle' : undefined}
        variants={antennaWaveVariants}
        style={{ transformOrigin: '37px 19px' }}
      >
        <path
          d="M 37 19 L 35 16"
          stroke="#8B6338"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="35" cy="16" r="0.6" fill="#7A5530" />
        <path
          d="M 35 16 L 33 13"
          stroke="#8B6338"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="33" cy="13" r="0.5" fill="#7A5530" />
        <path
          d="M 33 13 L 32 10"
          stroke="#8B6338"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="32" cy="10" r="0.5" fill="#7A5530" />
        <path
          d="M 32 10 L 31 7"
          stroke="#8B6338"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="31" cy="7" r="0.9" fill="#8B6338" />
      </motion.g>

      {/* Right antenna */}
      <motion.g
        id="right-antenna"
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            rotate: [8, -8, 8],
            transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          }
        }}
        style={{ transformOrigin: '43px 19px' }}
      >
        <path
          d="M 43 19 L 45 16"
          stroke="#8B6338"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="45" cy="16" r="0.6" fill="#7A5530" />
        <path
          d="M 45 16 L 47 13"
          stroke="#8B6338"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="47" cy="13" r="0.5" fill="#7A5530" />
        <path
          d="M 47 13 L 48 10"
          stroke="#8B6338"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="48" cy="10" r="0.5" fill="#7A5530" />
        <path
          d="M 48 10 L 49 7"
          stroke="#8B6338"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="49" cy="7" r="0.9" fill="#8B6338" />
      </motion.g>
    </motion.svg>
  );
}
