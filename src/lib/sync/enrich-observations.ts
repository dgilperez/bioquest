/**
 * Observation Enrichment Service
 *
 * Classifies rarity and calculates points for observations
 */

import { INatObservation, Rarity } from '@/types';
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
 * Uses batch processing for rarity classification to avoid N+1 API calls
 */
export async function enrichObservations(
  observations: INatObservation[],
  accessToken: string
): Promise<EnrichmentResult> {
  console.log(`Enriching ${observations.length} observations...`);

  // BATCH CLASSIFY ALL OBSERVATIONS AT ONCE (instead of N+1 loop)
  // This reduces 1000 API calls to ~10-20 batched calls
  const { classifyObservationsRarity } = await import('@/lib/gamification/rarity');
  const rarityMap = await classifyObservationsRarity(observations, accessToken);

  const enrichedObservations: EnrichedObservation[] = [];
  const rareFinds: RareFind[] = [];
  let totalPoints = 0;

  // Now process each observation with pre-calculated rarity
  for (const inatObs of observations) {
    // Calculate base points
    let obsPoints = POINTS_CONFIG.BASE_OBSERVATION_POINTS;

    // Get pre-calculated rarity from batch results
    const rarityResult = rarityMap.get(inatObs.id);
    const rarity = rarityResult?.rarity || 'common';
    const bonusPoints = rarityResult?.bonusPoints || 0;
    const isFirstGlobal = rarityResult?.isFirstGlobal || false;
    const isFirstRegional = rarityResult?.isFirstRegional || false;

    obsPoints += bonusPoints;

    // Track rare finds for reporting
    if (inatObs.taxon?.id && isRarityTracked(rarity)) {
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

  console.log(`Enriched ${enrichedObservations.length} observations with ${totalPoints} total points (${rareFinds.length} rare finds)`);

  return {
    enrichedObservations,
    totalPoints,
    rareFinds,
  };
}
