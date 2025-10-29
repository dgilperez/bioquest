import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getUserStats, getLevelTitle } from '@/lib/stats/user-stats';
import { DashboardClient } from '../dashboard/page.client';
import { AutoSync } from '@/components/sync/AutoSync';

export const metadata: Metadata = {
  title: 'Quest',
  description: 'Your active missions and recommendations',
};

export default async function QuestPage() {
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

  // Redirect to onboarding if not completed
  if (!user.onboardingCompleted) {
    redirect('/onboarding');
  }

  const stats = user.stats || (await getUserStats(user.id));
  const levelTitle = getLevelTitle(stats.level);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Auto-sync component */}
      <AutoSync
        userId={user.id}
        inatUsername={(session.user as any).inatUsername}
        accessToken={(session as any).accessToken}
        lastSyncedAt={stats.lastSyncedAt}
      />

      {/* TODO: Replace with proper Quest landing page in Phase 2 */}
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
        currentStreak={stats.currentStreak}
        longestStreak={stats.longestStreak}
        lastObservationDate={stats.lastObservationDate}
        currentRarityStreak={stats.currentRarityStreak}
        longestRarityStreak={stats.longestRarityStreak}
      />
    </div>
  );
}
