'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TaxonomicBreakdown } from '@/components/stats/TaxonomicBreakdown';
import { SpeciesAccumulationChart } from '@/components/stats/SpeciesAccumulationChart';
import { RarityDistribution } from '@/components/stats/RarityDistribution';
import { LifeListPreview } from '@/components/stats/LifeListPreview';
import type { AdvancedStatsResult } from '@/lib/stats/advanced-stats';

export default function StatsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdvancedStatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!session) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/stats/advanced');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [session]);

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Statistics</h1>
          <p className="text-gray-600">Please sign in to view your statistics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Failed to load statistics'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Statistics</h1>
        <p className="text-gray-600">
          Explore your naturalist journey through data and insights
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-500 mb-1">Total Species</div>
          <div className="text-3xl font-bold text-green-600">{stats.totalSpecies}</div>
          <div className="text-xs text-gray-400 mt-1">Your life list</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-500 mb-1">Total Observations</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalObservations}</div>
          <div className="text-xs text-gray-400 mt-1">All sightings</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="text-sm text-gray-500 mb-1">Taxonomic Groups</div>
          <div className="text-3xl font-bold text-purple-600">
            {stats.taxonomicBreakdown.length}
          </div>
          <div className="text-xs text-gray-400 mt-1">Different taxa observed</div>
        </div>
      </div>

      {/* Taxonomic Breakdown */}
      <div className="mb-8">
        <TaxonomicBreakdown data={stats.taxonomicBreakdown} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Species Accumulation */}
        <div>
          <SpeciesAccumulationChart data={stats.speciesAccumulation} />
        </div>

        {/* Rarity Distribution */}
        <div>
          <RarityDistribution data={stats.rarityBreakdown} />
        </div>
      </div>

      {/* Life List Preview */}
      <div>
        <LifeListPreview entries={stats.lifeList} total={stats.totalSpecies} />
      </div>
    </div>
  );
}
