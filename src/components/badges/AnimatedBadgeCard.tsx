'use client';

import { motion } from 'framer-motion';
import { Badge, BadgeDefinition, BadgeTier } from '@/types';
import { cn } from '@/lib/utils';
import { staggerItem } from '@/lib/animations/variants';

interface AnimatedBadgeCardProps {
  badge: Badge | BadgeDefinition;
  isUnlocked: boolean;
  index?: number;
  onClick?: () => void;
  compact?: boolean; // Compact mode for profile preview
}

const tierColors: Record<BadgeTier, { bg: string; border: string; glow: string }> = {
  bronze: {
    bg: 'from-amber-700 to-amber-900',
    border: 'border-amber-700/50',
    glow: '0 0 20px rgba(217, 119, 6, 0.3)',
  },
  silver: {
    bg: 'from-gray-400 to-gray-600',
    border: 'border-gray-400/50',
    glow: '0 0 20px rgba(156, 163, 175, 0.3)',
  },
  gold: {
    bg: 'from-yellow-400 to-yellow-600',
    border: 'border-yellow-400/50',
    glow: '0 0 20px rgba(234, 179, 8, 0.4)',
  },
  platinum: {
    bg: 'from-purple-400 to-purple-600',
    border: 'border-purple-400/50',
    glow: '0 0 20px rgba(168, 85, 247, 0.4)',
  },
};

export function AnimatedBadgeCard({ badge, isUnlocked, index = 0, onClick, compact = false }: AnimatedBadgeCardProps) {
  const tier = badge.tier || 'bronze';
  const tierConfig = tierColors[tier];

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={
        isUnlocked
          ? compact
            ? {
                scale: 1.02,
                boxShadow: tierConfig.glow,
                transition: { duration: 0.2 },
              }
            : {
                scale: 1.05,
                y: -8,
                boxShadow: tierConfig.glow,
                transition: { duration: 0.2 },
              }
          : {
              scale: 1.02,
              transition: { duration: 0.2 },
            }
      }
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'rounded-lg border transition-all cursor-pointer relative overflow-hidden',
        compact ? 'p-3' : 'p-6',
        isUnlocked
          ? `bg-gradient-to-br ${tierConfig.bg} ${tierConfig.border} shadow-lg`
          : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
      )}
    >
      {/* Shimmer effect for unlocked badges (disabled in compact mode) */}
      {isUnlocked && !compact && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'linear',
          }}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            width: '50%',
          }}
        />
      )}

      <div className={cn('flex items-start relative z-10', compact ? 'gap-2' : 'gap-4')}>
        {/* Badge Icon */}
        <motion.div
          className={cn(
            'flex-shrink-0 rounded-full flex items-center justify-center',
            compact ? 'w-12 h-12 text-2xl' : 'w-16 h-16 text-3xl',
            isUnlocked ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-300 dark:bg-gray-700'
          )}
          whileHover={
            isUnlocked && !compact
              ? {
                  scale: [1, 1.15, 1],
                  rotate: [0, -5, 5, 0],
                  transition: {
                    duration: 0.6,
                    ease: 'easeInOut',
                  },
                }
              : {}
          }
        >
          {isUnlocked ? '🏆' : '🔒'}
        </motion.div>

        {/* Badge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <motion.h3
              className={cn(
                'font-display font-semibold text-lg',
                isUnlocked ? 'text-white' : 'text-gray-600 dark:text-gray-400'
              )}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {badge.name}
            </motion.h3>
            {badge.tier && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 200 }}
                className={cn(
                  'px-2 py-1 rounded text-xs font-bold font-display uppercase',
                  isUnlocked
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}
              >
                {badge.tier}
              </motion.span>
            )}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.15 }}
            className={cn(
              'text-sm mt-2 font-body',
              isUnlocked ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {badge.description}
          </motion.p>

          {!isUnlocked && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.2 }}
              className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic"
            >
              Keep observing to unlock this badge!
            </motion.p>
          )}

          {isUnlocked && !compact && 'unlockedAt' in badge && badge.unlockedAt ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.2 }}
              className="text-xs text-white/70 mt-2"
            >
              Unlocked {new Date(badge.unlockedAt as Date).toLocaleDateString()}
            </motion.p>
          ) : null}
        </div>
      </div>

      {/* Locked badge pulse effect */}
      {!isUnlocked && (
        <motion.div
          className="absolute top-4 right-4 text-4xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          🔒
        </motion.div>
      )}
    </motion.div>
  );
}
