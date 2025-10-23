import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Navigation } from '@/components/layout/Navigation';
import { QuestCard } from '@/components/quests/QuestCard';
import { generateAllQuests, assignAvailableQuestsToUser } from '@/lib/gamification/quests/generation';
import { Trophy, Target } from 'lucide-react';

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
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-nature-600 mb-4">Quests & Challenges</h1>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">{activeQuests.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Quests</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-2xl font-bold">{completedQuests.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">⭐</div>
                <div>
                  <p className="text-2xl font-bold">{totalPointsEarned.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Points Earned</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Quests */}
          {dailyQuests.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Daily Quests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyQuests.map(uq => (
                  <QuestCard
                    key={uq.id}
                    quest={uq.quest as any}
                    progress={uq.progress}
                    status={uq.status as any}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Weekly Quests */}
          {weeklyQuests.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📆</span>
                Weekly Quests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyQuests.map(uq => (
                  <QuestCard
                    key={uq.id}
                    quest={uq.quest as any}
                    progress={uq.progress}
                    status={uq.status as any}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Monthly Quests */}
          {monthlyQuests.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🗓️</span>
                Monthly Quests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthlyQuests.map(uq => (
                  <QuestCard
                    key={uq.id}
                    quest={uq.quest as any}
                    progress={uq.progress}
                    status={uq.status as any}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recently Completed */}
          {completedQuests.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-600" />
                Recently Completed
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedQuests.map(uq => (
                  <QuestCard
                    key={uq.id}
                    quest={uq.quest as any}
                    progress={100}
                    status="completed"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {activeQuests.length === 0 && completedQuests.length === 0 && (
            <div className="rounded-lg border bg-white dark:bg-gray-800 p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-2">No Active Quests</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Quests will appear here automatically. Check back daily for new challenges!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
