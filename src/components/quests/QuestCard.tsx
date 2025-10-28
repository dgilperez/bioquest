import { Quest, QuestStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Target, Award, Clock } from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  progress: number;
  status: QuestStatus;
}

const questTypeColors: Record<string, string> = {
  daily: 'from-blue-500 to-blue-600',
  weekly: 'from-purple-500 to-purple-600',
  monthly: 'from-yellow-500 to-yellow-600',
  personal: 'from-green-500 to-green-600',
  event: 'from-red-500 to-red-600',
};

const questTypeIcons: Record<string, string> = {
  daily: '📅',
  weekly: '📆',
  monthly: '🗓️',
  personal: '🎯',
  event: '🎉',
};

const questTypeLabels: Record<string, string> = {
  daily: 'Daily Quest',
  weekly: 'Weekly Quest',
  monthly: 'Monthly Quest',
  personal: 'Personal Quest',
  event: 'Special Event',
};

export function QuestCard({ quest, progress, status }: QuestCardProps) {
  const isCompleted = status === 'completed';
  const isExpired = status === 'expired';
  const isActive = status === 'active';

  // Calculate time remaining
  const now = new Date();
  const endDate = new Date(quest.endDate);
  const timeRemaining = endDate.getTime() - now.getTime();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  let timeRemainingText = '';
  if (daysRemaining > 0) {
    timeRemainingText = `${daysRemaining}d remaining`;
  } else if (hoursRemaining > 0) {
    timeRemainingText = `${hoursRemaining}h remaining`;
  } else {
    timeRemainingText = 'Expires soon';
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-6 transition-all',
        isCompleted && 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700',
        isExpired && 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60',
        isActive && 'bg-white dark:bg-gray-800 hover:shadow-lg'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'text-3xl w-12 h-12 flex items-center justify-center rounded-full',
              isCompleted && 'bg-green-200 dark:bg-green-900/40',
              isExpired && 'bg-gray-200 dark:bg-gray-700',
              isActive && `bg-gradient-to-br ${questTypeColors[quest.type] || questTypeColors.daily}`
            )}
          >
            {isCompleted ? '✓' : (questTypeIcons[quest.type] || '📅')}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {questTypeLabels[quest.type] || 'Quest'}
            </p>
            <h3 className="text-lg font-semibold">{quest.title}</h3>
          </div>
        </div>

        {/* Reward */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
            <Award className="h-4 w-4" />
            <span className="font-bold">{quest.reward.points || 0}</span>
          </div>
          <p className="text-xs text-gray-500">points</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {quest.description}
      </p>

      {/* Progress Bar */}
      {isActive && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                `bg-gradient-to-r ${questTypeColors[quest.type] || questTypeColors.daily}`
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        {isActive && (
          <>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeRemainingText}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>
                {progress >= 100 ? 'Complete!' : `${progress}% complete`}
              </span>
            </div>
          </>
        )}

        {isCompleted && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-500 font-semibold">
            <Award className="h-3 w-3" />
            <span>Completed</span>
          </div>
        )}

        {isExpired && (
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Expired</span>
          </div>
        )}
      </div>
    </div>
  );
}
