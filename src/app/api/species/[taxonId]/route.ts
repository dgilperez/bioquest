import { NextRequest, NextResponse } from 'next/server';
import { getINatClient } from '@/lib/inat/client';
import {
  withAPIErrorHandler,
  createSuccessResponse,
  NotFoundError,
  ValidationError,
} from '@/lib/errors';

async function handleGetSpeciesInfo(
  req: NextRequest,
  { params }: { params: { taxonId: string } }
): Promise<NextResponse> {
  const taxonId = parseInt(params.taxonId);

  if (isNaN(taxonId)) {
    throw new ValidationError('Invalid taxon ID');
  }

  const client = getINatClient();

  // Get taxon information
  const taxonResponse = await client.getTaxon(taxonId);

  if (!taxonResponse.results || taxonResponse.results.length === 0) {
    throw new NotFoundError(`Species with ID ${taxonId} not found`);
  }

  const taxon = taxonResponse.results[0];

  // Get observation count for rarity info
  const observationCount = await client.getTaxonObservationCount(taxonId);

  // Build taxonomy object
  const taxonomy: Record<string, string> = {};
  if (taxon.ancestor_ids && taxon.ancestors) {
    taxon.ancestors.forEach((ancestor: any) => {
      if (ancestor.rank && ancestor.name) {
        taxonomy[ancestor.rank] = ancestor.name;
      }
    });
  }

  // Extract species info
  const speciesInfo = {
    id: taxon.id,
    name: taxon.name,
    commonName: taxon.preferred_common_name || taxon.english_common_name,
    rank: taxon.rank,
    ancestorNames: taxon.ancestor_ids || [],
    wikipediaSummary: taxon.wikipedia_summary,
    wikipediaUrl: taxon.wikipedia_url,
    conservationStatus: taxon.conservation_status
      ? {
          status: taxon.conservation_status.status,
          statusName: taxon.conservation_status.status_name || taxon.conservation_status.status,
        }
      : undefined,
    taxonomy,
    photos: taxon.taxon_photos?.slice(0, 6).map((tp: any) => ({
      url: tp.photo?.medium_url || tp.photo?.url,
      attribution: tp.photo?.attribution || 'Unknown',
      license: tp.photo?.license_code || 'Unknown',
    })),
    observationCount,
    isEndangered: taxon.threatened || false,
    isIntroduced: taxon.introduced || false,
  };

  return createSuccessResponse(speciesInfo);
}

export const GET = withAPIErrorHandler(handleGetSpeciesInfo);
