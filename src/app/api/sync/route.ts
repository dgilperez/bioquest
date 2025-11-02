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
    // Check if it's a "sync already in progress" error
    if (error instanceof Error && error.message.includes('Sync already in progress')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sync already in progress',
          data: { alreadySyncing: true }
        },
        { status: 409 } // Conflict
      );
    }

    // Check if it's a rate limit error
    if (error instanceof Error && (error.message.includes('rate limit') || error.message.includes('429'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests to iNaturalist. Please wait a few minutes.',
          recoverable: true,
          retryAfter: 60000, // 1 minute
        },
        { status: 429 }
      );
    }

    // Check if it's a network/timeout error
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('fetch')
    )) {
      return NextResponse.json(
        {
          success: false,
          error: 'Network error',
          message: 'Failed to connect to iNaturalist. Please check your connection.',
          recoverable: true,
          retryAfter: 5000, // 5 seconds
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Check if it's an auth error
    if (error instanceof Error && (
      error.message.includes('401') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('authentication failed')
    )) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          message: 'Your iNaturalist session has expired. Please sign in again.',
          recoverable: false,
        },
        { status: 401 }
      );
    }

    throw new SyncError('Failed to sync observations from iNaturalist', {
      userId,
      inatUsername,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export const POST = withAPIErrorHandler(handleSync);
