'use client';

import { LeaderboardEntry, LeaderboardType, LeaderboardPeriod } from '@/lib/leaderboards/service';
import { LeaderboardRow } from './LeaderboardRow';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  total: number;
  type: LeaderboardType;
  period: LeaderboardPeriod;
}

export function LeaderboardList({
  entries,
  userEntry,
  total,
  period,
}: LeaderboardListProps) {
  const getPointsLabel = () => {
    switch (period) {
      case 'weekly':
        return 'Weekly Points';
      case 'monthly':
        return 'Monthly Points';
      default:
        return 'Total Points';
    }
  };

  const getPoints = (entry: LeaderboardEntry) => {
    switch (period) {
      case 'weekly':
        return entry.weeklyPoints;
      case 'monthly':
        return entry.monthlyPoints;
      default:
        return entry.totalPoints;
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">No entries yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top leaderboard entries */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Naturalist</div>
            <div className="col-span-2 text-right">{getPointsLabel()}</div>
            <div className="col-span-2 text-right">Observations</div>
            <div className="col-span-2 text-right">Species</div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {entries.map((entry, index) => (
            <LeaderboardRow
              key={entry.user.id}
              entry={entry}
              points={getPoints(entry)}
              isCurrentUser={userEntry?.user.id === entry.user.id}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Current user position if not in top entries */}
      {userEntry && !entries.find((e) => e.user.id === userEntry.user.id) && (
        <div className="bg-green-50 rounded-lg shadow-sm border-2 border-green-200 overflow-hidden">
          <div className="px-6 py-3 bg-green-100 border-b border-green-200">
            <h3 className="text-sm font-semibold text-green-900">Your Position</h3>
          </div>
          <div className="p-1">
            <LeaderboardRow
              entry={userEntry}
              points={getPoints(userEntry)}
              isCurrentUser={true}
              index={0}
            />
          </div>
        </div>
      )}

      {/* Stats footer */}
      <div className="text-center text-sm text-gray-500">
        Showing top {entries.length} of {total} naturalists
        {userEntry && (
          <>
            {' • '}
            You&apos;re ranked #{userEntry.rank}
          </>
        )}
      </div>
    </div>
  );
}
