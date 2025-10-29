import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getUserBadges } from '@/lib/gamification/badges/unlock';
import { ProfileClient } from './page.client';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Your achievements, stats, and rankings',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      stats: true,
    },
  });

  if (!user || !user.stats) {
    redirect('/signin');
  }

  // Get user's badges
  const { unlocked, locked } = await getUserBadges(user.id);

  // Get recent badges (last 6 unlocked)
  const recentBadges = unlocked.slice(0, 6);

  // Calculate leaderboard rank
  const usersWithHigherPoints = await prisma.userStats.count({
    where: {
      totalPoints: {
        gt: user.stats.totalPoints,
      },
    },
  });

  const totalUsers = await prisma.userStats.count();
  const globalRank = usersWithHigherPoints + 1;
  const percentile = totalUsers > 0 ? ((totalUsers - globalRank + 1) / totalUsers) * 100 : 0;

  const leaderboardRank = {
    globalRank,
    totalUsers,
    percentile,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileClient
        userStats={{
          level: user.stats.level,
          totalPoints: user.stats.totalPoints,
          totalObservations: user.stats.totalObservations,
          totalSpecies: user.stats.totalSpecies,
          weeklyPoints: user.stats.weeklyPoints,
          monthlyPoints: user.stats.monthlyPoints,
        }}
        recentBadges={recentBadges}
        totalBadgesUnlocked={unlocked.length}
        totalBadgesAvailable={unlocked.length + locked.length}
        leaderboardRank={leaderboardRank}
      />
    </div>
  );
}
