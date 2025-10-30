'use client';

import { motion } from 'framer-motion';
import { Badge, BadgeDefinition } from '@/types';
import { AnimatedBadgeCard } from '@/components/badges/AnimatedBadgeCard';
import { staggerContainer } from '@/lib/animations/variants';
import { useState } from 'react';
import { BadgeUnlockCeremony } from '@/components/celebrations/BadgeUnlockCeremony';

interface BadgesClientProps {
  unlocked: Badge[];
  locked: BadgeDefinition[];
}

export function BadgesClient({ unlocked, locked }: BadgesClientProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const handleBadgeClick = (badge: Badge | BadgeDefinition, isUnlocked: boolean) => {
    if (isUnlocked && 'id' in badge) {
      // Show celebration ceremony for unlocked badges (Badge type has id)
      const celebrationBadge: any = {
        ...badge,
        icon: '🏆',
        title: badge.name,
      };
      setSelectedBadge(celebrationBadge);
    }
  };

  if (unlocked.length === 0 && locked.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 text-muted-foreground"
      >
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-lg">No badges yet! Start observing to unlock achievements.</p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Unlocked Badges */}
        {unlocked.length > 0 && (
          <section>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-display font-bold mb-4 flex items-center gap-2"
            >
              <span className="text-3xl">🏆</span>
              Unlocked Badges
            </motion.h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {unlocked.map((badge, index) => (
                <AnimatedBadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={true}
                  index={index}
                  onClick={() => handleBadgeClick(badge, true)}
                />
              ))}
            </motion.div>
          </section>
        )}

        {/* Locked Badges */}
        {locked.length > 0 && (
          <section>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-display font-bold mb-4 text-muted-foreground flex items-center gap-2"
            >
              <span className="text-3xl">🔒</span>
              Locked Badges
            </motion.h2>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {locked.map((badge, index) => (
                <AnimatedBadgeCard
                  key={badge.code}
                  badge={badge}
                  isUnlocked={false}
                  index={index + unlocked.length}
                  onClick={() => handleBadgeClick(badge, false)}
                />
              ))}
            </motion.div>
          </section>
        )}
      </div>

      {/* Badge Unlock Ceremony */}
      <BadgeUnlockCeremony badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </>
  );
}
