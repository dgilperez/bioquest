'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { TaxonIcon, hasTaxonIcon } from '@/lib/icons/taxon-icon-mapper';

interface TaxonCardProps {
  id: number;
  name: string;
  commonName?: string;
  rank: string;
  globalObsCount: number;
  userObsCount?: number;
  userSpeciesCount?: number;
  completionPercent?: number;
  onClick: () => void;
  index: number;
}

export function TaxonCard({
  name,
  commonName,
  rank,
  globalObsCount,
  userObsCount = 0,
  userSpeciesCount = 0,
  completionPercent = 0,
  onClick,
  index,
}: TaxonCardProps) {
  // Calculate completion color
  const getCompletionColor = (percent: number) => {
    if (percent === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (percent < 25) return 'bg-red-500';
    if (percent < 50) return 'bg-orange-500';
    if (percent < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const completionColor = getCompletionColor(completionPercent);

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02, x: 4 }}
      onClick={onClick}
      className="w-full text-left p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-nature-500 dark:hover:border-nature-600 transition-colors shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-6">
        {/* Animated Icon */}
        {hasTaxonIcon(name) && (
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: index * 0.05 + 0.1,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
          >
            <TaxonIcon name={name} size={56} animate={true} />
          </motion.div>
        )}

        {/* Left side: Taxon info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-lg truncate">
              {commonName || name}
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0">
              {rank}
            </span>
          </div>

          {commonName && (
            <p className="text-sm text-muted-foreground font-body italic truncate">
              {name}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2 text-sm">
            {userObsCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-nature-600 dark:text-nature-400 font-semibold">
                  {userObsCount}
                </span>
                <span className="text-muted-foreground">obs</span>
              </div>
            )}

            {userSpeciesCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-nature-600 dark:text-nature-400 font-semibold">
                  {userSpeciesCount}
                </span>
                <span className="text-muted-foreground">species</span>
              </div>
            )}

            {globalObsCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <span>{formatNumber(globalObsCount)}</span>
                <span className="text-xs">globally</span>
              </div>
            )}
          </div>

          {/* Completion bar */}
          {completionPercent > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Completeness</span>
                <span className="text-xs font-semibold text-nature-600 dark:text-nature-400">
                  {completionPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.6, ease: 'easeOut' }}
                  className={`h-full ${completionColor}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right side: Arrow */}
        <ChevronRight className="w-6 h-6 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      </div>
    </motion.button>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
