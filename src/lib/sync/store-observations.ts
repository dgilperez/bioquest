/**
 * Observation Storage Service
 *
 * Handles persisting observations to the database
 */

import { prisma } from '@/lib/db/prisma';
import { EnrichedObservation } from './enrich-observations';

/**
 * Store enriched observations in the database
 */
export async function storeObservations(
  userId: string,
  enrichedObservations: EnrichedObservation[]
): Promise<void> {
  for (const enriched of enrichedObservations) {
    const { observation: inatObs, rarity, points, isFirstGlobal, isFirstRegional } = enriched;
    const photoCount = inatObs.photos?.length || 0;

    await prisma.observation.upsert({
      where: { id: inatObs.id },
      update: {
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
        placeGuess: inatObs.place_guess || null,
        rarity,
        isFirstGlobal,
        isFirstRegional,
        pointsAwarded: points,
        updatedAt: new Date(),
      },
      create: {
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
        placeGuess: inatObs.place_guess || null,
        rarity,
        isFirstGlobal,
        isFirstRegional,
        pointsAwarded: points,
      },
    });
  }

  console.log(`Stored ${enrichedObservations.length} observations`);
}
