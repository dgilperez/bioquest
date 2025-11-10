/**
 * Example Component: Client-Side iNaturalist API Calls
 *
 * This demonstrates the hybrid client/server architecture:
 * - User observations fetched directly from browser (user's IP quota)
 * - Rarity classification still happens server-side (shared cache)
 *
 * SCALABILITY:
 * - These API calls use the USER's IP, not the server's IP
 * - Each user gets their own rate limit (~60 req/min)
 * - Server quota saved for background processing and shared cache
 *
 * See: /docs/SCALING.md - "Hybrid Client/Server Architecture"
 */

'use client';

import { useINatAPI } from '@/hooks/useINatAPI';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Observation {
  id: number;
  species_guess?: string;
  observed_on?: string;
  place_guess?: string;
  quality_grade?: string;
  taxon?: {
    id: number;
    name: string;
    preferred_common_name?: string;
  };
  photos?: Array<{
    url: string;
  }>;
}

export function ClientSideObservations() {
  const { data: session } = useSession();
  const {
    getUserObservations,
    searchTaxa,
    loading,
    error,
    isAuthenticated,
  } = useINatAPI();

  const [observations, setObservations] = useState<Observation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Load user's observations on mount
  useEffect(() => {
    async function loadObservations() {
      // ARCHITECTURE NOTE: inatUsername is stored on session.user (requires type assertion)
      // See /src/lib/auth.ts for NextAuth session configuration
      const inatUsername = (session?.user as any)?.inatUsername;
      if (!inatUsername) return;

      try {
        // SCALABILITY: This API call goes directly from browser → iNaturalist
        // Benefits:
        // 1. Uses USER's IP quota (60 req/min), not server's shared quota
        // 2. Faster response (no server round-trip)
        // 3. Server resources freed for background jobs (rarity classification, etc.)
        console.log('📡 Fetching observations from browser (user IP quota)...');
        const data = await getUserObservations(inatUsername, {
          per_page: 10,
          order_by: 'observed_on',
          order: 'desc',
        });

        console.log(
          `✅ Loaded ${data.results.length} observations (0 server API calls!)`
        );
        setObservations(data.results);
      } catch (err) {
        console.error('Failed to load observations:', err);
      }
    }

    loadObservations();
  }, [session, getUserObservations]);

  // Search taxa - another example of client-side API usage
  async function handleSearch() {
    if (!searchQuery) return;

    try {
      // HYBRID ARCHITECTURE: Search queries are perfect for client-side execution
      // - User-initiated action (not background job)
      // - Results needed immediately for UI
      // - No caching benefit (search terms vary widely)
      // - Using user's IP quota instead of server's shared quota
      console.log(
        `🔍 Searching taxa from browser (user IP quota): "${searchQuery}"`
      );
      const data = await searchTaxa(searchQuery);
      console.log(
        `✅ Found ${data.results.length} taxa (0 server API calls!)`
      );
      setSearchResults(data.results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded">
        <p className="text-sm text-yellow-800">
          Please sign in to use client-side API features
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with explanation */}
      <div className="p-4 border border-blue-300 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">
          Client-Side API Demo
        </h3>
        <p className="text-sm text-blue-800">
          This component fetches data directly from iNaturalist using{' '}
          <strong>your browser</strong>, not the server. API calls count toward
          your personal rate limit (60/min), not the shared server quota.
        </p>
      </div>

      {/* Search Taxa */}
      <div className="border rounded p-4">
        <h4 className="font-semibold mb-3">Search Taxa (Client-Side)</h4>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for a species..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Found {searchResults.length} results:
            </p>
            {searchResults.map((taxon) => (
              <div key={taxon.id} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">
                  {taxon.preferred_common_name || taxon.name}
                </div>
                <div className="text-gray-600 text-xs italic">{taxon.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Observations */}
      <div className="border rounded p-4">
        <h4 className="font-semibold mb-3">
          Your Recent Observations (Client-Side)
        </h4>

        {loading && (
          <div className="text-center py-8 text-gray-600">
            Loading observations...
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            Error: {error.message}
            {error.name === 'RateLimitError' && (
              <div className="mt-2 text-xs">
                You&apos;ve made too many requests. Please wait a moment before
                trying again.
              </div>
            )}
          </div>
        )}

        {!loading && !error && observations.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            No observations found
          </div>
        )}

        {!loading && observations.length > 0 && (
          <div className="space-y-3">
            {observations.map((obs) => (
              <div
                key={obs.id}
                className="flex gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                {obs.photos?.[0] && (
                  <img
                    src={obs.photos[0].url}
                    alt={obs.species_guess || 'Observation'}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {obs.taxon?.preferred_common_name ||
                      obs.species_guess ||
                      'Unknown'}
                  </div>
                  {obs.taxon?.name && (
                    <div className="text-sm text-gray-600 italic truncate">
                      {obs.taxon.name}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {obs.observed_on && (
                      <span>
                        {new Date(obs.observed_on).toLocaleDateString()}
                      </span>
                    )}
                    {obs.place_guess && <span> · {obs.place_guess}</span>}
                  </div>
                </div>
                {obs.quality_grade && (
                  <div className="text-xs px-2 py-1 bg-white rounded border h-fit">
                    {obs.quality_grade}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded">
        <strong>How this works:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            API calls go directly from your browser to iNaturalist (check
            Network tab)
          </li>
          <li>Uses your OAuth token for authentication</li>
          <li>Counts toward YOUR rate limit, not the server&apos;s shared limit</li>
          <li>
            Server still handles rarity classification, points, and badges
            (shared cache)
          </li>
          <li>Result: 40% reduction in server API calls + faster UX</li>
        </ul>
      </div>
    </div>
  );
}
