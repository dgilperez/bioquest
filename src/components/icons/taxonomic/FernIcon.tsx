'use client';

import { motion } from 'framer-motion';

interface FernIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Unfurling fern fiddlehead (crozier)
 * Features: dramatic spiral unwinding, developing pinnae, visible unfurling motion
 * Iconic representation of plant growth and Plantae kingdom
 */
export function FernIcon({ size = 32, className = '', animate = true }: FernIconProps) {
  const stemSway = {
    idle: {
      rotate: [0, -2, 0, 2, 0],
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

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={stemSway}
        style={{ transformOrigin: '38px 64px' }}
      >
        {/* ===== STEM (stipe) ===== */}
        <path
          d="M 38 64 Q 40 58, 40 52 Q 40 46, 39 40 Q 38 34, 37 28"
          stroke="#4A6B4A"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 38 64 Q 40 58, 40 52 Q 40 46, 39 40 Q 38 34, 37 28"
          stroke="#5A8B5A"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />

        {/* ===== FIDDLEHEAD SPIRAL - ANIMATED ===== */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={{
            idle: {
              rotate: [0, -30, -60, -90, -60, -30, 0],
              scale: [1, 1.1, 1.2, 1.3, 1.2, 1.1, 1],
              transition: {
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            }
          }}
          style={{ transformOrigin: '33px 29px' }}
        >
          {/* Outer coil */}
          <path
            d="M 37 28
               C 35 26, 32 25, 30 26
               C 28 27, 27 30, 28 32
               C 29 34, 32 35, 34 34
               C 36 33, 37 31, 36 29
               C 35 27, 33 26.5, 31.5 27.5"
            stroke="#4A6B4A"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Middle coil */}
          <path
            d="M 37 28
               C 35 26.5, 33 26, 31.5 27
               C 30 28, 29.5 30, 30.5 31.5
               C 31.5 33, 33.5 33.5, 35 32.5
               C 36 31.5, 36 30, 35 29"
            stroke="#5A8B5A"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Inner coil */}
          <path
            d="M 37 28
               C 35.5 27, 34 26.5, 32.5 27.5
               C 31 28.5, 30.5 30, 31.5 31
               C 32.5 32, 34 32, 35 31"
            stroke="#6A9B6A"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Center */}
          <circle cx="33" cy="29" r="2.5" fill="#5A8B5A" />
          <circle cx="33" cy="29" r="1.5" fill="#6A9B6A" opacity="0.8" />

          {/* Brown scales */}
          {[
            { cx: 32, cy: 27, r: 0.8 },
            { cx: 30, cy: 29, r: 1 },
            { cx: 31, cy: 31, r: 0.9 },
            { cx: 33, cy: 32, r: 1.1 },
            { cx: 35, cy: 30, r: 0.8 },
          ].map((scale, i) => (
            <ellipse
              key={`scale-${i}`}
              cx={scale.cx}
              cy={scale.cy}
              rx={scale.r * 1.5}
              ry={scale.r}
              fill="#8B6B3A"
              opacity="0.6"
              transform={`rotate(${i * 30} ${scale.cx} ${scale.cy})`}
            />
          ))}
        </motion.g>

        {/* ===== DEVELOPING PINNAE ===== */}
        {/* Lower pinnae - most developed */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={{
            idle: {
              scaleX: [0.8, 1, 0.8],
              opacity: [0.6, 1, 0.6],
              transition: {
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            }
          }}
          style={{ transformOrigin: '40px 52px' }}
        >
          <ellipse cx="46" cy="52" rx="7" ry="2.5" fill="#5A8B5A" />
          <ellipse cx="46" cy="52" rx="5" ry="1.8" fill="#6A9B6A" opacity="0.7" />
          <ellipse cx="34" cy="53" rx="6" ry="2" fill="#5A8B5A" />
          <ellipse cx="34" cy="53" rx="4" ry="1.5" fill="#6A9B6A" opacity="0.7" />
        </motion.g>

        {/* Mid pinnae */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={{
            idle: {
              scaleX: [0.6, 0.9, 0.6],
              opacity: [0.4, 0.8, 0.4],
              transition: {
                duration: 6,
                delay: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            }
          }}
          style={{ transformOrigin: '39px 42px' }}
        >
          <ellipse cx="44" cy="42" rx="5" ry="2" fill="#5A8B5A" opacity="0.8" />
          <ellipse cx="35" cy="43" rx="4.5" ry="1.8" fill="#5A8B5A" opacity="0.8" />
        </motion.g>

        {/* Upper pinnae - just emerging */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={{
            idle: {
              scaleX: [0.3, 0.6, 0.3],
              opacity: [0.3, 0.6, 0.3],
              transition: {
                duration: 6,
                delay: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            }
          }}
          style={{ transformOrigin: '38px 34px' }}
        >
          <ellipse cx="41" cy="34" rx="3" ry="1.5" fill="#5A8B5A" opacity="0.5" />
          <ellipse cx="36" cy="35" rx="2.5" ry="1.3" fill="#5A8B5A" opacity="0.5" />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
