'use client';

import { motion } from 'framer-motion';

interface FungiIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Detailed Amanita mushroom icon adapted from the approved logo RedMushroom component
 * Features: multi-layer cap with spots, detailed gills, textured stem, proper shading
 */
export function FungiIcon({ size = 32, className = '', animate = true }: FungiIconProps) {
  const growVariants = {
    idle: {
      scale: [1, 1.06, 1],
      y: [0, -2, 0],
      rotate: [-1.5, 1.5, -1.5],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const capBreatheVariants = {
    idle: {
      scaleY: [1, 1.05, 1],
      scaleX: [1, 0.98, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const spotVariants = (delay: number) => ({
    idle: {
      scale: animate ? [1, 1.2, 1] : 1,
      opacity: animate ? [0.95, 1, 0.95] : 0.95,
      transition: {
        duration: 1.8,
        delay: delay * 0.08,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      animate={animate ? 'idle' : undefined}
      variants={growVariants as any}
      whileTap={{ scale: 0.9, rotate: -5 }}
      whileHover={{ scale: 1.1 }}
      style={{ transformOrigin: 'center' }}
    >
      {/* Ground shadow */}
      <ellipse
        cx="40"
        cy="74"
        rx="12"
        ry="2.5"
        fill="#000000"
        opacity="0.1"
      />

      {/* Stem base - wider at bottom */}
      <path
        d="M 34 72
           C 34 70.5, 34.5 69, 35 67.5
           L 36 60
           L 44 60
           L 45 67.5
           C 45.5 69, 46 70.5, 46 72
           Z"
        fill="#E8D5B8"
      />

      {/* Stem texture lines */}
      {[58, 60, 62, 64, 66, 68, 70].map((y, i) => (
        <path
          key={`stem-texture-${i}`}
          d={`M 37 ${y} Q 40 ${y + 0.5}, 43 ${y}`}
          stroke="#D4C8B0"
          strokeWidth="0.3"
          fill="none"
          opacity="0.4"
        />
      ))}

      {/* Main stem with gradient effect */}
      <ellipse cx="40" cy="64" rx="7" ry="14" fill="#F5E8D0" />
      <ellipse cx="40" cy="63" rx="6.5" ry="13" fill="#F5E8D0" opacity="0.8" />

      {/* Stem highlight - left side */}
      <ellipse
        cx="37"
        cy="62"
        rx="2.5"
        ry="10"
        fill="#FFFFFF"
        opacity="0.35"
      />

      {/* Stem shadow - right side */}
      <ellipse
        cx="42.5"
        cy="63.5"
        rx="2"
        ry="11"
        fill="#D4C8B0"
        opacity="0.3"
      />

      {/* Stem ring (annulus) */}
      <ellipse
        cx="40"
        cy="55"
        rx="7.5"
        ry="2.5"
        fill="#E8D5B8"
      />
      <ellipse
        cx="40"
        cy="54.5"
        rx="7"
        ry="1.8"
        fill="#D4C8B0"
      />

      {/* Gills underneath cap - multiple layers */}
      <ellipse
        cx="40"
        cy="52"
        rx="21"
        ry="5"
        fill="#D4A48C"
      />
      <ellipse
        cx="40"
        cy="51.5"
        rx="20"
        ry="4"
        fill="#C89880"
      />

      {/* Individual gill lines radiating from center */}
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i * 20) - 180;
        const rad = (angle * Math.PI) / 180;
        const x1 = 40 + Math.cos(rad) * 6;
        const y1 = 52 + Math.sin(rad) * 1.5;
        const x2 = 40 + Math.cos(rad) * 20;
        const y2 = 52 + Math.sin(rad) * 4.5;

        return (
          <line
            key={`gill-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#B8826C"
            strokeWidth="0.4"
            opacity="0.4"
          />
        );
      })}

      {/* Cap underside shadow curve */}
      <path
        d="M 19 52 Q 19 50, 23 49 Q 30.5 48, 40 48 Q 49.5 48, 57 49 Q 61 50, 61 52"
        fill="#B8826C"
        opacity="0.3"
      />

      {/* Main cap - multiple layers for 3D effect */}
      <motion.ellipse
        cx="40"
        cy="44"
        rx="22"
        ry="14"
        fill="#C85A4F"
        animate={animate ? 'idle' : undefined}
        variants={capBreatheVariants as any}
        style={{ transformOrigin: '40px 44px' }}
      />

      {/* Cap mid-tone */}
      <motion.ellipse
        cx="40"
        cy="43"
        rx="21"
        ry="13"
        fill="#D4654F"
        opacity="0.7"
        animate={animate ? 'idle' : undefined}
        variants={capBreatheVariants as any}
        style={{ transformOrigin: '40px 43px' }}
      />

      {/* Cap top curve - darker for rounded top */}
      <path
        d="M 18 44
           Q 18 36, 23 31
           Q 30 27, 40 26
           Q 50 27, 57 31
           Q 62 36, 62 44"
        fill="#B24943"
      />

      {/* Cap top highlight area */}
      <ellipse
        cx="33"
        cy="38"
        rx="13"
        ry="8"
        fill="#E87C5F"
        opacity="0.4"
      />

      {/* Subtle cap edge rim */}
      <ellipse
        cx="40"
        cy="51"
        rx="21.5"
        ry="4.5"
        fill="none"
        stroke="#A83F34"
        strokeWidth="0.6"
        opacity="0.3"
      />

      {/* White spots - varied sizes with animation */}
      {/* Large central spot */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(0) as any}>
        <ellipse
          cx="40"
          cy="36"
          rx="3.8"
          ry="3.5"
          fill="#F5E8D0"
          opacity="0.95"
        />
        <ellipse
          cx="39.5"
          cy="35.5"
          rx="1.8"
          ry="1.5"
          fill="#FFFFFF"
          opacity="0.6"
        />
      </motion.g>

      {/* Upper left spot */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(1) as any}>
        <ellipse
          cx="30"
          cy="40"
          rx="2.9"
          ry="2.6"
          fill="#F5E8D0"
          opacity="0.95"
        />
        <ellipse
          cx="29.5"
          cy="39.5"
          rx="1.2"
          ry="1"
          fill="#FFFFFF"
          opacity="0.5"
        />
      </motion.g>

      {/* Upper right spot */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(2) as any}>
        <ellipse
          cx="50"
          cy="39.5"
          rx="2.6"
          ry="2.3"
          fill="#F5E8D0"
          opacity="0.92"
        />
        <ellipse
          cx="49.5"
          cy="39"
          rx="1"
          ry="0.9"
          fill="#FFFFFF"
          opacity="0.5"
        />
      </motion.g>

      {/* Lower left spot */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(3) as any}>
        <ellipse
          cx="26"
          cy="45"
          rx="2.2"
          ry="2"
          fill="#F5E8D0"
          opacity="0.9"
        />
        <ellipse
          cx="25.7"
          cy="44.7"
          rx="0.9"
          ry="0.8"
          fill="#FFFFFF"
          opacity="0.4"
        />
      </motion.g>

      {/* Mid-left spot */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(4) as any}>
        <ellipse
          cx="33"
          cy="44.5"
          rx="2.4"
          ry="2.2"
          fill="#F5E8D0"
          opacity="0.93"
        />
        <ellipse
          cx="32.7"
          cy="44.2"
          rx="1"
          ry="0.9"
          fill="#FFFFFF"
          opacity="0.45"
        />
      </motion.g>

      {/* Lower right spot */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(5) as any}>
        <ellipse
          cx="48"
          cy="46"
          rx="2.3"
          ry="2.1"
          fill="#F5E8D0"
          opacity="0.91"
        />
        <ellipse
          cx="47.7"
          cy="45.7"
          rx="0.95"
          ry="0.85"
          fill="#FFFFFF"
          opacity="0.42"
        />
      </motion.g>

      {/* Far left small spot */}
      <motion.circle
        cx="22"
        cy="43"
        r="1.7"
        fill="#F5E8D0"
        opacity="0.88"
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(6) as any}
      />

      {/* Far right small spot */}
      <motion.circle
        cx="55"
        cy="44"
        r="1.8"
        fill="#F5E8D0"
        opacity="0.89"
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(7) as any}
      />

      {/* Tiny spots for extra detail */}
      <motion.circle
        cx="34.5"
        cy="49"
        r="1.2"
        fill="#F5E8D0"
        opacity="0.85"
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(8) as any}
      />

      <motion.circle
        cx="45.5"
        cy="49.5"
        r="1.3"
        fill="#F5E8D0"
        opacity="0.86"
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(9) as any}
      />

      <motion.circle
        cx="28"
        cy="47"
        r="1"
        fill="#F5E8D0"
        opacity="0.82"
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(10) as any}
      />

      <motion.circle
        cx="52"
        cy="47.5"
        r="1.2"
        fill="#F5E8D0"
        opacity="0.83"
        animate={animate ? 'idle' : undefined}
        variants={spotVariants(11) as any}
      />
    </motion.svg>
  );
}
