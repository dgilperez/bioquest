import { Rarity, INatObservation } from '@/types';
import { getTaxonCounts, batchGetTaxonCounts } from './taxon-cache';
import {
  RARITY_THRESHOLDS,
  RARITY_BONUS_POINTS,
  FIRST_OBSERVATION_BONUSES
} from './constants';

export interface RarityResult {
  rarity: Rarity;
  globalCount: number;
  regionalCount?: number;
  regionalRarity?: Rarity; // Rarity when considering regional scope
  isFirstGlobal: boolean;
  isFirstRegional: boolean;
  bonusPoints: number;
}

/**
 * Determine rarity tier based on observation count
 */
function determineRarityTier(count: number): Rarity {
  if (count < RARITY_THRESHOLDS.MYTHIC) return 'mythic';
  if (count < RARITY_THRESHOLDS.LEGENDARY) return 'legendary';
  if (count < RARITY_THRESHOLDS.EPIC) return 'epic';
  if (count < RARITY_THRESHOLDS.RARE) return 'rare';
  if (count < RARITY_THRESHOLDS.UNCOMMON) return 'uncommon';
  return 'common';
}

/**
 * Calculate bonus points for rarity
 */
function calculateBonusPoints(
  rarity: Rarity,
  isFirstGlobal: boolean,
  isFirstRegional: boolean
): number {
  let bonus = RARITY_BONUS_POINTS[rarity] || 0;

  // Massive bonus for first global observation ever!
  if (isFirstGlobal) {
    bonus = Math.max(bonus, FIRST_OBSERVATION_BONUSES.FIRST_GLOBAL);
  }

  // Significant bonus for first regional (but not as much as global)
  if (isFirstRegional && !isFirstGlobal) {
    bonus = Math.max(bonus, FIRST_OBSERVATION_BONUSES.FIRST_REGIONAL);
  }

  return bonus;
}

/**
 * Determine the rarity of an observation based on its taxon
 */
export async function classifyObservationRarity(
  observation: INatObservation,
  accessToken: string,
  placeId?: number
): Promise<RarityResult> {
  if (!observation.taxon?.id) {
    // Unknown species, can't determine rarity
    return {
      rarity: 'common',
      globalCount: 0,
      isFirstGlobal: false,
      isFirstRegional: false,
      bonusPoints: 0,
    };
  }

  const taxonId = observation.taxon.id;

  try {
    // Get taxon counts from cache (reduces API calls by 90-95%)
    const counts = await getTaxonCounts(taxonId, accessToken, placeId);
    const globalCount = counts.global;
    const regionalCount = counts.regional;

    // Determine regional rarity if available
    let regionalRarity: Rarity | undefined;
    let isFirstRegional = false;

    if (regionalCount !== undefined) {
      regionalRarity = determineRarityTier(regionalCount);
      isFirstRegional = regionalCount === 1; // This observation is the first in region
    }

    // Determine global rarity
    const globalRarity = determineRarityTier(globalCount);
    const isFirstGlobal = globalCount === 1;

    // Use the higher rarity (more impressive) of global vs regional
    let finalRarity = globalRarity;
    if (regionalRarity) {
      // If regional is rarer, use that (but cap at legendary unless also globally rare)
      const regionalIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].indexOf(regionalRarity);
      const globalIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].indexOf(globalRarity);

      if (regionalIndex > globalIndex) {
        // Regional is rarer - use regional rarity
        finalRarity = regionalRarity;
      }
    }

    // Calculate bonus points
    const bonusPoints = calculateBonusPoints(finalRarity, isFirstGlobal, isFirstRegional);

    return {
      rarity: finalRarity,
      globalCount,
      regionalCount,
      regionalRarity,
      isFirstGlobal,
      isFirstRegional,
      bonusPoints,
    };
  } catch (error) {
    console.error('Error classifying rarity:', error);
    // On error, default to common
    return {
      rarity: 'common',
      globalCount: 0,
      isFirstGlobal: false,
      isFirstRegional: false,
      bonusPoints: 0,
    };
  }
}

/**
 * Batch classify multiple observations (more efficient)
 * OPTIMIZATION: Deduplicates taxa before making API calls
 * Reduces 2000 API calls to ~100 for 1000 observations
 */
