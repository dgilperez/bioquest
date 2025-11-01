'use client';

import { motion } from 'framer-motion';

interface PlantaeIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Detailed leaf icon with botanical accuracy
 * Features: multi-layer shading, complex vein network, serrated edges, realistic shape
 */
export function PlantaeIcon({ size = 32, className = '', animate = true }: PlantaeIconProps) {
  const leafSwayVariants = {
    idle: {
      rotate: [-2, 2, -2],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const veinDrawVariants = (delay: number) => ({
    idle: {
      pathLength: animate ? [0, 1] : 1,
      opacity: animate ? [0, 1] : 1,
      transition: {
        duration: 0.6,
        delay,
        ease: 'easeOut',
      },
    },
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      animate={animate ? 'idle' : undefined}
      variants={leafSwayVariants}
      style={{ transformOrigin: 'center' }}
    >
      {/* Shadow */}
      <ellipse
        cx="40"
        cy="72"
        rx="18"
        ry="3"
        fill="#3A5A2E"
        opacity="0.2"
      />

      {/* ===== DETAILED LEAF ===== */}
      <g id="main-leaf" style={{ transformOrigin: '40px 40px' }}>
        {/* Leaf shadow layer */}
        <path
          d="M 40 10
             Q 42 12, 44 15
             Q 48 20, 52 26
             Q 56 33, 58 40
             Q 60 48, 60 55
             Q 60 62, 58 67
             Q 56 71, 52 73
             Q 48 75, 44 74
             Q 42 73, 40 72
             Q 38 73, 36 74
             Q 32 75, 28 73
             Q 24 71, 22 67
             Q 20 62, 20 55
             Q 20 48, 22 40
             Q 24 33, 28 26
             Q 32 20, 36 15
             Q 38 12, 40 10
             Z"
          fill="#3A6B4A"
          opacity="0.4"
        />

        {/* Main leaf body - darkest base */}
        <path
          d="M 40 11
             Q 42 13, 44 16
             Q 48 21, 52 27
             Q 56 34, 58 41
             Q 60 48, 60 55
             Q 60 61, 58 66
             Q 56 70, 52 72
             Q 48 74, 44 73
             Q 42 72, 40 71
             Q 38 72, 36 73
             Q 32 74, 28 72
             Q 24 70, 22 66
             Q 20 61, 20 55
             Q 20 48, 22 41
             Q 24 34, 28 27
             Q 32 21, 36 16
             Q 38 13, 40 11
             Z"
          fill="#4A7B5A"
        />

        {/* Leaf mid-tone layer */}
        <path
          d="M 40 13
             Q 42 15, 44 18
             Q 47 23, 50 29
             Q 54 36, 56 43
             Q 58 50, 58 55
             Q 58 60, 56 64
             Q 54 68, 50 70
             Q 47 71, 44 70
             Q 42 69, 40 68
             Q 38 69, 36 70
             Q 33 71, 30 70
             Q 26 68, 24 64
             Q 22 60, 22 55
             Q 22 50, 24 43
             Q 26 36, 30 29
             Q 33 23, 36 18
             Q 38 15, 40 13
             Z"
          fill="#5A8B6A"
          opacity="0.7"
        />

        {/* Leaf lighter overlay */}
        <path
          d="M 40 16
             Q 41 18, 43 21
             Q 46 26, 48 32
             Q 52 39, 54 46
             Q 56 52, 56 55
             Q 56 58, 54 62
             Q 52 66, 48 68
             Q 46 69, 43 68
             Q 41 67, 40 66
             Q 39 67, 37 68
             Q 34 69, 32 68
             Q 28 66, 26 62
             Q 24 58, 24 55
             Q 24 52, 26 46
             Q 28 39, 32 32
             Q 34 26, 37 21
             Q 39 18, 40 16
             Z"
          fill="#6B9D7A"
          opacity="0.5"
        />

        {/* Serrated edges - left side */}
        {[
          { x1: 36, y1: 18, x2: 34, y2: 20 },
          { x1: 32, y1: 24, x2: 30, y2: 26 },
          { x1: 28, y1: 31, x2: 26, y2: 33 },
          { x1: 24, y1: 39, x2: 22, y2: 41 },
          { x1: 22, y1: 48, x2: 20, y2: 50 },
          { x1: 22, y1: 58, x2: 20, y2: 60 },
          { x1: 24, y1: 65, x2: 22, y2: 67 },
        ].map((edge, i) => (
          <path
            key={`left-edge-${i}`}
            d={`M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`}
            stroke="#4A7B5A"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        ))}

        {/* Serrated edges - right side */}
        {[
          { x1: 44, y1: 18, x2: 46, y2: 20 },
          { x1: 48, y1: 24, x2: 50, y2: 26 },
          { x1: 52, y1: 31, x2: 54, y2: 33 },
          { x1: 56, y1: 39, x2: 58, y2: 41 },
          { x1: 58, y1: 48, x2: 60, y2: 50 },
          { x1: 58, y1: 58, x2: 60, y2: 60 },
          { x1: 56, y1: 65, x2: 58, y2: 67 },
        ].map((edge, i) => (
          <path
            key={`right-edge-${i}`}
            d={`M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`}
            stroke="#4A7B5A"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
        ))}

        {/* Central midvein */}
        <motion.path
          d="M 40 11 L 40 71"
          stroke="#3A5A3E"
          strokeWidth="1.8"
          strokeLinecap="round"
          initial={false}
          animate={animate ? 'idle' : undefined}
          variants={veinDrawVariants(0.1)}
        />

        {/* Midvein highlight */}
        <motion.path
          d="M 39 12 L 39 70"
          stroke="#6B9D7A"
          strokeWidth="0.6"
          strokeLinecap="round"
          opacity="0.5"
          initial={false}
          animate={animate ? 'idle' : undefined}
          variants={veinDrawVariants(0.15)}
        />

        {/* Secondary veins - left side */}
        {[
          { start: 20, end: { x: 28, y: 24 }, delay: 0.2 },
          { start: 25, end: { x: 26, y: 30 }, delay: 0.22 },
          { start: 30, end: { x: 24, y: 36 }, delay: 0.24 },
          { start: 36, end: { x: 23, y: 43 }, delay: 0.26 },
          { start: 42, end: { x: 22, y: 50 }, delay: 0.28 },
          { start: 48, end: { x: 23, y: 56 }, delay: 0.3 },
          { start: 54, end: { x: 24, y: 62 }, delay: 0.32 },
          { start: 60, end: { x: 26, y: 67 }, delay: 0.34 },
        ].map((vein, i) => (
          <motion.path
            key={`left-vein-${i}`}
            d={`M 40 ${vein.start} Q 35 ${vein.start + 2}, ${vein.end.x} ${vein.end.y}`}
            stroke="#4A6B4A"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            initial={false}
            animate={animate ? 'idle' : undefined}
          variants={veinDrawVariants(vein.delay)}
          />
        ))}

        {/* Secondary veins - right side */}
        {[
          { start: 20, end: { x: 52, y: 24 }, delay: 0.2 },
          { start: 25, end: { x: 54, y: 30 }, delay: 0.22 },
          { start: 30, end: { x: 56, y: 36 }, delay: 0.24 },
          { start: 36, end: { x: 57, y: 43 }, delay: 0.26 },
          { start: 42, end: { x: 58, y: 50 }, delay: 0.28 },
          { start: 48, end: { x: 57, y: 56 }, delay: 0.3 },
          { start: 54, end: { x: 56, y: 62 }, delay: 0.32 },
          { start: 60, end: { x: 54, y: 67 }, delay: 0.34 },
        ].map((vein, i) => (
          <motion.path
            key={`right-vein-${i}`}
            d={`M 40 ${vein.start} Q 45 ${vein.start + 2}, ${vein.end.x} ${vein.end.y}`}
            stroke="#4A6B4A"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            initial={false}
            animate={animate ? 'idle' : undefined}
          variants={veinDrawVariants(vein.delay)}
          />
        ))}

        {/* Tertiary veins - fine network on left */}
        {[
          { from: { x: 35, y: 22 }, to: { x: 30, y: 26 }, delay: 0.4 },
          { from: { x: 32, y: 28 }, to: { x: 27, y: 32 }, delay: 0.41 },
          { from: { x: 30, y: 35 }, to: { x: 25, y: 40 }, delay: 0.42 },
          { from: { x: 28, y: 42 }, to: { x: 24, y: 47 }, delay: 0.43 },
          { from: { x: 28, y: 50 }, to: { x: 24, y: 54 }, delay: 0.44 },
          { from: { x: 29, y: 57 }, to: { x: 26, y: 61 }, delay: 0.45 },
        ].map((vein, i) => (
          <motion.path
            key={`left-tertiary-${i}`}
            d={`M ${vein.from.x} ${vein.from.y} L ${vein.to.x} ${vein.to.y}`}
            stroke="#5A7B5A"
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity="0.6"
            initial={false}
            animate={animate ? 'idle' : undefined}
          variants={veinDrawVariants(vein.delay)}
          />
        ))}

        {/* Tertiary veins - fine network on right */}
        {[
          { from: { x: 45, y: 22 }, to: { x: 50, y: 26 }, delay: 0.4 },
          { from: { x: 48, y: 28 }, to: { x: 53, y: 32 }, delay: 0.41 },
          { from: { x: 50, y: 35 }, to: { x: 55, y: 40 }, delay: 0.42 },
          { from: { x: 52, y: 42 }, to: { x: 56, y: 47 }, delay: 0.43 },
          { from: { x: 52, y: 50 }, to: { x: 56, y: 54 }, delay: 0.44 },
          { from: { x: 51, y: 57 }, to: { x: 54, y: 61 }, delay: 0.45 },
        ].map((vein, i) => (
          <motion.path
            key={`right-tertiary-${i}`}
            d={`M ${vein.from.x} ${vein.from.y} L ${vein.to.x} ${vein.to.y}`}
            stroke="#5A7B5A"
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity="0.6"
            initial={false}
            animate={animate ? 'idle' : undefined}
          variants={veinDrawVariants(vein.delay)}
          />
        ))}

        {/* Leaf highlights - natural light reflection */}
        <ellipse
          cx="35"
          cy="28"
          rx="8"
          ry="10"
          fill="#FFFFFF"
          opacity="0.15"
        />
        <ellipse
          cx="32"
          cy="35"
          rx="6"
          ry="8"
          fill="#FFFFFF"
          opacity="0.1"
        />

        {/* Subtle texture spots */}
        {[
          { cx: 48, cy: 32, r: 1.2 },
          { cx: 52, cy: 45, r: 1 },
          { cx: 46, cy: 58, r: 0.8 },
          { cx: 34, cy: 52, r: 1.1 },
          { cx: 30, cy: 44, r: 0.9 },
        ].map((spot, i) => (
          <circle
            key={`texture-spot-${i}`}
            cx={spot.cx}
            cy={spot.cy}
            r={spot.r}
            fill="#4A6B4A"
            opacity="0.2"
          />
        ))}

        {/* Leaf tip detail */}
        <path
          d="M 40 11 Q 38 13, 38 15 Q 40 14, 42 15 Q 42 13, 40 11 Z"
          fill="#5A8B6A"
          opacity="0.8"
        />

        {/* Stem connection at base */}
        <ellipse
          cx="40"
          cy="72"
          rx="3"
          ry="2"
          fill="#4A6B3A"
        />
        <path
          d="M 38 72 L 38 75 L 42 75 L 42 72"
          fill="#5A8C6A"
        />
      </g>
    </motion.svg>
  );
}
