'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Import all element components
import Background from './logo/elements/Background';
import LeftSpiralFern from './logo/elements/LeftSpiralFern';
import RightSpiralFern from './logo/elements/RightSpiralFern';
import RedMushroom from './logo/elements/RedMushroom';
import OrangeMushroom from './logo/elements/OrangeMushroom';
import PurpleMushroom from './logo/elements/PurpleMushroom';
import Beetle from './logo/elements/Beetle';
import BlueLeaves from './logo/elements/BlueLeaves';
import GreenFronds from './logo/elements/GreenFronds';
import OrangeBranches from './logo/elements/OrangeBranches';

interface AnimatedLogoProps {
  size?: number;
  autoPlay?: boolean;
  speed?: number;
  loop?: boolean;
  onComplete?: () => void;
}

export default function AnimatedLogo({
  size = 400,
  autoPlay = true,
  speed = 1,
  loop = false,
  onComplete,
}: AnimatedLogoProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const shouldAnimate = !prefersReducedMotion && isPlaying;

  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [autoPlay]);

  // Base duration adjusted by speed prop
  const duration = (d: number) => d / speed;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: duration(0.1),
        delayChildren: duration(0.2),
      },
    },
  };

  const breatheVariants = loop
    ? {
        scale: [1, 1.015, 1],
        transition: {
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }
    : {};

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'visible'}
        variants={containerVariants}
        onAnimationComplete={() => {
          if (!loop) setIsPlaying(false);
          onComplete?.();
        }}
      >
        {/* Background circle */}
        <Background shouldAnimate={shouldAnimate} duration={duration} />

        {/* Organic elements layer by layer */}

        {/* Bottom layer - green fronds */}
        <GreenFronds shouldAnimate={shouldAnimate} duration={duration} />

        {/* Orange connecting branches */}
        <OrangeBranches shouldAnimate={shouldAnimate} duration={duration} />

        {/* Left spiral fern */}
        <LeftSpiralFern shouldAnimate={shouldAnimate} duration={duration} />

        {/* Right spiral fern (dominant) */}
        <RightSpiralFern shouldAnimate={shouldAnimate} duration={duration} />

        {/* Blue-green leaves on right */}
        <BlueLeaves shouldAnimate={shouldAnimate} duration={duration} />

        {/* Mushrooms */}
        <RedMushroom shouldAnimate={shouldAnimate} duration={duration} />
        <OrangeMushroom shouldAnimate={shouldAnimate} duration={duration} />
        <PurpleMushroom shouldAnimate={shouldAnimate} duration={duration} />

        {/* Beetle (top layer) */}
        <Beetle shouldAnimate={shouldAnimate} duration={duration} />

        {/* Continuous breathing animation wrapper */}
        {loop && shouldAnimate && (
          <motion.g animate={breatheVariants}>
            <rect width="400" height="400" fill="transparent" />
          </motion.g>
        )}
      </motion.svg>

      {/* Play/Pause control */}
      {!prefersReducedMotion && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-2 right-2 bg-black/10 hover:bg-black/20 rounded-full p-2 text-sm transition-colors"
          aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      )}
    </div>
  );
}
