'use client';

import { motion } from 'framer-motion';
import { getStreakColor, getStreakEmoji, getStreakMessage, getNextMilestone } from '@/lib/gamification/streaks';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  lastObservationDate: Date | null;
  streakAtRisk?: boolean;
  hoursUntilBreak?: number;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  lastObservationDate,
  streakAtRisk = false,
  hoursUntilBreak = 0,
}: StreakDisplayProps) {
  const streakColor = getStreakColor(currentStreak);
  const streakEmoji = getStreakEmoji(currentStreak);
  const nextMilestone = getNextMilestone(currentStreak);

  // Calculate progress to next milestone
  const progressToNext = nextMilestone
    ? ((currentStreak % nextMilestone.days) / nextMilestone.days) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="relative overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-lg"
    >
      {/* Background gradient effect */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${streakColor.replace('from-', '').replace('to-', '')})`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
            Observation Streak
          </h3>
          {currentStreak > 0 && (
            <motion.div
              animate={{
                scale: streakAtRisk ? [1, 1.1, 1] : [1, 1.05, 1],
                rotate: [0, -5, 5, -5, 0],
              }}
              transition={{
                duration: streakAtRisk ? 0.5 : 2,
                repeat: Infinity,
                repeatDelay: streakAtRisk ? 0 : 1,
              }}
              className="text-4xl"
            >
              {streakEmoji}
            </motion.div>
          )}
        </div>

        {/* Main streak display */}
        <div className="flex items-baseline gap-2 mb-2">
          <motion.span
            key={currentStreak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`text-6xl font-display font-black bg-gradient-to-r ${streakColor} bg-clip-text text-transparent`}
          >
            {currentStreak}
          </motion.span>
          <span className="text-2xl font-display font-bold text-gray-600 dark:text-gray-400">
            {currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        {/* Status message */}
        <motion.p
          key={`${currentStreak}-${streakAtRisk}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm font-body mb-4 ${
            streakAtRisk && hoursUntilBreak < 6
              ? 'text-red-600 dark:text-red-400 font-semibold'
              : streakAtRisk
              ? 'text-orange-600 dark:text-orange-400 font-medium'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {getStreakMessage({
            currentStreak,
            longestStreak,
            lastObservationDate: lastObservationDate || new Date(),
            streakAtRisk,
            hoursUntilBreak,
            bonusPoints: 0
          })}
        </motion.p>

        {/* Progress to next milestone */}
        {nextMilestone && currentStreak > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-display text-gray-500 dark:text-gray-400">
              <span>Next: {nextMilestone.title}</span>
              <span className="font-bold">
                {nextMilestone.days - currentStreak} days
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${streakColor} relative`}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    width: '50%',
                  }}
                />
              </motion.div>
            </div>
            {nextMilestone.bonusPoints > 0 && (
              <p className="text-xs text-center font-display text-gray-500 dark:text-gray-400">
                Reward: <span className="font-bold text-nature-600 dark:text-nature-400">
                  +{nextMilestone.bonusPoints} points
                </span>
              </p>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-around">
          <div className="text-center">
            <p className="text-xs font-display text-gray-500 dark:text-gray-400 mb-1">
              Current
            </p>
            <p className={`text-2xl font-display font-bold bg-gradient-to-r ${streakColor} bg-clip-text text-transparent`}>
              {currentStreak}
            </p>
          </div>
          <div className="w-px bg-gray-200 dark:border-gray-700" />
          <div className="text-center">
            <p className="text-xs font-display text-gray-500 dark:text-gray-400 mb-1">
              Longest
            </p>
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
              {longestStreak}
            </p>
          </div>
        </div>

        {/* Warning for at-risk streaks */}
        {streakAtRisk && hoursUntilBreak < 6 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <p className="text-xs font-display text-red-800 dark:text-red-300 text-center">
              ⏰ Make an observation today to keep your streak alive!
            </p>
          </motion.div>
        )}

        {/* First streak encouragement */}
        {currentStreak === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-4 bg-nature-50 dark:bg-nature-900/20 border border-nature-200 dark:border-nature-800 rounded-lg text-center"
          >
            <p className="text-sm font-display text-nature-800 dark:text-nature-300 mb-2">
              🌱 Start your first streak!
            </p>
            <p className="text-xs font-body text-nature-600 dark:text-nature-400">
              Make an observation today and come back tomorrow to build your streak
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
