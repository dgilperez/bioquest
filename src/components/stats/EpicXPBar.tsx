'use client';

import { motion, useAnimate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CountUp } from '@/components/animations/CountUp';

interface EpicXPBarProps {
  currentPoints: number;
  pointsToNextLevel: number;
  nextLevel: number;
}

export function EpicXPBar({ currentPoints, pointsToNextLevel, nextLevel }: EpicXPBarProps) {
  const [scope, animate] = useAnimate();
  const currentLevelPoints = currentPoints % pointsToNextLevel;
  const progress = (currentLevelPoints / pointsToNextLevel) * 100;
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    // Animate progress bar fill
    animate(
      '.progress-fill',
      { width: `${progress}%` },
      { duration: 1.5, ease: 'easeOut' }
    );

    // Show particles if progress is high
    if (progress > 75) {
      setShowParticles(true);
    }
  }, [progress, animate]);

  return (
    <div ref={scope} className="relative">
      {/* XP Numbers */}
      <div className="flex justify-between mb-3 text-sm">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="font-body"
        >
          <CountUp value={currentLevelPoints} /> XP
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="opacity-90 font-body"
        >
          <CountUp value={pointsToNextLevel} /> XP to Level {nextLevel}
        </motion.div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-4 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />

        {/* Progress Fill */}
        <motion.div
          className="progress-fill absolute inset-y-0 left-0 rounded-full overflow-hidden"
          initial={{ width: '0%' }}
          style={{
            background: 'linear-gradient(90deg, #AED581 0%, #8BC34A 50%, #6BA644 100%)',
            boxShadow: '0 0 20px rgba(139, 195, 74, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              width: '50%',
            }}
          />

          {/* Particle Trail */}
          {showParticles && (
            <div className="absolute right-0 inset-y-0 w-8">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: 0,
                    y: Math.random() * 16,
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{
                    x: [0, -20, -40],
                    y: [
                      Math.random() * 16,
                      Math.random() * 16,
                      Math.random() * 16,
                    ],
                    opacity: [1, 0.5, 0],
                    scale: [1, 0.5, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Glow Effect at End */}
        {progress > 80 && (
          <motion.div
            className="absolute right-0 inset-y-0 w-16 pointer-events-none"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%)',
            }}
          />
        )}
      </div>

      {/* Percentage Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-3 text-xs opacity-75 font-body"
      >
        {Math.round(progress)}% Complete
      </motion.div>
    </div>
  );
}
