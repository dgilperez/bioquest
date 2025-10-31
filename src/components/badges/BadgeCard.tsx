import { Badge, BadgeDefinition, BadgeTier } from '@/types';
import { cn } from '@/lib/utils';

interface BadgeCardProps {
  badge: Badge | BadgeDefinition;
  isUnlocked: boolean;
}

const tierColors: Record<BadgeTier, string> = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-purple-400 to-purple-600',
};

const tierBorder: Record<BadgeTier, string> = {
  bronze: 'border-amber-700/50',
  silver: 'border-gray-400/50',
  gold: 'border-yellow-400/50',
  platinum: 'border-purple-400/50',
};

export function BadgeCard({ badge, isUnlocked }: BadgeCardProps) {
  const tier = badge.tier || 'bronze';

  return (
    <div
      className={cn(
        'rounded-lg border p-6 transition-all duration-200 cursor-pointer',
        isUnlocked
          ? `bg-gradient-to-br ${tierColors[tier]} ${tierBorder[tier]} shadow-lg hover:scale-105 hover:shadow-2xl`
          : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60 hover:opacity-80'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Badge Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl',
            isUnlocked
              ? 'bg-white/20 backdrop-blur-sm'
              : 'bg-gray-300 dark:bg-gray-700'
          )}
        >
          {isUnlocked ? '🏆' : '🔒'}
        </div>

        {/* Badge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'font-semibold text-lg',
                isUnlocked ? 'text-white' : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {badge.name}
            </h3>
            {badge.tier && (
              <span
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  isUnlocked
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}
              >
                {badge.tier}
              </span>
            )}
          </div>

          <p
            className={cn(
              'text-sm mt-2',
              isUnlocked
                ? 'text-white/90'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {badge.description}
          </p>

          {!isUnlocked && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Keep observing to unlock this badge!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
