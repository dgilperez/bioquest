'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, Target, Sparkles, Navigation, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationRecommendation } from '@/lib/explore/recommendations-optimized';
import { toast } from 'sonner';
import { staggerContainer } from '@/lib/animations/variants';
import { TripCreationModal } from '@/components/trips/TripCreationModal';

const iconicTaxonEmojis: Record<string, string> = {
  'Plantae': '🌿',
  'Fungi': '🍄',
  'Aves': '🦅',
  'Mammalia': '🦌',
  'Reptilia': '🦎',
  'Amphibia': '🐸',
  'Actinopterygii': '🐟',
  'Insecta': '🦋',
  'Arachnida': '🕷️',
  'Mollusca': '🐚',
  'Animalia': '🦎',
  'Chromista': '🦠',
  'Protozoa': '🦠',
};

const activityColors = {
  low: 'text-gray-500 bg-gray-100',
  medium: 'text-amber-600 bg-amber-100',
  high: 'text-green-600 bg-green-100',
};

export function ExploreClient() {
  const [recommendations, setRecommendations] = useState<LocationRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [usingGeolocation, setUsingGeolocation] = useState(false);

  // Get user's current location using browser geolocation API
  const getUserLocation = () => {
    setUsingGeolocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserCoordinates(coords);
          fetchRecommendations(coords);
          toast.success('Location detected!');
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Could not get your location. Using your observation history instead.');
          setUsingGeolocation(false);
          fetchRecommendations();
        }
      );
    } else {
      toast.error('Geolocation not supported by your browser');
      setUsingGeolocation(false);
      fetchRecommendations();
    }
  };

  const fetchRecommendations = async (coords?: { lat: number; lng: number }) => {
    console.log('🔴 fetchRecommendations called with coords:', coords);
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (coords) {
        params.set('lat', coords.lat.toString());
        params.set('lng', coords.lng.toString());
      }

      console.log('🔴 Making fetch request to:', `/api/explore/recommendations?${params.toString()}`);
      const response = await fetch(`/api/explore/recommendations?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch recommendations');
      }

      const data = await response.json();
      console.log('🔴 Received data:', data);

      setRecommendations(data.recommendations || []);
      setUserCoordinates(data.userCoordinates || null);

      if (!data.success) {
        toast.error(data.message || 'Failed to load recommendations');
      } else if (data.recommendations.length === 0) {
        if (!data.userCoordinates) {
          toast.info('No location data available. Please use "Use My Location" or sync observations with GPS data.');
        } else {
          toast.info('No recommendations found nearby. Try increasing your search radius.');
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
      setUsingGeolocation(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          Explore
        </h1>
        <p className="text-muted-foreground font-body text-lg mb-6">
          Discover amazing places near you to observe nature
        </p>

        <div className="flex gap-4">
          <Button
            onClick={getUserLocation}
            disabled={isLoading || usingGeolocation}
            size="lg"
          >
            {usingGeolocation ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5 mr-2" />
                Use My Location
              </>
            )}
          </Button>

          <Button
            onClick={() => fetchRecommendations()}
            disabled={isLoading}
            variant="outline"
            size="lg"
          >
            {isLoading && !usingGeolocation ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Target className="h-5 w-5 mr-2" />
                Use Observation History
              </>
            )}
          </Button>
        </div>

        {userCoordinates && (
          <p className="mt-4 text-sm text-muted-foreground">
            Showing results near {userCoordinates.lat.toFixed(4)}, {userCoordinates.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border bg-gradient-to-br from-nature-50 to-nature-100 dark:from-nature-900/20 dark:to-nature-800/20 p-8 text-center">
            <Loader2 className="h-12 w-12 mx-auto text-nature-600 animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Exploring nearby locations...</h3>
            <p className="text-muted-foreground">
              Searching for places with new species, analyzing biodiversity, and calculating distances
            </p>
          </div>

          {/* Skeleton cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border bg-white dark:bg-gray-800 p-6 shadow-lg animate-pulse"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="h-24 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                  <div className="h-24 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
                </div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations Grid */}
      {!isLoading && recommendations.length > 0 && (
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {recommendations.map((location, index) => (
            <LocationCard key={location.placeId} location={location} index={index} />
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && recommendations.length === 0 && !userCoordinates && (
        <div className="text-center py-16">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to explore?</h3>
          <p className="text-muted-foreground mb-6">
            Click a button above to discover great places to observe nature nearby
          </p>
        </div>
      )}
    </motion.div>
  );
}

interface LocationCardProps {
  location: LocationRecommendation;
  index: number;
}

function LocationCard({ location, index }: LocationCardProps) {
  const [showTripModal, setShowTripModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="rounded-2xl border bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-shadow"
      >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-5 w-5 text-nature-600" />
            <h3 className="text-xl font-display font-bold">{location.placeName}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{location.displayName}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-nature-600">{location.distance}</div>
          <div className="text-xs text-muted-foreground">miles away</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg bg-gradient-to-br from-nature-50 to-nature-100 dark:from-nature-900/20 dark:to-nature-800/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-nature-600" />
            <span className="text-xs font-medium text-nature-700 dark:text-nature-300">NEW SPECIES</span>
          </div>
          <div className="text-2xl font-bold text-nature-800 dark:text-nature-200">
            {location.newSpeciesPossible}
          </div>
          <div className="text-xs text-muted-foreground">possible</div>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">ACTIVITY</span>
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${activityColors[location.recentActivity]}`}>
            {location.recentActivity.toUpperCase()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {location.recentObservationCount} obs. (30 days)
          </div>
        </div>
      </div>

      {/* Rarity Information */}
      {(location.rareSpeciesCounts.mythic > 0 ||
        location.rareSpeciesCounts.legendary > 0 ||
        location.rareSpeciesCounts.epic > 0 ||
        location.rareSpeciesCounts.rare > 0) && (
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-700">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            Rare Species Opportunities
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {location.rareSpeciesCounts.mythic > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white text-sm font-medium">
                <span className="text-lg">💎</span>
                <span>{location.rareSpeciesCounts.mythic} Mythic</span>
              </div>
            )}
            {location.rareSpeciesCounts.legendary > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white text-sm font-medium">
                <span className="text-lg">✨</span>
                <span>{location.rareSpeciesCounts.legendary} Legendary</span>
              </div>
            )}
            {location.rareSpeciesCounts.epic > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 text-white text-sm font-medium">
                <span className="text-lg">🌟</span>
                <span>{location.rareSpeciesCounts.epic} Epic</span>
              </div>
            )}
            {location.rareSpeciesCounts.rare > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 text-white text-sm font-medium">
                <span className="text-lg">💠</span>
                <span>{location.rareSpeciesCounts.rare} Rare</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seasonal Information */}
      {location.bestSeasons && location.bestSeasons.length > 0 && (
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-700">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">🗓️</span>
            Best Time to Visit
          </h4>
          <div className="space-y-2">
            {location.bestSeasons.slice(0, 2).map((season, idx) => (
              <div
                key={season.season}
                className={`p-3 rounded-md ${
                  idx === 0
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border border-green-300 dark:border-green-700'
                    : 'bg-white/50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {season.season === 'spring' && '🌸'}
                      {season.season === 'summer' && '☀️'}
                      {season.season === 'fall' && '🍂'}
                      {season.season === 'winter' && '❄️'}
                    </span>
                    <span className="font-semibold capitalize">{season.season}</span>
                    <span className="text-xs text-muted-foreground">({season.months})</span>
                  </div>
                  {idx === 0 && (
                    <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-200 dark:bg-green-900/40 px-2 py-1 rounded-full">
                      BEST NOW
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{season.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong For Taxa */}
      {location.strongFor.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span>🎯</span> Strong for:
          </h4>
          <div className="flex flex-wrap gap-2">
            {location.strongFor.map((taxon) => (
              <span
                key={taxon}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-nature-100 dark:bg-nature-900/30 text-sm font-medium text-nature-700 dark:text-nature-300"
              >
                <span>{iconicTaxonEmojis[taxon] || '🌿'}</span>
                {taxon}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Targets */}
      {location.topTargets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Top targets you haven&apos;t seen:</h4>
          <ul className="space-y-2">
            {location.topTargets.map((target) => (
              <li
                key={target.taxonId}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-lg">{iconicTaxonEmojis[target.iconicTaxon] || '🌿'}</span>
                <div className="flex-1">
                  <div className="font-medium">{target.commonName || target.taxonName}</div>
                  {target.commonName && (
                    <div className="text-xs italic text-muted-foreground">{target.taxonName}</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {target.observationCount} obs.
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Badge */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Recommendation score</span>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-nature-500 to-nature-600"
              style={{ width: `${location.score}%` }}
            />
          </div>
          <span className="text-sm font-bold text-nature-600">{location.score}/100</span>
        </div>
      </div>

      {/* Plan Trip Button */}
      <div className="mt-4">
        <Button
          onClick={() => setShowTripModal(true)}
          className="w-full"
          size="lg"
        >
          <Calendar className="h-5 w-5 mr-2" />
          Plan Trip
        </Button>
      </div>
    </motion.div>

    {showTripModal && (
      <TripCreationModal
        location={location}
        isOpen={showTripModal}
        onClose={() => setShowTripModal(false)}
      />
    )}
    </>
  );
}
