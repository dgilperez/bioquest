import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getUserStats, getLevelTitle } from '@/lib/stats/user-stats';
import { SyncButton } from '@/components/stats/SyncButton';
import { Navigation } from '@/components/layout/Navigation';
import { DashboardClient } from './page.client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your BioQuest stats and progress',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { stats: true },
  });

  if (!user) {
    redirect('/signin');
  }

  const stats = user.stats || (await getUserStats(user.id));
  const levelTitle = getLevelTitle(stats.level);

  return (
    <div className="min-h-screen bg-gradient-to-b from-nature-50 via-white to-nature-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md dark:bg-gray-800/80 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
                BioQuest
              </h1>
              <span className="text-sm text-muted-foreground font-body px-3 py-1 bg-nature-100 dark:bg-nature-900/30 rounded-full">
                {session.user.name || (session.user as any).inatUsername}
              </span>
            </div>
            <SyncButton
              userId={user.id}
              inatUsername={(session.user as any).inatUsername}
              accessToken={(session as any).accessToken}
            />
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <DashboardClient
          userName={session.user.name || (session.user as any).inatUsername}
          level={stats.level}
          levelTitle={levelTitle}
          totalPoints={stats.totalPoints}
          pointsToNextLevel={stats.pointsToNextLevel}
          totalObservations={stats.totalObservations}
          totalSpecies={stats.totalSpecies}
          rareObservations={stats.rareObservations}
          legendaryObservations={stats.legendaryObservations}
        />
      </main>
    </div>
  );
}
