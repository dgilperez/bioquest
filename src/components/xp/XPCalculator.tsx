'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { POINTS_CONFIG, RARITY_BONUS_POINTS } from '@/lib/gamification/constants';
import { RarityBadge, RarityTier } from './RarityBadge';
import { XPBreakdown } from './XPBreakdown';

export function XPCalculator() {
  const [isNewSpecies, setIsNewSpecies] = useState(false);
  const [rarity, setRarity] = useState<RarityTier>('common');
  const [isResearchGrade, setIsResearchGrade] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  // Calculate points
  const basePoints = POINTS_CONFIG.BASE_OBSERVATION_POINTS;
  const bonusPoints = {
    newSpecies: isNewSpecies ? POINTS_CONFIG.NEW_SPECIES_BONUS : 0,
    rarity: RARITY_BONUS_POINTS[rarity],
    researchGrade: isResearchGrade ? POINTS_CONFIG.RESEARCH_GRADE_BONUS : 0,
    photos: Math.min(photoCount, POINTS_CONFIG.MAX_PHOTO_BONUS) * POINTS_CONFIG.PHOTO_POINTS,
  };
  const totalPoints = basePoints + Object.values(bonusPoints).reduce((sum, val) => sum + val, 0);

  const calculation = {
    basePoints,
    bonusPoints,
    totalPoints,
  };

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-nature-600" />
        <h3 className="text-lg font-semibold">XP Calculator</h3>
      </div>

      <div className="space-y-4">
        {/* New Species Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">New Species?</label>
          <button
            onClick={() => setIsNewSpecies(!isNewSpecies)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors touch-manipulation ${
              isNewSpecies ? 'bg-nature-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            aria-label="Toggle new species"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                isNewSpecies ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Rarity Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rarity</label>
          <div className="grid grid-cols-2 gap-2">
            {(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'] as RarityTier[]).map((r) => (
              <button
                key={r}
                onClick={() => setRarity(r)}
                className={`p-3 rounded-lg border transition-all min-h-[44px] touch-manipulation ${
                  rarity === r
                    ? 'border-nature-500 bg-nature-50 dark:bg-nature-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-nature-300'
                }`}
                aria-label={`Set rarity to ${r}`}
              >
                <RarityBadge rarity={r} size="sm" showLabel={true} />
              </button>
            ))}
          </div>
        </div>

        {/* Research Grade Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Research Grade?</label>
          <button
            onClick={() => setIsResearchGrade(!isResearchGrade)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors touch-manipulation ${
              isResearchGrade ? 'bg-nature-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            aria-label="Toggle research grade"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                isResearchGrade ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Photo Count Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Photos</label>
            <span className="text-sm text-muted-foreground">{photoCount}</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            value={photoCount}
            onChange={(e) => setPhotoCount(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-nature-600 touch-pan-y"
            style={{
              WebkitAppearance: 'none',
              // Ensure large enough touch target for mobile
              minHeight: '44px',
              padding: '20px 0',
            }}
          />
          <p className="text-xs text-muted-foreground">
            Max 3 photos count for bonus ({Math.min(photoCount, 3)} × 5 XP)
          </p>
        </div>
      </div>

      {/* Result */}
      <motion.div
        key={totalPoints}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4"
      >
        <XPBreakdown calculation={calculation} showAnimation={false} />
      </motion.div>
    </div>
  );
}
