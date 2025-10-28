import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getINatClient } from '@/lib/inat/client';
import { prisma } from '@/lib/db/prisma';
import {
  withAPIErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from '@/lib/errors';

interface TaxonDetails {
  taxon: {
    id: number;
    name: string;
    commonName?: string;
    rank: string;
    parentId?: number;
    ancestorIds: number[];
    globalObsCount: number;
    globalSpeciesCount?: number;
  };
  children: Array<{
    id: number;
    name: string;
    commonName?: string;
    rank: string;
    obsCount: number;
    speciesCount?: number;
  }>;
  userProgress?: {
    observationCount: number;
    speciesCount: number;
    completionPercent: number;
    lastObservedAt?: Date;
  };
  regionalData?: {
    rgObservationCount: number;
    speciesCount: number;
    observerCount: number;
  };
}

async function handleGetTaxonDetails(
  req: NextRequest,
  { params }: { params: { taxonId: string } }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError('You must be logged in to access the Tree of Life');
  }

  const taxonId = parseInt(params.taxonId);
  if (isNaN(taxonId)) {
    throw new ValidationError('Invalid taxon ID');
  }

  const { searchParams } = new URL(req.url);
  const regionId = searchParams.get('regionId') ? parseInt(searchParams.get('regionId')!) : undefined;

  const client = getINatClient();

  // Fetch taxon details from iNaturalist
  const taxonResponse = await client.getTaxon(taxonId);

  if (!taxonResponse.results || taxonResponse.results.length === 0) {
    throw new NotFoundError(`Taxon with ID ${taxonId} not found`);
  }

  const taxon = taxonResponse.results[0];

  // Get or cache taxon in database
  const cachedTaxon = await prisma.taxonNode.upsert({
    where: { id: taxonId },
    update: {
      name: taxon.name,
      rank: taxon.rank,
      commonName: taxon.preferred_common_name || null,
      parentId: taxon.parent_id || null,
      ancestorIds: taxon.ancestor_ids ? JSON.stringify(taxon.ancestor_ids) : null,
      iconicTaxonName: taxon.iconic_taxon_name || null,
      globalObsCount: taxon.observations_count || 0,
      updatedAt: new Date(),
    },
    create: {
      id: taxonId,
      name: taxon.name,
      rank: taxon.rank,
      commonName: taxon.preferred_common_name || null,
      parentId: taxon.parent_id || null,
      ancestorIds: taxon.ancestor_ids ? JSON.stringify(taxon.ancestor_ids) : null,
      iconicTaxonName: taxon.iconic_taxon_name || null,
      globalObsCount: taxon.observations_count || 0,
    },
  });

  // Get children taxa (next level down in taxonomy)
  const childrenResponse = await client.request<{ results: any[] }>(
    `/taxa?parent_id=${taxonId}&per_page=200&rank=${getChildRank(taxon.rank)}`
  );

  const children = childrenResponse.results.map((child: any) => ({
    id: child.id,
    name: child.name,
    commonName: child.preferred_common_name,
    rank: child.rank,
    obsCount: child.observations_count || 0,
    speciesCount: child.descendant_species_count,
  }));

  // Get user's progress for this taxon
  const userProgress = await prisma.userTaxonProgress.findUnique({
    where: {
      userId_taxonId_regionId: {
        userId: session.user.id,
        taxonId,
        regionId: regionId || null,
      },
    },
  });

  // Get regional data if regionId provided
  let regionalData;
  if (regionId) {
    regionalData = await prisma.regionalTaxonData.findUnique({
      where: {
        placeId_taxonId: {
          placeId: regionId,
          taxonId,
        },
      },
    });

    // If not cached, fetch from iNat and cache
    if (!regionalData || isStale(regionalData.cachedAt)) {
      const obsCount = await client.getTaxonObservationCount(taxonId, regionId);

      regionalData = await prisma.regionalTaxonData.upsert({
        where: {
          placeId_taxonId: {
            placeId: regionId,
            taxonId,
          },
        },
        update: {
          rgObservationCount: obsCount,
          updatedAt: new Date(),
        },
        create: {
          placeId: regionId,
          placeName: 'Region', // TODO: fetch place name
          taxonId,
          rank: taxon.rank,
          rgObservationCount: obsCount,
        },
      });
    }
  }

  const result: TaxonDetails = {
    taxon: {
      id: cachedTaxon.id,
      name: cachedTaxon.name,
      commonName: cachedTaxon.commonName || undefined,
      rank: cachedTaxon.rank,
      parentId: cachedTaxon.parentId || undefined,
      ancestorIds: cachedTaxon.ancestorIds ? JSON.parse(cachedTaxon.ancestorIds) : [],
      globalObsCount: cachedTaxon.globalObsCount,
      globalSpeciesCount: cachedTaxon.globalSpeciesCount || undefined,
    },
    children: children.sort((a, b) => b.obsCount - a.obsCount), // Sort by observation count
    userProgress: userProgress
      ? {
          observationCount: userProgress.observationCount,
          speciesCount: userProgress.speciesCount,
          completionPercent: userProgress.completionPercent,
          lastObservedAt: userProgress.lastObservedAt || undefined,
        }
      : undefined,
    regionalData: regionalData
      ? {
          rgObservationCount: regionalData.rgObservationCount,
          speciesCount: regionalData.speciesCount,
          observerCount: regionalData.observerCount,
        }
      : undefined,
  };

  return createSuccessResponse(result);
}

function getChildRank(parentRank: string): string {
  const rankHierarchy = [
    'stateofmatter',
    'kingdom',
    'phylum',
    'subphylum',
    'class',
    'subclass',
    'order',
    'suborder',
    'infraorder',
    'superfamily',
    'family',
    'subfamily',
    'tribe',
    'subtribe',
    'genus',
    'subgenus',
    'species',
    'subspecies',
    'variety',
    'form',
  ];

  const parentIndex = rankHierarchy.indexOf(parentRank.toLowerCase());
  if (parentIndex === -1 || parentIndex === rankHierarchy.length - 1) {
    return 'species'; // Default fallback
  }

  // Find the next main rank (skip sub- prefixes for cleaner tree)
  const mainRanks = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
  for (let i = parentIndex + 1; i < rankHierarchy.length; i++) {
    if (mainRanks.includes(rankHierarchy[i])) {
      return rankHierarchy[i];
    }
  }

  return rankHierarchy[parentIndex + 1];
}

function isStale(cachedAt: Date): boolean {
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - cachedAt.getTime() > ONE_WEEK;
}

export const GET = withAPIErrorHandler(handleGetTaxonDetails);
