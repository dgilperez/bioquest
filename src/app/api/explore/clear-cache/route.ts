import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recommendationsCache } from '@/lib/cache/recommendations-cache';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Clear cache for this user
    recommendationsCache.clearUser(userId);

    console.log(`🗑️  Cleared recommendations cache for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      {
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
