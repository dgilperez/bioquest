'use client';

import { motion } from 'framer-motion';

interface ChromistaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Ciliate (Paramecium-like) with beating cilia
 * Features: oval body, hair-like cilia, oral groove, visible nucleus
 * Shows the characteristic undulating movement of cilia
 */
export function ChromistaIcon({ size = 32, className = '', animate = true }: ChromistaIconProps) {
  const ciliaWaveVariants = (delay: number, side: 'left' | 'right') => {
    const baseRotation = side === 'left' ? [0, -15, -5, 0] : [0, 15, 5, 0];
    return {
      idle: {
        rotate: baseRotation,
        transition: {
          duration: 0.6,
          delay,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    };
  };

  const bodyPulseVariants = {
    idle: {
      scale: [1, 1.03, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const nucleusRotateVariants = {
    idle: {
      rotate: [0, 360],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const oralGroovePulseVariants = {
    idle: {
      opacity: [0.4, 0.7, 0.4],
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
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
        rx="18"
        ry="3"
        fill="#2A3A2E"
        opacity="0.2"
      />

      {/* ===== CILIA (hair-like projections) ===== */}
      {/* Left side cilia - arranged in rows */}
      {[...Array(12)].map((_, i) => {
        const y = 25 + i * 4;
        const delay = i * 0.05;
        return (
          <motion.line
            key={`left-${i}`}
            x1="25"
            y1={y}
            x2="18"
            y2={y - 2}
            stroke="#4A8A8A"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
            animate={animate ? 'idle' : undefined}
            variants={ciliaWaveVariants(delay, 'left')}
            style={{ transformOrigin: '25px ' + y + 'px' }}
          />
        );
      })}

      {/* Right side cilia */}
      {[...Array(12)].map((_, i) => {
        const y = 25 + i * 4;
        const delay = i * 0.05;
        return (
          <motion.line
            key={`right-${i}`}
            x1="55"
            y1={y}
            x2="62"
            y2={y - 2}
            stroke="#4A8A8A"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
            animate={animate ? 'idle' : undefined}
            variants={ciliaWaveVariants(delay, 'right')}
            style={{ transformOrigin: '55px ' + y + 'px' }}
          />
        );
      })}

      {/* ===== BODY (main cell body) ===== */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={bodyPulseVariants}
      >
        {/* Cell membrane (outer boundary) */}
        <ellipse
          cx="40"
          cy="45"
          rx="16"
          ry="24"
          fill="url(#citiateGradient)"
          opacity="0.85"
        />

        {/* Cell membrane outline */}
        <ellipse
          cx="40"
          cy="45"
          rx="16"
          ry="24"
          fill="none"
          stroke="#3A7A7A"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Cytoplasm texture (inner fill) */}
        <ellipse
          cx="40"
          cy="45"
          rx="14"
          ry="22"
          fill="#7AB8B8"
          opacity="0.3"
        />
      </motion.g>

      {/* ===== ORAL GROOVE (feeding structure) ===== */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={oralGroovePulseVariants}
      >
        <path
          d="M 40 28 Q 38 32, 40 36 Q 42 40, 40 44"
          stroke="#2A5A5A"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {/* Food particles being ingested */}
        <motion.circle
          cx="40"
          cy="28"
          r="1.5"
          fill="#8B4513"
          animate={animate ? 'idle' : undefined}
          variants={{
            idle: {
              y: [0, 16],  // Move from cy=28 to cy=44 (16px down)
              opacity: [1, 0],
              transition: { duration: 2, repeat: Infinity, ease: 'linear' }
            }
          }}
        />
      </motion.g>

      {/* ===== NUCLEUS (macronucleus - kidney shaped) ===== */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={nucleusRotateVariants}
        style={{ transformOrigin: '40px 45px' }}
      >
        <ellipse
          cx="42"
          cy="45"
          rx="8"
          ry="12"
          fill="#4A4A6A"
          opacity="0.6"
        />
        {/* Chromatin visible inside */}
        <circle cx="42" cy="42" r="2" fill="#6A6A8A" opacity="0.8" />
        <circle cx="40" cy="47" r="2" fill="#6A6A8A" opacity="0.8" />
        <circle cx="44" cy="46" r="1.5" fill="#6A6A8A" opacity="0.8" />
      </motion.g>

      {/* ===== MICRONUCLEUS (smaller, round nucleus) ===== */}
      <circle
        cx="35"
        cy="50"
        r="3"
        fill="#5A5A7A"
        opacity="0.5"
      />

      {/* ===== CONTRACTILE VACUOLES (water regulation) ===== */}
      <motion.circle
        cx="32"
        cy="35"
        r="3"
        fill="none"
        stroke="#6AB8B8"
        strokeWidth="1.5"
        opacity="0.6"
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            scale: [1, 1.33, 1],  // Scale from r=3 to r=4 (1.33x)
            opacity: [0.6, 0.3, 0.6],
            transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          }
        }}
        style={{ transformOrigin: '32px 35px' }}
      />

      <motion.circle
        cx="48"
        cy="55"
        r="3"
        fill="none"
        stroke="#6AB8B8"
        strokeWidth="1.5"
        opacity="0.6"
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            scale: [1, 1.33, 1],  // Scale from r=3 to r=4 (1.33x)
            opacity: [0.6, 0.3, 0.6],
            transition: { duration: 1.5, delay: 0.75, repeat: Infinity, ease: 'easeInOut' }
          }
        }}
        style={{ transformOrigin: '48px 55px' }}
      />

      {/* ===== ANTERIOR CILIA (longer at front for steering) ===== */}
      {[...Array(6)].map((_, i) => {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const x1 = 40 + 16 * Math.cos(angle);
        const y1 = 21 + 10 * Math.sin(angle);
        const x2 = 40 + 22 * Math.cos(angle);
        const y2 = 21 + 16 * Math.sin(angle);
        const delay = i * 0.08;

        return (
          <motion.line
            key={`anterior-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#5A9A9A"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
            animate={animate ? 'idle' : undefined}
            variants={{
              idle: {
                rotate: [0, -20, 0, 20, 0],
                transition: { duration: 0.8, delay, repeat: Infinity, ease: 'easeInOut' }
              }
            }}
            style={{ transformOrigin: x1 + 'px ' + y1 + 'px' }}
          />
        );
      })}

      {/* Gradient definitions */}
      <defs>
        <radialGradient id="citiateGradient">
          <stop offset="0%" stopColor="#9AD8D8" />
          <stop offset="70%" stopColor="#6AB8B8" />
          <stop offset="100%" stopColor="#4A9898" />
        </radialGradient>
      </defs>
    </motion.svg>
  );
}
