'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { LifeListEntry } from '@/lib/stats/advanced-stats';
import { getRarityConfig } from '@/styles/design-tokens';
import { Rarity } from '@/types';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const ICONIC_TAXA = [
  { value: '', label: 'All Taxa' },
  { value: 'Aves', label: '🐦 Birds' },
  { value: 'Plantae', label: '🌿 Plants' },
  { value: 'Insecta', label: '🐛 Insects' },
  { value: 'Mammalia', label: '🦌 Mammals' },
  { value: 'Reptilia', label: '🦎 Reptiles' },
  { value: 'Amphibia', label: '🐸 Amphibians' },
  { value: 'Fungi', label: '🍄 Fungi' },
  { value: 'Mollusca', label: '🐌 Molluscs' },
  { value: 'Arachnida', label: '🕷️ Arachnids' },
  { value: 'Actinopterygii', label: '🐟 Ray-finned Fishes' },
];

const RARITY_OPTIONS: { value: Rarity | ''; label: string }[] = [
  { value: '', label: 'All Rarities' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'mythic', label: 'Mythic' },
];

const PAGE_SIZE = 50;

export default function LifeListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [entries, setEntries] = useState<LifeListEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [iconicTaxon, setIconicTaxon] = useState('');
  const [rarity, setRarity] = useState<Rarity | ''>('');
  const [page, setPage] = useState(1);

  // Filter UI state
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const fetchLifeList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: ((page - 1) * PAGE_SIZE).toString(),
      });

      if (search) params.append('search', search);
      if (iconicTaxon) params.append('iconicTaxon', iconicTaxon);
      if (rarity) params.append('rarity', rarity);

      const response = await fetch(`/api/stats/life-list?${params}`);
      const data = await response.json();

      setEntries(data.entries);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch life list:', error);
    } finally {
      setLoading(false);
    }
  }, [search, iconicTaxon, rarity, page]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLifeList();
    }
  }, [status, fetchLifeList]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1); // Reset to first page on search
  }

  function handleFilterChange() {
    setPage(1); // Reset to first page on filter change
  }

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Life List</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your complete species checklist • {total} species
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 mb-6">
          {/* Search Bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search species by name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium mb-2">Taxonomic Group</label>
                <select
                  value={iconicTaxon}
                  onChange={(e) => {
                    setIconicTaxon(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  {ICONIC_TAXA.map((taxon) => (
                    <option key={taxon.value} value={taxon.value}>
                      {taxon.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Rarity</label>
                <select
                  value={rarity}
                  onChange={(e) => {
                    setRarity(e.target.value as Rarity | '');
                    handleFilterChange();
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  {RARITY_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-12 text-center">
            <div className="text-gray-500">Loading species...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-12 text-center">
            <p className="text-gray-500 mb-2">No species found</p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            {/* Species Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Species
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rarity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Seen
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Observations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {entries.map((entry) => {
                      const config = getRarityConfig(entry.rarity);
                      const date = new Date(entry.firstObservedOn).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });

                      return (
                        <tr
                          key={entry.taxonId}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {entry.commonName || entry.taxonName}
                                </div>
                                {entry.commonName && (
                                  <div className="text-sm text-gray-500 italic truncate">
                                    {entry.taxonName}
                                  </div>
                                )}
                              </div>
                              {entry.isFirstGlobal && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                                  🌍 First!
                                </span>
                              )}
                              {entry.isFirstRegional && !entry.isFirstGlobal && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                                  📍 Regional
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className="inline-block text-xs font-semibold px-2 py-1 rounded capitalize"
                              style={{
                                backgroundColor: config.colors.particle,
                                color: config.colors.base,
                              }}
                            >
                              {entry.rarity}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {date}
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-medium">
                            {entry.observationCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} species
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            page === pageNum
                              ? 'bg-green-600 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
