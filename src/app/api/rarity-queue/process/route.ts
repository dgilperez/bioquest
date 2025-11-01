import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processUserQueue } from '@/lib/rarity-queue/processor';

/**
 * POST /api/rarity-queue/process
 *
 * Trigger background processing of the user's rarity classification queue.
 * Processes a batch of pending taxa and returns the results.
 *
 * Query params:
 * - batchSize: Number of taxa to process (default: 20, max: 50)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get batch size from query params
    const searchParams = req.nextUrl.searchParams;
    const batchSizeParam = searchParams.get('batchSize');
    const batchSize = batchSizeParam
      ? Math.min(parseInt(batchSizeParam, 10), 50)
      : 20;

    console.log(`🎯 Processing rarity queue for user ${userId} (batch size: ${batchSize})`);

    const result = await processUserQueue(userId, batchSize);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error processing rarity queue:', error);
    return NextResponse.json(
      { error: 'Failed to process queue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
