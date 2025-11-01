import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncUserObservations } from '@/lib/stats/user-stats';
import {
  withAPIErrorHandler,
  createSuccessResponse,
  UnauthorizedError,
  ValidationError,
  SyncError
} from '@/lib/errors';

async function handleSync(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new UnauthorizedError('You must be signed in to sync observations');
  }

  const body = await req.json();
  const { userId, inatUsername, accessToken } = body;

  if (!userId || !inatUsername || !accessToken) {
    throw new ValidationError('Missing required fields: userId, inatUsername, and accessToken', {
      receivedFields: Object.keys(body),
    });
  }

  try {
    const result = await syncUserObservations(userId, inatUsername, accessToken);
    return createSuccessResponse(result);
  } catch (error) {
    throw new SyncError('Failed to sync observations from iNaturalist', {
      userId,
      inatUsername,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export const POST = withAPIErrorHandler(handleSync);
