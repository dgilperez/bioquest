import { Rarity, INatObservation } from '@/types';
import { getINatClient } from '@/lib/inat/client';
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

  const client = getINatClient(accessToken);
  const taxonId = observation.taxon.id;

  try {
    // Get global observation count
    const globalCount = await client.getTaxonObservationCount(taxonId);

    // Get regional count if place specified
    let regionalCount: number | undefined;
    let regionalRarity: Rarity | undefined;
    let isFirstRegional = false;

    if (placeId) {
      regionalCount = await client.getTaxonObservationCount(taxonId, placeId);
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
  placeId?: number
): Promise<Map<number, RarityResult>> {
  const results = new Map<number, RarityResult>();
  const { SYNC_CONFIG } = await import('./constants');
  const client = getINatClient(accessToken);

  // OPTIMIZATION 1: Extract unique taxonIds to avoid duplicate API calls
  // Before: 1000 observations with 50 unique species = 2000 API calls
  // After: 1000 observations with 50 unique species = 100 API calls (20x reduction!)
  const uniqueTaxonIds = new Set<number>();
  const taxonCountCache = new Map<number, { global: number; regional?: number }>();

  for (const obs of observations) {
    if (obs.taxon?.id) {
      uniqueTaxonIds.add(obs.taxon.id);
    }
  }

  console.log(`Fetching rarity for ${uniqueTaxonIds.size} unique taxa (from ${observations.length} observations)`);

  // OPTIMIZATION 2: Batch fetch counts for unique taxa only
  const BATCH_SIZE = SYNC_CONFIG.RARITY_BATCH_SIZE;
  const taxonIdArray = Array.from(uniqueTaxonIds);

  for (let i = 0; i < taxonIdArray.length; i += BATCH_SIZE) {
    const batch = taxonIdArray.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async taxonId => {
        try {
          // Fetch global count
          const globalCount = await client.getTaxonObservationCount(taxonId);

          // Fetch regional count if place specified
          let regionalCount: number | undefined;
          if (placeId) {
            regionalCount = await client.getTaxonObservationCount(taxonId, placeId);
          }

          // Cache the counts
          taxonCountCache.set(taxonId, { global: globalCount, regional: regionalCount });
        } catch (error) {
          console.error(`Error fetching counts for taxon ${taxonId}:`, error);
          // Cache error state to avoid retries
          taxonCountCache.set(taxonId, { global: 0 });
        }
      })
    );

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < taxonIdArray.length) {
      await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.RARITY_BATCH_DELAY_MS));
    }
  }

  // OPTIMIZATION 3: Map cached results to observations (no API calls!)
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
