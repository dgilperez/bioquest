import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getQueueStatus } from '@/lib/rarity-queue/manager';

/**
 * GET /api/rarity-queue/status
 *
 * Get the current status of the rarity classification queue for the authenticated user.
 * Returns counts of pending, processing, completed, and failed taxa.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const status = await getQueueStatus(userId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting queue status:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}
