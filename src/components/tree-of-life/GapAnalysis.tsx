'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GapAnalysisProps {
  taxonId: number;
  taxonName: string;
  regionId?: number;
}

interface UnobservedTaxon {
  id: number;
  name: string;
  commonName?: string;
  rank: string;
  obsCount: number;
  difficulty?: string;
  reason?: string;
}

export function GapAnalysis({ taxonId, taxonName, regionId }: GapAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [data, setData] = useState<{
    unobserved: UnobservedTaxon[];
    recommended: UnobservedTaxon[];
    unobservedCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGaps = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        difficulty,
      });

      if (regionId) {
        params.append('regionId', regionId.toString());
      }

      const response = await fetch(`/api/tree-of-life/gaps/${taxonId}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load gap analysis');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error('Error loading gaps:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGaps();
    }
  }, [isOpen, difficulty, taxonId, regionId]);

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    hard: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    expert: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={isOpen ? 'default' : 'outline'}
        className="w-full"
      >
        <Target className="w-4 h-4 mr-2" />
        {isOpen ? 'Hide' : 'Show'} Gap Analysis
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Difficulty Filter */}
            <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Difficulty Level
              </h3>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      difficulty === level
                        ? 'bg-nature-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-nature-600" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Results */}
            {!isLoading && !error && data && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 rounded-xl border-2 border-nature-500 dark:border-nature-600 bg-nature-50 dark:bg-nature-950/20">
                  <p className="text-sm text-muted-foreground">
                    You haven't observed{' '}
                    <span className="font-bold text-nature-700 dark:text-nature-300">
                      {data.unobservedCount}
                    </span>{' '}
                    taxa under <span className="font-semibold">{taxonName}</span>
                  </p>
                </div>

                {/* Recommended Taxa */}
                {data.recommended.length > 0 && (
                  <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h3 className="font-display font-semibold mb-3">
                      Recommended Targets ({difficulty})
                    </h3>
                    <div className="space-y-2">
                      {data.recommended.map((taxon, index) => (
                        <motion.div
                          key={taxon.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-nature-500 dark:hover:border-nature-600 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {taxon.commonName || taxon.name}
                              </h4>
                              {taxon.commonName && (
                                <p className="text-sm text-muted-foreground italic">
                                  {taxon.name}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {taxon.reason}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                  difficultyColors[
                                    taxon.difficulty as keyof typeof difficultyColors
                                  ] || difficultyColors.medium
                                }`}
                              >
                                {taxon.difficulty}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatNumber(taxon.obsCount)} obs
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Unobserved (Top 10) */}
                {data.unobserved.length > 0 && (
                  <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Most Common Unobserved
                    </h3>
                    <div className="space-y-2">
                      {data.unobserved.map((taxon, index) => (
                        <motion.div
                          key={taxon.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {taxon.commonName || taxon.name}
                              </h4>
                              {taxon.commonName && (
                                <p className="text-sm text-muted-foreground italic">
                                  {taxon.name}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatNumber(taxon.obsCount)} obs globally
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {data.recommended.length === 0 && data.unobserved.length === 0 && (
                  <div className="p-6 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-950/20 text-center">
                    <p className="text-green-700 dark:text-green-300 font-semibold">
                      Amazing! You've observed all available taxa at this level!
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
