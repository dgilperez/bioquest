import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdvancedStats } from '@/lib/stats/advanced-stats';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const stats = await getAdvancedStats(user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Advanced stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advanced stats' },
      { status: 500 }
    );
  }
}
