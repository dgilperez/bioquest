/**
 * Client-Side iNaturalist API Hook
 *
 * Enables direct browser calls to iNaturalist API using user's OAuth token.
 * API calls from browser use the USER's IP, not the server's IP - avoiding shared rate limits!
 *
 * SCALABILITY BENEFIT:
 * - Server-only: All calls count toward 10k/day server limit
 * - Client-side: Each user gets their own rate limit (effectively unlimited)
 * - Hybrid: 40% reduction in server API calls + faster UX
 *
 * USAGE:
 * ```tsx
 * const { getUserObservations, loading, error } = useINatAPI();
 * const data = await getUserObservations('username');
 * ```
 *
 * See: /docs/SCALING.md - "Hybrid Client/Server Architecture"
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useCallback, useRef } from 'react';

const INAT_API_BASE = 'https://api.inaturalist.org/v1';

// Client-side rate limiting to prevent abuse
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 60, // Match iNat's server limit
  WINDOW_MS: 60000, // 1 minute
};

export interface INatAPIError extends Error {
  statusCode?: number;
  endpoint?: string;
}

export function useINatAPI() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<INatAPIError | null>(null);

  // Track request timestamps for client-side rate limiting
  const requestTimestamps = useRef<number[]>([]);

  /**
   * Enforce client-side rate limiting
   */
  const enforceRateLimit = useCallback(() => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT.WINDOW_MS;

    // Remove timestamps outside the window
    requestTimestamps.current = requestTimestamps.current.filter(
      (ts) => ts > windowStart
    );

    // Check if we've hit the limit
    if (requestTimestamps.current.length >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
      const error = new Error(
        'Rate limit exceeded - please wait before making more requests'
      ) as INatAPIError;
      error.name = 'RateLimitError';
      throw error;
    }

    // Record this request
    requestTimestamps.current.push(now);
  }, []);

  /**
   * Make a request to the iNaturalist API
   *
   * IMPORTANT: This makes a direct call from the browser to iNat's API.
   * The request uses the user's IP address, NOT the server's IP.
   *
   * @param endpoint - The API endpoint path (e.g., '/observations' or '/taxa')
   * @param options - Optional fetch options (headers, method, body, etc.)
   * @returns Parsed JSON response typed as T
   * @throws INatAPIError - If authentication fails, rate limit exceeded, or API error
   *
   * @example
   * const data = await request<{ results: INatTaxon[] }>('/taxa?q=sparrow');
   */
  const request = useCallback(
    async <T,>(endpoint: string, options?: RequestInit): Promise<T> => {
      // Access token is stored on session object directly (not session.user)
      // See /src/lib/auth.ts - NextAuth stores it via: (session as any).accessToken = token.accessToken
      const accessToken = (session as any)?.accessToken;

      if (!accessToken) {
        const error = new Error('No access token available') as INatAPIError;
        error.name = 'AuthenticationError';
        throw error;
      }

      // Enforce client-side rate limiting
      try {
        enforceRateLimit();
      } catch (err) {
        setError(err as INatAPIError);
        throw err;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `${INAT_API_BASE}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        if (!response.ok) {
          const error = new Error(
            `iNat API error: ${response.statusText}`
          ) as INatAPIError;
          error.statusCode = response.status;
          error.endpoint = url;
          error.name = 'APIError';

          // Special handling for rate limits
          if (response.status === 429) {
            error.name = 'RateLimitError';
            error.message = 'iNaturalist rate limit exceeded - please wait';
          }

          throw error;
        }

        const data = await response.json();
        return data as T;
      } catch (err) {
        const error = err as INatAPIError;
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [session, enforceRateLimit]
  );

  /**
   * Get observations for a user
   *
   * Fetches observations directly from iNaturalist using the user's OAuth token.
   * This call uses the USER's IP quota, not the server's quota.
   *
   * @param username - iNaturalist username (e.g., 'dgilperez')
   * @param options - Query options for filtering and pagination
   * @param options.page - Page number (default: 1)
   * @param options.per_page - Results per page (default: 50, max: 200)
   * @param options.order_by - Sort field: 'created_at', 'observed_on', or 'id'
   * @param options.order - Sort direction: 'desc' or 'asc'
   * @param options.quality_grade - Filter by quality: 'research', 'needs_id', or 'casual'
   * @returns Promise with paginated observation results
   *
   * @example
   * // Get user's most recent observations
   * const data = await getUserObservations('dgilperez', {
   *   per_page: 50,
   *   order_by: 'observed_on',
   *   order: 'desc'
   * });
   *
   * @example
   * // Get only research-grade observations
   * const data = await getUserObservations('dgilperez', {
   *   quality_grade: 'research',
   *   per_page: 100
   * });
   */
  const getUserObservations = useCallback(
    async (
      username: string,
      options?: {
        page?: number;
        per_page?: number;
        order_by?: 'created_at' | 'observed_on' | 'id';
        order?: 'desc' | 'asc';
        quality_grade?: 'research' | 'needs_id' | 'casual';
      }
    ) => {
      const params = new URLSearchParams({
        user_login: username,
        per_page: (options?.per_page || 50).toString(),
        page: (options?.page || 1).toString(),
      });

      if (options?.order_by) {
        params.append('order_by', options.order_by);
      }
      if (options?.order) {
        params.append('order', options.order);
      }
      if (options?.quality_grade) {
        params.append('quality_grade', options.quality_grade);
      }

      return request<{
        total_results: number;
        page: number;
        per_page: number;
        results: any[]; // TODO: Type properly with INatObservation
      }>(`/observations?${params.toString()}`);
    },
    [request]
  );

  /**
   * Search for taxa (species, genera, families, etc.)
   *
   * Searches iNaturalist's taxonomy database. Returns matches ranked by relevance.
   * This call uses the USER's IP quota, not the server's quota.
   *
   * @param query - Search term (common name, scientific name, or partial match)
   * @param options - Search options
   * @param options.per_page - Number of results to return (default: 20, max: 200)
   * @returns Promise with search results
   *
   * @example
   * // Search by common name
   * const data = await searchTaxa('sparrow');
   *
   * @example
   * // Search by scientific name
   * const data = await searchTaxa('Passer domesticus');
   *
   * @example
   * // Get more results
   * const data = await searchTaxa('oak', { per_page: 50 });
   */
  const searchTaxa = useCallback(
    async (query: string, options?: { per_page?: number }) => {
      const params = new URLSearchParams({
        q: query,
        per_page: (options?.per_page || 20).toString(),
      });

      return request<{
        total_results: number;
        results: any[]; // TODO: Type properly with INatTaxon
      }>(`/taxa?${params.toString()}`);
    },
    [request]
  );

  /**
   * Search for places (countries, states, parks, etc.)
   *
   * Searches iNaturalist's places database using autocomplete.
   * This call uses the USER's IP quota, not the server's quota.
   *
   * @param query - Place name or partial match
   * @param options - Search options
   * @param options.per_page - Number of results to return (default: 20, max: 200)
   * @returns Promise with place search results
   *
   * @example
   * // Search for a state
   * const data = await searchPlaces('california');
   *
   * @example
   * // Search for a park
   * const data = await searchPlaces('yosemite');
   */
  const searchPlaces = useCallback(
    async (query: string, options?: { per_page?: number }) => {
      const params = new URLSearchParams({
        q: query,
        per_page: (options?.per_page || 20).toString(),
      });

      return request<{
        total_results: number;
        results: Array<{
          id: number;
          name: string;
          display_name: string;
          place_type: number;
        }>;
      }>(`/places/autocomplete?${params.toString()}`);
    },
    [request]
  );

  /**
   * Get user info (profile data, stats)
   *
   * Fetches public profile information for an iNaturalist user.
   * This call uses the USER's IP quota, not the server's quota.
   *
   * @param username - iNaturalist username
   * @returns Promise with user profile data
   *
   * @example
   * const data = await getUserInfo('dgilperez');
   * console.log(`User has ${data.results[0].observations_count} observations`);
   */
  const getUserInfo = useCallback(
    async (username: string) => {
      return request<{
        results: Array<{
          id: number;
          login: string;
          name: string;
          icon: string | null;
          observations_count: number;
          species_count: number;
        }>;
      }>(`/users/${username}`);
    },
    [request]
  );

  /**
   * Get species counts for a user (life list)
   *
   * Fetches aggregated counts of how many times a user has observed each species.
   * Useful for building life lists, species rankings, etc.
   * This call uses the USER's IP quota, not the server's quota.
   *
   * @param username - iNaturalist username
   * @param options - Filter options
   * @param options.taxon_id - Filter to descendants of this taxon (e.g., 3 for birds)
   * @param options.place_id - Filter to observations in this place
   * @returns Promise with species counts and taxon details
   *
   * @example
   * // Get all species observed by user
   * const data = await getUserSpeciesCounts('dgilperez');
   *
   * @example
   * // Get only bird species (taxon_id 3 = Aves)
   * const data = await getUserSpeciesCounts('dgilperez', { taxon_id: 3 });
   *
   * @example
   * // Get species observed in California (place_id 14)
   * const data = await getUserSpeciesCounts('dgilperez', { place_id: 14 });
   */
  const getUserSpeciesCounts = useCallback(
    async (username: string, options?: { taxon_id?: number; place_id?: number }) => {
      const params = new URLSearchParams({
        user_login: username,
        per_page: '200',
      });

      if (options?.taxon_id) {
        params.append('taxon_id', options.taxon_id.toString());
      }
      if (options?.place_id) {
        params.append('place_id', options.place_id.toString());
      }

      return request<{
        total_results: number;
        results: Array<{
          count: number;
          taxon: any; // TODO: Type properly with INatTaxon
        }>;
      }>(`/observations/species_counts?${params.toString()}`);
    },
    [request]
  );

  return {
    // Core request method
    request,

    // Convenience methods
    getUserObservations,
    searchTaxa,
    searchPlaces,
    getUserInfo,
    getUserSpeciesCounts,

    // State
    loading,
    error,

    // Utility
    isAuthenticated: !!(session as any)?.accessToken,
  };
}

/**
 * Example usage in a component:
 *
 * ```tsx
 * 'use client';
 *
 * import { useINatAPI } from '@/hooks/useINatAPI';
 * import { useEffect, useState } from 'react';
 *
 * export function ObservationList({ username }: { username: string }) {
 *   const { getUserObservations, loading, error } = useINatAPI();
 *   const [observations, setObservations] = useState([]);
 *
 *   useEffect(() => {
 *     async function loadObservations() {
 *       try {
 *         // Direct browser call to iNat API - uses user's IP quota!
 *         const data = await getUserObservations(username);
 *         setObservations(data.results);
 *       } catch (err) {
 *         console.error('Failed to load observations:', err);
 *       }
 *     }
 *
 *     loadObservations();
 *   }, [username, getUserObservations]);
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {observations.map(obs => (
 *         <ObservationCard key={obs.id} observation={obs} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
