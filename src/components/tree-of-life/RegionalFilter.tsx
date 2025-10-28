'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RegionalFilterProps {
  selectedRegion: { id: number; name: string } | null;
  onRegionChange: (region: { id: number; name: string } | null) => void;
}

interface Place {
  id: number;
  name: string;
  displayName: string;
  placeType: number;
}

export function RegionalFilter({ selectedRegion, onRegionChange }: RegionalFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setPlaces([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/tree-of-life/places/search?q=${encodeURIComponent(searchQuery)}`
        );

        if (response.ok) {
          const data = await response.json();
          setPlaces(data.data);
        }
      } catch (error) {
        console.error('Error searching places:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectPlace = (place: Place) => {
    onRegionChange({ id: place.id, name: place.displayName });
    setIsOpen(false);
    setSearchQuery('');
    setPlaces([]);
  };

  const handleClearRegion = () => {
    onRegionChange(null);
  };

  const getPlaceTypeLabel = (placeType: number): string => {
    const types: Record<number, string> = {
      8: 'County',
      9: 'Municipality',
      10: 'Park',
      11: 'Open Space',
      12: 'State',
      13: 'Territory',
      14: 'Province',
      15: 'District',
      100: 'Country',
      101: 'Continent',
    };
    return types[placeType] || 'Place';
  };

  return (
    <div className="space-y-2">
      {/* Current selection or open button */}
      {selectedRegion ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-nature-500 dark:border-nature-600 bg-nature-50 dark:bg-nature-950/20">
          <MapPin className="w-5 h-5 text-nature-600 dark:text-nature-400 flex-shrink-0" />
          <span className="flex-1 font-medium text-nature-700 dark:text-nature-300">
            {selectedRegion.name}
          </span>
          <button
            onClick={handleClearRegion}
            className="p-1 rounded-full hover:bg-nature-200 dark:hover:bg-nature-800 transition-colors"
            aria-label="Clear region filter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="w-full"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Filter by Region
        </Button>
      )}

      {/* Search modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-display font-bold">Select Region</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a place..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-nature-500 dark:focus:border-nature-600 outline-none transition-colors"
                    autoFocus
                  />
                </div>

                {/* Loading state */}
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-nature-600" />
                  </div>
                )}

                {/* Results */}
                {!isLoading && places.length > 0 && (
                  <div className="space-y-2">
                    {places.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => handleSelectPlace(place)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-nature-500 dark:hover:border-nature-600 hover:bg-nature-50 dark:hover:bg-nature-950/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold">{place.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {place.displayName}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {getPlaceTypeLabel(place.placeType)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && searchQuery.length >= 2 && places.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No places found for &quot;{searchQuery}&quot;</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                )}

                {/* Prompt */}
                {!isLoading && searchQuery.length < 2 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Enter at least 2 characters to search</p>
                    <p className="text-sm mt-1">
                      Try: your city, state, country, or continent
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
