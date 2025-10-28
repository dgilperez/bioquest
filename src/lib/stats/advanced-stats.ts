import { prisma } from '@/lib/db/prisma';
import { Rarity } from '@/types';

export interface TaxonomicBreakdown {
  iconicTaxon: string;
  count: number;
  speciesCount: number;
  percentage: number;
  commonName: string;
}

export interface LifeListEntry {
  taxonId: number;
  taxonName: string;
  commonName: string | null;
  taxonRank: string | null;
  iconicTaxon: string | null;
  firstObservedOn: Date;
  observationCount: number;
  rarity: Rarity;
  isFirstGlobal: boolean;
  isFirstRegional: boolean;
}

export interface SpeciesAccumulationPoint {
  date: string;
  cumulativeSpecies: number;
  newSpecies: number;
}

export interface AdvancedStatsResult {
  taxonomicBreakdown: TaxonomicBreakdown[];
  lifeList: LifeListEntry[];
  speciesAccumulation: SpeciesAccumulationPoint[];
  totalSpecies: number;
  totalObservations: number;
  rarityBreakdown: Record<Rarity, number>;
}

const ICONIC_TAXON_NAMES: Record<string, string> = {
  'Aves': 'Birds',
  'Plantae': 'Plants',
  'Insecta': 'Insects',
  'Mammalia': 'Mammals',
  'Reptilia': 'Reptiles',
  'Amphibia': 'Amphibians',
  'Fungi': 'Fungi',
  'Mollusca': 'Molluscs',
  'Arachnida': 'Arachnids',
  'Actinopterygii': 'Ray-finned Fishes',
  'Animalia': 'Other Animals',
  'Chromista': 'Chromista',
  'Protozoa': 'Protozoans',
};

/**
 * Get taxonomic breakdown by iconic taxon
 */
