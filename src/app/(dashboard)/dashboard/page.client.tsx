'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AnimatedStatsCard } from '@/components/stats/AnimatedStatsCard';
import { EpicLevelCard } from '@/components/stats/EpicLevelCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { StreakDisplay } from '@/components/dashboard/StreakDisplay';
import { LevelUpCelebration } from '@/components/celebrations/LevelUpCelebration';
import { BadgeUnlockCeremony } from '@/components/celebrations/BadgeUnlockCeremony';
import { StreakMilestone } from '@/components/celebrations/StreakMilestone';
import { staggerContainer } from '@/lib/animations/variants';
import { Badge } from '@/types';
import { toast } from 'sonner';

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
  currentStreak: number;
  longestStreak: number;
  lastObservationDate: Date | null;
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
  currentStreak,
  longestStreak,
  lastObservationDate,
}: DashboardClientProps) {
  // Celebration states
  const [levelUpData, setLevelUpData] = useState<{ show: boolean; newLevel: number; levelTitle: string } | null>(null);
  const [badgeData, setBadgeData] = useState<Badge | null>(null);
  const [streakMilestoneData, setStreakMilestoneData] = useState<{ show: boolean; days: number; title: string; bonusPoints: number } | null>(null);

  // Check for celebrations from URL params (set by sync redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Check for level up
    if (params.get('levelUp') === 'true') {
      const newLevel = parseInt(params.get('newLevel') || '0');
      const newTitle = params.get('levelTitle') || '';
      if (newLevel > 0) {
        setLevelUpData({ show: true, newLevel, levelTitle: newTitle });
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    // Check for streak milestone
    if (params.get('streakMilestone') === 'true') {
      const days = parseInt(params.get('streakDays') || '0');
      const title = params.get('streakTitle') || '';
      const bonusPoints = parseInt(params.get('streakBonus') || '0');
      if (days > 0) {
        setTimeout(() => {
          setStreakMilestoneData({ show: true, days, title, bonusPoints });
        }, levelUpData ? 1000 : 0); // Delay if level up is showing
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    // Check for rare finds (show toast)
    const rareFinds = params.get('rareFinds');
    if (rareFinds) {
      try {
        const finds = JSON.parse(decodeURIComponent(rareFinds));
        finds.forEach((find: any, index: number) => {
          setTimeout(() => {
            const rarityEmojis: Record<string, string> = {
              mythic: '💎',
              legendary: '✨',
              epic: '🌟',
              rare: '💠',
              uncommon: '🔷',
            };
            const emoji = rarityEmojis[find.rarity] || '🌿';
            toast.success(`${emoji} ${find.rarity.toUpperCase()} Find!`, {
              description: `${find.commonName || find.taxonName} (+${find.bonusPoints} points)`,
              duration: 5000,
            });
          }, index * 1000);
        });
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('Error parsing rare finds:', e);
      }
    }
  }, [levelUpData]);

  // Calculate streak at risk
  const now = new Date();
  const lastObs = lastObservationDate ? new Date(lastObservationDate) : null;
  const streakAtRisk = lastObs ? (now.getTime() - lastObs.getTime()) > (24 * 60 * 60 * 1000) : false;
  const hoursUntilBreak = lastObs
    ? Math.max(0, 24 - ((now.getTime() - lastObs.getTime()) / (1000 * 60 * 60)))
    : 0;

  return (
    <>
      {/* Celebrations */}
      {levelUpData && (
        <LevelUpCelebration
          show={levelUpData.show}
          newLevel={levelUpData.newLevel}
          levelTitle={levelUpData.levelTitle}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {badgeData && (
        <BadgeUnlockCeremony
          badge={badgeData}
          onClose={() => setBadgeData(null)}
        />
      )}

      {streakMilestoneData && (
        <StreakMilestone
          show={streakMilestoneData.show}
          days={streakMilestoneData.days}
          title={streakMilestoneData.title}
          bonusPoints={streakMilestoneData.bonusPoints}
          onClose={() => setStreakMilestoneData(null)}
        />
      )}

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

        {/* Two-column layout: Level + Streak */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Epic Level Card - Takes 2 columns */}
          <div className="lg:col-span-2">
            <EpicLevelCard
              level={level}
              levelTitle={levelTitle}
              totalPoints={totalPoints}
              pointsToNextLevel={pointsToNextLevel}
            />
          </div>

          {/* Streak Display - Takes 1 column */}
          <div>
            <StreakDisplay
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              lastObservationDate={lastObservationDate}
              streakAtRisk={streakAtRisk}
              hoursUntilBreak={hoursUntilBreak}
            />
          </div>
        </div>

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
        </div>
      </motion.div>
    </>
  );
}
