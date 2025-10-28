import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getINatClient } from '@/lib/inat/client';
import { prisma } from '@/lib/db/prisma';
import {
  withAPIErrorHandler,
  createSuccessResponse,
  UnauthorizedError,
} from '@/lib/errors';

interface IconicTaxonSummary {
  id: number;
  name: string;
  iconicTaxonName: string;
  rank: string;
  obsCount: number;
  userObsCount: number;
  userSpeciesCount: number;
}

async function handleGetStartingTaxa(_req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError('You must be logged in to access the Tree of Life');
  }
  const userId = (session.user as any).id;

  // Iconic taxon IDs from iNaturalist
  // These are the main kingdoms/groups that iNat organizes observations by
  const iconicTaxa = [
    { id: 47126, name: 'Animalia', iconicName: 'Animalia' },
    { id: 47170, name: 'Plantae', iconicName: 'Plantae' },
    { id: 47169, name: 'Fungi', iconicName: 'Fungi' },
    { id: 48222, name: 'Mollusca', iconicName: 'Mollusca' },
    { id: 47115, name: 'Actinopterygii', iconicName: 'Actinopterygii' }, // Ray-finned Fishes
    { id: 26036, name: 'Arachnida', iconicName: 'Arachnida' },
    { id: 47158, name: 'Aves', iconicName: 'Aves' }, // Birds
    { id: 47119, name: 'Mammalia', iconicName: 'Mammalia' },
    { id: 47178, name: 'Reptilia', iconicName: 'Reptilia' },
    { id: 47119, name: 'Amphibia', iconicName: 'Amphibia' },
    { id: 47120, name: 'Insecta', iconicName: 'Insecta' },
    { id: 54960, name: 'Chromista', iconicName: 'Chromista' }, // Kelp, diatoms, etc.
    { id: 48460, name: 'Protozoa', iconicName: 'Protozoa' },
  ];

  const client = getINatClient();

  // Get user's observations grouped by iconic taxon
  const userObsByIconic = await prisma.observation.groupBy({
    by: ['iconicTaxon'],
    where: {
      userId,
    },
    _count: {
      id: true,
    },
  });

  // Get user's unique species count by iconic taxon
  const userSpeciesByIconic = await prisma.observation.groupBy({
    by: ['iconicTaxon'],
    where: {
      userId,
      taxonId: { not: null },
    },
    _count: {
      taxonId: true,
    },
  });

  // Map to lookup objects
  const obsCountMap = new Map(
    userObsByIconic.map(g => [g.iconicTaxon || 'Unknown', g._count.id])
  );
  const speciesCountMap = new Map(
    userSpeciesByIconic.map(g => [g.iconicTaxon || 'Unknown', g._count.taxonId])
  );

  // Build summary for each iconic taxon
  const results: IconicTaxonSummary[] = [];

  for (const taxon of iconicTaxa) {
    const iconicName = taxon.iconicName;
    const userObsCount = obsCountMap.get(iconicName) || 0;
    const userSpeciesCount = speciesCountMap.get(iconicName) || 0;

    // Get or cache taxon data
    let cachedTaxon = await prisma.taxonNode.findUnique({
      where: { id: taxon.id },
    });

    if (!cachedTaxon || isStale(cachedTaxon.cachedAt)) {
      try {
        const taxonResponse = await client.getTaxon(taxon.id);
        if (taxonResponse.results && taxonResponse.results.length > 0) {
          const inatTaxon = taxonResponse.results[0];

          cachedTaxon = await prisma.taxonNode.upsert({
            where: { id: taxon.id },
            update: {
              name: inatTaxon.name,
              rank: inatTaxon.rank,
              commonName: inatTaxon.preferred_common_name || null,
              iconicTaxonName: inatTaxon.iconic_taxon_name || null,
              globalObsCount: inatTaxon.observations_count || 0,
              updatedAt: new Date(),
            },
            create: {
              id: taxon.id,
              name: inatTaxon.name,
              rank: inatTaxon.rank,
              commonName: inatTaxon.preferred_common_name || null,
              iconicTaxonName: inatTaxon.iconic_taxon_name || null,
              globalObsCount: inatTaxon.observations_count || 0,
            },
          });
        }
      } catch (error) {
        console.error(`Failed to fetch taxon ${taxon.id}:`, error);
        // Continue with other taxa
        continue;
      }
    }

    if (cachedTaxon) {
      results.push({
        id: cachedTaxon.id,
        name: cachedTaxon.name,
        iconicTaxonName: iconicName,
        rank: cachedTaxon.rank,
        obsCount: cachedTaxon.globalObsCount,
        userObsCount,
        userSpeciesCount,
      });
    }
  }

  // Sort by user observation count (most active first), then by global observation count
  results.sort((a, b) => {
    if (b.userObsCount !== a.userObsCount) {
      return b.userObsCount - a.userObsCount;
    }
    return b.obsCount - a.obsCount;
  });

  return createSuccessResponse(results);
}

function isStale(cachedAt: Date): boolean {
  const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - cachedAt.getTime() > ONE_MONTH;
}

export const GET = withAPIErrorHandler(handleGetStartingTaxa);
