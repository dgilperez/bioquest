import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getGlobalLeaderboard,
  getRegionalLeaderboard,
  getFriendsLeaderboard,
  getTaxonLeaderboard,
  LeaderboardPeriod,
  LeaderboardType,
} from '@/lib/leaderboards/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') || 'global') as LeaderboardType;
    const period = (searchParams.get('period') || 'all_time') as LeaderboardPeriod;
    const limit = parseInt(searchParams.get('limit') || '100');
    const region = searchParams.get('region');
    const taxon = searchParams.get('taxon');

    // Get user from database
    const { prisma } = await import('@/lib/db/prisma');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, region: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let result;

    switch (type) {
      case 'global':
        result = await getGlobalLeaderboard(period, limit, user.id);
        break;

      case 'regional':
        const userRegion = region || user.region;
        if (!userRegion) {
          return NextResponse.json({ error: 'Region not specified' }, { status: 400 });
        }
        result = await getRegionalLeaderboard(userRegion, period, limit, user.id);
        break;

      case 'friends':
        result = await getFriendsLeaderboard(user.id, period, limit);
        break;

      case 'taxon':
        if (!taxon) {
          return NextResponse.json({ error: 'Taxon not specified' }, { status: 400 });
        }
        result = await getTaxonLeaderboard(taxon, limit, user.id);
        break;

      default:
        return NextResponse.json({ error: 'Invalid leaderboard type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