export async function getTaxonomicBreakdown(userId: string): Promise<TaxonomicBreakdown[]> {
  const breakdown = await prisma.observation.groupBy({
    by: ['iconicTaxon'],
    where: {
      userId,
      iconicTaxon: { not: null },
    },
    _count: {
      id: true,
    },
  });

  // Get species count per taxon
  const speciesCounts = await Promise.all(
    breakdown.map(async (group) => {
      const distinctSpecies = await prisma.observation.findMany({
        where: {
          userId,
          iconicTaxon: group.iconicTaxon,
          taxonId: { not: null },
        },
        distinct: ['taxonId'],
        select: { taxonId: true },
      });

      return {
        iconicTaxon: group.iconicTaxon || 'Unknown',
        count: group._count.id,
        speciesCount: distinctSpecies.length,
      };
    })
  );

  const totalObservations = speciesCounts.reduce((sum, item) => sum + item.count, 0);

  return speciesCounts
    .map((item) => ({
      iconicTaxon: item.iconicTaxon,
      count: item.count,
      speciesCount: item.speciesCount,
      percentage: Math.round((item.count / totalObservations) * 100),
      commonName: ICONIC_TAXON_NAMES[item.iconicTaxon] || item.iconicTaxon,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get complete life list (unique species)
 */
export async function getLifeList(
  userId: string,
  options?: {
    iconicTaxon?: string;
    rarity?: Rarity;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ entries: LifeListEntry[]; total: number }> {
  const { iconicTaxon, rarity, search, limit = 100, offset = 0 } = options || {};

  // Build where clause
  const where: any = {
    userId,
    taxonId: { not: null },
  };

  if (iconicTaxon) {
    where.iconicTaxon = iconicTaxon;
  }

  if (rarity) {
    where.rarity = rarity;
  }

  if (search) {
    where.OR = [
      { taxonName: { contains: search, mode: 'insensitive' } },
      { commonName: { contains: search, mode: 'insensitive' } },
    ];
  }

  // First get distinct taxonIds to count total species
  const distinctSpecies = await prisma.observation.findMany({
    where,
    distinct: ['taxonId'],
    select: { taxonId: true },
  });

  const total = distinctSpecies.length;

  // Get observation counts and first observation for each species
  // Note: For better performance with large datasets, this could be optimized
  // with raw SQL or aggregation, but for typical use cases this is fine
  const observations = await prisma.observation.findMany({
    where,
    orderBy: {
      observedOn: 'asc',
    },
    select: {
      taxonId: true,
      taxonName: true,
      commonName: true,
      taxonRank: true,
      iconicTaxon: true,
      observedOn: true,
      rarity: true,
      isFirstGlobal: true,
      isFirstRegional: true,
    },
  });

  // Group by taxonId and get first observation
  const speciesMap = new Map<number, any>();
  const observationCounts = new Map<number, number>();

  for (const obs of observations) {
    if (!obs.taxonId) continue;

    if (!speciesMap.has(obs.taxonId)) {
      speciesMap.set(obs.taxonId, obs);
      observationCounts.set(obs.taxonId, 1);
    } else {
      observationCounts.set(obs.taxonId, (observationCounts.get(obs.taxonId) || 0) + 1);
    }
  }

  // Convert to array and sort by first observation date (newest first)
  const allEntries: LifeListEntry[] = Array.from(speciesMap.values())
    .map((obs) => ({
      taxonId: obs.taxonId!,
      taxonName: obs.taxonName || 'Unknown',
      commonName: obs.commonName,
      taxonRank: obs.taxonRank,
      iconicTaxon: obs.iconicTaxon,
      firstObservedOn: obs.observedOn,
      observationCount: observationCounts.get(obs.taxonId!) || 1,
      rarity: obs.rarity as Rarity,
      isFirstGlobal: obs.isFirstGlobal,
      isFirstRegional: obs.isFirstRegional,
    }))
    .sort((a, b) => b.firstObservedOn.getTime() - a.firstObservedOn.getTime());

  // Apply pagination in memory (acceptable for species lists which are typically < 10k)
  const entries = allEntries.slice(offset, offset + limit);

  return { entries, total };
}

/**
 * Get species accumulation curve data
 */
export async function getSpeciesAccumulation(userId: string): Promise<SpeciesAccumulationPoint[]> {
  const observations = await prisma.observation.findMany({
    where: {
      userId,
      taxonId: { not: null },
    },
    orderBy: {
      observedOn: 'asc',
    },
    select: {
      taxonId: true,
      observedOn: true,
    },
  });

  const seenSpecies = new Set<number>();
  const points: SpeciesAccumulationPoint[] = [];
  let lastDate = '';

  for (const obs of observations) {
    if (!obs.taxonId) continue;

    const dateStr = obs.observedOn.toISOString().split('T')[0];
    const isNew = !seenSpecies.has(obs.taxonId);

    if (isNew) {
      seenSpecies.add(obs.taxonId);
    }

    // Group by day
    if (dateStr !== lastDate) {
      points.push({
        date: dateStr,
        cumulativeSpecies: seenSpecies.size,
        newSpecies: isNew ? 1 : 0,
      });
      lastDate = dateStr;
    } else if (points.length > 0) {
      // Update the last point for the same day
      const lastPoint = points[points.length - 1];
      lastPoint.cumulativeSpecies = seenSpecies.size;
      if (isNew) {
        lastPoint.newSpecies += 1;
      }
    }
  }

  return points;
}

/**
 * Get complete advanced stats for a user
 */
export async function getAdvancedStats(userId: string): Promise<AdvancedStatsResult> {
  const [taxonomicBreakdown, lifeListResult, speciesAccumulation, stats] = await Promise.all([
    getTaxonomicBreakdown(userId),
    getLifeList(userId, { limit: 10 }), // Just top 10 for overview
    getSpeciesAccumulation(userId),
    prisma.userStats.findUnique({
      where: { userId },
      select: {
        totalObservations: true,
        totalSpecies: true,
        rareObservations: true,
        legendaryObservations: true,
      },
    }),
  ]);

  // Get rarity breakdown
  const rarityBreakdown = await prisma.observation.groupBy({
    by: ['rarity'],
    where: { userId },
    _count: { id: true },
  });

  const rarityMap: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
  };

  for (const item of rarityBreakdown) {
    rarityMap[item.rarity as Rarity] = item._count.id;
  }

  return {
    taxonomicBreakdown,
    lifeList: lifeListResult.entries,
    speciesAccumulation,
    totalSpecies: stats?.totalSpecies || 0,
    totalObservations: stats?.totalObservations || 0,
    rarityBreakdown: rarityMap,
  };
}
