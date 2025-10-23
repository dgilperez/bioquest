import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncUserObservations } from '@/lib/stats/user-stats';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, inatUsername, accessToken } = body;

    if (!userId || !inatUsername || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sync observations
    const result = await syncUserObservations(userId, inatUsername, accessToken);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Failed to sync observations' },
      { status: 500 }
    );
  }
}
