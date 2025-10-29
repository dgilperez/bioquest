import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProgress } from '@/lib/sync/progress';

/**
 * GET /api/sync/progress
 * Poll this endpoint to get real-time sync progress
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const progress = await getProgress(userId);

  if (!progress) {
    return NextResponse.json({
      status: 'idle',
      message: 'No sync in progress',
    });
  }

  return NextResponse.json(progress);
}
