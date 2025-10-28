import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  withAPIErrorHandler,
  createSuccessResponse,
  ValidationError,
  UnauthorizedError,
} from '@/lib/errors';
import { getUnobservedChildrenTaxa, getRecommendedTaxa } from '@/lib/tree-of-life/progress';

async function handleGetGaps(
  req: NextRequest,
  { params }: { params: { taxonId: string } }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError('You must be logged in to view gap analysis');
  }

  const taxonId = parseInt(params.taxonId);
  if (isNaN(taxonId)) {
    throw new ValidationError('Invalid taxon ID');
  }

  const { searchParams } = new URL(req.url);
  const regionId = searchParams.get('regionId') ? parseInt(searchParams.get('regionId')!) : undefined;
  const difficulty = (searchParams.get('difficulty') || 'medium') as 'easy' | 'medium' | 'hard';
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;

  // Get unobserved taxa
  const unobserved = await getUnobservedChildrenTaxa(
    session.user.id,
    taxonId,
    regionId,
    limit
  );

  // Get recommended taxa based on difficulty
  const recommended = await getRecommendedTaxa(
    session.user.id,
    taxonId,
    regionId,
    difficulty
  );

  return createSuccessResponse({
    taxonId,
    regionId,
    unobservedCount: unobserved.length,
    unobserved: unobserved.slice(0, 10), // Top 10 most common unobserved
    recommended, // Recommended based on difficulty
  });
}

export const GET = withAPIErrorHandler(handleGetGaps);
