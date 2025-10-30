'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Star,
  Camera,
  Award,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Trophy,
  Flame,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { XPBreakdown } from '@/components/xp/XPBreakdown';
import { RarityLegend } from '@/components/xp/RarityBadge';
import { XPCalculator } from '@/components/xp/XPCalculator';
import { POINTS_CONFIG, FIRST_OBSERVATION_BONUSES } from '@/lib/gamification/constants';

export function HowXPWorksClient() {
  const [showRarityDetails, setShowRarityDetails] = useState(false);
  const [showAdvancedBonuses, setShowAdvancedBonuses] = useState(false);

  // Example calculations for demonstration
  const example1 = {
    basePoints: 10,
    bonusPoints: { newSpecies: 0, rarity: 0, researchGrade: 0, photos: 0 },
    totalPoints: 10,
  };

  const example2 = {
    basePoints: 10,
    bonusPoints: { newSpecies: 50, rarity: 0, researchGrade: 25, photos: 15 },
    totalPoints: 100,
  };

  const example3 = {
    basePoints: 10,
    bonusPoints: { newSpecies: 50, rarity: 100, researchGrade: 25, photos: 10 },
    totalPoints: 195,
  };

  const example4 = {
    basePoints: 10,
    bonusPoints: { newSpecies: 50, rarity: 500, researchGrade: 25, photos: 15 },
    totalPoints: 600,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link href="/profile">
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>
      </Link>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          How XP Works
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Learn how Experience Points (XP) work in BioQuest and master the art of maximizing your point earnings!
        </p>
      </motion.div>

      <div className="space-y-8">
        {/* Section 1: The Basics */}
        <section className="rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-lg">
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-nature-600" />
            The Basics
          </h2>

          <div className="space-y-6">
            <p className="text-muted-foreground">
              Every observation you make earns you Experience Points (XP). The formula is simple:
            </p>

            <div className="rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-6 border-2 border-amber-200 dark:border-amber-800">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold mb-2">Total XP = Base + Bonuses</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">Base XP</h3>
                  </div>
                  <div className="text-3xl font-bold text-nature-600">{POINTS_CONFIG.BASE_OBSERVATION_POINTS}</div>
                  <p className="text-sm text-muted-foreground mt-1">You ALWAYS earn this!</p>
                </div>

                <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold">Bonuses</h3>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                    +0 to +7,000
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">When applicable</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Bonus Types:</h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <Star className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 dark:text-blue-100">New Species</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">+{POINTS_CONFIG.NEW_SPECIES_BONUS} XP</div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">First time you observe this species</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <Award className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-green-900 dark:text-green-100">Research Grade</div>
                    <div className="text-sm text-green-700 dark:text-green-300">+{POINTS_CONFIG.RESEARCH_GRADE_BONUS} XP</div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">Community-verified identification</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <Camera className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-amber-900 dark:text-amber-100">Photos</div>
                    <div className="text-sm text-amber-700 dark:text-amber-300">+{POINTS_CONFIG.PHOTO_POINTS} XP each (max {POINTS_CONFIG.MAX_PHOTO_BONUS})</div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Upload quality photos of your observation</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-purple-900 dark:text-purple-100">Rarity Bonus</div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">+0 to +2,000 XP</div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Based on how rare the species is globally</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Examples */}
        <section className="rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-lg">
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
            <Target className="h-6 w-6 text-nature-600" />
            Examples
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Example 1 */}
            <div className="rounded-lg border p-4 hover:border-nature-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📸</span>
                <div>
                  <h3 className="font-semibold">Simple Observation</h3>
                  <p className="text-xs text-muted-foreground">1 photo, needs ID</p>
                </div>
              </div>
              <XPBreakdown calculation={example1} compact={true} />
            </div>

            {/* Example 2 */}
            <div className="rounded-lg border p-4 hover:border-nature-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🦋</span>
                <div>
                  <h3 className="font-semibold">Quality Find</h3>
                  <p className="text-xs text-muted-foreground">New species, 3 photos, research grade</p>
                </div>
              </div>
              <XPBreakdown calculation={example2} compact={true} />
            </div>

            {/* Example 3 */}
            <div className="rounded-lg border p-4 hover:border-nature-300 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💠</span>
                <div>
                  <h3 className="font-semibold">Rare Discovery</h3>
                  <p className="text-xs text-muted-foreground">New rare species, 2 photos, research grade</p>
                </div>
              </div>
              <XPBreakdown calculation={example3} compact={true} />
            </div>

            {/* Example 4 */}
            <div className="rounded-lg border-2 border-yellow-400 dark:border-yellow-600 p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h3 className="font-semibold">Legendary Find!</h3>
                  <p className="text-xs text-muted-foreground">New legendary species, 3 photos, research grade</p>
                </div>
              </div>
              <XPBreakdown calculation={example4} compact={true} />
            </div>
          </div>
        </section>

        {/* Section 3: Rarity System (Collapsible) */}
        <section className="rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-lg">
          <button
            onClick={() => setShowRarityDetails(!showRarityDetails)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              What Makes a Species Rare?
            </h2>
            {showRarityDetails ? (
              <ChevronUp className="h-6 w-6 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-6 w-6 text-muted-foreground" />
            )}
          </button>

          {showRarityDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              <p className="text-muted-foreground">
                Rarity is based on the <strong>global observation count</strong> on iNaturalist.
                The fewer times a species has been observed worldwide, the rarer it is!
              </p>

              <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6">
                <RarityLegend />
              </div>

              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="flex items-start gap-2">
                  <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Pro Tip</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Rarity is calculated when you sync, based on current iNaturalist data.
                      Explore remote areas or look for uncommon species to find rare observations!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Section 4: Advanced Bonuses (Collapsible) */}
        <section className="rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-lg">
          <button
            onClick={() => setShowAdvancedBonuses(!showAdvancedBonuses)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-green-600" />
              Special & Advanced Bonuses
            </h2>
            {showAdvancedBonuses ? (
              <ChevronUp className="h-6 w-6 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-6 w-6 text-muted-foreground" />
            )}
          </button>

          {showAdvancedBonuses && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="rounded-lg border-2 border-green-300 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Globe className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100 text-lg mb-1">
                      First Regional Observation
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      Be the first to observe a species in your region!
                    </p>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      +{FIRST_OBSERVATION_BONUSES.FIRST_REGIONAL.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border-2 border-yellow-400 dark:border-yellow-600 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 text-lg mb-1">
                      First Global Observation EVER
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                      Discover a species that has NEVER been observed on iNaturalist before!
                    </p>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      +{FIRST_OBSERVATION_BONUSES.FIRST_GLOBAL.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
                <div className="flex items-start gap-2">
                  <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Streak Bonuses</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Observe daily to maintain your streak and earn milestone bonuses:
                    </p>
                    <ul className="text-sm text-amber-600 dark:text-amber-400 mt-2 space-y-1">
                      <li>• 7 days: +100 XP</li>
                      <li>• 30 days: +500 XP</li>
                      <li>• 365 days: +10,000 XP</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Section 5: Optimization Tips */}
        <section className="rounded-2xl border bg-gradient-to-br from-nature-50 to-green-50 dark:from-nature-900/20 dark:to-green-900/20 p-8 shadow-lg border-nature-200 dark:border-nature-800">
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
            <Target className="h-6 w-6 text-nature-600" />
            Pro Strategies to Maximize XP
          </h2>

          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <strong>Get IDs confirmed</strong> → Research grade = +25 XP every time
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <strong>Upload 3 photos</strong> → Max photo bonus (+15 XP)
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <strong>Explore new areas</strong> → Higher chance of regional firsts
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <strong>Seek variety</strong> → New species = +50 XP each
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <strong>Observe daily</strong> → Maintain streaks for bonus XP
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <strong>Hunt for rarities</strong> → Look for uncommon species in your area
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Interactive Calculator */}
        <section>
          <XPCalculator />
        </section>

        {/* Back to Profile CTA */}
        <div className="text-center">
          <Link href="/profile">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
