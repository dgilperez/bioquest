'use client';

import { motion } from 'framer-motion';
import { Sparkles, Star, Camera, Award, TrendingUp } from 'lucide-react';
import { PointsCalculation } from '@/types';

interface XPBreakdownProps {
  calculation: PointsCalculation;
  showAnimation?: boolean;
  compact?: boolean;
}

const bonusIcons = {
  newSpecies: Star,
  rarity: Sparkles,
  researchGrade: Award,
  photos: Camera,
};

const bonusColors = {
  newSpecies: 'text-blue-600 dark:text-blue-400',
  rarity: 'text-purple-600 dark:text-purple-400',
  researchGrade: 'text-green-600 dark:text-green-400',
  photos: 'text-amber-600 dark:text-amber-400',
};

const bonusLabels = {
  newSpecies: 'New Species',
  rarity: 'Rarity Bonus',
  researchGrade: 'Research Grade',
  photos: 'Photos',
};

export function XPBreakdown({ calculation, showAnimation = false, compact = false }: XPBreakdownProps) {
  const hasAnyBonus = Object.values(calculation.bonusPoints).some(v => v > 0);

  return (
    <motion.div
      initial={showAnimation ? { opacity: 0, y: 10 } : false}
      animate={showAnimation ? { opacity: 1, y: 0 } : {}}
      className={compact ? 'space-y-1' : 'space-y-2'}
    >
      {/* Base Points */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Base XP</span>
        </div>
        <span className="font-medium">{calculation.basePoints}</span>
      </div>

      {/* Bonuses */}
      {hasAnyBonus && (
        <>
          {(Object.keys(calculation.bonusPoints) as Array<keyof typeof calculation.bonusPoints>).map((key) => {
            const points = calculation.bonusPoints[key];
            if (points === 0) return null;

            const Icon = bonusIcons[key];
            const colorClass = bonusColors[key];
            const label = bonusLabels[key];

            return (
              <motion.div
                key={key}
                initial={showAnimation ? { opacity: 0, x: -10 } : false}
                animate={showAnimation ? { opacity: 1, x: 0 } : {}}
                transition={showAnimation ? { delay: 0.1 } : {}}
                className="flex items-center justify-between text-sm"
              >
                <div className={`flex items-center gap-2 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </div>
                <span className={`font-medium ${colorClass}`}>+{points}</span>
              </motion.div>
            );
          })}
        </>
      )}

      {/* Total */}
      <motion.div
        initial={showAnimation ? { opacity: 0, scale: 0.95 } : false}
        animate={showAnimation ? { opacity: 1, scale: 1 } : {}}
        transition={showAnimation ? { delay: 0.2 } : {}}
        className={`flex items-center justify-between pt-2 border-t ${
          compact ? 'text-base' : 'text-lg'
        } font-bold`}
      >
        <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          Total XP
        </span>
        <motion.span
          initial={showAnimation ? { scale: 1 } : false}
          animate={showAnimation ? { scale: [1, 1.2, 1] } : {}}
          transition={showAnimation ? { delay: 0.3, duration: 0.4 } : {}}
          className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent"
        >
          {calculation.totalPoints}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
