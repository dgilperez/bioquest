'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Star, Leaf, Zap } from 'lucide-react';
import { CountUp } from '@/components/animations/CountUp';

interface WeeklyXPCardProps {
  weeklyPoints: number;
  // Optional breakdown data for future enhancement
  newSpeciesCount?: number;
  rareFindsCount?: number;
  observationsCount?: number;
}

export function WeeklyXPCard({
  weeklyPoints,
  newSpeciesCount = 0,
  rareFindsCount = 0,
  observationsCount = 0,
}: WeeklyXPCardProps) {
  // Determine if we have breakdown data
  const hasBreakdown = newSpeciesCount > 0 || rareFindsCount > 0 || observationsCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        delay: 0.3,
      }}
      className="relative rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-2 border-amber-200 dark:border-amber-800 overflow-hidden shadow-lg"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </motion.div>
          <h3 className="text-sm font-display font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wider">
            This Week
          </h3>
        </div>

        {/* XP Count */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <motion.span
              className="text-3xl sm:text-4xl font-display font-extrabold text-amber-700 dark:text-amber-300"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 15,
                delay: 0.4,
              }}
            >
              +<CountUp value={weeklyPoints} duration={1200} />
            </motion.span>
            <span className="text-base sm:text-lg font-body font-medium text-amber-600 dark:text-amber-400">
              XP
            </span>
          </div>
        </div>

        {/* Breakdown */}
        {hasBreakdown ? (
          <div className="space-y-2">
            {newSpeciesCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 text-sm"
              >
                <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-amber-800 dark:text-amber-200 font-body">
                  {newSpeciesCount} new {newSpeciesCount === 1 ? 'species' : 'species'}
                </span>
              </motion.div>
            )}
            {rareFindsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2 text-sm"
              >
                <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-amber-800 dark:text-amber-200 font-body">
                  {rareFindsCount} rare {rareFindsCount === 1 ? 'find' : 'finds'}
                </span>
              </motion.div>
            )}
            {observationsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-2 text-sm"
              >
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-amber-800 dark:text-amber-200 font-body">
                  {observationsCount} {observationsCount === 1 ? 'observation' : 'observations'}
                </span>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-amber-700 dark:text-amber-300 font-body italic"
          >
            Keep exploring to earn more XP!
          </motion.p>
        )}

        {/* Motivational Message */}
        {weeklyPoints === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-amber-700 dark:text-amber-300 font-body mt-3 italic"
          >
            Start your week strong! 🚀
          </motion.p>
        )}

        {weeklyPoints > 0 && weeklyPoints < 100 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-amber-700 dark:text-amber-300 font-body mt-3 italic"
          >
            Great start! Keep it up! 🌟
          </motion.p>
        )}

        {weeklyPoints >= 500 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-amber-700 dark:text-amber-300 font-body mt-3 font-semibold"
          >
            You&apos;re on fire! 🔥
          </motion.p>
        )}
      </div>

      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        }}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
