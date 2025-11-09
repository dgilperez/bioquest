'use client';

import { motion } from 'framer-motion';

interface BeetleProps {
  shouldAnimate: boolean;
  duration: (d: number) => number;
}

export default function Beetle({ shouldAnimate, duration }: BeetleProps) {
  const growVariants = {
    hidden: { scale: 0, opacity: 0, rotate: 25 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: duration(2.3),
        duration: duration(1.1),
        type: 'spring',
        stiffness: 140,
        damping: 13,
      },
    },
  } as any;

  const legVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        delay: duration(delay),
        duration: duration(0.6),
        ease: 'easeOut',
      },
    }),
  } as any;

  const antennaVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        delay: duration(delay),
        duration: duration(0.5),
        ease: 'easeOut',
      },
    }),
  } as any;

  return (
    <motion.g
      id="beetle"
      style={{ transformOrigin: '85px 280px' }}
      variants={growVariants}
      initial="hidden"
      animate={shouldAnimate ? 'visible' : 'visible'}
    >
      {/* Ground shadow */}
      <ellipse
        cx="85"
        cy="314"
        rx="14"
        ry="3.5"
        fill="#000000"
        opacity="0.15"
      />

      {/* ===== LEGS (6 total - detailed anatomy) ===== */}
      {/* LEFT LEGS */}
      {/* Front left leg - coxa, femur, tibia, tarsus */}
      <g id="front-left-leg">
        <motion.path
          d="M 73 271 L 70 273"
          stroke="#7A5530"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.4}
        />
        <motion.circle cx="70" cy="273" r="1.2" fill="#7A5530" />
        <motion.path
          d="M 70 273 Q 65 276, 62 281"
          stroke="#8B6338"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.42}
        />
        <motion.circle cx="62" cy="281" r="1" fill="#7A5530" />
        <motion.path
          d="M 62 281 Q 60 284, 59 288"
          stroke="#8B6338"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.44}
        />
        <motion.path
          d="M 59 288 L 58 290 L 57 292"
          stroke="#7A5530"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.46}
        />
      </g>

      {/* Middle left leg */}
      <g id="middle-left-leg">
        <motion.path
          d="M 71 286 L 68 288"
          stroke="#7A5530"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.48}
        />
        <motion.circle cx="68" cy="288" r="1.2" fill="#7A5530" />
        <motion.path
          d="M 68 288 Q 63 291, 60 296"
          stroke="#8B6338"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.5}
        />
        <motion.circle cx="60" cy="296" r="1" fill="#7A5530" />
        <motion.path
          d="M 60 296 Q 58 299, 57 303"
          stroke="#8B6338"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.52}
        />
        <motion.path
          d="M 57 303 L 56 305 L 55 307"
          stroke="#7A5530"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.54}
        />
      </g>

      {/* Back left leg */}
      <g id="back-left-leg">
        <motion.path
          d="M 73 299 L 70 301"
          stroke="#7A5530"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.56}
        />
        <motion.circle cx="70" cy="301" r="1.2" fill="#7A5530" />
        <motion.path
          d="M 70 301 Q 66 305, 64 310"
          stroke="#8B6338"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.58}
        />
        <motion.circle cx="64" cy="310" r="1" fill="#7A5530" />
        <motion.path
          d="M 64 310 Q 63 313, 62 316"
          stroke="#8B6338"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.6}
        />
        <motion.path
          d="M 62 316 L 61 318 L 60 320"
          stroke="#7A5530"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.62}
        />
      </g>

      {/* RIGHT LEGS */}
      {/* Front right leg */}
      <g id="front-right-leg">
        <motion.path
          d="M 97 271 L 100 273"
          stroke="#7A5530"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.45}
        />
        <motion.circle cx="100" cy="273" r="1.2" fill="#7A5530" />
        <motion.path
          d="M 100 273 Q 105 276, 108 281"
          stroke="#8B6338"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.47}
        />
        <motion.circle cx="108" cy="281" r="1" fill="#7A5530" />
        <motion.path
          d="M 108 281 Q 110 284, 111 288"
          stroke="#8B6338"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.49}
        />
        <motion.path
          d="M 111 288 L 112 290 L 113 292"
          stroke="#7A5530"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.51}
        />
      </g>

      {/* Middle right leg */}
      <g id="middle-right-leg">
        <motion.path
          d="M 99 286 L 102 288"
          stroke="#7A5530"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.53}
        />
        <motion.circle cx="102" cy="288" r="1.2" fill="#7A5530" />
        <motion.path
          d="M 102 288 Q 107 291, 110 296"
          stroke="#8B6338"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.55}
        />
        <motion.circle cx="110" cy="296" r="1" fill="#7A5530" />
        <motion.path
          d="M 110 296 Q 112 299, 113 303"
          stroke="#8B6338"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.57}
        />
        <motion.path
          d="M 113 303 L 114 305 L 115 307"
          stroke="#7A5530"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.59}
        />
      </g>

      {/* Back right leg */}
      <g id="back-right-leg">
        <motion.path
          d="M 97 299 L 100 301"
          stroke="#7A5530"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.61}
        />
        <motion.circle cx="100" cy="301" r="1.2" fill="#7A5530" />
        <motion.path
          d="M 100 301 Q 104 305, 106 310"
          stroke="#8B6338"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.63}
        />
        <motion.circle cx="106" cy="310" r="1" fill="#7A5530" />
        <motion.path
          d="M 106 310 Q 107 313, 108 316"
          stroke="#8B6338"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.65}
        />
        <motion.path
          d="M 108 316 L 109 318 L 110 320"
          stroke="#7A5530"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          variants={legVariants}
          custom={2.67}
        />
      </g>

      {/* ===== ABDOMEN (segmented) ===== */}
      {/* Main abdomen shape */}
      <ellipse cx="85" cy="293" rx="16" ry="22" fill="#A87340" />
      <ellipse cx="85" cy="292" rx="15" ry="21" fill="#B8834C" opacity="0.8" />

      {/* Abdomen segments */}
      {[280, 286, 292, 298, 304, 309].map((y, i) => (
        <path
          key={`abdomen-seg-${i}`}
          d={`M 70 ${y} Q 85 ${y + 1}, 100 ${y}`}
          stroke="#9C6D3C"
          strokeWidth="0.6"
          fill="none"
          opacity="0.5"
        />
      ))}

      {/* Abdomen shadow on sides */}
      <ellipse cx="85" cy="293" rx="13" ry="20" fill="#8B6338" opacity="0.3" />

      {/* ===== THORAX (pronotum) ===== */}
      <ellipse cx="85" cy="269" rx="11" ry="12" fill="#C89454" />
      <ellipse cx="85" cy="268" rx="10" ry="11" fill="#D4A05C" opacity="0.85" />

      {/* Thorax segments */}
      <path
        d="M 76 263 Q 85 264, 94 263"
        stroke="#B8834C"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 75 275 Q 85 276, 95 275"
        stroke="#B8834C"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />

      {/* Thorax highlight */}
      <ellipse cx="82" cy="266" rx="5" ry="6" fill="#FFFFFF" opacity="0.2" />

      {/* ===== HEAD ===== */}
      <ellipse cx="85" cy="256" rx="7.5" ry="8.5" fill="#B8834C" />
      <ellipse cx="85" cy="255" rx="7" ry="8" fill="#C89454" opacity="0.9" />

      {/* Mandibles */}
      <path
        d="M 82 252 Q 81 250, 80 248"
        stroke="#8B6338"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 88 252 Q 89 250, 90 248"
        stroke="#8B6338"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eyes */}
      <ellipse cx="81" cy="256" rx="1.8" ry="2" fill="#4A3020" />
      <ellipse cx="89" cy="256" rx="1.8" ry="2" fill="#4A3020" />
      <circle cx="81" cy="255" r="0.6" fill="#FFFFFF" opacity="0.6" />
      <circle cx="89" cy="255" r="0.6" fill="#FFFFFF" opacity="0.6" />

      {/* ===== ELYTRA (wing cases) ===== */}
      {/* Left elytron */}
      <path
        d="M 85 266
           C 79 268, 74 272, 71 278
           C 68 284, 68 291, 68 298
           C 68 305, 70 311, 73 315
           C 75 317, 78 318, 81 318
           L 85 318
           Z"
        fill="#A87340"
        opacity="0.5"
      />
      <path
        d="M 85 266
           C 80 268, 75 272, 72 278
           C 70 284, 70 291, 70 298
           C 70 305, 72 311, 75 315"
        stroke="#8B6338"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Right elytron */}
      <path
        d="M 85 266
           C 91 268, 96 272, 99 278
           C 102 284, 102 291, 102 298
           C 102 305, 100 311, 97 315
           C 95 317, 92 318, 89 318
           L 85 318
           Z"
        fill="#A87340"
        opacity="0.5"
      />
      <path
        d="M 85 266
           C 90 268, 95 272, 98 278
           C 100 284, 100 291, 100 298
           C 100 305, 98 311, 95 315"
        stroke="#8B6338"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Elytra central split line */}
      <path
        d="M 85 266 L 85 318"
        stroke="#7A5530"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Elytra texture - left side */}
      {[
        { d: 'M 75 275 Q 76 280, 76 285 Q 76 290, 77 295', opacity: 0.5 },
        { d: 'M 79 272 Q 80 280, 80 288 Q 80 296, 81 304', opacity: 0.45 },
        { d: 'M 82 270 Q 83 280, 83 290 Q 83 300, 84 310', opacity: 0.4 },
      ].map((line, i) => (
        <path
          key={`elytron-left-${i}`}
          d={line.d}
          stroke="#9C6D3C"
          strokeWidth="0.8"
          fill="none"
          opacity={line.opacity}
        />
      ))}

      {/* Elytra texture - right side */}
      {[
        { d: 'M 95 275 Q 94 280, 94 285 Q 94 290, 93 295', opacity: 0.5 },
        { d: 'M 91 272 Q 90 280, 90 288 Q 90 296, 89 304', opacity: 0.45 },
        { d: 'M 88 270 Q 87 280, 87 290 Q 87 300, 86 310', opacity: 0.4 },
      ].map((line, i) => (
        <path
          key={`elytron-right-${i}`}
          d={line.d}
          stroke="#9C6D3C"
          strokeWidth="0.8"
          fill="none"
          opacity={line.opacity}
        />
      ))}

      {/* Elytra highlights */}
      <ellipse cx="78" cy="280" rx="4" ry="8" fill="#FFFFFF" opacity="0.12" />
      <ellipse cx="92" cy="280" rx="4" ry="8" fill="#FFFFFF" opacity="0.12" />

      {/* Elytra punctures (dots for texture) */}
      {[
        { cx: 77, cy: 283 },
        { cx: 93, cy: 283 },
        { cx: 76, cy: 290 },
        { cx: 94, cy: 290 },
        { cx: 77, cy: 297 },
        { cx: 93, cy: 297 },
        { cx: 78, cy: 304 },
        { cx: 92, cy: 304 },
      ].map((dot, i) => (
        <circle
          key={`puncture-${i}`}
          cx={dot.cx}
          cy={dot.cy}
          r="0.6"
          fill="#8B6338"
          opacity="0.4"
        />
      ))}

      {/* ===== ANTENNAE (segmented) ===== */}
      {/* Left antenna */}
      <g id="left-antenna">
        <motion.path
          d="M 81 255 L 79 252"
          stroke="#8B6338"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          variants={antennaVariants}
          custom={2.35}
        />
        <motion.circle cx="79" cy="252" r="0.8" fill="#7A5530" />
        <motion.path
          d="M 79 252 L 77 248"
          stroke="#8B6338"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          variants={antennaVariants}
          custom={2.37}
        />
        <motion.circle cx="77" cy="248" r="0.7" fill="#7A5530" />
        <motion.path
          d="M 77 248 L 76 244"
          stroke="#8B6338"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          variants={antennaVariants}
          custom={2.39}
        />
        <motion.circle cx="76" cy="244" r="0.6" fill="#7A5530" />
        <motion.path
          d="M 76 244 L 75 240"
          stroke="#8B6338"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          variants={antennaVariants}
          custom={2.41}
        />
        <motion.circle cx="75" cy="240" r="1.2" fill="#8B6338" />
      </g>

      {/* Right antenna */}
      <g id="right-antenna">
        <motion.path
          d="M 89 255 L 91 252"
          stroke="#8B6338"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          variants={antennaVariants}
          custom={2.36}
        />
        <motion.circle cx="91" cy="252" r="0.8" fill="#7A5530" />
        <motion.path
          d="M 91 252 L 93 248"
          stroke="#8B6338"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          variants={antennaVariants}
          custom={2.38}
        />
        <motion.circle cx="93" cy="248" r="0.7" fill="#7A5530" />
        <motion.path
          d="M 93 248 L 94 244"
          stroke="#8B6338"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          variants={antennaVariants}
          custom={2.4}
        />
        <motion.circle cx="94" cy="244" r="0.6" fill="#7A5530" />
        <motion.path
          d="M 94 244 L 95 240"
          stroke="#8B6338"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          variants={antennaVariants}
          custom={2.42}
        />
        <motion.circle cx="95" cy="240" r="1.2" fill="#8B6338" />
      </g>
    </motion.g>
  );
}
