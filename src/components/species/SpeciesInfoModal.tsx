'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, MapPin, Calendar, Camera, Info, Sparkles } from 'lucide-react';

interface SpeciesInfo {
  id: number;
  name: string;
  commonName?: string;
  rank: string;
  ancestorNames: string[];
  wikipediaSummary?: string;
  wikipediaUrl?: string;
  conservationStatus?: {
    status: string;
    statusName: string;
  };
  taxonomy: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
  };
  photos?: Array<{
    url: string;
    attribution: string;
    license: string;
  }>;
  observationCount: number;
  isEndangered?: boolean;
  isIntroduced?: boolean;
}

interface SpeciesInfoModalProps {
  taxonId: number;
  taxonName: string;
  commonName?: string;
  onClose: () => void;
}

export function SpeciesInfoModal({
  taxonId,
  taxonName,
  commonName,
  onClose,
}: SpeciesInfoModalProps) {
  const [speciesInfo, setSpeciesInfo] = useState<SpeciesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpeciesInfo() {
      try {
        setLoading(true);
        const response = await fetch(`/api/species/${taxonId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch species information');
        }

        const data = await response.json();
        setSpeciesInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSpeciesInfo();
  }, [taxonId]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-nature-50 to-nature-100 dark:from-gray-800 dark:to-gray-750">
            <div className="flex-1">
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                {commonName || taxonName}
              </h2>
              {commonName && (
                <p className="text-sm italic text-gray-600 dark:text-gray-400 mt-1">
                  {taxonName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nature-600"></div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {speciesInfo && !loading && (
              <div className="space-y-6">
                {/* Photos */}
                {speciesInfo.photos && speciesInfo.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {speciesInfo.photos.slice(0, 6).map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                        <img
                          src={photo.url}
                          alt={`${speciesInfo.commonName || speciesInfo.name} - photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white">{photo.attribution}</p>
                          <p className="text-xs text-gray-300">{photo.license}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conservation Status */}
                {speciesInfo.conservationStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <h3 className="font-display font-semibold text-amber-900 dark:text-amber-300">
                        Conservation Status
                      </h3>
                    </div>
                    <p className="text-amber-800 dark:text-amber-200">
                      {speciesInfo.conservationStatus.statusName} ({speciesInfo.conservationStatus.status})
                    </p>
                  </motion.div>
                )}

                {/* Wikipedia Summary */}
                {speciesInfo.wikipediaSummary && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-nature-600 dark:text-nature-400" />
                      <h3 className="font-display font-semibold text-gray-900 dark:text-white">
                        About
                      </h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {speciesInfo.wikipediaSummary}
                    </p>
                    {speciesInfo.wikipediaUrl && (
                      <a
                        href={speciesInfo.wikipediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-nature-600 dark:text-nature-400 hover:underline"
                      >
                        Read more on Wikipedia
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Taxonomy */}
                <div className="space-y-2">
                  <h3 className="font-display font-semibold text-gray-900 dark:text-white">
                    Taxonomy
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {speciesInfo.taxonomy.kingdom && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Kingdom</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {speciesInfo.taxonomy.kingdom}
                        </p>
                      </div>
                    )}
                    {speciesInfo.taxonomy.phylum && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phylum</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {speciesInfo.taxonomy.phylum}
                        </p>
                      </div>
                    )}
                    {speciesInfo.taxonomy.class && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Class</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {speciesInfo.taxonomy.class}
                        </p>
                      </div>
                    )}
                    {speciesInfo.taxonomy.order && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Order</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {speciesInfo.taxonomy.order}
                        </p>
                      </div>
                    )}
                    {speciesInfo.taxonomy.family && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Family</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {speciesInfo.taxonomy.family}
                        </p>
                      </div>
                    )}
                    {speciesInfo.taxonomy.genus && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Genus</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {speciesInfo.taxonomy.genus}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Global Observations
                    </p>
                    <p className="text-2xl font-display font-bold text-nature-600 dark:text-nature-400">
                      {speciesInfo.observationCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rank</p>
                    <p className="text-2xl font-display font-bold text-gray-900 dark:text-white capitalize">
                      {speciesInfo.rank}
                    </p>
                  </div>
                </div>

                {/* View on iNaturalist */}
                <a
                  href={`https://www.inaturalist.org/taxa/${taxonId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full p-3 bg-nature-600 hover:bg-nature-700 text-white rounded-lg transition-colors font-display font-medium"
                >
                  <ExternalLink className="w-5 h-5" />
                  View on iNaturalist
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
