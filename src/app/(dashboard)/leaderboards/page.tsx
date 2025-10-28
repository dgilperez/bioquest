'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LeaderboardList } from '@/components/leaderboards/LeaderboardList';
import { LeaderboardTabs } from '@/components/leaderboards/LeaderboardTabs';
import { LeaderboardFilters } from '@/components/leaderboards/LeaderboardFilters';
import { LeaderboardType, LeaderboardPeriod, LeaderboardEntry } from '@/lib/leaderboards/service';

interface LeaderboardResult {
  entries: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  total: number;
}

export default function LeaderboardsPage() {
  const { data: session } = useSession();
  const [type, setType] = useState<LeaderboardType>('global');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all_time');
  const [taxon, setTaxon] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!session) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          type,
          period,
          limit: '100',
        });

        if (type === 'taxon' && taxon) {
          params.append('taxon', taxon);
        }

        const response = await fetch(`/api/leaderboards?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [session, type, period, taxon]);

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Leaderboards</h1>
          <p className="text-gray-600">Please sign in to view leaderboards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboards</h1>
        <p className="text-gray-600">
          Compete with naturalists worldwide and climb the ranks!
        </p>
      </div>

      <LeaderboardTabs
        currentType={type}
        onTypeChange={setType}
      />

      <LeaderboardFilters
        type={type}
        period={period}
        taxon={taxon}
        onPeriodChange={setPeriod}
        onTaxonChange={setTaxon}
      />

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {!loading && data && (
        <LeaderboardList
          entries={data.entries}
          userEntry={data.userEntry}
          total={data.total}
          type={type}
          period={period}
        />
      )}
    </div>
  );
}
