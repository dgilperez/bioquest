/**
 * Observation Fetching Service
 *
 * Handles fetching observations from iNaturalist API with pagination
 */

import { getINatClient } from '@/lib/inat/client';
import { SYNC_CONFIG } from '@/lib/gamification/constants';
import { INatObservation } from '@/types';

export interface FetchOptions {
  accessToken: string;
  inatUsername: string;
  lastSyncedAt?: Date;
  syncCursor?: Date; // Cursor for incremental batched syncs (prefer over lastSyncedAt)
  maxObservations?: number; // Optional limit override (e.g., for first sync in dev mode)
}

export interface FetchResult {
  observations: INatObservation[];
  isIncrementalSync: boolean;
  totalAvailable: number;
  fetchedAll: boolean; // true if we fetched all available observations
  newestObservationDate?: Date; // newest updated_at from this batch (for cursor)
}

/**
 * Fetch observations for a user from iNaturalist
 * OPTIMIZED for large accounts (10k+ observations):
 * - First sync: Only fetch last 6 months (configurable)
 * - Respects MAX_OBSERVATIONS_PER_SYNC limit
 * - Enforces rate limiting
 */
export async function fetchUserObservations({
  accessToken,
  inatUsername,
  lastSyncedAt,
  syncCursor,
  maxObservations,
}: FetchOptions): Promise<FetchResult> {
  const client = getINatClient(accessToken);
  // Use syncCursor for partial syncs (pagination continuation), lastSyncedAt for incremental syncs
  // syncCursor: Pagination continuation (incomplete sync hitting limit)
  // lastSyncedAt: True incremental sync (completed full sync, fetching new observations)
  const filterDate = syncCursor || lastSyncedAt;
  const isIncrementalSync = !!filterDate;

  // Use provided max or default to MAX_OBSERVATIONS_PER_SYNC
  const observationLimit = maxObservations || SYNC_CONFIG.MAX_OBSERVATIONS_PER_SYNC;

  let allObservations: any[] = [];
  let currentPage = 1;
  let totalResults = 0;
  const perPage = SYNC_CONFIG.OBSERVATIONS_PER_PAGE;

  console.log(`Starting ${isIncrementalSync ? 'incremental' : 'full'} sync for ${inatUsername}${filterDate ? ` from ${filterDate.toISOString()}` : ''} (limit: ${observationLimit})...`);

  do {
    const response = await client.getUserObservations(inatUsername, {
      per_page: perPage,
      page: currentPage,
      updated_since: isIncrementalSync ? filterDate.toISOString() : undefined,
    });

    allObservations = allObservations.concat(response.results);
    totalResults = response.total_results;

    console.log(`Fetched page ${currentPage}: ${response.results.length} observations (${allObservations.length}/${totalResults} total)`);

    // DEBUG: Log first observation to see location fields
    if (currentPage === 1 && response.results.length > 0) {
      const firstObs = response.results[0];
      console.log('🔍 DEBUG - First observation structure:');
      console.log('  - id:', firstObs.id);
      console.log('  - location field:', firstObs.location);
      console.log('  - geojson:', JSON.stringify(firstObs.geojson));
      console.log('  - latitude:', firstObs.latitude);
      console.log('  - longitude:', firstObs.longitude);
      console.log('  - obscured:', firstObs.obscured);
      console.log('  - geoprivacy:', firstObs.geoprivacy);
    }

    currentPage++;

    // SAFETY: Respect observation limit
    if (allObservations.length >= observationLimit) {
      console.log(`Reached observation limit (${observationLimit}), stopping fetch`);
      break;
    }

    // Continue if there are more pages
    if (allObservations.length >= totalResults) {
      break;
    }

    // Rate limiting: respect iNaturalist's 60 req/min limit
    // With 500ms delay, we can make ~120 requests/min, so we're well under
    if (allObservations.length < totalResults) {
      await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.PAGE_DELAY_MS));
    }
  } while (allObservations.length < totalResults);

  console.log(`Fetched ${allObservations.length} observations (total available: ${totalResults})`);

  const fetchedAll = allObservations.length >= totalResults;

  if (!fetchedAll) {
    console.log(`⚠️  Partial sync: ${totalResults - allObservations.length} observations remaining. Trigger another sync to continue.`);
  } else {
    console.log(`✅ Complete sync: All available observations fetched.`);
  }

  // Find the newest observation's updated_at for cursor-based pagination
  const newestObservationDate = allObservations.length > 0
    ? allObservations.reduce((newest, obs) => {
        const obsDate = new Date(obs.updated_at);
        return obsDate > newest ? obsDate : newest;
      }, new Date(allObservations[0].updated_at))
    : undefined;

  if (newestObservationDate) {
    console.log(`📍 Sync cursor: ${newestObservationDate.toISOString()}`);
  }

  return {
    observations: allObservations,
    isIncrementalSync,
    totalAvailable: totalResults,
    fetchedAll,
    newestObservationDate,
  };
}

/**
 * Fetch and update user location based on most common observation location
 */
export async function updateUserLocation(
  userId: string,
  inatId: number,
  observations: INatObservation[],
  accessToken: string
): Promise<string | null> {
  const { getINatClient } = await import('@/lib/inat/client');
  const { prisma } = await import('@/lib/db/prisma');

  const client = getINatClient(accessToken);

  try {
    await client.getUserInfo(inatId);

    // Extract most common location from observations
    const mostCommonLocation = observations
      .map(obs => obs.place_guess)
      .filter(Boolean)
      .reduce((acc: Record<string, number>, place) => {
        if (place) acc[place] = (acc[place] || 0) + 1;
        return acc;
      }, {});

    const topLocation = Object.entries(mostCommonLocation)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    if (topLocation) {
      await prisma.user.update({
        where: { id: userId },
        data: { region: topLocation }
      });
      return topLocation;
    }
  } catch (error) {
    console.warn('Could not fetch user info:', error);
  }

  return null;
}
