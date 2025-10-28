'use client';

import type { TaxonomicBreakdown as TaxonomicBreakdownType } from '@/lib/stats/advanced-stats';

interface TaxonomicBreakdownProps {
  data: TaxonomicBreakdownType[];
}

const TAXON_EMOJIS: Record<string, string> = {
  'Birds': '🐦',
  'Plants': '🌿',
  'Insects': '🐛',
  'Mammals': '🦌',
  'Reptiles': '🦎',
  'Amphibians': '🐸',
  'Fungi': '🍄',
  'Molluscs': '🐌',
  'Arachnids': '🕷️',
  'Ray-finned Fishes': '🐟',
  'Other Animals': '🦠',
};

export function TaxonomicBreakdown({ data }: TaxonomicBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Taxonomic Breakdown</h2>
        <p className="text-gray-500">No observations yet</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-6">Taxonomic Breakdown</h2>

      <div className="space-y-4">
        {data.map((taxon) => {
          const widthPercentage = (taxon.count / maxCount) * 100;

          return (
            <div key={taxon.iconicTaxon} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {TAXON_EMOJIS[taxon.commonName] || '🔬'}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{taxon.commonName}</div>
                    <div className="text-xs text-gray-500">
                      {taxon.speciesCount} species
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{taxon.count}</div>
                  <div className="text-xs text-gray-500">{taxon.percentage}%</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 group-hover:from-green-600 group-hover:to-green-700"
                  style={{ width: `${widthPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t text-sm text-gray-500">
        <p>
          You&apos;ve observed <strong>{data.reduce((sum, d) => sum + d.speciesCount, 0)}</strong>{' '}
          unique species across <strong>{data.length}</strong> taxonomic groups
        </p>
      </div>
    </div>
  );
}
