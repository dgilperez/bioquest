'use client';

import { LeaderboardType } from '@/lib/leaderboards/service';

interface LeaderboardTabsProps {
  currentType: LeaderboardType;
  onTypeChange: (type: LeaderboardType) => void;
}

const tabs: { value: LeaderboardType; label: string; description: string }[] = [
  {
    value: 'global',
    label: 'Global',
    description: 'All naturalists worldwide',
  },
  {
    value: 'regional',
    label: 'Regional',
    description: 'Your local area',
  },
  {
    value: 'friends',
    label: 'Friends',
    description: 'Your friend circle',
  },
  {
    value: 'taxon',
    label: 'Taxon',
    description: 'Top observers by species group',
  },
];

export function LeaderboardTabs({ currentType, onTypeChange }: LeaderboardTabsProps) {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTypeChange(tab.value)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  currentType === tab.value
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div>
                <div className="font-semibold">{tab.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
