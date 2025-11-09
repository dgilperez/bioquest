'use client';

import { motion } from 'framer-motion';

interface AnimaliaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function AnimaliaIcon({ size = 32, className = '', animate = true }: AnimaliaIconProps) {
  const pawWaveVariants = {
    idle: {
      y: [0, -2, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const tailWagVariants = {
    idle: {
      rotate: [-10, 10, -10],
      transition: {
        duration: 1.2,
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
      {/* Shadow */}
      <ellipse
        cx="40"
        cy="72"
        rx="25"
        ry="3"
        fill="#2A3A2E"
        opacity="0.2"
      />

      {/* Tail */}
      <motion.path
        d="M 58 35 Q 68 30, 72 20"
        stroke="#6B5B4A"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        animate={animate ? 'idle' : undefined}
        variants={tailWagVariants as any}
        style={{ transformOrigin: '58px 35px' }}
      />

      {/* Body */}
      <ellipse
        cx="42"
        cy="42"
        rx="18"
        ry="16"
        fill="#8B7355"
      />

      {/* Body highlight */}
      <ellipse
        cx="40"
        cy="38"
        rx="12"
        ry="10"
        fill="#A68968"
        opacity="0.5"
      />

      {/* Head */}
      <circle
        cx="30"
        cy="32"
        r="14"
        fill="#8B7355"
      />

      {/* Head highlight */}
      <circle
        cx="28"
        cy="28"
        r="8"
        fill="#A68968"
        opacity="0.5"
      />

      {/* Ears */}
      <motion.ellipse
        cx="24"
        cy="22"
        rx="4"
        ry="7"
        fill="#6B5B4A"
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            rotate: [-5, 5, -5],
            transition: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          }
        }}
        style={{ transformOrigin: '24px 28px' }}
      />
      <motion.ellipse
        cx="36"
        cy="22"
        rx="4"
        ry="7"
        fill="#6B5B4A"
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            rotate: [5, -5, 5],
            transition: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          }
        }}
        style={{ transformOrigin: '36px 28px' }}
      />

      {/* Ear inner */}
      <ellipse cx="24" cy="23" rx="2" ry="4" fill="#C9A68C" opacity="0.6" />
      <ellipse cx="36" cy="23" rx="2" ry="4" fill="#C9A68C" opacity="0.6" />

      {/* Snout */}
      <ellipse
        cx="26"
        cy="36"
        rx="6"
        ry="5"
        fill="#A68968"
      />

      {/* Nose */}
      <ellipse
        cx="26"
        cy="34"
        rx="3"
        ry="2.5"
        fill="#3A2A1E"
      />

      {/* Eyes */}
      <circle cx="26" cy="30" r="2.5" fill="#2A1A0E" />
      <circle cx="34" cy="30" r="2.5" fill="#2A1A0E" />
      <circle cx="26" cy="29" r="1" fill="#FFF" opacity="0.7" />
      <circle cx="34" cy="29" r="1" fill="#FFF" opacity="0.7" />

      {/* Mouth */}
      <path
        d="M 26 36 Q 26 38, 24 38"
        stroke="#3A2A1E"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 26 36 Q 26 38, 28 38"
        stroke="#3A2A1E"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />

      {/* Front left leg */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={pawWaveVariants as any}
      >
        <rect
          x="28"
          y="52"
          width="6"
          height="16"
          rx="3"
          fill="#8B7355"
        />
        <ellipse
          cx="31"
          cy="68"
          rx="4"
          ry="3"
          fill="#6B5B4A"
        />
      </motion.g>

      {/* Front right leg */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            y: [0, -2, 0],
            transition: {
              duration: 1.5,
              delay: 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          },
        }}
      >
        <rect
          x="38"
          y="52"
          width="6"
          height="16"
          rx="3"
          fill="#8B7355"
        />
        <ellipse
          cx="41"
          cy="68"
          rx="4"
          ry="3"
          fill="#6B5B4A"
        />
      </motion.g>

      {/* Back left leg */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            y: [0, -2, 0],
            transition: {
              duration: 1.5,
              delay: 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          },
        }}
      >
        <rect
          x="48"
          y="52"
          width="6"
          height="16"
          rx="3"
          fill="#8B7355"
        />
        <ellipse
          cx="51"
          cy="68"
          rx="4"
          ry="3"
          fill="#6B5B4A"
        />
      </motion.g>

      {/* Back right leg */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={{
          idle: {
            y: [0, -2, 0],
            transition: {
              duration: 1.5,
              delay: 0.9,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          },
        }}
      >
        <rect
          x="56"
          y="52"
          width="6"
          height="16"
          rx="3"
          fill="#8B7355"
        />
        <ellipse
          cx="59"
          cy="68"
          rx="4"
          ry="3"
          fill="#6B5B4A"
        />
      </motion.g>
    </motion.svg>
  );
}
