'use client';

import { motion } from 'framer-motion';
import { UserQuest, Quest } from '@/types';
import { AnimatedQuestCard } from '@/components/quests/AnimatedQuestCard';
import { staggerContainer } from '@/lib/animations/variants';
import { Trophy } from 'lucide-react';

interface QuestsClientProps {
  dailyQuests: (UserQuest & { quest: Quest })[];
  weeklyQuests: (UserQuest & { quest: Quest })[];
  monthlyQuests: (UserQuest & { quest: Quest })[];
  completedQuests: (UserQuest & { quest: Quest })[];
}

export function QuestsClient({
  dailyQuests,
  weeklyQuests,
  monthlyQuests,
  completedQuests,
}: QuestsClientProps) {
  const hasNoQuests =
    dailyQuests.length === 0 &&
    weeklyQuests.length === 0 &&
    monthlyQuests.length === 0 &&
    completedQuests.length === 0;

  if (hasNoQuests) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="rounded-lg border bg-white dark:bg-gray-800 p-12 text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-6xl mb-4"
        >
          🎯
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-display font-bold mb-2"
        >
          No Active Quests
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground font-body max-w-md mx-auto"
        >
          Quests will appear here automatically. Check back daily for new challenges!
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Daily Quests */}
      {dailyQuests.length > 0 && (
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-display font-bold mb-4 flex items-center gap-2"
          >
            <span className="text-3xl">📅</span>
            Daily Quests
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {dailyQuests.map((uq, index) => (
              <AnimatedQuestCard
                key={uq.id}
                quest={uq.quest}
                progress={uq.progress}
                status={uq.status as any}
                index={index}
              />
            ))}
          </motion.div>
        </section>
      )}

      {/* Weekly Quests */}
      {weeklyQuests.length > 0 && (
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-display font-bold mb-4 flex items-center gap-2"
          >
            <span className="text-3xl">📆</span>
            Weekly Quests
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {weeklyQuests.map((uq, index) => (
              <AnimatedQuestCard
                key={uq.id}
                quest={uq.quest}
                progress={uq.progress}
                status={uq.status as any}
                index={index}
              />
            ))}
          </motion.div>
        </section>
      )}

      {/* Monthly Quests */}
      {monthlyQuests.length > 0 && (
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-display font-bold mb-4 flex items-center gap-2"
          >
            <span className="text-3xl">🗓️</span>
            Monthly Quests
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {monthlyQuests.map((uq, index) => (
              <AnimatedQuestCard
                key={uq.id}
                quest={uq.quest}
                progress={uq.progress}
                status={uq.status as any}
                index={index}
              />
            ))}
          </motion.div>
        </section>
      )}

      {/* Recently Completed */}
      {completedQuests.length > 0 && (
        <section>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-display font-bold mb-4 flex items-center gap-2"
          >
            <Trophy className="h-6 w-6 text-green-600" />
            Recently Completed
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {completedQuests.map((uq, index) => (
              <AnimatedQuestCard
                key={uq.id}
                quest={uq.quest}
                progress={100}
                status="completed"
                index={index}
              />
            ))}
          </motion.div>
        </section>
      )}
    </div>
  );
}
