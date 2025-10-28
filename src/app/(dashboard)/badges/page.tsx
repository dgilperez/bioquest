import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getUserBadges } from '@/lib/gamification/badges/unlock';
import { BadgeFilters } from '@/components/badges/BadgeFilters';
import { Navigation } from '@/components/layout/Navigation';
import { BadgesClient } from './page.client';
import { AnimatedStatsCard } from '@/components/stats/AnimatedStatsCard';

export const metadata: Metadata = {
  title: 'Badges',
  description: 'Your BioQuest achievements and badges',
};

export default async function BadgesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    redirect('/signin');
  }

  const { unlocked, locked } = await getUserBadges(user.id);

  const totalBadges = unlocked.length + locked.length;
  const progressPercent = totalBadges > 0 ? Math.round((unlocked.length / totalBadges) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-nature-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent mb-4">
            Badge Collection
          </h1>
          <Navigation />
          <p className="text-sm text-muted-foreground font-body mt-4">
            {unlocked.length} of {totalBadges} badges unlocked
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatedStatsCard
              title="Total"
              value={totalBadges}
              icon="🏆"
              color="gray"
              index={0}
            />
            <AnimatedStatsCard
              title="Unlocked"
              value={unlocked.length}
              icon="✨"
              color="green"
              index={1}
            />
            <AnimatedStatsCard
              title="Locked"
              value={locked.length}
              icon="🔒"
              color="gray"
              index={2}
            />
            <AnimatedStatsCard
              title="Progress"
              value={progressPercent}
              icon="📊"
              color="yellow"
              index={3}
            />
          </div>

          {/* Filters */}
          <BadgeFilters />

          {/* Badge Collections */}
          <BadgesClient unlocked={unlocked} locked={locked} />
        </div>
      </main>
    </div>
  );
}
