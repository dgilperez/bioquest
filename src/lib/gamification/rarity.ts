import { Rarity, INatObservation } from '@/types';
import { getINatClient } from '@/lib/inat/client';

/**
 * Rarity thresholds based on global observation counts
 */
const RARITY_THRESHOLDS = {
  LEGENDARY: 100, // Less than 100 observations globally
  RARE: 1000, // Less than 1000 observations globally
  // Everything else is NORMAL
};

export interface RarityResult {
  rarity: Rarity;
  globalCount: number;
  regionalCount?: number;
  isFirstGlobal: boolean;
  isFirstRegional: boolean;
  bonusPoints: number;
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
      rarity: 'normal',
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
    let isFirstRegional = false;

    if (placeId) {
      regionalCount = await client.getTaxonObservationCount(taxonId, placeId);
      isFirstRegional = regionalCount === 1; // This observation is the first in region
    }

    // Determine rarity
    let rarity: Rarity = 'normal';
    let bonusPoints = 0;
    const isFirstGlobal = globalCount === 1;

    if (isFirstGlobal) {
      rarity = 'legendary';
      bonusPoints = 1000; // Huge bonus for first ever!
    } else if (globalCount < RARITY_THRESHOLDS.LEGENDARY) {
      rarity = 'legendary';
      bonusPoints = 500;
    } else if (globalCount < RARITY_THRESHOLDS.RARE) {
      rarity = 'rare';
      bonusPoints = 100;
    }

    // Additional bonus for first regional
    if (isFirstRegional && !isFirstGlobal) {
      rarity = 'legendary';
      bonusPoints = Math.max(bonusPoints, 250);
    }

    return {
      rarity,
      globalCount,
      regionalCount,
      isFirstGlobal,
      isFirstRegional,
      bonusPoints,
    };
  } catch (error) {
    console.error('Error classifying rarity:', error);
    // On error, default to normal
    return {
      rarity: 'normal',
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
 * Get rarity badge color
 */
export function getRarityColor(rarity: Rarity): string {
  switch (rarity) {
    case 'legendary':
      return 'text-legendary dark:text-legendary-light';
    case 'rare':
      return 'text-rare dark:text-rare-light';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
}

/**
 * Get rarity badge label
 */
export function getRarityLabel(rarity: Rarity): string {
  switch (rarity) {
    case 'legendary':
      return 'Legendary';
    case 'rare':
      return 'Rare';
    default:
      return 'Normal';
  }
}

/**
 * Get rarity emoji
 */
export function getRarityEmoji(rarity: Rarity): string {
  switch (rarity) {
    case 'legendary':
      return '✨';
    case 'rare':
      return '💎';
    default:
      return '🌿';
  }
}
