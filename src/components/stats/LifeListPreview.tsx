'use client';

import Link from 'next/link';
import type { LifeListEntry } from '@/lib/stats/advanced-stats';
import { getRarityConfig } from '@/styles/design-tokens';

interface LifeListPreviewProps {
  entries: LifeListEntry[];
  total: number;
}

export function LifeListPreview({ entries, total }: LifeListPreviewProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Life List Additions</h2>
        <p className="text-gray-500">No species recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Recent Life List Additions</h2>
          <p className="text-sm text-gray-500">Your newest species discoveries</p>
        </div>
        <Link
          href="/stats/life-list"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          View Full List ({total})
        </Link>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          const config = getRarityConfig(entry.rarity);
          const date = new Date(entry.firstObservedOn).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          return (
            <div
              key={entry.taxonId}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded capitalize"
                    style={{
                      backgroundColor: config.colors.particle,
                      color: config.colors.base,
                    }}
                  >
                    {entry.rarity}
                  </span>
                  {entry.isFirstGlobal && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                      🌍 First!
                    </span>
                  )}
                  {entry.isFirstRegional && !entry.isFirstGlobal && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                      📍 Regional First
                    </span>
                  )}
                </div>

                <div className="font-medium text-gray-900 mt-1 truncate">
                  {entry.commonName || entry.taxonName}
                </div>

                {entry.commonName && (
                  <div className="text-sm text-gray-500 italic truncate">
                    {entry.taxonName}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-1">
                  First seen {date} • {entry.observationCount} observation
                  {entry.observationCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {total > entries.length && (
        <div className="mt-4 pt-4 border-t text-center">
          <Link
            href="/stats/life-list"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View all {total} species →
          </Link>
        </div>
      )}
    </div>
  );
}
