'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Badge } from '@/types';

interface BadgeUnlockCeremonyProps {
  badge: Badge | null;
  onClose: () => void;
}

export function BadgeUnlockCeremony({ badge, onClose }: BadgeUnlockCeremonyProps) {
  useEffect(() => {
    if (badge) {
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      const colors = badge.tier === 'platinum'
        ? ['#5E35B1', '#7E57C2', '#B39DDB']
        : badge.tier === 'gold'
        ? ['#F9A825', '#FDD835', '#FFF59D']
        : badge.tier === 'silver'
        ? ['#90A4AE', '#B0BEC5', '#ECEFF1']
        : ['#8D6E63', '#A1887F', '#BCAAA4'];

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
        });

        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
        });
      }, 50);

      // Burst at the center
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors,
        });
      }, 300);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [badge]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Badge Card */}
          <motion.div
            className="relative z-10 max-w-md w-full"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              duration: 0.8,
            }}
          >
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl border-4 border-nature-400">
              {/* Pulsing Glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: [
                    '0 0 0px rgba(139, 195, 74, 0)',
                    '0 0 40px rgba(139, 195, 74, 0.6)',
                    '0 0 0px rgba(139, 195, 74, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Content */}
              <div className="relative text-center">
                {/* Badge Unlocked Text */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <h2 className="text-3xl font-display font-bold text-nature-600 dark:text-nature-400 mb-2">
                    Badge Unlocked!
                  </h2>
                  <div className="text-5xl mb-4">🏆</div>
                </motion.div>

                {/* Badge Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    rotate: [- 180, 180, 0],
                  }}
                  transition={{
                    delay: 0.5,
                    duration: 0.8,
                    times: [0, 0.6, 1],
                  }}
                  className="text-8xl mb-6"
                >
                  {badge.iconUrl || '🏆'}
                </motion.div>

                {/* Badge Name */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-2xl font-display font-bold mb-2"
                >
                  {badge.name}
                </motion.h3>

                {/* Badge Description */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-muted-foreground font-body mb-6"
                >
                  {badge.description}
                </motion.p>

                {/* Tier Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2, type: 'spring' }}
                  className={`inline-block px-4 py-2 rounded-full font-bold text-sm mb-6 ${
                    badge.tier === 'platinum'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : badge.tier === 'gold'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      : badge.tier === 'silver'
                      ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                  }`}
                >
                  {badge.tier?.toUpperCase() || 'BRONZE'} TIER
                </motion.div>

                {/* Close Button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-6 py-3 bg-nature-600 hover:bg-nature-700 text-white rounded-lg font-display font-bold shadow-lg transition-colors"
                >
                  Awesome!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