export async function classifyObservationsRarity(
  observations: INatObservation[],
  accessToken: string,
  placeId?: number,
  onProgress?: (processed: number, total: number, message: string) => void
): Promise<Map<number, RarityResult>> {
  const results = new Map<number, RarityResult>();

  // OPTIMIZATION: Extract unique taxonIds to avoid duplicate API calls
  // With cache: 1000 observations with 50 unique species = ~5-10 API calls (90-95% cache hit!)
  const uniqueTaxonIds = new Set<number>();

  for (const obs of observations) {
    if (obs.taxon?.id) {
      uniqueTaxonIds.add(obs.taxon.id);
    }
  }

  const totalTaxa = uniqueTaxonIds.size;
  console.log(`🔍 Starting rarity classification for ${totalTaxa} unique taxa (from ${observations.length} observations)`);

  // OPTIMIZATION: Use batch cache function to fetch all counts at once
  // This leverages database caching + request deduplication
  const taxonCountCache = await batchGetTaxonCounts(
    Array.from(uniqueTaxonIds),
    accessToken,
    placeId,
    onProgress
      ? (processed: number, total: number) => {
          onProgress(processed, total, `Classifying rarity (${processed}/${total} taxa)`);
        }
      : undefined
  );

  console.log(`🎉 All ${totalTaxa} taxa fetched (${taxonCountCache.size} successful)!`);

  // OPTIMIZATION 2: Map cached results to observations (no API calls!)
  for (const obs of observations) {
    if (!obs.taxon?.id) {
      results.set(obs.id, {
        rarity: 'common',
        globalCount: 0,
        isFirstGlobal: false,
        isFirstRegional: false,
        bonusPoints: 0,
      });
      continue;
    }

    const counts = taxonCountCache.get(obs.taxon.id);
    if (!counts) {
      // Shouldn't happen, but handle gracefully
      results.set(obs.id, {
        rarity: 'common',
        globalCount: 0,
        isFirstGlobal: false,
        isFirstRegional: false,
        bonusPoints: 0,
      });
      continue;
    }

    // Determine global rarity
    const globalRarity = determineRarityTier(counts.global);
    const isFirstGlobal = counts.global === 1;

    // Determine regional rarity if available
    let regionalRarity: Rarity | undefined;
    let isFirstRegional = false;
    if (counts.regional !== undefined) {
      regionalRarity = determineRarityTier(counts.regional);
      isFirstRegional = counts.regional === 1;
    }

    // Use the higher rarity (more impressive) of global vs regional
    let finalRarity = globalRarity;
    if (regionalRarity) {
      const regionalIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].indexOf(regionalRarity);
      const globalIndex = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].indexOf(globalRarity);

      if (regionalIndex > globalIndex) {
        finalRarity = regionalRarity;
      }
    }

    // Calculate bonus points
    const bonusPoints = calculateBonusPoints(finalRarity, isFirstGlobal, isFirstRegional);

    results.set(obs.id, {
      rarity: finalRarity,
      globalCount: counts.global,
      regionalCount: counts.regional,
      regionalRarity,
      isFirstGlobal,
      isFirstRegional,
      bonusPoints,
    });
  }

  return results;
}

/**
 * Get rarity display labels and emojis
 * Note: For colors and styling, use getRarityConfig from @/styles/design-tokens
 */
export function getRarityLabel(rarity: Rarity): string {
  switch (rarity) {
    case 'mythic': return 'Mythic';
    case 'legendary': return 'Legendary';
    case 'epic': return 'Epic';
    case 'rare': return 'Rare';
    case 'uncommon': return 'Uncommon';
    case 'common':
    default: return 'Common';
  }
}

export function getRarityEmoji(rarity: Rarity): string {
  switch (rarity) {
    case 'mythic': return '💎';
    case 'legendary': return '✨';
    case 'epic': return '🌟';
    case 'rare': return '💠';
    case 'uncommon': return '🔷';
    case 'common':
    default: return '⚪';
  }
}

/**
 * Get rarity index for comparisons (higher = rarer)
 */
export function getRarityIndex(rarity: Rarity): number {
  const order: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  return order.indexOf(rarity);
}

/**
 * Compare two rarities (returns true if a is rarer than b)
 */
export function isRarerThan(a: Rarity, b: Rarity): boolean {
  return getRarityIndex(a) > getRarityIndex(b);
}
