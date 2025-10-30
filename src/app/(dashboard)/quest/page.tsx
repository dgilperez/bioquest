import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateAllQuests, assignAvailableQuestsToUser } from '@/lib/gamification/quests/generation';
import { AutoSync } from '@/components/sync/AutoSync';
import { QuestLandingClient } from './page.client';

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

  // Ensure quests are generated and assigned
  await generateAllQuests();
  await assignAvailableQuestsToUser(user.id);

  // Get user's active quests with optimized batch progress calculation
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

  // Calculate progress for all quests in a single batch (optimized!)
  const { calculateMultipleQuestProgress } = await import('@/lib/gamification/quests/progress');
  const quests = activeQuests.map(uq => uq.quest);
  const progressMap = await calculateMultipleQuestProgress(user.id, quests as any);

  // Map results
  const questsWithProgress = activeQuests.map((userQuest) => ({
    quest: userQuest.quest,
    progress: progressMap.get(userQuest.quest.id) || userQuest.progress,
    status: userQuest.status as 'active' | 'completed' | 'expired',
  }));

  // Get top 3 quests: 1 daily, 1 weekly, 1 monthly
  const dailyQuest = questsWithProgress.find(q => q.quest.type === 'daily');
  const weeklyQuest = questsWithProgress.find(q => q.quest.type === 'weekly');
  const monthlyQuest = questsWithProgress.find(q => q.quest.type === 'monthly');

  const topQuests = [dailyQuest, weeklyQuest, monthlyQuest].filter(Boolean) as typeof questsWithProgress;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Auto-sync component */}
      <AutoSync
        userId={user.id}
        inatUsername={(session.user as any).inatUsername}
        accessToken={(session as any).accessToken}
        lastSyncedAt={user.stats?.lastSyncedAt || null}
      />

      <QuestLandingClient
        topQuests={topQuests}
        totalActiveQuests={activeQuests.length}
      />
    </div>
  );
}
