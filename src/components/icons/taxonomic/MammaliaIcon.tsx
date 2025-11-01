'use client';

import { motion } from 'framer-motion';

interface MammaliaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Deer - representing mammals
 * Features: antlers, grazing motion, ear twitching
 * Based on Twemoji deer emoji (CC-BY 4.0)
 */
export function MammaliaIcon({ size = 32, className = '', animate = true }: MammaliaIconProps) {
  const headBobVariants = {
    idle: {
      y: [0, -2, 0, -1, 0],
      rotate: [0, -2, 0, 2, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const earTwitchVariants = (delay: number) => ({
    idle: {
      rotate: [0, -8, 0, 8, 0],
      transition: {
        duration: 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  const antlerShakeVariants = {
    idle: {
      rotate: [0, -1, 0, 1, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const blinkVariants = {
    idle: {
      scaleY: [1, 0.1, 1, 1, 1, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={className}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shadow */}
      <ellipse
        cx="18"
        cy="34"
        rx="12"
        ry="2"
        fill="#2A3A2E"
        opacity="0.25"
      />

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={headBobVariants}
      >
        {/* Left antler */}
        <motion.path
          fill="#662113"
          d="M15.971 15.083c-1.458-2.333-.667-7.708 0-8.958s-.542-2.458-1.5-.458-.996 3-3.162 2.458-1.088-3.292-.379-5.625c.729-2.4-.917-1.959-1.667-.458-.75 1.5-1.254 5.693-2.901 5.984-1.647.291-6.099.599-2.851-5.651C4.818-.139 2.773-.656 1.68 1.459.361 4.007-.404 7.25.221 8.625c1.113 2.448 3.483 2.95 6.983 2.284s6.101-.634 6.101 1.133c0 1.872.208 3.458 1.042 3.625s1.624-.584 1.624-.584z"
          animate={animate ? 'idle' : undefined}
          variants={antlerShakeVariants}
          style={{ transformOrigin: '8px 8px' }}
        />

        {/* Right antler */}
        <motion.path
          fill="#662113"
          d="M20.028 15.083c1.458-2.333.667-7.708 0-8.958s.542-2.458 1.5-.458.996 3 3.162 2.458 1.088-3.292.379-5.625c-.729-2.4.917-1.959 1.667-.458s1.254 5.693 2.901 5.984c1.647.292 6.099.599 2.851-5.651-1.307-2.514.737-3.031 1.831-.916 1.318 2.549 2.084 5.792 1.459 7.167-1.113 2.448-3.482 2.95-6.982 2.284s-6.102-.634-6.102 1.133c0 1.872-.208 3.458-1.041 3.625s-1.625-.585-1.625-.585z"
          animate={animate ? 'idle' : undefined}
          variants={antlerShakeVariants}
          style={{ transformOrigin: '28px 8px' }}
        />

        {/* Left ear */}
        <motion.path
          fill="#C1694F"
          d="M13.859 15.495c.596 2.392.16 4.422-2.231 5.017-2.392.596-6.344.559-7.958-1.303-2.294-2.646-2.531-6.391-1.189-6.725 1.34-.334 10.783.62 11.378 3.011z"
          animate={animate ? 'idle' : undefined}
          variants={earTwitchVariants(0)}
          style={{ transformOrigin: '7px 17px' }}
        />

        {/* Right ear */}
        <motion.path
          fill="#C1694F"
          d="M22.142 15.495c-.596 2.392-.16 4.422 2.231 5.017 2.392.596 6.345.559 7.958-1.303 2.295-2.646 2.531-6.391 1.189-6.725-1.34-.334-10.783.62-11.378 3.011z"
          animate={animate ? 'idle' : undefined}
          variants={earTwitchVariants(0.2)}
          style={{ transformOrigin: '29px 17px' }}
        />

        {/* Left ear inner detail */}
        <path
          fill="#272B2B"
          d="M2.48 12.484c-.943.235-1.102 2.157-.317 4.198l3.374-4.134c-1.457-.146-2.643-.167-3.057-.064z"
        />

        {/* Right ear inner detail */}
        <path
          fill="#272B2B"
          d="M33.521 12.484c-.419-.104-1.632-.083-3.118.069l3.445 4.106c.774-2.032.613-3.941-.327-4.175z"
        />

        {/* Left snout/nose area */}
        <path
          fill="#E6AAAA"
          d="M12.052 15.997c.871 1.393-.553 2.229-1.946 3.099-1.394.871-4.608-.203-5.479-1.596-.871-1.394-1.186-3.131-.676-3.45.51-.318 7.23.553 8.101 1.947z"
        />

        {/* Right snout/nose area */}
        <path
          fill="#E6AAAA"
          d="M23.948 15.997c-.871 1.393.553 2.229 1.945 3.099 1.394.871 4.608-.203 5.479-1.596.871-1.394 1.185-3.131.676-3.45-.51-.318-7.229.553-8.1 1.947z"
        />

        {/* Face/body */}
        <path
          fill="#C1694F"
          d="M18 14.125h-.002c-10.271.001-8.703 3.959-7.603 10.541 1.1 6.584 2.401 11.256 7.605 11.256 5.203 0 6.502-4.672 7.604-11.256 1.099-6.582 2.666-10.54-7.604-10.541z"
        />

        {/* Left eye */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={blinkVariants}
        >
          <path
            fill="#272B2B"
            d="M11.826 22.851s-.75-1.299.549-2.049 2.049.549 2.049.549l.75 1.299s.75 1.299-.549 2.049-2.049-.549-2.049-.549l-.75-1.299z"
          />
        </motion.g>

        {/* Right eye */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={blinkVariants}
        >
          <path
            fill="#272B2B"
            d="M21.576 21.351s.75-1.299 2.049-.549.549 2.049.549 2.049l-.75 1.299s-.75 1.299-2.049.549-.549-2.049-.549-2.049l.75-1.299z"
          />
        </motion.g>

        {/* Nose */}
        <path
          fill="#272B2B"
          d="M15.226 34.266c-.925-.188 1.85-3.596 2.774-3.596s3.699 3.407 2.774 3.596c-.924.188-4.624.188-5.548 0z"
        />
      </motion.g>
    </motion.svg>
  );
}
