/**
 * Observation Enrichment Service
 *
 * Classifies rarity and calculates points for observations
 */

import { INatObservation, Rarity } from '@/types';
import { classifyObservationRarity } from '@/lib/gamification/rarity';
import { POINTS_CONFIG, isRarityTracked } from '@/lib/gamification/constants';

export interface EnrichedObservation {
  observation: INatObservation;
  rarity: Rarity;
  points: number;
  bonusPoints: number;
  isFirstGlobal: boolean;
  isFirstRegional: boolean;
}

export interface EnrichmentResult {
  enrichedObservations: EnrichedObservation[];
  totalPoints: number;
  rareFinds: RareFind[];
}

export interface RareFind {
  observationId: number;
  taxonName: string;
  commonName?: string;
  rarity: Rarity;
  bonusPoints: number;
  isFirstGlobal: boolean;
  isFirstRegional: boolean;
}

/**
 * Enrich observations with rarity classification and point calculations
 */
export async function enrichObservations(
  observations: INatObservation[],
  accessToken: string
): Promise<EnrichmentResult> {
  const enrichedObservations: EnrichedObservation[] = [];
  const rareFinds: RareFind[] = [];
  let totalPoints = 0;

  for (let i = 0; i < observations.length; i++) {
    const inatObs = observations[i];

    if (i % 50 === 0) {
      console.log(`Processing observation ${i + 1}/${observations.length}...`);
    }

    // Calculate base points
    let obsPoints = POINTS_CONFIG.BASE_OBSERVATION_POINTS;

    // Classify rarity (only for observations with taxon)
    let rarity: Rarity = 'common';
    let bonusPoints = 0;
    let isFirstGlobal = false;
    let isFirstRegional = false;

    if (inatObs.taxon?.id) {
      try {
        const rarityResult = await classifyObservationRarity(inatObs, accessToken);

        rarity = rarityResult.rarity;
        bonusPoints = rarityResult.bonusPoints;
        isFirstGlobal = rarityResult.isFirstGlobal;
        isFirstRegional = rarityResult.isFirstRegional;

        obsPoints += bonusPoints;

        // Track rare finds for reporting
        if (isRarityTracked(rarity)) {
          rareFinds.push({
            observationId: inatObs.id,
            taxonName: inatObs.taxon.name,
            commonName: inatObs.taxon.preferred_common_name || undefined,
            rarity,
            bonusPoints,
            isFirstGlobal,
            isFirstRegional,
          });
        }
      } catch (error) {
        console.warn(`Could not classify rarity for observation ${inatObs.id}:`, error);
        // Continue with default rarity
      }
    }

    // Research grade bonus
    if (inatObs.quality_grade === 'research') {
      obsPoints += POINTS_CONFIG.RESEARCH_GRADE_BONUS;
    }

    // Photo bonus (max 3 photos)
    const photoCount = inatObs.photos?.length || 0;
    const photoBonus = Math.min(photoCount, POINTS_CONFIG.MAX_PHOTO_BONUS) * POINTS_CONFIG.PHOTO_POINTS;
    obsPoints += photoBonus;

    totalPoints += obsPoints;

    enrichedObservations.push({
      observation: inatObs,
      rarity,
      points: obsPoints,
      bonusPoints,
      isFirstGlobal,
      isFirstRegional,
    });
  }

  console.log(`Enriched ${enrichedObservations.length} observations with ${totalPoints} total points`);

  return {
    enrichedObservations,
    totalPoints,
    rareFinds,
  };
}
