'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getRarityConfig } from '@/styles/design-tokens';
import { Rarity } from '@/types';

interface ParticleBurstProps {
  rarity: Rarity;
  show: boolean;
  onComplete?: () => void;
}

export function ParticleBurst({ rarity, show, onComplete }: ParticleBurstProps) {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number; distance: number }>>([]);

  useEffect(() => {
    if (show && rarity !== 'common') {
      const config = getRarityConfig(rarity);
      const particleCount = config.particles.count;

      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        angle: (360 / particleCount) * i,
        distance: 50 + Math.random() * 100,
      }));

      setParticles(newParticles);

      // Cleanup after animation
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, rarity, onComplete]);

  if (rarity === 'common' || !show) return null;

  const config = getRarityConfig(rarity);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      <AnimatePresence>
        {particles.map((particle) => {
          const x = Math.cos((particle.angle * Math.PI) / 180) * particle.distance;
          const y = Math.sin((particle.angle * Math.PI) / 180) * particle.distance;

          return (
            <motion.div
              key={particle.id}
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
              style={{
                background: config.colors.particle,
                boxShadow: `0 0 8px ${config.colors.glow}`,
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x,
                y,
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
              exit={{ opacity: 0 }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
