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
 *
 * Options:
 * - fastSync: Only classify first N unique taxa (for quick onboarding)
 * - fastSyncLimit: Number of taxa to classify immediately (default: 200)
 */
export async function enrichObservations(
  observations: INatObservation[],
  accessToken: string,
  onProgress?: (processed: number, total: number, message: string) => void,
  options?: {
    fastSync?: boolean;
    fastSyncLimit?: number;
  }
): Promise<EnrichmentResult & { unclassifiedTaxa?: number[] }> {
  console.log(`Enriching ${observations.length} observations...`);

  const { classifyObservationsRarity } = await import('@/lib/gamification/rarity');

  let rarityMap: Map<number, any>;
  let unclassifiedTaxa: number[] | undefined;

  if (options?.fastSync) {
    // TWO-PHASE APPROACH: Classify only top N taxa immediately
    const limit = options.fastSyncLimit || 200;

    // Count observations per taxon to prioritize common species
    const taxonCounts = new Map<number, number>();
    observations.forEach(obs => {
      if (obs.taxon?.id) {
        taxonCounts.set(obs.taxon.id, (taxonCounts.get(obs.taxon.id) || 0) + 1);
      }
    });

    // Sort by count (descending) - classify most common first
    const sortedTaxa = Array.from(taxonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([taxonId]) => taxonId);

    const fastTaxa = sortedTaxa.slice(0, limit);
    const backgroundTaxa = sortedTaxa.slice(limit);

    console.log(`⚡ Fast sync: Classifying ${fastTaxa.length} most common taxa immediately`);
    console.log(`📥 Queueing ${backgroundTaxa.length} taxa for background processing`);

    // Filter observations to only classify fast taxa
    const fastObservations = observations.filter(obs =>
      obs.taxon?.id && fastTaxa.includes(obs.taxon.id)
    );

    // Classify only fast taxa
    rarityMap = await classifyObservationsRarity(fastObservations, accessToken, undefined, onProgress);

    // Return unclassified taxa for queueing
    unclassifiedTaxa = backgroundTaxa;

  } else {
    // FULL SYNC: Classify ALL taxa (legacy behavior)
    console.log(`🔍 Full sync: Classifying all ${observations.length} observations`);
    rarityMap = await classifyObservationsRarity(observations, accessToken, undefined, onProgress);
  }

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

  if (unclassifiedTaxa) {
    console.log(`📝 ${unclassifiedTaxa.length} taxa will be classified in background`);
  }

  return {
    enrichedObservations,
    totalPoints,
    rareFinds,
    unclassifiedTaxa,
  };
}
