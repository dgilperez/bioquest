'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, Users, ArrowRight, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/types';
import { getXPToNextLevel, getLevelProgress } from '@/lib/gamification/levels';
import { AnimatedBadgeCard } from '@/components/badges/AnimatedBadgeCard';
import { staggerContainer } from '@/lib/animations/variants';
import { motion } from 'framer-motion';

interface UserStats {
  level: number;
  totalPoints: number;
  totalObservations: number;
  totalSpecies: number;
  weeklyPoints: number;
  monthlyPoints: number;
}

interface LeaderboardRank {
  globalRank: number;
  totalUsers: number;
  percentile: number;
}

interface ProfileClientProps {
  userStats: UserStats;
  recentBadges: Badge[];
  totalBadgesUnlocked: number;
  totalBadgesAvailable: number;
  leaderboardRank: LeaderboardRank | null;
}

export function ProfileClient({
  userStats,
  recentBadges,
  totalBadgesUnlocked,
  totalBadgesAvailable,
  leaderboardRank,
}: ProfileClientProps) {
  const router = useRouter();

  // Calculate XP progress to next level using proper level config
  const xpProgress = getLevelProgress(userStats.level, userStats.totalPoints);
  const xpToNextLevel = getXPToNextLevel(userStats.level, userStats.totalPoints);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          Your Profile
        </h1>
        <p className="text-lg text-muted-foreground">
          Track your progress, showcase achievements, and compete with other naturalists
        </p>
      </div>

      {/* Level & XP Section */}
      <section>
        <div className="p-6 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-800/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-display font-bold">Level {userStats.level}</h2>
              <p className="text-sm text-muted-foreground">
                {xpToNextLevel.toLocaleString()} XP to level {userStats.level + 1}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">
                {userStats.totalPoints.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total XP</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${Math.min(Math.max(xpProgress, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level {userStats.level}</span>
              <span>{xpProgress.toFixed(1)}% progress</span>
              <span>Level {userStats.level + 1}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section>
        <h2 className="text-2xl font-display font-bold mb-6">Key Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground mb-1">Observations</div>
            <div className="text-3xl font-bold text-nature-600">
              {userStats.totalObservations.toLocaleString()}
            </div>
          </div>

          <div className="p-5 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground mb-1">Species</div>
            <div className="text-3xl font-bold text-blue-600">
              {userStats.totalSpecies.toLocaleString()}
            </div>
          </div>

          <div className="p-5 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground mb-1">This Week</div>
            <div className="text-3xl font-bold text-green-600">
              {userStats.weeklyPoints.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>

          <div className="p-5 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground mb-1">This Month</div>
            <div className="text-3xl font-bold text-purple-600">
              {userStats.monthlyPoints.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>
        </div>
      </section>

      {/* Leaderboard Rank */}
      {leaderboardRank && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold">Leaderboard Rank</h2>
              <p className="text-sm text-muted-foreground">
                Your global standing among all naturalists
              </p>
            </div>
            <Link href="/leaderboards">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                View Leaderboards
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="p-6 rounded-lg border bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-800/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-4xl font-bold text-yellow-700 dark:text-yellow-300">
                      #{leaderboardRank.globalRank.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      out of {leaderboardRank.totalUsers.toLocaleString()} naturalists
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-600">
                  Top {leaderboardRank.percentile.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Percentile</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Badges */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Recent Achievements</h2>
            <p className="text-sm text-muted-foreground">
              {totalBadgesUnlocked} of {totalBadgesAvailable} badges unlocked
            </p>
          </div>
          <Link href="/profile/badges">
            <Button variant="outline" className="gap-2">
              <Trophy className="h-4 w-4" />
              View All Badges
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentBadges.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {recentBadges.map((badge, index) => (
              <AnimatedBadgeCard
                key={badge.id}
                badge={badge}
                isUnlocked={true}
                index={index}
                compact={true}
                onClick={() => router.push('/profile/badges')}
              />
            ))}
          </motion.div>
        ) : (
          <div className="p-12 rounded-lg border border-dashed text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No badges yet. Start observing to earn achievements!
            </p>
          </div>
        )}

        {/* Badge Progress */}
        {totalBadgesAvailable > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Badge Collection Progress</span>
              <span className="text-sm font-medium">
                {Math.round((totalBadgesUnlocked / totalBadgesAvailable) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all"
                style={{ width: `${(totalBadgesUnlocked / totalBadgesAvailable) * 100}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/profile/badges"
          className="p-6 rounded-lg border bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            All Badges
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            View your complete badge collection and locked achievements
          </p>
          <Button variant="outline" className="w-full">
            View Badges
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>

        <Link
          href="/stats"
          className="p-6 rounded-lg border bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Detailed Statistics
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explore charts, graphs, and analytics of your observations
          </p>
          <Button variant="outline" className="w-full">
            View Stats
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>

        <Link
          href="/leaderboards"
          className="p-6 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            Leaderboards
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Compare your progress and compete with other naturalists
          </p>
          <Button variant="outline" className="w-full">
            View Rankings
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>

        <Link
          href="/profile/how-xp-works"
          className="p-6 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            How XP Works
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Learn how to earn points and level up faster
          </p>
          <Button variant="outline" className="w-full">
            Learn More
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
