'use client';

import { motion } from 'framer-motion';

interface BackgroundProps {
  shouldAnimate: boolean;
  duration: (d: number) => number;
}

export default function Background({ shouldAnimate, duration }: BackgroundProps) {
  return (
    <motion.circle
      cx="200"
      cy="200"
      r="198"
      fill="#EDE4D3"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: duration(0.8), ease: 'easeOut' }}
    />
  );
}
