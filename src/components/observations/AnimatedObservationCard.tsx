'use client';

import { motion, useAnimation } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Observation } from '@prisma/client';
import { Rarity } from '@/types';
import { RarityShimmer } from '@/components/animations/RarityShimmer';
import { ParticleBurst } from '@/components/animations/ParticleBurst';
import { SpeciesInfoModal } from '@/components/species/SpeciesInfoModal';
import { getRarityConfig } from '@/styles/design-tokens';
import { Info } from 'lucide-react';

interface AnimatedObservationCardProps {
  observation: Observation;
  index: number;
  isNew?: boolean;
}

export function AnimatedObservationCard({
  observation,
  index,
  isNew = false,
}: AnimatedObservationCardProps) {
  const [revealed, setRevealed] = useState(!isNew);
  const [showShimmer, setShowShimmer] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showSpeciesInfo, setShowSpeciesInfo] = useState(false);
  const controls = useAnimation();

  const rarity = (observation.rarity || 'common') as Rarity;
  const config = rarity !== 'common' ? getRarityConfig(rarity) : null;

  useEffect(() => {
    if (isNew) {
      const sequence = async () => {
        // Card flip
        await controls.start({
          rotateY: 0,
          scale: 1,
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: index * 0.1,
          },
        });

        setRevealed(true);

        // Shimmer and particles for uncommon+ items
        if (rarity !== 'common') {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setShowShimmer(true);

          await new Promise((resolve) => setTimeout(resolve, 800));
          setShowParticles(true);
        }
      };

      sequence();
    }
  }, [isNew, index, controls, rarity]);

  const rarityColors: Record<string, string> = {
    common: 'border-gray-200 dark:border-gray-700',
    uncommon: 'border-green-300 dark:border-green-700',
    rare: 'border-indigo-300 dark:border-indigo-700',
    epic: 'border-cyan-400 dark:border-cyan-600',
    legendary: 'border-yellow-400 dark:border-yellow-600',
    mythic: 'border-purple-400 dark:border-purple-600',
  };

  const rarityBadgeColors: Record<string, string> = {
    common: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    uncommon: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rare: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    epic: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
    legendary: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    mythic: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  };

  return (
    <>
      <motion.div
        initial={isNew ? { rotateY: 180, scale: 0.8, opacity: 0 } : false}
        animate={controls}
        whileHover={{
          scale: 1.03,
          y: -4,
          transition: { duration: 0.2 },
        }}
        className={`relative rounded-xl border-2 ${rarityColors[rarity]} bg-white dark:bg-gray-800 overflow-hidden shadow-lg`}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: config ? config.shadow : undefined,
        }}
      >
      {/* Card Back (before reveal) */}
      {!revealed && (
        <div className="absolute inset-0 backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-nature-600 to-nature-800 flex items-center justify-center p-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-6xl"
            >
              🌿
            </motion.div>
          </div>
        </div>
      )}

      {/* Card Front */}
      <div className="backface-hidden relative">
        <div className="p-4">
          {/* Rarity Badge */}
          {rarity !== 'common' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.5, type: 'spring' }}
              className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${rarityBadgeColors[rarity]} z-10`}
            >
              {rarity === 'mythic' && '💎 MYTHIC'}
              {rarity === 'legendary' && '✨ LEGENDARY'}
              {rarity === 'epic' && '🌟 EPIC'}
              {rarity === 'rare' && '💠 RARE'}
              {rarity === 'uncommon' && '🔷 UNCOMMON'}
            </motion.div>
          )}

          {/* Species Info with Learn More button */}
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg mb-1">
                  {observation.commonName || observation.speciesGuess}
                </h3>
                {observation.commonName && (
                  <p className="text-sm text-muted-foreground font-body italic">
                    {observation.taxonName}
                  </p>
                )}
              </div>
              {observation.taxonId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeciesInfo(true);
                  }}
                  className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  aria-label="Learn more about this species"
                >
                  <Info className="w-5 h-5 text-nature-600 dark:text-nature-400 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-sm text-muted-foreground font-body">
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span className="truncate">{observation.placeGuess}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{new Date(observation.observedOn).toLocaleDateString()}</span>
            </div>
            {observation.qualityGrade === 'research' && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <span>✅</span>
                <span className="font-semibold">Research Grade</span>
              </div>
            )}
          </div>

          {/* Points Badge */}
          {observation.pointsAwarded && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1 + 0.7, type: 'spring', stiffness: 200 }}
              className="mt-4 inline-flex items-center gap-1 px-3 py-1 bg-nature-100 dark:bg-nature-900/30 rounded-full text-nature-700 dark:text-nature-300 font-bold text-sm"
            >
              <span>+{observation.pointsAwarded}</span>
              <span className="text-xs">XP</span>
            </motion.div>
          )}
        </div>

        {/* Shimmer Effect */}
        {showShimmer && (
          <RarityShimmer
            rarity={rarity}
            onComplete={() => setShowShimmer(false)}
          />
        )}

        {/* Particle Burst */}
        {showParticles && (
          <ParticleBurst
            rarity={rarity}
            show={showParticles}
            onComplete={() => setShowParticles(false)}
          />
        )}
      </div>
    </motion.div>

      {/* Species Info Modal */}
      {showSpeciesInfo && observation.taxonId && (
        <SpeciesInfoModal
          taxonId={observation.taxonId}
          taxonName={observation.taxonName || observation.speciesGuess || 'Unknown'}
          commonName={observation.commonName || undefined}
          onClose={() => setShowSpeciesInfo(false)}
        />
      )}
    </>
  );
}
