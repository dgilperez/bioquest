'use client';

import { motion } from 'framer-motion';

interface RedMushroomProps {
  shouldAnimate: boolean;
  duration: (d: number) => number;
}

export default function RedMushroom({ shouldAnimate, duration }: RedMushroomProps) {
  const growVariants = {
    hidden: { scale: 0, opacity: 0, y: 15 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        delay: duration(1.5),
        duration: duration(1.4),
        type: 'spring',
        stiffness: 100,
        damping: 11,
      },
    },
  } as any;

  const spotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: duration(delay),
        duration: duration(0.5),
        type: 'spring',
        stiffness: 180,
      },
    }),
  } as any;

  return (
    <motion.g
      id="red-mushroom"
      style={{ transformOrigin: '225px 120px' }}
      variants={growVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Ground shadow */}
      <ellipse
        cx="225"
        cy="145"
        rx="15"
        ry="4"
        fill="#000000"
        opacity="0.1"
      />

      {/* Stem base - wider at bottom */}
      <path
        d="M 213 142
           C 213 140, 214 138, 215 136
           L 217 122
           L 233 122
           L 235 136
           C 236 138, 237 140, 237 142
           Z"
        fill="#E8D5B8"
      />

      {/* Stem texture lines */}
      {[118, 122, 126, 130, 134, 138].map((y, i) => (
        <path
          key={`stem-texture-${i}`}
          d={`M 218 ${y} Q 225 ${y + 1}, 232 ${y}`}
          stroke="#D4C8B0"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />
      ))}

      {/* Main stem with gradient effect using multiple paths */}
      <ellipse cx="225" cy="130" rx="12" ry="24" fill="#F5E8D0" />
      <ellipse cx="225" cy="128" rx="11" ry="22" fill="#F5E8D0" opacity="0.8" />

      {/* Stem highlight - left side */}
      <ellipse
        cx="220"
        cy="125"
        rx="4"
        ry="16"
        fill="#FFFFFF"
        opacity="0.35"
      />

      {/* Stem shadow - right side */}
      <ellipse
        cx="230"
        cy="128"
        rx="3"
        ry="18"
        fill="#D4C8B0"
        opacity="0.3"
      />

      {/* Stem top ring (annulus) where cap meets stem */}
      <ellipse
        cx="225"
        cy="114"
        rx="13"
        ry="4.5"
        fill="#E8D5B8"
      />
      <ellipse
        cx="225"
        cy="113"
        rx="12"
        ry="3"
        fill="#D4C8B0"
      />

      {/* Gills underneath cap - multiple layers for depth */}
      <ellipse
        cx="225"
        cy="108"
        rx="36"
        ry="9"
        fill="#D4A48C"
      />
      <ellipse
        cx="225"
        cy="107"
        rx="34"
        ry="7"
        fill="#C89880"
      />

      {/* Individual gill lines radiating from center */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15) - 180;
        const rad = (angle * Math.PI) / 180;
        const x1 = 225 + Math.cos(rad) * 10;
        const y1 = 108 + Math.sin(rad) * 3;
        const x2 = 225 + Math.cos(rad) * 34;
        const y2 = 108 + Math.sin(rad) * 8;

        return (
          <line
            key={`gill-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#B8826C"
            strokeWidth="0.6"
            opacity="0.4"
          />
        );
      })}

      {/* Cap underside shadow curve */}
      <path
        d="M 189 108 Q 189 104, 197 102 Q 211 100, 225 100 Q 239 100, 253 102 Q 261 104, 261 108"
        fill="#B8826C"
        opacity="0.3"
      />

      {/* Main cap - multiple layers for 3D effect */}
      {/* Base cap layer */}
      <ellipse
        cx="225"
        cy="92"
        rx="38"
        ry="24"
        fill="#C85A4F"
      />

      {/* Cap mid-tone for dimension */}
      <ellipse
        cx="225"
        cy="90"
        rx="36"
        ry="22"
        fill="#D4654F"
        opacity="0.7"
      />

      {/* Cap top curve - darker for the rounded top */}
      <path
        d="M 187 92
           Q 187 80, 197 73
           Q 207 68, 225 66
           Q 243 68, 253 73
           Q 263 80, 263 92"
        fill="#B24943"
      />

      {/* Cap top highlight area */}
      <ellipse
        cx="212"
        cy="82"
        rx="22"
        ry="14"
        fill="#E87C5F"
        opacity="0.4"
      />

      {/* Subtle cap edge rim */}
      <ellipse
        cx="225"
        cy="104"
        rx="37"
        ry="8"
        fill="none"
        stroke="#A83F34"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* White spots - varied sizes and irregular shapes */}
      {/* Large central spot */}
      <motion.g variants={spotVariants} custom={2.0} initial="hidden" animate="visible">
        <ellipse
          cx="225"
          cy="78"
          rx="6.5"
          ry="6"
          fill="#F5E8D0"
          opacity="0.95"
        />
        <ellipse
          cx="224"
          cy="77"
          rx="3"
          ry="2.5"
          fill="#FFFFFF"
          opacity="0.6"
        />
      </motion.g>

      {/* Upper left spot */}
      <motion.g variants={spotVariants} custom={2.05} initial="hidden" animate="visible">
        <ellipse
          cx="208"
          cy="85"
          rx="5"
          ry="4.5"
          fill="#F5E8D0"
          opacity="0.95"
        />
        <ellipse
          cx="207"
          cy="84"
          rx="2"
          ry="1.8"
          fill="#FFFFFF"
          opacity="0.5"
        />
      </motion.g>

      {/* Upper right spot */}
      <motion.g variants={spotVariants} custom={2.1} initial="hidden" animate="visible">
        <ellipse
          cx="242"
          cy="84"
          rx="4.5"
          ry="4"
          fill="#F5E8D0"
          opacity="0.92"
        />
        <ellipse
          cx="241"
          cy="83"
          rx="1.8"
          ry="1.6"
          fill="#FFFFFF"
          opacity="0.5"
        />
      </motion.g>

      {/* Lower left spot */}
      <motion.g variants={spotVariants} custom={2.15} initial="hidden" animate="visible">
        <ellipse
          cx="198"
          cy="94"
          rx="3.8"
          ry="3.5"
          fill="#F5E8D0"
          opacity="0.9"
        />
        <ellipse
          cx="197.5"
          cy="93.5"
          rx="1.5"
          ry="1.3"
          fill="#FFFFFF"
          opacity="0.4"
        />
      </motion.g>

      {/* Mid-left spot */}
      <motion.g variants={spotVariants} custom={2.08} initial="hidden" animate="visible">
        <ellipse
          cx="213"
          cy="93"
          rx="4.2"
          ry="3.8"
          fill="#F5E8D0"
          opacity="0.93"
        />
        <ellipse
          cx="212.5"
          cy="92.5"
          rx="1.7"
          ry="1.5"
          fill="#FFFFFF"
          opacity="0.45"
        />
      </motion.g>

      {/* Lower right spot */}
      <motion.g variants={spotVariants} custom={2.18} initial="hidden" animate="visible">
        <ellipse
          cx="237"
          cy="96"
          rx="4"
          ry="3.6"
          fill="#F5E8D0"
          opacity="0.91"
        />
        <ellipse
          cx="236.5"
          cy="95.5"
          rx="1.6"
          ry="1.4"
          fill="#FFFFFF"
          opacity="0.42"
        />
      </motion.g>

      {/* Far left small spot */}
      <motion.g variants={spotVariants} custom={2.13} initial="hidden" animate="visible">
        <ellipse
          cx="193"
          cy="90"
          rx="3"
          ry="2.8"
          fill="#F5E8D0"
          opacity="0.88"
        />
      </motion.g>

      {/* Far right small spot */}
      <motion.g variants={spotVariants} custom={2.2} initial="hidden" animate="visible">
        <ellipse
          cx="252"
          cy="92"
          rx="3.2"
          ry="3"
          fill="#F5E8D0"
          opacity="0.89"
        />
      </motion.g>

      {/* Tiny spots for extra detail */}
      <motion.circle
        cx="218"
        cy="100"
        r="2"
        fill="#F5E8D0"
        opacity="0.85"
        variants={spotVariants}
        custom={2.22}
        initial="hidden"
        animate="visible"
      />

      <motion.circle
        cx="232"
        cy="101"
        r="2.2"
        fill="#F5E8D0"
        opacity="0.86"
        variants={spotVariants}
        custom={2.24}
        initial="hidden"
        animate="visible"
      />

      <motion.circle
        cx="204"
        cy="98"
        r="1.8"
        fill="#F5E8D0"
        opacity="0.82"
        variants={spotVariants}
        custom={2.17}
        initial="hidden"
        animate="visible"
      />

      <motion.circle
        cx="246"
        cy="99"
        r="2"
        fill="#F5E8D0"
        opacity="0.83"
        variants={spotVariants}
        custom={2.21}
        initial="hidden"
        animate="visible"
      />
    </motion.g>
  );
}
