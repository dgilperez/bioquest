import { prisma } from '@/lib/db/prisma';

/**
 * Update UserTaxonProgress for a specific taxon
 *
 * Recalculates observation and species counts from classified observations
 * and updates the database record.
 *
 * This should be called after background classification completes to ensure
 * Tree of Life stats are up-to-date.
 */
export async function updateUserTaxonProgress(
  userId: string,
  taxonId: number
): Promise<{ observationCount: number; speciesCount: number }> {
  // Query observations with rarityStatus='classified' only
  const stats = await prisma.observation.groupBy({
    by: ['userId'],
    where: {
      userId,
      taxonId,
      rarityStatus: 'classified', // Only count classified observations
    },
    _count: {
      id: true, // Count observations by ID (primary key)
    },
  });

  // Get distinct species count
  const distinctSpecies = await prisma.observation.findMany({
    where: { userId, taxonId, rarityStatus: 'classified' },
    distinct: ['taxonName'],
    select: { taxonName: true },
  });

  const observationCount = stats[0]?._count.id || 0;
  const speciesCount = distinctSpecies.length;

  // Find existing progress record (global, not region-specific)
  const existing = await prisma.userTaxonProgress.findFirst({
    where: { userId, taxonId, regionId: null },
  });

  if (existing) {
    // Update existing record
    await prisma.userTaxonProgress.update({
      where: { id: existing.id },
      data: {
        observationCount,
        speciesCount,
      },
    });
  } else {
    // Create new record
    await prisma.userTaxonProgress.create({
      data: {
        userId,
        taxonId,
        rank: 'kingdom', // Iconic taxa are kingdom-level
        observationCount,
        speciesCount,
        completionPercent: 0,
      },
    });
  }

  return { observationCount, speciesCount };
}

/**
 * Get unobserved child taxa for a given taxon
 *
 * TODO: Implement this function to support Tree of Life gaps feature
 */
export async function getUnobservedChildrenTaxa(
  _userId: string,
  _taxonId: number,
  _regionId?: number,
  _limit?: number
): Promise<any[]> {
  // Stub implementation - to be completed
  console.warn('getUnobservedChildrenTaxa not yet implemented');
  return [];
}

/**
 * Get recommended taxa based on difficulty
 *
 * TODO: Implement this function to support Tree of Life gaps feature
 */
export async function getRecommendedTaxa(
  _userId: string,
  _taxonId: number,
  _regionId?: number,
  _difficulty?: 'easy' | 'medium' | 'hard'
): Promise<any[]> {
  // Stub implementation - to be completed
  console.warn('getRecommendedTaxa not yet implemented');
  return [];
}
