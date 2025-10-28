'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface LevelUpCelebrationProps {
  show: boolean;
  newLevel: number;
  levelTitle: string;
  onClose: () => void;
}

export function LevelUpCelebration({
  show,
  newLevel,
  levelTitle,
  onClose,
}: LevelUpCelebrationProps) {
  useEffect(() => {
    if (show) {
      // Screen shake effect
      const shakeKeyframes = [
        { transform: 'translate(0, 0)' },
        { transform: 'translate(-10px, 5px)' },
        { transform: 'translate(10px, -5px)' },
        { transform: 'translate(-5px, 10px)' },
        { transform: 'translate(5px, -10px)' },
        { transform: 'translate(0, 0)' },
      ];

      document.body.animate(shakeKeyframes, {
        duration: 500,
        iterations: 1,
      });

      // Massive confetti explosion
      setTimeout(() => {
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
        };

        function fire(particleRatio: number, opts: any) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
        });

        fire(0.2, {
          spread: 60,
        });

        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 45,
        });
      }, 300);

      // Auto-close after 4 seconds
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with radial gradient */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'radial-gradient(circle, rgba(139,195,74,0.3) 0%, rgba(0,0,0,0.8) 70%)',
            }}
            onClick={onClose}
          />

          {/* Flash Effect */}
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.3, times: [0, 0.1, 1] }}
          />

          {/* Level Up Content */}
          <div className="relative z-10">
            {/* "LEVEL UP!" Text */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: [0, 1.5, 1],
                rotate: [-180, 180, 0],
              }}
              transition={{
                duration: 0.8,
                times: [0, 0.6, 1],
                type: 'spring',
                stiffness: 200,
              }}
              className="text-center mb-8"
            >
              <h2 className="text-6xl md:text-8xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-nature-400 to-green-400 mb-4 drop-shadow-2xl">
                LEVEL UP!
              </h2>
            </motion.div>

            {/* New Level Number */}
            <motion.div
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{
                delay: 0.4,
                type: 'spring',
                stiffness: 150,
                damping: 10,
              }}
              className="text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  textShadow: [
                    '0 0 20px rgba(139,195,74,0.5)',
                    '0 0 40px rgba(139,195,74,0.8)',
                    '0 0 20px rgba(139,195,74,0.5)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-9xl md:text-[12rem] font-display font-black text-white mb-4"
              >
                {newLevel}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-2xl md:text-4xl font-display font-bold text-nature-300"
              >
                {levelTitle}
              </motion.p>
            </motion.div>

            {/* Tap to Continue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="text-center mt-12"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-display font-bold text-lg border-2 border-white/30 transition-colors"
              >
                Continue →
              </motion.button>
            </motion.div>
          </div>

          {/* Floating Stars/Sparkles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  delay: 0.5 + Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              >
                {['✨', '⭐', '🌟'][Math.floor(Math.random() * 3)]}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
