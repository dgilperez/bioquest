'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, Users, ArrowRight, Star, Sparkles, Eye, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/types';
import { getXPToNextLevel, getLevelProgress } from '@/lib/gamification/levels';
import { AnimatedBadgeCard } from '@/components/badges/AnimatedBadgeCard';
import { staggerContainer } from '@/lib/animations/variants';
import { CountUp } from '@/components/animations/CountUp';
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

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    }),
  };

  const iconFloat = {
    idle: {
      y: [0, -4, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center max-w-2xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          Your Profile
        </h1>
        <p className="text-lg text-muted-foreground">
          Track your progress, showcase achievements, and compete with other naturalists
        </p>
      </motion.div>

      {/* Level & XP Section */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="relative p-6 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-800/20 overflow-hidden">
          {/* Animated background decoration */}
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 opacity-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-full h-full text-purple-600" />
          </motion.div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-display font-bold"
              >
                Level {userStats.level}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-muted-foreground"
              >
                <CountUp
                  value={xpToNextLevel}
                  duration={1200}
                  suffix=" XP"
                />{' '}
                to level {userStats.level + 1}
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="text-right"
            >
              <div className="text-3xl font-bold text-purple-600">
                <CountUp value={userStats.totalPoints} duration={1500} />
              </div>
              <p className="text-sm text-muted-foreground">Total XP</p>
            </motion.div>
          </div>

          {/* XP Progress Bar with shimmer */}
          <div className="space-y-2 relative z-10">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 relative"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.max(xpProgress, 0), 100)}%` }}
                transition={{ delay: 0.6, duration: 1.5, ease: 'easeOut' }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                    repeatDelay: 1,
                  }}
                  style={{ width: '50%' }}
                />
              </motion.div>
              {/* Glow effect when near level up */}
              {xpProgress > 90 && (
                <motion.div
                  className="absolute inset-0 bg-purple-400/30"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-between text-xs text-muted-foreground"
            >
              <span>Level {userStats.level}</span>
              <span>{xpProgress.toFixed(1)}% progress</span>
              <span>Level {userStats.level + 1}</span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <section>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-display font-bold mb-6"
        >
          Key Statistics
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Observations Stat */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -4 }}
            className="p-5 rounded-lg border bg-card hover:shadow-lg transition-shadow relative overflow-hidden group"
          >
            {/* Background icon */}
            <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <Eye className="w-16 h-16 text-nature-600" />
            </div>
            <motion.div
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
              className="inline-block mb-2"
            >
              <Eye className="w-6 h-6 text-nature-600" />
            </motion.div>
            <div className="text-sm text-muted-foreground mb-1">Observations</div>
            <div className="text-3xl font-bold text-nature-600">
              <CountUp value={userStats.totalObservations} duration={1200} />
            </div>
          </motion.div>

          {/* Species Stat */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -4 }}
            className="p-5 rounded-lg border bg-card hover:shadow-lg transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <Leaf className="w-16 h-16 text-blue-600" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.6,
              }}
              className="inline-block mb-2"
            >
              <Leaf className="w-6 h-6 text-blue-600" />
            </motion.div>
            <div className="text-sm text-muted-foreground mb-1">Species</div>
            <div className="text-3xl font-bold text-blue-600">
              <CountUp value={userStats.totalSpecies} duration={1200} />
            </div>
          </motion.div>

          {/* Weekly Points Stat */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -4 }}
            className="p-5 rounded-lg border bg-card hover:shadow-lg transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-16 h-16 text-green-600" />
            </div>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.7,
              }}
              className="inline-block mb-2"
            >
              <TrendingUp className="w-6 h-6 text-green-600" />
            </motion.div>
            <div className="text-sm text-muted-foreground mb-1">This Week</div>
            <div className="text-3xl font-bold text-green-600">
              <CountUp value={userStats.weeklyPoints} duration={1200} />
            </div>
            <div className="text-xs text-muted-foreground">XP</div>
          </motion.div>

          {/* Monthly Points Stat */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            whileHover={{ scale: 1.05, y: -4 }}
            className="p-5 rounded-lg border bg-card hover:shadow-lg transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-10 transition-opacity">
              <Star className="w-16 h-16 text-purple-600" />
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.8,
              }}
              className="inline-block mb-2"
            >
              <Star className="w-6 h-6 text-purple-600" />
            </motion.div>
            <div className="text-sm text-muted-foreground mb-1">This Month</div>
            <div className="text-3xl font-bold text-purple-600">
              <CountUp value={userStats.monthlyPoints} duration={1200} />
            </div>
            <div className="text-xs text-muted-foreground">XP</div>
          </motion.div>
        </div>
      </section>

      {/* Leaderboard Rank */}
      {leaderboardRank && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
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

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-lg border bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-800/20 relative overflow-hidden"
          >
            {/* Animated trophy background */}
            <motion.div
              className="absolute -right-8 -top-8 opacity-5"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              <Trophy className="w-48 h-48 text-yellow-600" />
            </motion.div>

            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{
                      y: [0, -8, 0],
                      rotate: [0, -5, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Trophy className="h-8 w-8 text-yellow-600" />
                  </motion.div>
                  <div>
                    <div className="text-4xl font-bold text-yellow-700 dark:text-yellow-300">
                      #<CountUp value={leaderboardRank.globalRank} duration={1500} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      out of{' '}
                      <CountUp
                        value={leaderboardRank.totalUsers}
                        duration={1500}
                        suffix=" naturalists"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="text-right"
              >
                <div className="text-2xl font-bold text-amber-600">
                  Top{' '}
                  <CountUp
                    value={leaderboardRank.percentile}
                    duration={1500}
                    decimals={1}
                    suffix="%"
                  />
                </div>
                <div className="text-sm text-muted-foreground">Percentile</div>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>
      )}

      {/* Recent Badges */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Recent Achievements</h2>
            <p className="text-sm text-muted-foreground">
              <CountUp value={totalBadgesUnlocked} duration={1000} /> of{' '}
              <CountUp value={totalBadgesAvailable} duration={1000} /> badges unlocked
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-12 rounded-lg border border-dashed text-center"
          >
            <motion.div animate={iconFloat} variants={iconFloat}>
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            </motion.div>
            <p className="text-muted-foreground mb-4">
              No badges yet. Start observing to earn achievements!
            </p>
          </motion.div>
        )}

        {/* Badge Progress with animated fill */}
        {totalBadgesAvailable > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Badge Collection Progress</span>
              <span className="text-sm font-medium">
                <CountUp
                  value={Math.round((totalBadgesUnlocked / totalBadgesAvailable) * 100)}
                  duration={1200}
                  suffix="%"
                />
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                initial={{ width: 0 }}
                animate={{ width: `${(totalBadgesUnlocked / totalBadgesAvailable) * 100}%` }}
                transition={{ delay: 0.9, duration: 1.5, ease: 'easeOut' }}
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                    repeatDelay: 1,
                  }}
                  style={{ width: '50%' }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            href: '/profile/badges',
            icon: Trophy,
            iconColor: 'text-amber-600',
            gradient: 'from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20',
            title: 'All Badges',
            description: 'View your complete badge collection and locked achievements',
            delay: 0,
          },
          {
            href: '/stats',
            icon: TrendingUp,
            iconColor: 'text-blue-600',
            gradient: 'from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20',
            title: 'Detailed Statistics',
            description: 'Explore charts, graphs, and analytics of your observations',
            delay: 0.1,
          },
          {
            href: '/leaderboards',
            icon: Users,
            iconColor: 'text-purple-600',
            gradient: 'from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20',
            title: 'Leaderboards',
            description: 'Compare your progress and compete with other naturalists',
            delay: 0.2,
          },
          {
            href: '/profile/how-xp-works',
            icon: Sparkles,
            iconColor: 'text-green-600',
            gradient: 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20',
            title: 'How XP Works',
            description: 'Learn how to earn points and level up faster',
            delay: 0.3,
          },
        ].map((link) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + link.delay }}
            whileHover={{ scale: 1.05, y: -4 }}
          >
            <Link
              href={link.href}
              className={`block p-6 rounded-lg border bg-gradient-to-br ${link.gradient} hover:shadow-lg transition-all group relative overflow-hidden`}
            >
              {/* Background decoration */}
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <link.icon className="w-24 h-24" />
              </div>

              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2 relative z-10">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <link.icon className={`h-5 w-5 ${link.iconColor}`} />
                </motion.div>
                {link.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 relative z-10">
                {link.description}
              </p>
              <Button variant="outline" className="w-full group-hover:bg-white/50 transition-colors">
                <span className="flex items-center justify-center gap-2">
                  View
                  <motion.div
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </span>
              </Button>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
