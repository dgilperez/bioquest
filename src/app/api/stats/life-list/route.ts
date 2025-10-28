import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLifeList } from '@/lib/stats/advanced-stats';
import { prisma } from '@/lib/db/prisma';
import { Rarity } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const iconicTaxon = searchParams.get('taxon') || undefined;
    const rarity = (searchParams.get('rarity') as Rarity) || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getLifeList(user.id, {
      iconicTaxon,
      rarity,
      search,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Life list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch life list' },
      { status: 500 }
    );
  }
}
