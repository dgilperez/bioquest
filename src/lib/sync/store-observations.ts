/**
 * Observation Storage Service
 *
 * Handles persisting observations to the database with batch operations
 */

import { prisma } from '@/lib/db/prisma';
import { EnrichedObservation } from './enrich-observations';

/**
 * Store enriched observations in the database using batch operations
 * Much more efficient than individual upserts (5-10x faster)
 */
export async function storeObservations(
  userId: string,
  enrichedObservations: EnrichedObservation[]
): Promise<void> {
  if (enrichedObservations.length === 0) return;

  // Check which observations already exist
  const existingIds = await prisma.observation.findMany({
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
    await prisma.observation.createMany({
      data: toCreate.map(enriched => {
        const { observation: inatObs, rarity, points, isFirstGlobal, isFirstRegional } = enriched;
        const photoCount = inatObs.photos?.length || 0;

        // Parse coordinates from location string (format: "lat,lon")
        let latitude: number | null = null;
        let longitude: number | null = null;
        if (inatObs.location) {
          const [lat, lon] = inatObs.location.split(',').map(s => parseFloat(s.trim()));
          if (!isNaN(lat) && !isNaN(lon)) {
            latitude = lat;
            longitude = lon;
          }
        }

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
          location: inatObs.location || null,
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

        // Parse coordinates from location string (format: "lat,lon")
        let latitude: number | null = null;
        let longitude: number | null = null;
        if (inatObs.location) {
          const [lat, lon] = inatObs.location.split(',').map(s => parseFloat(s.trim()));
          if (!isNaN(lat) && !isNaN(lon)) {
            latitude = lat;
            longitude = lon;
          }
        }

        return prisma.observation.update({
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
            location: inatObs.location || null,
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

  console.log(`Stored ${enrichedObservations.length} observations (${toCreate.length} new, ${toUpdate.length} updated)`);
}
