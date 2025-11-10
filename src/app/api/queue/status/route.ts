import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getQueueStatus } from '@/lib/rarity-queue/manager';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/queue/status
 *
 * Returns background classification queue status for the current user
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get queue status
    const status = await getQueueStatus(user.id);

    // Also check if there are observations with pending rarity status
    const pendingObservations = await prisma.observation.count({
      where: {
        userId: user.id,
        rarityStatus: 'pending',
      },
    });

    return NextResponse.json({
      ...status,
      pendingObservations,
      isComplete: status.pending === 0 && status.processing === 0 && status.failed === 0 && pendingObservations === 0,
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    );
  }
}
