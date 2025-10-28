import { prisma } from '@/lib/db/prisma';
import { getINatClient } from '@/lib/inat/client';

export interface TaxonProgress {
  taxonId: number;
  rank: string;
  observationCount: number;
  speciesCount: number;
  completionPercent: number;
  totalSpeciesInRegion: number;
  totalSpeciesGlobal: number;
}

/**
 * Calculate user's progress for a specific taxon
 * Returns observation counts, species counts, and completion percentage
 */
export async function calculateTaxonProgress(
  userId: string,
  taxonId: number,
  regionId?: number
): Promise<TaxonProgress> {
  // Get user's observations under this taxon
  const observations = await prisma.observation.findMany({
    where: {
      userId,
      taxonId: { not: null },
    },
    select: {
      id: true,
      taxonId: true,
    },
  });

  // Get the taxon node to find its rank
  const taxonNode = await prisma.taxonNode.findUnique({
    where: { id: taxonId },
    select: { rank: true, ancestorIds: true },
  });

  if (!taxonNode) {
    throw new Error(`Taxon ${taxonId} not found`);
  }

  // Filter observations that are descendants of this taxon
  const ancestorIds = taxonNode.ancestorIds ? JSON.parse(taxonNode.ancestorIds) : [];
  const relevantObs = observations.filter((obs) => {
    // Check if this observation's taxon is this taxon or a descendant
    // This is a simplified check - in production, we'd need to check the full ancestry
    return obs.taxonId === taxonId || ancestorIds.includes(obs.taxonId);
  });

  const observationCount = relevantObs.length;
  const uniqueTaxonIds = new Set(relevantObs.map((obs) => obs.taxonId));
  const speciesCount = uniqueTaxonIds.size;

  // Get regional data if regionId provided
  let totalSpeciesInRegion = 0;
  if (regionId) {
    const regionalData = await prisma.regionalTaxonData.findUnique({
      where: {
        placeId_taxonId: {
          placeId: regionId,
          taxonId,
        },
      },
      select: { speciesCount: true },
    });

    totalSpeciesInRegion = regionalData?.speciesCount || 0;
  }

  // Get global species count from cached taxon node
  const taxonWithCount = await prisma.taxonNode.findUnique({
    where: { id: taxonId },
    select: { globalSpeciesCount: true },
  });

  const totalSpeciesGlobal = taxonWithCount?.globalSpeciesCount || 0;

  // Calculate completion percentage
  const total = regionId ? totalSpeciesInRegion : totalSpeciesGlobal;
  const completionPercent = total > 0 ? (speciesCount / total) * 100 : 0;

  return {
    taxonId,
    rank: taxonNode.rank,
    observationCount,
    speciesCount,
    completionPercent,
    totalSpeciesInRegion,
    totalSpeciesGlobal,
  };
}

/**
 * Update or create user taxon progress record
 */
export async function updateUserTaxonProgress(
  userId: string,
  taxonId: number,
  regionId?: number
): Promise<void> {
  const progress = await calculateTaxonProgress(userId, taxonId, regionId);

  await prisma.userTaxonProgress.upsert({
    where: {
      userId_taxonId_regionId: {
        userId,
        taxonId,
        regionId: regionId ?? null,
      },
    } as any,
    update: {
      observationCount: progress.observationCount,
      speciesCount: progress.speciesCount,
      completionPercent: progress.completionPercent,
      updatedAt: new Date(),
    },
    create: {
      userId,
      taxonId,
      rank: progress.rank,
      regionId: regionId || null,
      observationCount: progress.observationCount,
      speciesCount: progress.speciesCount,
      completionPercent: progress.completionPercent,
    },
  });
}

/**
 * Batch update user progress for multiple taxa
 * Useful after sync to recalculate all progress
 */
export async function batchUpdateTaxonProgress(
  userId: string,
  taxonIds: number[],
  regionId?: number
): Promise<void> {
  for (const taxonId of taxonIds) {
    await updateUserTaxonProgress(userId, taxonId, regionId);
  }
}

/**
 * Get children taxa that user hasn't observed yet (gap analysis)
 */
export async function getUnobservedChildrenTaxa(
  userId: string,
  parentTaxonId: number,
  _regionId?: number,
  limit: number = 20
): Promise<Array<{
  id: number;
  name: string;
  commonName?: string;
  rank: string;
  obsCount: number;
  regionalObsCount?: number;
}>> {
  const client = getINatClient();

  // Get all children of this taxon
  const childrenResponse = await client.request<{ results: any[] }>(
    `/taxa?parent_id=${parentTaxonId}&per_page=200`
  );

  // Get user's observed taxon IDs under this parent
  const userObservations = await prisma.observation.findMany({
    where: {
      userId,
      taxonId: { not: null },
    },
    select: {
      taxonId: true,
    },
  });

  const observedTaxonIds = new Set(userObservations.map((obs) => obs.taxonId));

  // Filter to unobserved children
  const unobserved = childrenResponse.results
    .filter((child) => !observedTaxonIds.has(child.id))
    .map((child) => ({
      id: child.id,
      name: child.name,
      commonName: child.preferred_common_name,
      rank: child.rank,
      obsCount: child.observations_count || 0,
      regionalObsCount: undefined, // Would need separate query per child
    }));

  // Sort by observation count (most common first = easier to find)
  unobserved.sort((a, b) => b.obsCount - a.obsCount);

  return unobserved.slice(0, limit);
}

/**
 * Get recommended taxa to observe next (gap analysis with regional filtering)
 */
export async function getRecommendedTaxa(
  userId: string,
  parentTaxonId: number,
  regionId?: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<Array<{
  id: number;
  name: string;
  commonName?: string;
  rank: string;
  obsCount: number;
  difficulty: string;
  reason: string;
}>> {
  const unobserved = await getUnobservedChildrenTaxa(userId, parentTaxonId, regionId, 50);

  // Score taxa by difficulty
  const withDifficulty = unobserved.map((taxon) => {
    let difficultyScore: string;
    let reason: string;

    if (taxon.obsCount > 10000) {
      difficultyScore = 'easy';
      reason = 'Very common, easy to find';
    } else if (taxon.obsCount > 1000) {
      difficultyScore = 'medium';
      reason = 'Moderately common';
    } else if (taxon.obsCount > 100) {
      difficultyScore = 'hard';
      reason = 'Uncommon, requires effort';
    } else {
      difficultyScore = 'expert';
      reason = 'Rare, challenging to find';
    }

    return {
      ...taxon,
      difficulty: difficultyScore,
      reason,
    };
  });

  // Filter by requested difficulty
  let filtered = withDifficulty;
  if (difficulty === 'easy') {
    filtered = withDifficulty.filter((t) => t.difficulty === 'easy');
  } else if (difficulty === 'medium') {
    filtered = withDifficulty.filter(
      (t) => t.difficulty === 'easy' || t.difficulty === 'medium'
    );
  }

  return filtered.slice(0, 10);
}
