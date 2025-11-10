'use client';

import { motion } from 'framer-motion';

interface GreenFrondsProps {
  duration: (d: number) => number;
}

export default function GreenFronds({ duration }: GreenFrondsProps) {
  const frondVariants = {
    hidden: { scale: 0, opacity: 0, rotate: -18 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: duration(delay),
        duration: duration(1.0),
        type: 'spring',
        stiffness: 80,
        damping: 13,
      },
    }),
  } as any;

  const veinVariants = {
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

  const pinnaVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (delay: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: duration(delay),
        duration: duration(0.4),
        type: 'spring',
        stiffness: 120,
      },
    }),
  } as any;

  // Helper function to create a compound frond with pinnae (leaflets)
  const createPinnateFromd = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    numPinnae: number,
    pinnaLength: number,
    baseDelay: number,
    frondId: string
  ) => {
    const angle = Math.atan2(endY - startY, endX - startX);
    const pinnae = [];

    for (let i = 0; i < numPinnae; i++) {
      const t = (i + 1) / (numPinnae + 1);
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      const sizeMultiplier = Math.sin(t * Math.PI); // Larger in middle, smaller at ends
      const currentPinnaLength = pinnaLength * sizeMultiplier;

      pinnae.push({ x, y, length: currentPinnaLength, index: i });
    }

    return (
      <motion.g
        id={frondId}
        variants={frondVariants}
        custom={baseDelay}
        initial="hidden"
        animate="visible"
      >
        {/* Rachis (main stem) - shadow */}
        <path
          d={`M ${startX} ${startY} L ${endX} ${endY}`}
          stroke="#4A6B5A"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Rachis (main stem) - main */}
        <motion.path
          d={`M ${startX} ${startY} L ${endX} ${endY}`}
          stroke="#5A8C6A"
          strokeWidth="3"
          strokeLinecap="round"
          variants={veinVariants}
          custom={baseDelay + 0.1}
        />

        {/* Rachis highlight */}
        <motion.path
          d={`M ${startX} ${startY} L ${endX} ${endY}`}
          stroke="#7CAD89"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
          variants={veinVariants}
          custom={baseDelay + 0.15}
        />

        {/* Pinnae (leaflets) on both sides */}
        {pinnae.map((pinna) => {
          // Alternate sides
          const side = pinna.index % 2 === 0 ? 1 : -1;
          const perpAngle = angle + (Math.PI / 2) * side;
          const pinnaEndX = pinna.x + Math.cos(perpAngle) * pinna.length;
          const pinnaEndY = pinna.y + Math.sin(perpAngle) * pinna.length;

          return (
            <g key={`pinna-${frondId}-${pinna.index}`}>
              {/* Pinna shadow layer */}
              <motion.path
                d={`M ${pinna.x} ${pinna.y}
                     Q ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.3} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.3 - side * 1.5},
                       ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.7} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.7 - side * 1}
                     Q ${pinnaEndX - Math.cos(perpAngle) * pinna.length * 0.1} ${pinnaEndY - Math.sin(perpAngle) * pinna.length * 0.1 - side * 0.5},
                       ${pinnaEndX} ${pinnaEndY}
                     Q ${pinnaEndX - Math.cos(perpAngle) * pinna.length * 0.1} ${pinnaEndY - Math.sin(perpAngle) * pinna.length * 0.1 + side * 0.5},
                       ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.7} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.7 + side * 1}
                     Q ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.3} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.3 + side * 1.5},
                       ${pinna.x} ${pinna.y}
                     Z`}
                fill="#4A6B5A"
                opacity="0.25"
                variants={pinnaVariants}
                custom={baseDelay + 0.2 + pinna.index * 0.02}
              />

              {/* Pinna main body */}
              <motion.path
                d={`M ${pinna.x} ${pinna.y}
                     Q ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.3} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.3 - side * 1.2},
                       ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.7} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.7 - side * 0.8}
                     Q ${pinnaEndX - Math.cos(perpAngle) * pinna.length * 0.1} ${pinnaEndY - Math.sin(perpAngle) * pinna.length * 0.1 - side * 0.3},
                       ${pinnaEndX} ${pinnaEndY}
                     Q ${pinnaEndX - Math.cos(perpAngle) * pinna.length * 0.1} ${pinnaEndY - Math.sin(perpAngle) * pinna.length * 0.1 + side * 0.3},
                       ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.7} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.7 + side * 0.8}
                     Q ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.3} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.3 + side * 1.2},
                       ${pinna.x} ${pinna.y}
                     Z`}
                fill="#6B9D78"
                variants={pinnaVariants}
                custom={baseDelay + 0.2 + pinna.index * 0.02}
              />

              {/* Pinna lighter overlay */}
              <motion.path
                d={`M ${pinna.x} ${pinna.y}
                     Q ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.3} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.3 - side * 1},
                       ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.6} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.6 - side * 0.6}
                     Q ${pinnaEndX - Math.cos(perpAngle) * pinna.length * 0.15} ${pinnaEndY - Math.sin(perpAngle) * pinna.length * 0.15},
                       ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.6} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.6 + side * 0.6}
                     Q ${pinna.x + Math.cos(perpAngle) * pinna.length * 0.3} ${pinna.y + Math.sin(perpAngle) * pinna.length * 0.3 + side * 1},
                       ${pinna.x} ${pinna.y}
                     Z`}
                fill="#7CAD89"
                opacity="0.5"
                variants={pinnaVariants}
                custom={baseDelay + 0.22 + pinna.index * 0.02}
              />

              {/* Pinna midvein */}
              <motion.path
                d={`M ${pinna.x} ${pinna.y} L ${pinnaEndX} ${pinnaEndY}`}
                stroke="#5A8C6A"
                strokeWidth="0.8"
                strokeLinecap="round"
                variants={veinVariants}
                custom={baseDelay + 0.25 + pinna.index * 0.02}
              />

              {/* Pinna secondary veins (3-4 per pinna) */}
              {[0.25, 0.5, 0.75].map((vt, vi) => {
                const veinStartX = pinna.x + Math.cos(perpAngle) * pinna.length * vt;
                const veinStartY = pinna.y + Math.sin(perpAngle) * pinna.length * vt;
                const veinEndX = veinStartX + Math.cos(perpAngle + Math.PI / 2.5 * side) * pinna.length * 0.35;
                const veinEndY = veinStartY + Math.sin(perpAngle + Math.PI / 2.5 * side) * pinna.length * 0.35;

                return (
                  <motion.path
                    key={`vein-${pinna.index}-${vi}`}
                    d={`M ${veinStartX} ${veinStartY} L ${veinEndX} ${veinEndY}`}
                    stroke="#5A8C6A"
                    strokeWidth="0.4"
                    strokeLinecap="round"
                    opacity="0.6"
                    variants={veinVariants}
                    custom={baseDelay + 0.3 + pinna.index * 0.02 + vi * 0.01}
                  />
                );
              })}

              {/* Pinna highlight */}
              <motion.ellipse
                cx={pinna.x + Math.cos(perpAngle) * pinna.length * 0.3}
                cy={pinna.y + Math.sin(perpAngle) * pinna.length * 0.3}
                rx={pinna.length * 0.2}
                ry={pinna.length * 0.15}
                fill="#FFFFFF"
                opacity="0.12"
                variants={pinnaVariants}
                custom={baseDelay + 0.25 + pinna.index * 0.02}
              />
            </g>
          );
        })}
      </motion.g>
    );
  };

  return (
    <g id="green-fronds">
      {/* Top-left frond */}
      {createPinnateFromd(30, 195, 100, 195, 8, 12, 0.9, 'frond-1')}

      {/* Left frond */}
      {createPinnateFromd(35, 230, 85, 230, 7, 11, 1.0, 'frond-2')}

      {/* Bottom-left frond */}
      {createPinnateFromd(110, 332, 166, 332, 9, 14, 1.1, 'frond-3')}

      {/* Bottom-center frond */}
      {createPinnateFromd(178, 348, 226, 348, 8, 12, 1.15, 'frond-4')}

      {/* Bottom-right frond */}
      {createPinnateFromd(250, 342, 294, 342, 7, 10, 1.2, 'frond-5')}
    </g>
  );
}
