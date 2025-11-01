'use client';

import { motion } from 'framer-motion';

interface BacteriaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Rod-shaped bacterium (bacillus) with flagella
 * Features: capsule, cell wall, flagella, pili, rotating motion
 * Represents a typical motile bacterial cell
 */
export function BacteriaIcon({ size = 32, className = '', animate = true }: BacteriaIconProps) {
  const flagellaWaveVariants = (delay: number) => ({
    idle: {
      d: [
        'M 60 40 Q 65 35, 68 38 Q 71 41, 74 38',
        'M 60 40 Q 65 45, 68 42 Q 71 39, 74 42',
        'M 60 40 Q 65 35, 68 38 Q 71 41, 74 38',
      ],
      transition: {
        duration: 1.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  const bodyRotateVariants = {
    idle: {
      rotate: [0, 360],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const piliWiggleVariants = (delay: number) => ({
    idle: {
      rotate: [-5, 5, -5],
      transition: {
        duration: 1.2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  const capsulePulseVariants = {
    idle: {
      opacity: [0.2, 0.35, 0.2],
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
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
      whileTap={{ scale: 0.9, rotate: -20 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shadow */}
      <ellipse
        cx="40"
        cy="73"
        rx="18"
        ry="3"
        fill="#2A3A2E"
        opacity="0.25"
      />

      {/* ===== FLAGELLA (whip-like tails for movement) ===== */}
      {/* Posterior flagellum */}
      <motion.path
        d="M 60 40 Q 65 35, 68 38 Q 71 41, 74 38"
        initial={false}
        animate={animate ? 'idle' : undefined}
        variants={flagellaWaveVariants(0)}
        stroke="#7D6E83"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Additional flagellum */}
      <motion.path
        d="M 60 42 Q 65 47, 68 44 Q 71 41, 74 44"
        initial={false}
        animate={animate ? 'idle' : undefined}
        variants={flagellaWaveVariants(0.3)}
        stroke="#7D6E83"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={bodyRotateVariants}
        style={{ transformOrigin: '40px 40px' }}
      >
        {/* ===== CAPSULE (protective outer layer) ===== */}
        <motion.ellipse
          cx="40"
          cy="40"
          rx="22"
          ry="16"
          fill="#9B59B6"
          opacity="0.25"
          animate={animate ? 'idle' : undefined}
          variants={capsulePulseVariants}
        />

        {/* ===== CELL WALL & MEMBRANE ===== */}
        {/* Cell wall (peptidoglycan layer) */}
        <ellipse
          cx="40"
          cy="40"
          rx="19"
          ry="13"
          fill="url(#bacteriaGradient)"
          opacity="0.9"
        />

        {/* Cell wall outline */}
        <ellipse
          cx="40"
          cy="40"
          rx="19"
          ry="13"
          fill="none"
          stroke="#7D3C98"
          strokeWidth="1.5"
        />

        {/* Cell membrane (inner) */}
        <ellipse
          cx="40"
          cy="40"
          rx="17"
          ry="11"
          fill="#BB8FCE"
          opacity="0.4"
        />

        {/* ===== CYTOPLASM ===== */}
        <ellipse
          cx="40"
          cy="40"
          rx="16"
          ry="10"
          fill="#D7BDE2"
          opacity="0.3"
        />

        {/* ===== NUCLEOID (bacterial chromosome) ===== */}
        <ellipse
          cx="40"
          cy="40"
          rx="8"
          ry="5"
          fill="#5B2C6F"
          opacity="0.5"
        />

        {/* DNA strands visible */}
        <path
          d="M 34 40 Q 37 38, 40 40 Q 43 42, 46 40"
          stroke="#7D3C98"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />

        {/* ===== RIBOSOMES (protein synthesis) ===== */}
        <circle cx="35" cy="36" r="1.5" fill="#512E5F" opacity="0.7" />
        <circle cx="38" cy="44" r="1.5" fill="#512E5F" opacity="0.7" />
        <circle cx="45" cy="36" r="1.5" fill="#512E5F" opacity="0.7" />
        <circle cx="42" cy="43" r="1.5" fill="#512E5F" opacity="0.7" />
        <circle cx="40" cy="37" r="1.5" fill="#512E5F" opacity="0.7" />

        {/* ===== PLASMIDS (small DNA circles) ===== */}
        <circle
          cx="32"
          cy="40"
          r="2.5"
          fill="none"
          stroke="#7D3C98"
          strokeWidth="1"
          opacity="0.5"
        />
        <circle
          cx="48"
          cy="40"
          r="2"
          fill="none"
          stroke="#7D3C98"
          strokeWidth="1"
          opacity="0.5"
        />
      </motion.g>

      {/* ===== PILI (hair-like adhesion structures) ===== */}
      {/* Short pili all around */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45 - 90) * (Math.PI / 180);
        const x1 = 40 + 19 * Math.cos(angle);
        const y1 = 40 + 13 * Math.sin(angle);
        const x2 = 40 + 26 * Math.cos(angle);
        const y2 = 40 + 17 * Math.sin(angle);
        const delay = i * 0.1;

        return (
          <motion.line
            key={`pili-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#9B7EAE"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
            animate={animate ? 'idle' : undefined}
            variants={piliWiggleVariants(delay)}
            style={{ transformOrigin: x1 + 'px ' + y1 + 'px' }}
          />
        );
      })}

      {/* Sex pilus (longer, for conjugation) */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            rotate: [-10, 10, -10],
            transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
        }}
        style={{ transformOrigin: '22px 34px' }}
      >
        <path
          d="M 22 34 Q 12 32, 8 28"
          stroke="#8E7CC3"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <circle cx="8" cy="28" r="2" fill="#7D6E83" opacity="0.6" />
      </motion.g>

      {/* ===== SPORE (dormant form indicator - optional feature) ===== */}
      <motion.ellipse
        cx="45"
        cy="40"
        rx="4"
        ry="3"
        fill="#5B2C6F"
        opacity="0.4"
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            opacity: [0.4, 0.6, 0.4],
            transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
        }}
      />

      {/* Gradient definitions */}
      <defs>
        <linearGradient id="bacteriaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#AF7AC5" />
          <stop offset="50%" stopColor="#9B59B6" />
          <stop offset="100%" stopColor="#7D3C98" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
