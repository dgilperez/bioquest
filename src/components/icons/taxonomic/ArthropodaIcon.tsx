'use client';

import { motion } from 'framer-motion';

interface ArthropodaIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Peacock jumping spider (Maratus) in pre-jump crouch position
 * Features: 8 legs, multiple eyes, colorful abdominal flaps, jumping pose
 * Famous for their courtship displays and incredible jumping ability
 */
export function ArthropodaIcon({ size = 32, className = '', animate = true }: ArthropodaIconProps) {
  const legTwitchVariants = (delay: number, angle: number) => ({
    idle: {
      rotate: [angle, angle - 5, angle, angle + 5, angle],
      transition: {
        duration: 1.2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  });

  const flapDisplayVariants = {
    idle: {
      scale: [1, 1.15, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const crouchBounceVariants = {
    idle: {
      y: [0, -2, 0, -1, 0],
      transition: {
        duration: 1.5,
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
      whileTap={{ scale: 0.85, y: -5 }}
      whileHover={{ scale: 1.1 }}
    >
      {/* Shadow */}
      <ellipse
        cx="40"
        cy="72"
        rx="20"
        ry="4"
        fill="#2A3A2E"
        opacity="0.3"
      />

      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={crouchBounceVariants as any}
      >
        {/* ===== LEGS (8 legs - 4 pairs) ===== */}
        {/* Front left leg (leg 1) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0, -25) as any}
          style={{ transformOrigin: '30px 38px' }}
        >
          <path
            d="M 30 38 L 22 32 L 16 28 L 12 24"
            stroke="#3A2A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Joints */}
          <circle cx="22" cy="32" r="1.5" fill="#2A1A0A" />
          <circle cx="16" cy="28" r="1.5" fill="#2A1A0A" />
        </motion.g>

        {/* Front right leg (leg 2) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0, 25) as any}
          style={{ transformOrigin: '50px 38px' }}
        >
          <path
            d="M 50 38 L 58 32 L 64 28 L 68 24"
            stroke="#3A2A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="58" cy="32" r="1.5" fill="#2A1A0A" />
          <circle cx="64" cy="28" r="1.5" fill="#2A1A0A" />
        </motion.g>

        {/* Second left leg (leg 3) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0.1, -45) as any}
          style={{ transformOrigin: '28px 42px' }}
        >
          <path
            d="M 28 42 L 18 40 L 12 38 L 8 36"
            stroke="#3A2A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="18" cy="40" r="1.5" fill="#2A1A0A" />
          <circle cx="12" cy="38" r="1.5" fill="#2A1A0A" />
        </motion.g>

        {/* Second right leg (leg 4) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0.1, 45) as any}
          style={{ transformOrigin: '52px 42px' }}
        >
          <path
            d="M 52 42 L 62 40 L 68 38 L 72 36"
            stroke="#3A2A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="62" cy="40" r="1.5" fill="#2A1A0A" />
          <circle cx="68" cy="38" r="1.5" fill="#2A1A0A" />
        </motion.g>

        {/* Third left leg (leg 5) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0.2, -65) as any}
          style={{ transformOrigin: '28px 48px' }}
        >
          <path
            d="M 28 48 L 18 52 L 12 56 L 8 60"
            stroke="#3A2A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="18" cy="52" r="1.5" fill="#2A1A0A" />
          <circle cx="12" cy="56" r="1.5" fill="#2A1A0A" />
        </motion.g>

        {/* Third right leg (leg 6) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0.2, 65) as any}
          style={{ transformOrigin: '52px 48px' }}
        >
          <path
            d="M 52 48 L 62 52 L 68 56 L 72 60"
            stroke="#3A2A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="62" cy="52" r="1.5" fill="#2A1A0A" />
          <circle cx="68" cy="56" r="1.5" fill="#2A1A0A" />
        </motion.g>

        {/* Back left leg (leg 7) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0.3, -85) as any}
          style={{ transformOrigin: '30px 52px' }}
        >
          <path
            d="M 30 52 L 22 58 L 16 62 L 12 66"
            stroke="#3A2A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="22" cy="58" r="1.5" fill="#2A1A0A" />
          <circle cx="16" cy="62" r="1.5" fill="#2A1A0A" />
        </motion.g>

        {/* Back right leg (leg 8) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0.3, 85) as any}
          style={{ transformOrigin: '50px 52px' }}
        >
          <path
            d="M 50 52 L 58 58 L 64 62 L 68 66"
            stroke="#3A2A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="58" cy="58" r="1.5" fill="#2A1A0A" />
          <circle cx="64" cy="62" r="1.5" fill="#2A1A0A" />
        </motion.g>

        {/* ===== BODY ===== */}
        {/* Abdomen (opisthosoma) - rounded back end */}
        <ellipse
          cx="40"
          cy="54"
          rx="12"
          ry="14"
          fill="#2A1A0A"
        />

        {/* Abdomen shine/texture */}
        <ellipse
          cx="40"
          cy="52"
          rx="9"
          ry="10"
          fill="#3A2A1A"
          opacity="0.6"
        />

        {/* Colorful peacock display flaps (extended from abdomen) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={flapDisplayVariants as any}
        >
          {/* Left flap - iridescent blue/green */}
          <ellipse
            cx="26"
            cy="50"
            rx="11"
            ry="13"
            fill="url(#peacockGradientLeft)"
            opacity="0.9"
          />

          {/* Right flap - iridescent blue/green */}
          <ellipse
            cx="54"
            cy="50"
            rx="11"
            ry="13"
            fill="url(#peacockGradientRight)"
            opacity="0.9"
          />

          {/* Eye spots on flaps */}
          <circle cx="26" cy="50" r="4.5" fill="#FF4500" opacity="0.8" />
          <circle cx="26" cy="50" r="2.5" fill="#FFD700" />
          <circle cx="54" cy="50" r="4.5" fill="#FF4500" opacity="0.8" />
          <circle cx="54" cy="50" r="2.5" fill="#FFD700" />
        </motion.g>

        {/* Pedicel (narrow waist connecting cephalothorax to abdomen) */}
        <rect
          x="37"
          y="42"
          width="6"
          height="6"
          rx="3"
          fill="#3A2A1A"
        />

        {/* Cephalothorax (prosoma - head + thorax fused) */}
        <ellipse
          cx="40"
          cy="36"
          rx="13"
          ry="11"
          fill="#4A3A2A"
        />

        {/* Carapace texture/shine */}
        <ellipse
          cx="40"
          cy="34"
          rx="10"
          ry="8"
          fill="#5A4A3A"
          opacity="0.5"
        />

        {/* ===== EYES (8 eyes arranged in rows) ===== */}
        {/* Front large eyes */}
        <circle cx="37" cy="34" r="3" fill="#1A1A1A" />
        <circle cx="43" cy="34" r="3" fill="#1A1A1A" />
        <circle cx="37" cy="34" r="1.5" fill="#FFFFFF" opacity="0.6" />
        <circle cx="43" cy="34" r="1.5" fill="#FFFFFF" opacity="0.6" />

        {/* Side eyes (smaller) */}
        <circle cx="32" cy="36" r="2" fill="#1A1A1A" />
        <circle cx="48" cy="36" r="2" fill="#1A1A1A" />
        <circle cx="32" cy="36" r="0.8" fill="#FFFFFF" opacity="0.4" />
        <circle cx="48" cy="36" r="0.8" fill="#FFFFFF" opacity="0.4" />

        {/* Rear eyes (tiny) */}
        <circle cx="34" cy="40" r="1.5" fill="#1A1A1A" />
        <circle cx="46" cy="40" r="1.5" fill="#1A1A1A" />

        {/* Chelicerae (fangs) - small appendages near mouth */}
        <path
          d="M 38 35 L 36 38"
          stroke="#2A1A0A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 42 35 L 44 38"
          stroke="#2A1A0A"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Pedipalps (leg-like palps - shorter than legs, used for sensing/mating) */}
        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0.05, -15) as any}
          style={{ transformOrigin: '33px 34px' }}
        >
          <path
            d="M 33 34 L 26 30 L 22 27"
            stroke="#4A3A2A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Pedipalp joint */}
          <circle cx="26" cy="30" r="1.5" fill="#3A2A1A" />
          {/* Bulb at end (for male spiders - mating organ) */}
          <circle cx="22" cy="27" r="2" fill="#3A2A1A" />
        </motion.g>

        <motion.g
          animate={animate ? 'idle' : undefined}
          variants={legTwitchVariants(0.05, 15) as any}
          style={{ transformOrigin: '47px 34px' }}
        >
          <path
            d="M 47 34 L 54 30 L 58 27"
            stroke="#4A3A2A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="54" cy="30" r="1.5" fill="#3A2A1A" />
          <circle cx="58" cy="27" r="2" fill="#3A2A1A" />
        </motion.g>
      </motion.g>

      {/* Gradient definitions for iridescent flaps */}
      <defs>
        <radialGradient id="peacockGradientLeft">
          <stop offset="0%" stopColor="#00CED1" />
          <stop offset="50%" stopColor="#4169E1" />
          <stop offset="100%" stopColor="#8A2BE2" />
        </radialGradient>
        <radialGradient id="peacockGradientRight">
          <stop offset="0%" stopColor="#00FA9A" />
          <stop offset="50%" stopColor="#00CED1" />
          <stop offset="100%" stopColor="#4169E1" />
        </radialGradient>
      </defs>
    </motion.svg>
  );
}
