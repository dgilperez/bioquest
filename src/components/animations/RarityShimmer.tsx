'use client';

import { motion } from 'framer-motion';
import { getRarityConfig } from '@/styles/design-tokens';
import { Rarity } from '@/types';

interface RarityShimmerProps {
  rarity: Rarity;
  onComplete?: () => void;
}

export function RarityShimmer({ rarity, onComplete }: RarityShimmerProps) {
  if (rarity === 'common') return null;

  const config = getRarityConfig(rarity);

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          duration: 1.5,
          ease: 'easeInOut',
          delay: 0.3,
        }}
        onAnimationComplete={onComplete}
        style={{
          background: `linear-gradient(90deg,
            transparent 0%,
            ${config.colors.glow}40 20%,
            ${config.colors.glow}80 50%,
            ${config.colors.glow}40 80%,
            transparent 100%)`,
          width: '50%',
        }}
      />

      {/* Pulsing border glow */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        animate={{
          boxShadow: [
            `0 0 0px ${config.colors.base}00`,
            config.shadow,
            `0 0 0px ${config.colors.base}00`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: 2,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
