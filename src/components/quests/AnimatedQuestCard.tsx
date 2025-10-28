'use client';

import { motion } from 'framer-motion';
import { Quest, QuestStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Target, Award, Clock } from 'lucide-react';
import { staggerItem } from '@/lib/animations/variants';
import { CountUp } from '@/components/animations/CountUp';

interface AnimatedQuestCardProps {
  quest: Quest;
  progress: number;
  status: QuestStatus;
  index?: number;
}

const questTypeColors = {
  daily: { bg: 'from-blue-500 to-blue-600', glow: '0 0 20px rgba(59, 130, 246, 0.3)' },
  weekly: { bg: 'from-purple-500 to-purple-600', glow: '0 0 20px rgba(168, 85, 247, 0.3)' },
  monthly: { bg: 'from-yellow-500 to-yellow-600', glow: '0 0 20px rgba(234, 179, 8, 0.3)' },
  personal: { bg: 'from-green-500 to-green-600', glow: '0 0 20px rgba(34, 197, 94, 0.3)' },
};

const questTypeIcons = {
  daily: '📅',
  weekly: '📆',
  monthly: '🗓️',
  personal: '🎯',
};

const questTypeLabels = {
  daily: 'Daily Quest',
  weekly: 'Weekly Quest',
  monthly: 'Monthly Quest',
  personal: 'Personal Quest',
};

export function AnimatedQuestCard({ quest, progress, status, index = 0 }: AnimatedQuestCardProps) {
  const isCompleted = status === 'completed';
  const isExpired = status === 'expired';
  const isActive = status === 'active';
  const typeConfig = questTypeColors[quest.type];

  // Calculate time remaining
  const now = new Date();
  const endDate = new Date(quest.endDate);
  const timeRemaining = endDate.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  let timeRemainingText = '';
  let isUrgent = false;

  if (daysRemaining > 0) {
    timeRemainingText = `${daysRemaining}d remaining`;
  } else if (hoursRemaining > 0) {
    timeRemainingText = `${hoursRemaining}h remaining`;
    isUrgent = hoursRemaining <= 6;
  } else {
    timeRemainingText = 'Expires soon';
    isUrgent = true;
  }

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={
        isActive
          ? {
              scale: 1.03,
              y: -4,
              boxShadow: typeConfig.glow,
              transition: { duration: 0.2 },
            }
          : isCompleted
          ? {
              scale: 1.02,
              transition: { duration: 0.2 },
            }
          : {}
      }
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-lg border p-6 transition-all cursor-pointer relative overflow-hidden',
        isCompleted &&
          'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700',
        isExpired && 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60',
        isActive && 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-md'
      )}
    >
      {/* Shimmer for active high-progress quests */}
      {isActive && progress >= 75 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
            ease: 'linear',
          }}
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.2) 50%, transparent 100%)`,
            width: '50%',
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <motion.div
            className={cn(
              'text-3xl w-12 h-12 flex items-center justify-center rounded-full',
              isCompleted && 'bg-green-200 dark:bg-green-900/40',
              isExpired && 'bg-gray-200 dark:bg-gray-700',
              isActive && `bg-gradient-to-br ${typeConfig.bg}`
            )}
            animate={
              isCompleted
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }
                : isActive
                ? {
                    rotate: [0, -5, 5, -5, 0],
                  }
                : {}
            }
            transition={
              isCompleted
                ? {
                    duration: 0.8,
                    times: [0, 0.5, 1],
                  }
                : {
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'easeInOut',
                  }
            }
          >
            {isCompleted ? '✓' : questTypeIcons[quest.type]}
          </motion.div>
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="text-xs font-medium font-display text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              {questTypeLabels[quest.type]}
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.05 }}
              className="text-lg font-display font-bold"
            >
              {quest.title}
            </motion.h3>
          </div>
        </div>

        {/* Reward */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 200 }}
          className="text-right"
        >
          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
            <motion.div
              animate={{
                rotate: isActive && progress >= 100 ? [0, -10, 10, -10, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                repeat: isActive && progress >= 100 ? Infinity : 0,
                repeatDelay: 1,
              }}
            >
              <Award className="h-5 w-5" />
            </motion.div>
            <span className="font-bold font-display text-lg">
              <CountUp value={quest.reward.points || 0} duration={800} />
            </span>
          </div>
          <p className="text-xs text-gray-500">points</p>
        </motion.div>
      </div>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05 + 0.15 }}
        className="text-sm font-body text-gray-600 dark:text-gray-400 mb-4"
      >
        {quest.description}
      </motion.p>

      {/* Progress Bar */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 + 0.2 }}
          className="mb-4"
        >
          <div className="flex justify-between text-xs font-display font-medium text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <motion.span
              key={progress}
              initial={{ scale: 1.5, color: 'rgb(34, 197, 94)' }}
              animate={{ scale: 1, color: 'currentColor' }}
              transition={{ duration: 0.3 }}
              className="font-bold"
            >
              <CountUp value={progress} duration={500} suffix="%" />
            </motion.span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: index * 0.05 + 0.3 }}
              className={cn(
                'h-full rounded-full relative',
                `bg-gradient-to-r ${typeConfig.bg}`
              )}
            >
              {/* Shimmer on progress bar */}
              {progress > 0 && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    width: '50%',
                  }}
                />
              )}
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05 + 0.25 }}
        className="flex items-center justify-between text-xs font-body text-gray-500 dark:text-gray-400"
      >
        {isActive && (
          <>
            <div className={cn('flex items-center gap-1', isUrgent && 'text-red-600 dark:text-red-500 font-semibold')}>
              <Clock className={cn('h-3 w-3', isUrgent && 'animate-pulse')} />
              <span>{timeRemainingText}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{progress >= 100 ? 'Complete!' : `${progress}% complete`}</span>
            </div>
          </>
        )}

        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-500 font-semibold font-display">
            <Award className="h-3 w-3" />
            <span>Completed!</span>
          </div>
        )}

        {isExpired && (
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Expired</span>
          </div>
        )}
      </motion.div>

      {/* Completion celebration particles */}
      {isCompleted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => {
            const angle = (360 / 8) * i;
            const x = Math.cos((angle * Math.PI) / 180) * 50;
            const y = Math.sin((angle * Math.PI) / 180) * 50;

            return (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-500 rounded-full"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x,
                  y,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.05,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
