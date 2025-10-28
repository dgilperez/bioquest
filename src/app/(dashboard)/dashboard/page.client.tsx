'use client';

import { motion } from 'framer-motion';
import { AnimatedStatsCard } from '@/components/stats/AnimatedStatsCard';
import { EpicLevelCard } from '@/components/stats/EpicLevelCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { staggerContainer } from '@/lib/animations/variants';

interface DashboardClientProps {
  userName: string;
  level: number;
  levelTitle: string;
  totalPoints: number;
  pointsToNextLevel: number;
  totalObservations: number;
  totalSpecies: number;
  rareObservations: number;
  legendaryObservations: number;
}

export function DashboardClient({
  userName,
  level,
  levelTitle,
  totalPoints,
  pointsToNextLevel,
  totalObservations,
  totalSpecies,
  rareObservations,
  legendaryObservations,
}: DashboardClientProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-4xl font-display font-bold mb-2 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          Welcome back, {userName}!
        </h2>
        <p className="text-muted-foreground font-body text-lg">
          Here's your progress as a naturalist 🌿
        </p>
      </motion.div>

      {/* Epic Level Card */}
      <EpicLevelCard
        level={level}
        levelTitle={levelTitle}
        totalPoints={totalPoints}
        pointsToNextLevel={pointsToNextLevel}
      />

      {/* Stats Grid with Stagger Animation */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <AnimatedStatsCard
          title="Observations"
          value={totalObservations}
          icon="📸"
          color="blue"
          index={0}
        />
        <AnimatedStatsCard
          title="Species"
          value={totalSpecies}
          icon="🌿"
          color="green"
          index={1}
        />
        <AnimatedStatsCard
          title="Rare Finds"
          value={rareObservations}
          icon="💎"
          color="purple"
          index={2}
        />
        <AnimatedStatsCard
          title="Legendary"
          value={legendaryObservations}
          icon="✨"
          color="yellow"
          index={3}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-lg"
      >
        <h3 className="text-2xl font-display font-semibold mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            href="/badges"
            icon="🏆"
            title="View Badges"
            description="Check your achievements"
            index={0}
          />
          <QuickActionCard
            href="/observations"
            icon="👁️"
            title="Observations"
            description="View your finds"
            index={1}
          />
          <QuickActionCard
            href="/quests"
            icon="🎯"
            title="Active Quests"
            description="See your challenges"
            index={2}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
