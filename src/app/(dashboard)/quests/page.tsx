import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Navigation } from '@/components/layout/Navigation';
import { generateAllQuests, assignAvailableQuestsToUser } from '@/lib/gamification/quests/generation';
import { QuestsClient } from './page.client';
import { AnimatedStatsCard } from '@/components/stats/AnimatedStatsCard';

export const metadata: Metadata = {
  title: 'Quests',
  description: 'Your BioQuest challenges and quests',
};

export default async function QuestsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    redirect('/signin');
  }

  // Ensure quests are generated
  await generateAllQuests();

  // Ensure user has all available quests assigned
  await assignAvailableQuestsToUser(user.id);

  // Get user's active quests
  const activeQuests = await prisma.userQuest.findMany({
    where: {
      userId: user.id,
      status: 'active',
    },
    include: {
      quest: true,
    },
    orderBy: {
      quest: {
        type: 'asc',
      },
    },
  });

  // Get user's completed quests
  const completedQuests = await prisma.userQuest.findMany({
    where: {
      userId: user.id,
      status: 'completed',
    },
    include: {
      quest: true,
    },
    orderBy: {
      completedAt: 'desc',
    },
    take: 10, // Show last 10 completed
  });

  // Group active quests by type
  const dailyQuests = activeQuests.filter(q => q.quest.type === 'daily');
  const weeklyQuests = activeQuests.filter(q => q.quest.type === 'weekly');
  const monthlyQuests = activeQuests.filter(q => q.quest.type === 'monthly');

  // Calculate total points earned from completed quests
  const totalPointsEarned = completedQuests.reduce(
    (sum, q) => sum + ((q.quest.reward as any)?.points || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-nature-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent mb-4">
            Quests & Challenges
          </h1>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnimatedStatsCard
              title="Active Quests"
              value={activeQuests.length}
              icon="🎯"
              color="blue"
              index={0}
            />
            <AnimatedStatsCard
              title="Completed"
              value={completedQuests.length}
              icon="🏆"
              color="green"
              index={1}
            />
            <AnimatedStatsCard
              title="Points Earned"
              value={totalPointsEarned}
              icon="⭐"
              color="yellow"
              index={2}
            />
          </div>

          {/* Quest Lists */}
          <QuestsClient
            dailyQuests={dailyQuests}
            weeklyQuests={weeklyQuests}
            monthlyQuests={monthlyQuests}
            completedQuests={completedQuests}
          />
        </div>
      </main>
    </div>
  );
}
