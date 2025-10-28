'use client';

import { Rarity } from '@/types';
import { getRarityConfig } from '@/styles/design-tokens';

interface RarityDistributionProps {
  data: Record<Rarity, number>;
}

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export function RarityDistribution({ data }: RarityDistributionProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Rarity Distribution</h2>
        <p className="text-gray-500">No observations yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-2">Rarity Distribution</h2>
      <p className="text-sm text-gray-500 mb-6">Breakdown by observation rarity</p>

      <div className="space-y-3">
        {RARITY_ORDER.map((rarity) => {
          const count = data[rarity] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const config = getRarityConfig(rarity);

          return (
            <div key={rarity} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.colors.base }}
                  />
                  <span className="font-medium text-sm capitalize">{rarity}</span>
                </div>
                <div className="text-sm font-semibold">
                  {count} ({percentage}%)
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: config.colors.base,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Total Observations</span>
          <span className="text-xl font-bold">{total}</span>
        </div>
      </div>

      {/* Notable finds */}
      {(data.epic + data.legendary + data.mythic > 0) && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="text-sm font-semibold text-purple-900 mb-1">
            🌟 Notable Finds
          </div>
          <div className="text-xs text-purple-700">
            You&apos;ve found {data.epic + data.legendary + data.mythic} rare or better observations!
          </div>
        </div>
      )}
    </div>
  );
}
