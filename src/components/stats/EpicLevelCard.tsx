'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CountUp } from '@/components/animations/CountUp';
import { EpicXPBar } from './EpicXPBar';

interface EpicLevelCardProps {
  level: number;
  levelTitle: string;
  totalPoints: number;
  pointsToNextLevel: number;
}

interface Particle {
  id: number;
  startX: number;
  endX: number;
  duration: number;
  delay: number;
}

export function EpicLevelCard({
  level,
  levelTitle,
  totalPoints,
  pointsToNextLevel,
}: EpicLevelCardProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles only on client side to avoid hydration mismatch
    const newParticles = [...Array(15)].map((_, i) => ({
      id: i,
      startX: Math.random() * 100,
      endX: Math.random() * 100,
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: 0.2,
      }}
      className="relative rounded-2xl border-2 border-nature-400 overflow-hidden shadow-2xl"
    >
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(135deg, #6BA644 0%, #8BC34A 50%, #AED581 100%)',
            'linear-gradient(135deg, #8BC34A 0%, #AED581 50%, #6BA644 100%)',
            'linear-gradient(135deg, #6BA644 0%, #8BC34A 50%, #AED581 100%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            initial={{
              x: `${particle.startX}%`,
              y: '120%',
            }}
            animate={{
              y: ['120%', '-20%'],
              x: [`${particle.startX}%`, `${particle.endX}%`],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          {/* Level Info */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm opacity-90 mb-1 font-body uppercase tracking-wider">Current Level</p>
            <motion.h3
              className="text-6xl font-display font-extrabold mb-2"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 15,
                delay: 0.5,
              }}
            >
              <CountUp value={level} duration={1000} />
            </motion.h3>
            <motion.p
              className="text-lg font-body font-medium opacity-95"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {levelTitle}
            </motion.p>
          </motion.div>

          {/* Total Points */}
          <motion.div
            className="text-right"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm opacity-90 mb-1 font-body uppercase tracking-wider">Total Points</p>
            <motion.p
              className="text-4xl font-display font-bold"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 15,
                delay: 0.5,
              }}
            >
              <CountUp value={totalPoints} duration={1500} />
            </motion.p>
          </motion.div>
        </div>

        {/* XP Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <EpicXPBar
            currentPoints={totalPoints}
            pointsToNextLevel={pointsToNextLevel}
            nextLevel={level + 1}
          />
        </motion.div>

        {/* Decorative Badge */}
        <motion.div
          className="absolute -top-4 -right-4 w-32 h-32 opacity-10"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
