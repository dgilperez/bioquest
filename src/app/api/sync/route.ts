import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncUserObservations } from '@/lib/stats/user-stats';
import { syncMockObservations } from '@/lib/stats/mock-sync';

// Check if we're in mock mode
const isMockMode = !process.env.INATURALIST_CLIENT_ID || process.env.INATURALIST_CLIENT_ID === 'your_client_id_here';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, inatUsername, accessToken } = body;

    console.log('Sync API received body:', { userId, inatUsername, hasAccessToken: !!accessToken });

    if (!userId || !inatUsername) {
      console.error('Missing required fields. Body:', body);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use mock sync in development mode when iNat OAuth is not configured
    if (isMockMode) {
      console.log('🎭 Using mock data sync (iNaturalist OAuth not configured)');
      const result = await syncMockObservations(userId, inatUsername);
      return NextResponse.json({
        success: true,
        mock: true,
        ...result,
      });
    }

    // Real sync with iNaturalist API
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

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
