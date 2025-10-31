'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CircleIcon,
  DiamondShapeIcon,
  GemIcon,
  StarIcon,
  SparklesIcon,
  DiamondIcon,
} from '@/components/icons/rarity';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface RarityBadgeProps {
  rarity: RarityTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const rarityConfig = {
  common: {
    icon: CircleIcon,
    label: 'Common',
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    glow: '',
    xp: 0,
  },
  uncommon: {
    icon: DiamondShapeIcon,
    label: 'Uncommon',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-600',
    glow: 'shadow-blue-500/20',
    xp: 25,
  },
  rare: {
    icon: GemIcon,
    label: 'Rare',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-300 dark:border-purple-600',
    glow: 'shadow-purple-500/30',
    xp: 100,
  },
  epic: {
    icon: StarIcon,
    label: 'Epic',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-300 dark:border-amber-600',
    glow: 'shadow-amber-500/40',
    xp: 250,
  },
  legendary: {
    icon: SparklesIcon,
    label: 'Legendary',
    color: 'text-yellow-500 dark:text-yellow-300',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-400 dark:border-yellow-600',
    glow: 'shadow-yellow-400/50',
    xp: 500,
  },
  mythic: {
    icon: DiamondIcon,
    label: 'Mythic',
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20',
    border: 'border-pink-400 dark:border-pink-600',
    glow: 'shadow-pink-500/60 shadow-lg',
    xp: 2000,
  },
};

const sizeConfig = {
  sm: { badge: 'px-2 py-0.5 text-xs', icon: 12, label: 'text-xs', xp: 'text-xs' },
  md: { badge: 'px-3 py-1 text-sm', icon: 16, label: 'text-sm', xp: 'text-xs' },
  lg: { badge: 'px-4 py-2 text-base', icon: 20, label: 'text-base', xp: 'text-sm' },
};

export function RarityBadge({
  rarity,
  size = 'md',
  showLabel = true,
  animated = false,
  className,
}: RarityBadgeProps) {
  const config = rarityConfig[rarity];
  const sizes = sizeConfig[size];
  const IconComponent = config.icon;
  const [isHovered, setIsHovered] = React.useState(false);

  const badgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
        config.bg,
        config.border,
        config.color,
        config.glow,
        sizes.badge,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IconComponent size={sizes.icon} animate={animated ? true : isHovered} />
      {showLabel && (
        <>
          <span className={sizes.label}>{config.label}</span>
          {config.xp > 0 && (
            <span className={cn('opacity-70', sizes.xp)}>
              +{config.xp}
            </span>
          )}
        </>
      )}
    </div>
  );

  if (!animated) {
    return badgeContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {badgeContent}
    </motion.div>
  );
}

export function RarityLegend() {
  const rarities: RarityTier[] = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

  return (
    <div className="space-y-2">
      {rarities.map((rarity) => {
        return (
          <div key={rarity} className="flex items-center justify-between">
            <RarityBadge rarity={rarity} size="sm" showLabel={true} />
            <span className="text-xs text-muted-foreground">
              {rarity === 'mythic' && '<10 observations'}
              {rarity === 'legendary' && '10-99 observations'}
              {rarity === 'epic' && '100-499 observations'}
              {rarity === 'rare' && '500-1,999 observations'}
              {rarity === 'uncommon' && '2,000-9,999 observations'}
              {rarity === 'common' && '10,000+ observations'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
