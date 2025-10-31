'use client';

import { motion } from 'framer-motion';

interface VirusIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Icosahedral virus with protein spikes
 * Features: geometric capsid, spike proteins, pulsing animation
 * Classic representation of a bacteriophage or coronavirus-style virus
 */
export function VirusIcon({ size = 32, className = '', animate = true }: VirusIconProps) {
  const capsidPulseVariants = {
    idle: {
      scale: [1, 1.05, 1],
      rotate: [0, 5, 0, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const spikeWaveVariants = (delay: number) => ({
    idle: {
      scale: [1, 1.15, 1],
      rotate: [0, 15, 0],
      transition: {
        duration: 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  const genomePulseVariants = {
    idle: {
      opacity: [0.3, 0.6, 0.3],
      scale: [0.95, 1.05, 0.95],
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
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.1, rotate: 15 }}
    >
      {/* Shadow */}
      <ellipse
        cx="40"
        cy="72"
        rx="15"
        ry="3"
        fill="#2A3A2E"
        opacity="0.25"
      />

      {/* ===== PROTEIN SPIKES (glycoproteins) ===== */}
      {/* Spikes arranged in radial pattern */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const x = 40 + 20 * Math.cos(angle);
        const y = 40 + 20 * Math.sin(angle);
        const x2 = 40 + 32 * Math.cos(angle);
        const y2 = 40 + 32 * Math.sin(angle);
        const delay = i * 0.08;

        return (
          <motion.g
            key={`spike-${i}`}
            animate={animate ? 'idle' : undefined}
            variants={spikeWaveVariants(delay)}
            style={{ transformOrigin: x + 'px ' + y + 'px' }}
          >
            {/* Spike stem */}
            <line
              x1={x}
              y1={y}
              x2={x2}
              y2={y2}
              stroke="#E74C3C"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Spike head (club-shaped) */}
            <circle
              cx={x2}
              cy={y2}
              r="4"
              fill="#E74C3C"
            />

            {/* Spike receptor binding domain */}
            <circle
              cx={x2}
              cy={y2}
              r="2.5"
              fill="#C0392B"
            />

            {/* Attachment points (subtle) */}
            <circle
              cx={x2 - 1.5}
              cy={y2}
              r="1"
              fill="#FF6B6B"
              opacity="0.7"
            />
            <circle
              cx={x2 + 1.5}
              cy={y2}
              r="1"
              fill="#FF6B6B"
              opacity="0.7"
            />
          </motion.g>
        );
      })}

      {/* ===== VIRAL CAPSID (protein shell) ===== */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={capsidPulseVariants}
      >
        {/* Outer capsid layer */}
        <circle
          cx="40"
          cy="40"
          r="20"
          fill="url(#capsidGradient)"
          opacity="0.9"
        />

        {/* Capsid structural detail (icosahedral facets) */}
        {/* Pentagon facets */}
        {[0, 72, 144, 216, 288].map((angle, i) => {
          const rad = angle * (Math.PI / 180);
          const x = 40 + 14 * Math.cos(rad);
          const y = 40 + 14 * Math.sin(rad);

          return (
            <g key={`facet-${i}`}>
              <circle
                cx={x}
                cy={y}
                r="5"
                fill="#A93226"
                opacity="0.4"
              />
              <circle
                cx={x}
                cy={y}
                r="3"
                fill="#C0392B"
                opacity="0.6"
              />
            </g>
          );
        })}

        {/* Central pentamer */}
        <circle
          cx="40"
          cy="40"
          r="6"
          fill="#922B21"
          opacity="0.5"
        />

        {/* Hexameric capsomers (structural units) */}
        {[...Array(6)].map((_, i) => {
          const angle = (i * 60 + 30) * (Math.PI / 180);
          const x = 40 + 8 * Math.cos(angle);
          const y = 40 + 8 * Math.sin(angle);

          return (
            <circle
              key={`capsomer-${i}`}
              cx={x}
              cy={y}
              r="2.5"
              fill="#D98880"
              opacity="0.7"
            />
          );
        })}
      </motion.g>

      {/* ===== VIRAL GENOME (genetic material inside) ===== */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={genomePulseVariants}
      >
        {/* Coiled RNA/DNA strands */}
        <circle
          cx="40"
          cy="40"
          r="12"
          fill="none"
          stroke="#F39C12"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity="0.4"
        />

        <circle
          cx="40"
          cy="40"
          r="8"
          fill="none"
          stroke="#E67E22"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          opacity="0.5"
        />

        {/* Genome segments */}
        <circle cx="40" cy="36" r="2" fill="#F39C12" opacity="0.6" />
        <circle cx="36" cy="40" r="2" fill="#E67E22" opacity="0.6" />
        <circle cx="40" cy="44" r="2" fill="#F39C12" opacity="0.6" />
        <circle cx="44" cy="40" r="2" fill="#E67E22" opacity="0.6" />
      </motion.g>

      {/* ===== LIPID ENVELOPE (for enveloped viruses) ===== */}
      <circle
        cx="40"
        cy="40"
        r="21"
        fill="none"
        stroke="#E8DAEF"
        strokeWidth="1.5"
        strokeDasharray="2 2"
        opacity="0.4"
      />

      {/* Gradient definitions */}
      <defs>
        <radialGradient id="capsidGradient">
          <stop offset="0%" stopColor="#EC7063" />
          <stop offset="50%" stopColor="#E74C3C" />
          <stop offset="100%" stopColor="#C0392B" />
        </radialGradient>
      </defs>
    </motion.svg>
  );
}
