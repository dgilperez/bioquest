import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getUserStats, getLevelTitle } from '@/lib/stats/user-stats';
import { StatsCard } from '@/components/stats/StatsCard';
import { LevelProgress } from '@/components/stats/LevelProgress';
import { SyncButton } from '@/components/stats/SyncButton';
import { Navigation } from '@/components/layout/Navigation';

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
    <div className="min-h-screen bg-gradient-to-b from-nature-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-nature-600">BioQuest</h1>
              <span className="text-sm text-muted-foreground">
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
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {session.user.name || (session.user as any).inatUsername}!
            </h2>
            <p className="text-muted-foreground">
              Here's your progress as a naturalist
            </p>
          </div>

          {/* Level Card */}
          <div className="rounded-lg border bg-gradient-to-r from-nature-500 to-nature-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Current Level</p>
                <h3 className="text-4xl font-bold">Level {stats.level}</h3>
                <p className="text-sm mt-1">{levelTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Total Points</p>
                <p className="text-3xl font-bold">{stats.totalPoints.toLocaleString()}</p>
              </div>
            </div>
            <LevelProgress
              currentPoints={stats.totalPoints}
              pointsToNextLevel={stats.pointsToNextLevel}
              nextLevel={stats.level + 1}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Observations"
              value={stats.totalObservations}
              icon="📸"
              color="blue"
            />
            <StatsCard
              title="Species"
              value={stats.totalSpecies}
              icon="🌿"
              color="green"
            />
            <StatsCard
              title="Rare Finds"
              value={stats.rareObservations}
              icon="💎"
              color="purple"
            />
            <StatsCard
              title="Legendary"
              value={stats.legendaryObservations}
              icon="✨"
              color="yellow"
            />
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border bg-white dark:bg-gray-800 p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/badges" className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <div className="text-2xl mb-2">🏆</div>
                <p className="font-semibold">View Badges</p>
                <p className="text-sm text-muted-foreground">Check your achievements</p>
              </Link>
              <Link href="/observations" className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <div className="text-2xl mb-2">👁️</div>
                <p className="font-semibold">Observations</p>
                <p className="text-sm text-muted-foreground">View your finds</p>
              </Link>
              <Link href="/quests" className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                <div className="text-2xl mb-2">🎯</div>
                <p className="font-semibold">Active Quests</p>
                <p className="text-sm text-muted-foreground">See your challenges</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
