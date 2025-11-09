'use client';

import { motion } from 'framer-motion';

interface PurpleMushroomProps {
  shouldAnimate: boolean;
  duration: (d: number) => number;
}

export default function PurpleMushroom({ shouldAnimate, duration }: PurpleMushroomProps) {
  const growVariants = {
    hidden: { scale: 0, opacity: 0, y: 8 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        delay: duration(2.0),
        duration: duration(1.15),
        type: 'spring',
        stiffness: 108,
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
        duration: duration(0.35),
        type: 'spring',
        stiffness: 200,
      },
    }),
  } as any;

  return (
    <motion.g
      id="purple-mushroom"
      style={{ transformOrigin: '105px 315px' }}
      variants={growVariants}
      initial="hidden"
      animate={shouldAnimate ? 'visible' : 'visible'}
    >
      {/* Ground shadow */}
      <ellipse
        cx="105"
        cy="334"
        rx="9"
        ry="2.5"
        fill="#000000"
        opacity="0.1"
      />

      {/* Stem base - wider at bottom */}
      <path
        d="M 98 331
           C 98 329, 99 328, 100 326
           L 101 318
           L 109 318
           L 110 326
           C 111 328, 112 329, 112 331
           Z"
        fill="#D4C8D8"
      />

      {/* Stem texture lines */}
      {[315, 318, 321, 324, 327, 330].map((y, i) => (
        <path
          key={`stem-texture-${i}`}
          d={`M 102 ${y} Q 105 ${y + 0.4}, 108 ${y}`}
          stroke="#C8B8C8"
          strokeWidth="0.35"
          fill="none"
          opacity="0.45"
        />
      ))}

      {/* Main stem with gradient effect */}
      <ellipse cx="105" cy="322" rx="7.5" ry="15" fill="#E8D5C8" />
      <ellipse cx="105" cy="321" rx="7" ry="14" fill="#E8D5C8" opacity="0.9" />

      {/* Stem highlight - left side */}
      <ellipse
        cx="101.5"
        cy="319"
        rx="2.5"
        ry="10"
        fill="#FFFFFF"
        opacity="0.28"
      />

      {/* Stem shadow - right side */}
      <ellipse
        cx="108.5"
        cy="321"
        rx="2"
        ry="11"
        fill="#C8B8C8"
        opacity="0.25"
      />

      {/* Stem top ring (annulus) - subtle on smaller mushroom */}
      <ellipse
        cx="105"
        cy="310"
        rx="8.5"
        ry="3"
        fill="#D4C8D8"
      />
      <ellipse
        cx="105"
        cy="309"
        rx="7.5"
        ry="2"
        fill="#C8B8C8"
      />

      {/* Gills underneath cap - multiple layers for depth */}
      <ellipse
        cx="105"
        cy="304"
        rx="23"
        ry="6"
        fill="#6D4B75"
      />
      <ellipse
        cx="105"
        cy="303"
        rx="21"
        ry="4.5"
        fill="#5D3B65"
      />

      {/* Individual gill lines radiating from center */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 22.5) - 180;
        const rad = (angle * Math.PI) / 180;
        const x1 = 105 + Math.cos(rad) * 7;
        const y1 = 304 + Math.sin(rad) * 2;
        const x2 = 105 + Math.cos(rad) * 21;
        const y2 = 304 + Math.sin(rad) * 5.5;

        return (
          <line
            key={`gill-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#4D2B55"
            strokeWidth="0.45"
            opacity="0.5"
          />
        );
      })}

      {/* Cap underside shadow curve */}
      <path
        d="M 82 304 Q 82 301, 87 299 Q 95 297, 105 297 Q 115 297, 123 299 Q 128 301, 128 304"
        fill="#4D2B55"
        opacity="0.4"
      />

      {/* Main cap - multiple layers for 3D effect */}
      {/* Base cap layer */}
      <ellipse
        cx="105"
        cy="293"
        rx="25"
        ry="15"
        fill="#6D4B75"
      />

      {/* Cap mid-tone for dimension */}
      <ellipse
        cx="105"
        cy="292"
        rx="23"
        ry="13.5"
        fill="#7D5B85"
        opacity="0.8"
      />

      {/* Cap top curve - darker for rounded top */}
      <path
        d="M 80 293
           Q 80 284, 87 279
           Q 94 275, 105 273
           Q 116 275, 123 279
           Q 130 284, 130 293"
        fill="#5D3B65"
      />

      {/* Cap top highlight area */}
      <ellipse
        cx="96"
        cy="286"
        rx="15"
        ry="9"
        fill="#8D6B95"
        opacity="0.5"
      />

      {/* Subtle cap edge rim */}
      <ellipse
        cx="105"
        cy="302"
        rx="24"
        ry="5"
        fill="none"
        stroke="#5D3B65"
        strokeWidth="0.7"
        opacity="0.3"
      />

      {/* Cream/light purple spots - varied sizes with individual animations */}
      {/* Central spot */}
      <motion.g variants={spotVariants} custom={2.6} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="105"
          cy="282"
          rx="4"
          ry="3.5"
          fill="#E8D5E8"
          opacity="0.85"
        />
        <ellipse
          cx="104"
          cy="281"
          rx="1.8"
          ry="1.5"
          fill="#FFFFFF"
          opacity="0.5"
        />
      </motion.g>

      {/* Upper left spot */}
      <motion.g variants={spotVariants} custom={2.65} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="94"
          cy="287"
          rx="3.2"
          ry="2.8"
          fill="#E8D5E8"
          opacity="0.82"
        />
        <ellipse
          cx="93"
          cy="286"
          rx="1.3"
          ry="1.1"
          fill="#FFFFFF"
          opacity="0.45"
        />
      </motion.g>

      {/* Upper right spot */}
      <motion.g variants={spotVariants} custom={2.7} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="116"
          cy="286"
          rx="3"
          ry="2.6"
          fill="#E8D5E8"
          opacity="0.8"
        />
        <ellipse
          cx="115"
          cy="285"
          rx="1.2"
          ry="1"
          fill="#FFFFFF"
          opacity="0.43"
        />
      </motion.g>

      {/* Lower left spot */}
      <motion.g variants={spotVariants} custom={2.75} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="88"
          cy="294"
          rx="2.6"
          ry="2.3"
          fill="#E8D5E8"
          opacity="0.78"
        />
        <ellipse
          cx="87.5"
          cy="293.5"
          rx="1"
          ry="0.9"
          fill="#FFFFFF"
          opacity="0.4"
        />
      </motion.g>

      {/* Lower right spot */}
      <motion.g variants={spotVariants} custom={2.8} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="120"
          cy="295"
          rx="2.8"
          ry="2.4"
          fill="#E8D5E8"
          opacity="0.79"
        />
        <ellipse
          cx="119.5"
          cy="294.5"
          rx="1.1"
          ry="0.95"
          fill="#FFFFFF"
          opacity="0.42"
        />
      </motion.g>

      {/* Mid-left small spot */}
      <motion.g variants={spotVariants} custom={2.68} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="98"
          cy="291"
          rx="2.3"
          ry="2"
          fill="#E8D5E8"
          opacity="0.76"
        />
      </motion.g>

      {/* Mid-right small spot */}
      <motion.g variants={spotVariants} custom={2.78} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="112"
          cy="292"
          rx="2.2"
          ry="1.9"
          fill="#E8D5E8"
          opacity="0.75"
        />
      </motion.g>

      {/* Tiny spots for extra detail */}
      <motion.circle
        cx="101"
        cy="297"
        r="1.3"
        fill="#E8D5E8"
        opacity="0.72"
        variants={spotVariants}
        custom={2.82}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      <motion.circle
        cx="109"
        cy="298"
        r="1.4"
        fill="#E8D5E8"
        opacity="0.73"
        variants={spotVariants}
        custom={2.84}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      />
    </motion.g>
  );
}
