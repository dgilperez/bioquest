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
}

export interface FetchResult {
  observations: INatObservation[];
  isIncrementalSync: boolean;
}

/**
 * Fetch all observations for a user from iNaturalist
 * Handles pagination automatically
 */
export async function fetchUserObservations({
  accessToken,
  inatUsername,
  lastSyncedAt,
}: FetchOptions): Promise<FetchResult> {
  const client = getINatClient(accessToken);
  const isIncrementalSync = !!lastSyncedAt;

  let allObservations: any[] = [];
  let currentPage = 1;
  let totalResults = 0;
  const perPage = SYNC_CONFIG.OBSERVATIONS_PER_PAGE;

  console.log(`Starting ${isIncrementalSync ? 'incremental' : 'full'} sync for ${inatUsername}...`);

  do {
    const response = await client.getUserObservations(inatUsername, {
      per_page: perPage,
      page: currentPage,
      updated_since: isIncrementalSync ? lastSyncedAt.toISOString() : undefined,
    });

    allObservations = allObservations.concat(response.results);
    totalResults = response.total_results;

    console.log(`Fetched page ${currentPage}: ${response.results.length} observations (${allObservations.length}/${totalResults} total)`);

    currentPage++;

    // Continue if there are more pages
    if (allObservations.length >= totalResults) {
      break;
    }

    // Small delay between pages to be nice to the API
    if (allObservations.length < totalResults) {
      await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.PAGE_DELAY_MS));
    }
  } while (allObservations.length < totalResults);

  console.log(`Fetched ${allObservations.length} observations`);

  return {
    observations: allObservations,
    isIncrementalSync,
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
