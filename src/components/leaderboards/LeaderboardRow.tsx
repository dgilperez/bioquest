'use client';

import { LeaderboardEntry } from '@/lib/leaderboards/service';
import Image from 'next/image';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  points: number;
  isCurrentUser: boolean;
}

export function LeaderboardRow({ entry, points, isCurrentUser }: LeaderboardRowProps) {
  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const medal = getMedalEmoji(entry.rank);

  return (
    <div
      className={`
        px-6 py-4 hover:bg-gray-50 transition-colors
        ${isCurrentUser ? 'bg-green-50' : ''}
      `}
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Rank */}
        <div className="col-span-1">
          <div className="flex items-center gap-2">
            {medal ? (
              <span className="text-2xl">{medal}</span>
            ) : (
              <span className="text-lg font-semibold text-gray-700">
                #{entry.rank}
              </span>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="col-span-5">
          <div className="flex items-center gap-3">
            {entry.user.icon ? (
              <Image
                src={entry.user.icon}
                alt={entry.user.name || entry.user.inatUsername}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-semibold">
                  {(entry.user.name || entry.user.inatUsername).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {entry.user.name || entry.user.inatUsername}
                {isCurrentUser && (
                  <span className="ml-2 text-xs font-normal text-green-600">(You)</span>
                )}
              </div>
              <div className="text-sm text-gray-500 truncate">
                @{entry.user.inatUsername}
                {entry.user.location && (
                  <span className="ml-2">• {entry.user.location}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Points */}
        <div className="col-span-2 text-right">
          <div className="text-lg font-bold text-green-600">
            {points.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Level {entry.level}</div>
        </div>

        {/* Observations */}
        <div className="col-span-2 text-right">
          <div className="text-base font-semibold text-gray-700">
            {entry.totalObservations.toLocaleString()}
          </div>
        </div>

        {/* Species */}
        <div className="col-span-2 text-right">
          <div className="text-base font-semibold text-gray-700">
            {entry.totalSpecies.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
