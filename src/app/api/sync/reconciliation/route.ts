import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processUserPendingReconciliation } from '@/lib/sync/reconciliation-queue';

/**
 * POST /api/sync/reconciliation
 * Process any pending reconciliation job for the current user (lazy processing)
 */
export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const processed = await processUserPendingReconciliation(userId);
    return NextResponse.json({ processed });
  } catch (error: any) {
    console.error('Failed to process reconciliation:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
