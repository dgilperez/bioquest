'use client';

import { motion } from 'framer-motion';

interface OrangeMushroomProps {
  shouldAnimate: boolean;
  duration: (d: number) => number;
}

export default function OrangeMushroom({ shouldAnimate, duration }: OrangeMushroomProps) {
  const growVariants = {
    hidden: { scale: 0, opacity: 0, y: 10 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        delay: duration(1.8),
        duration: duration(1.2),
        type: 'spring',
        stiffness: 105,
        damping: 12,
      },
    },
  };

  const spotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: duration(delay),
        duration: duration(0.4),
        type: 'spring',
        stiffness: 190,
      },
    }),
  };

  return (
    <motion.g
      id="orange-mushroom"
      style={{ transformOrigin: '300px 240px' }}
      variants={growVariants}
      initial="hidden"
      animate={shouldAnimate ? 'visible' : 'visible'}
    >
      {/* Ground shadow */}
      <ellipse
        cx="300"
        cy="255"
        rx="11"
        ry="3"
        fill="#000000"
        opacity="0.12"
      />

      {/* Stem base - wider at bottom */}
      <path
        d="M 291 252
           C 291 250, 292 249, 293 247
           L 295 237
           L 305 237
           L 307 247
           C 308 249, 309 250, 309 252
           Z"
        fill="#E8D5B8"
      />

      {/* Stem texture lines */}
      {[234, 237, 240, 243, 246, 249].map((y, i) => (
        <path
          key={`stem-texture-${i}`}
          d={`M 296 ${y} Q 300 ${y + 0.5}, 304 ${y}`}
          stroke="#D4C8B0"
          strokeWidth="0.4"
          fill="none"
          opacity="0.5"
        />
      ))}

      {/* Main stem with gradient effect */}
      <ellipse cx="300" cy="242" rx="9" ry="18" fill="#F5E8D0" />
      <ellipse cx="300" cy="241" rx="8.5" ry="17" fill="#F5E8D0" opacity="0.85" />

      {/* Stem highlight - left side */}
      <ellipse
        cx="296"
        cy="238"
        rx="3"
        ry="12"
        fill="#FFFFFF"
        opacity="0.32"
      />

      {/* Stem shadow - right side */}
      <ellipse
        cx="304"
        cy="241"
        rx="2.5"
        ry="14"
        fill="#D4C8B0"
        opacity="0.28"
      />

      {/* Stem top ring (annulus) */}
      <ellipse
        cx="300"
        cy="228"
        rx="10"
        ry="3.5"
        fill="#E8D5B8"
      />
      <ellipse
        cx="300"
        cy="227"
        rx="9"
        ry="2.5"
        fill="#D4C8B0"
      />

      {/* Gills underneath cap - multiple layers for depth */}
      <ellipse
        cx="300"
        cy="222"
        rx="28"
        ry="7"
        fill="#C89454"
      />
      <ellipse
        cx="300"
        cy="221"
        rx="26"
        ry="5.5"
        fill="#B8826C"
      />

      {/* Individual gill lines radiating from center */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i * 18) - 180;
        const rad = (angle * Math.PI) / 180;
        const x1 = 300 + Math.cos(rad) * 8;
        const y1 = 222 + Math.sin(rad) * 2.5;
        const x2 = 300 + Math.cos(rad) * 26;
        const y2 = 222 + Math.sin(rad) * 6.5;

        return (
          <line
            key={`gill-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#A87340"
            strokeWidth="0.5"
            opacity="0.45"
          />
        );
      })}

      {/* Cap underside shadow curve */}
      <path
        d="M 272 222 Q 272 219, 278 217 Q 288 215, 300 215 Q 312 215, 322 217 Q 328 219, 328 222"
        fill="#A87340"
        opacity="0.35"
      />

      {/* Main cap - multiple layers for 3D effect */}
      {/* Base cap layer */}
      <ellipse
        cx="300"
        cy="210"
        rx="30"
        ry="18"
        fill="#C2653F"
      />

      {/* Cap mid-tone for dimension */}
      <ellipse
        cx="300"
        cy="209"
        rx="28"
        ry="16.5"
        fill="#D4734C"
        opacity="0.75"
      />

      {/* Cap top curve - darker for rounded top */}
      <path
        d="M 272 210
           Q 272 200, 280 194
           Q 288 189, 300 187
           Q 312 189, 320 194
           Q 328 200, 328 210"
        fill="#B85A3C"
      />

      {/* Cap top highlight area */}
      <ellipse
        cx="289"
        cy="201"
        rx="18"
        ry="11"
        fill="#E89464"
        opacity="0.45"
      />

      {/* Subtle cap edge rim */}
      <ellipse
        cx="300"
        cy="220"
        rx="29"
        ry="6"
        fill="none"
        stroke="#A84F2F"
        strokeWidth="0.8"
        opacity="0.35"
      />

      {/* White/cream spots - varied sizes with individual animations */}
      {/* Large central spot */}
      <motion.g variants={spotVariants} custom={2.3} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="300"
          cy="198"
          rx="5"
          ry="4.5"
          fill="#F5E8D0"
          opacity="0.9"
        />
        <ellipse
          cx="299"
          cy="197"
          rx="2.2"
          ry="2"
          fill="#FFFFFF"
          opacity="0.55"
        />
      </motion.g>

      {/* Upper left spot */}
      <motion.g variants={spotVariants} custom={2.35} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="287"
          cy="203"
          rx="4"
          ry="3.5"
          fill="#F5E8D0"
          opacity="0.88"
        />
        <ellipse
          cx="286"
          cy="202"
          rx="1.6"
          ry="1.4"
          fill="#FFFFFF"
          opacity="0.5"
        />
      </motion.g>

      {/* Upper right spot */}
      <motion.g variants={spotVariants} custom={2.4} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="313"
          cy="202"
          rx="3.8"
          ry="3.3"
          fill="#F5E8D0"
          opacity="0.87"
        />
        <ellipse
          cx="312"
          cy="201"
          rx="1.5"
          ry="1.3"
          fill="#FFFFFF"
          opacity="0.48"
        />
      </motion.g>

      {/* Lower left spot */}
      <motion.g variants={spotVariants} custom={2.45} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="279"
          cy="211"
          rx="3.2"
          ry="2.8"
          fill="#F5E8D0"
          opacity="0.85"
        />
        <ellipse
          cx="278.5"
          cy="210.5"
          rx="1.2"
          ry="1"
          fill="#FFFFFF"
          opacity="0.42"
        />
      </motion.g>

      {/* Lower right spot */}
      <motion.g variants={spotVariants} custom={2.5} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="318"
          cy="213"
          rx="3.5"
          ry="3"
          fill="#F5E8D0"
          opacity="0.86"
        />
        <ellipse
          cx="317.5"
          cy="212.5"
          rx="1.4"
          ry="1.2"
          fill="#FFFFFF"
          opacity="0.45"
        />
      </motion.g>

      {/* Mid-left small spot */}
      <motion.g variants={spotVariants} custom={2.38} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="292"
          cy="209"
          rx="3"
          ry="2.6"
          fill="#F5E8D0"
          opacity="0.84"
        />
      </motion.g>

      {/* Mid-right small spot */}
      <motion.g variants={spotVariants} custom={2.48} initial="hidden" animate={shouldAnimate ? 'visible' : 'visible'}>
        <ellipse
          cx="308"
          cy="210"
          rx="2.8"
          ry="2.5"
          fill="#F5E8D0"
          opacity="0.83"
        />
      </motion.g>

      {/* Tiny spots for extra detail */}
      <motion.circle
        cx="295"
        cy="215"
        r="1.6"
        fill="#F5E8D0"
        opacity="0.8"
        variants={spotVariants}
        custom={2.52}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      <motion.circle
        cx="305"
        cy="216"
        r="1.7"
        fill="#F5E8D0"
        opacity="0.81"
        variants={spotVariants}
        custom={2.54}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      />

      <motion.circle
        cx="283"
        cy="207"
        r="1.5"
        fill="#F5E8D0"
        opacity="0.78"
        variants={spotVariants}
        custom={2.43}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
      />
    </motion.g>
  );
}
