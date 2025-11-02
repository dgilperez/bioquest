/**
 * Observation Storage Service
 *
 * Handles persisting observations to the database with batch operations
 */

import { prisma } from '@/lib/db/prisma';
import { EnrichedObservation } from './enrich-observations';
import { INatObservation } from '@/types';

/**
 * Extract coordinates from iNaturalist observation
 * Tries multiple sources in order of preference:
 * 1. geojson.coordinates (most reliable)
 * 2. latitude/longitude fields
 * 3. location string
 */
function extractCoordinates(inatObs: INatObservation): {
  latitude: number | null;
  longitude: number | null;
  locationString: string | null;
} {
  // 1. Try geojson.coordinates (most reliable)
  if (inatObs.geojson?.coordinates) {
    // GeoJSON format is [lng, lat]
    const longitude = inatObs.geojson.coordinates[0];
    const latitude = inatObs.geojson.coordinates[1];
    return {
      latitude,
      longitude,
      locationString: `${latitude},${longitude}`,
    };
  }

  // 2. Try separate latitude/longitude fields
  if (inatObs.latitude !== undefined && inatObs.longitude !== undefined) {
    return {
      latitude: inatObs.latitude,
      longitude: inatObs.longitude,
      locationString: `${inatObs.latitude},${inatObs.longitude}`,
    };
  }

  // 3. Fall back to location string (format: "lat,lon")
  if (inatObs.location) {
    const [lat, lon] = inatObs.location.split(',').map(s => parseFloat(s.trim()));
    if (!isNaN(lat) && !isNaN(lon)) {
      return {
        latitude: lat,
        longitude: lon,
        locationString: inatObs.location,
      };
    }
  }

  return {
    latitude: null,
    longitude: null,
    locationString: null,
  };
}

export interface StoreResult {
  newCount: number;
  updatedCount: number;
  newObservationIds: Set<number>;
}

/**
 * Store enriched observations in the database using batch operations
 * Much more efficient than individual upserts (5-10x faster)
 * Returns counts of new vs updated observations
 *
 * @param userId - User ID
 * @param enrichedObservations - Observations to store
 * @param tx - Optional Prisma transaction context (for atomicity with other operations)
 */
export async function storeObservations(
  userId: string,
  enrichedObservations: EnrichedObservation[],
  tx?: any // Prisma transaction context
): Promise<StoreResult> {
  if (enrichedObservations.length === 0) return { newCount: 0, updatedCount: 0, newObservationIds: new Set() };

  // Use transaction context if provided, otherwise use global prisma
  const db = tx || prisma;

  // Check which observations already exist
  const existingIds = await db.observation.findMany({
    where: {
      id: {
        in: enrichedObservations.map(e => e.observation.id)
      }
    },
    select: { id: true }
  });
  const existingIdSet = new Set(existingIds.map(o => o.id));

  // Separate new vs existing observations
  const toCreate = enrichedObservations.filter(e => !existingIdSet.has(e.observation.id));
  const toUpdate = enrichedObservations.filter(e => existingIdSet.has(e.observation.id));

  // BATCH CREATE new observations
  if (toCreate.length > 0) {
    await db.observation.createMany({
      data: toCreate.map(enriched => {
        const { observation: inatObs, rarity, points, isFirstGlobal, isFirstRegional } = enriched;
        const photoCount = inatObs.photos?.length || 0;

        // Extract coordinates from multiple sources
        const { latitude, longitude, locationString } = extractCoordinates(inatObs);

        return {
          id: inatObs.id,
          userId,
          speciesGuess: inatObs.species_guess || null,
          taxonId: inatObs.taxon?.id || null,
          taxonName: inatObs.taxon?.name || null,
          taxonRank: inatObs.taxon?.rank || null,
          commonName: inatObs.taxon?.preferred_common_name || null,
          iconicTaxon: inatObs.taxon?.iconic_taxon_name || null,
          observedOn: new Date(inatObs.observed_on),
          qualityGrade: inatObs.quality_grade,
          photosCount: photoCount,
          location: locationString,
          latitude,
          longitude,
          placeGuess: inatObs.place_guess || null,
          rarity,
          isFirstGlobal,
          isFirstRegional,
          pointsAwarded: points,
        };
      }),
    });
  }

  // BATCH UPDATE existing observations (using Promise.all for parallel execution)
  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map(enriched => {
        const { observation: inatObs, rarity, points, isFirstGlobal, isFirstRegional } = enriched;
        const photoCount = inatObs.photos?.length || 0;

        // Extract coordinates from multiple sources
        const { latitude, longitude, locationString } = extractCoordinates(inatObs);

        return db.observation.update({
          where: { id: inatObs.id },
          data: {
            speciesGuess: inatObs.species_guess || null,
            taxonId: inatObs.taxon?.id || null,
            taxonName: inatObs.taxon?.name || null,
            taxonRank: inatObs.taxon?.rank || null,
            commonName: inatObs.taxon?.preferred_common_name || null,
            iconicTaxon: inatObs.taxon?.iconic_taxon_name || null,
            observedOn: new Date(inatObs.observed_on),
            qualityGrade: inatObs.quality_grade,
            photosCount: photoCount,
            location: locationString,
            latitude,
            longitude,
            placeGuess: inatObs.place_guess || null,
            rarity,
            isFirstGlobal,
            isFirstRegional,
            pointsAwarded: points,
            updatedAt: new Date(),
          },
        });
      })
    );
  }

  // Count observations with location data
  const withLocation = enrichedObservations.filter(e => {
    const { latitude } = extractCoordinates(e.observation);
    return latitude !== null;
  }).length;

  console.log(`Stored ${enrichedObservations.length} observations (${toCreate.length} new, ${toUpdate.length} updated, ${withLocation} with location)`);

  // Create set of new observation IDs for filtering
  const newObservationIds = new Set(toCreate.map(e => e.observation.id));

  return {
    newCount: toCreate.length,
    updatedCount: toUpdate.length,
    newObservationIds,
  };
}
