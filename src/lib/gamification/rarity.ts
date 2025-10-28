import { Rarity, INatObservation } from '@/types';
import { getINatClient } from '@/lib/inat/client';

/**
 * Enhanced 6-tier rarity system based on global observation counts
 *
 * Thresholds designed to create meaningful progression and excitement:
 * - Mythic: Ultra-rare, almost never seen (< 10)
 * - Legendary: Extremely rare, special finds (< 100)
 * - Epic: Very rare, notable discoveries (< 500)
 * - Rare: Uncommon species worth celebrating (< 2000)
 * - Uncommon: Less common, still interesting (< 10000)
 * - Common: Regularly observed (>= 10000)
 */
const RARITY_THRESHOLDS = {
  MYTHIC: 10,      // < 10 observations globally - almost extinct or newly discovered!
  LEGENDARY: 100,   // < 100 observations - extremely rare
  EPIC: 500,        // < 500 observations - very rare
  RARE: 2000,       // < 2000 observations - rare
  UNCOMMON: 10000,  // < 10000 observations - uncommon
  // >= 10000 = COMMON
};

/**
 * Bonus points for each rarity tier
 */
const RARITY_BONUS_POINTS = {
  mythic: 2000,
  legendary: 500,
  epic: 250,
  rare: 100,
  uncommon: 25,
  common: 0,
};

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
    bonus = Math.max(bonus, 5000);
  }

  // Significant bonus for first regional (but not as much as global)
  if (isFirstRegional && !isFirstGlobal) {
    bonus = Math.max(bonus, 1000);
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
 */
export async function classifyObservationsRarity(
  observations: INatObservation[],
  accessToken: string,
  placeId?: number
): Promise<Map<number, RarityResult>> {
  const results = new Map<number, RarityResult>();

  // Process in batches to respect rate limits
  const BATCH_SIZE = 10;
  for (let i = 0; i < observations.length; i += BATCH_SIZE) {
    const batch = observations.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async obs => {
        const result = await classifyObservationRarity(obs, accessToken, placeId);
        results.set(obs.id, result);
      })
    );

    // Small delay between batches
    if (i + BATCH_SIZE < observations.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
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
