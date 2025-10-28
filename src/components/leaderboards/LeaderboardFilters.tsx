'use client';

import { LeaderboardType, LeaderboardPeriod } from '@/lib/leaderboards/service';

interface LeaderboardFiltersProps {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  taxon: string;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  onTaxonChange: (taxon: string) => void;
}

const periods: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'all_time', label: 'All Time' },
  { value: 'monthly', label: 'This Month' },
  { value: 'weekly', label: 'This Week' },
];

const taxons = [
  { value: 'Aves', label: 'Birds' },
  { value: 'Plantae', label: 'Plants' },
  { value: 'Insecta', label: 'Insects' },
  { value: 'Mammalia', label: 'Mammals' },
  { value: 'Reptilia', label: 'Reptiles' },
  { value: 'Amphibia', label: 'Amphibians' },
  { value: 'Fungi', label: 'Fungi' },
  { value: 'Mollusca', label: 'Molluscs' },
  { value: 'Arachnida', label: 'Arachnids' },
];

export function LeaderboardFilters({
  type,
  period,
  taxon,
  onPeriodChange,
  onTaxonChange,
}: LeaderboardFiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-4">
      {/* Period filter - shown for all types except taxon */}
      {type !== 'taxon' && (
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Period
          </label>
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as LeaderboardPeriod)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Taxon filter - only shown for taxon leaderboards */}
      {type === 'taxon' && (
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Species Group
          </label>
          <select
            value={taxon}
            onChange={(e) => onTaxonChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select a group...</option>
            {taxons.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
