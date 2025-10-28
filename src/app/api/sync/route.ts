import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncUserObservations } from '@/lib/stats/user-stats';
import { syncMockObservations } from '@/lib/stats/mock-sync';
import {
  withAPIErrorHandler,
  createSuccessResponse,
  UnauthorizedError,
  ValidationError,
  SyncError
} from '@/lib/errors';

// Check if we're in mock mode
const isMockMode = !process.env.INATURALIST_CLIENT_ID || process.env.INATURALIST_CLIENT_ID === 'your_client_id_here';

async function handleSync(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new UnauthorizedError('You must be signed in to sync observations');
  }

  const body = await req.json();
  const { userId, inatUsername, accessToken } = body;

  if (!userId || !inatUsername) {
    throw new ValidationError('Missing required fields: userId and inatUsername', {
      receivedFields: Object.keys(body),
    });
  }

  // Use mock sync in development mode when iNat OAuth is not configured
  if (isMockMode) {
    console.log('🎭 Using mock data sync (iNaturalist OAuth not configured)');
    try {
      const result = await syncMockObservations(userId, inatUsername);
      return createSuccessResponse({
        mock: true,
        ...result,
      });
    } catch (error) {
      throw new SyncError('Failed to sync mock observations', {
        userId,
        inatUsername,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Real sync with iNaturalist API
  if (!accessToken) {
    throw new ValidationError('Access token required for real iNaturalist sync');
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
