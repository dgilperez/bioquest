import { NextRequest, NextResponse } from 'next/server';
import { checkAndResetLeaderboards } from '@/lib/leaderboards/reset';

/**
 * API endpoint to reset weekly and monthly leaderboards
 *
 * This should be called periodically via:
 * 1. A cron job (recommended for production)
 * 2. A scheduled task via hosting provider (Vercel Cron, etc.)
 * 3. Manual trigger for testing
 *
 * Security: In production, protect this endpoint with:
 * - API key verification
 * - IP whitelist
 * - Vercel cron secret header
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret (Vercel Cron Jobs)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Perform the reset
    const result = await checkAndResetLeaderboards();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      weekly: {
        reset: result.weekly.reset,
        usersReset: result.weekly.count
      },
      monthly: {
        reset: result.monthly.reset,
        usersReset: result.monthly.count
      }
    });
  } catch (error) {
    console.error('Leaderboard reset error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset leaderboards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing (remove in production)
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET method not allowed in production' },
      { status: 405 }
    );
  }

  return POST(request);
}
