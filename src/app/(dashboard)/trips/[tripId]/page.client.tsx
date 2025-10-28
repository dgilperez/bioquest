'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Target,
  CheckCircle2,
  Circle,
  Sparkles,
  Play,
  CheckSquare,
  XCircle,
  Trash2,
  Image as ImageIcon,
  Award,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { staggerContainer } from '@/lib/animations/variants';

interface Trip {
  id: string;
  userId: string;
  placeId: number | null;
  title: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  plannedDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  customLocationName: string | null;
  customLatitude: number | null;
  customLongitude: number | null;
  weather: string | null;
  conditions: string | null;
  notes: string | null;
  totalObservations: number;
  newSpeciesFound: number;
  pointsEarned: number;
  rarityHighlight: string | null;
  completionScore: number | null;
  createdAt: string;
  updatedAt: string;
  place: {
    id: number;
    name: string;
    displayName: string;
  } | null;
  targetSpecies: TripTarget[];
  observations: TripObservation[];
  achievements: TripAchievement[];
}

interface TripTarget {
  id: string;
  taxonId: number;
  taxonName: string;
  commonName: string | null;
  iconicTaxon: string | null;
  priority: number;
  spotted: boolean;
  spottedAt: string | null;
}

interface TripObservation {
  id: string;
  isTargetSpecies: boolean;
  observation: {
    id: number;
    taxonName: string | null;
    commonName: string | null;
    iconicTaxon: string | null;
    observedOn: string;
    rarity: string | null;
    pointsAwarded: number;
  };
}

interface TripAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  earnedAt: string;
}

const statusColors = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const rarityColors = {
  common: 'text-gray-600',
  uncommon: 'text-green-600',
  rare: 'text-purple-600',
  epic: 'text-blue-600',
  legendary: 'text-yellow-600',
  mythic: 'text-pink-600',
};

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

export function TripDetailClient({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchTrip = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Trip not found');
          router.push('/trips');
          return;
        }
        throw new Error('Failed to fetch trip');
      }

      const data = await response.json();
      setTrip(data.trip);
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast.error('Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  }, [tripId, router]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleAction = async (action: 'start' | 'complete' | 'cancel') => {
    if (!trip) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} trip`);
      }

      const data = await response.json();
      setTrip(data.trip);

      toast.success(
        action === 'start' ? 'Trip started! 🎯' :
        action === 'complete' ? 'Trip completed! 🎉' :
        'Trip cancelled'
      );
    } catch (error) {
      console.error(`Error ${action} trip:`, error);
      toast.error(`Failed to ${action} trip`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }

      toast.success('Trip deleted');
      router.push('/trips');
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-nature-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Trip not found</p>
      </div>
    );
  }

  const spottedTargets = trip.targetSpecies.filter(t => t.spotted).length;
  const totalTargets = trip.targetSpecies.length;
  const targetProgress = totalTargets > 0 ? (spottedTargets / totalTargets) * 100 : 0;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-display font-bold">{trip.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[trip.status]}`}>
              {trip.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span>
              {trip.place?.displayName || trip.customLocationName || 'Custom location'}
            </span>
          </div>

          {/* Date */}
          {trip.plannedDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(trip.plannedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {trip.status === 'planned' && (
            <>
              <Button
                onClick={() => handleAction('start')}
                disabled={isActionLoading}
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Trip
              </Button>
              <Button
                onClick={() => handleAction('cancel')}
                disabled={isActionLoading}
                variant="outline"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </>
          )}

          {trip.status === 'in_progress' && (
            <Button
              onClick={() => handleAction('complete')}
              disabled={isActionLoading}
              size="lg"
            >
              <CheckSquare className="h-5 w-5 mr-2" />
              Complete Trip
            </Button>
          )}

          <Button
            onClick={handleDelete}
            disabled={isActionLoading}
            variant="ghost"
            size="icon"
          >
            <Trash2 className="h-5 w-5 text-red-600" />
          </Button>
        </div>
      </div>

      {/* Description */}
      {trip.description && (
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-muted-foreground">{trip.description}</p>
        </div>
      )}

      {/* Stats Grid (for completed trips) */}
      {trip.status === 'completed' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-nature-50 to-nature-100 dark:from-nature-900/20 dark:to-nature-800/20">
            <div className="text-sm text-muted-foreground mb-1">Observations</div>
            <div className="text-3xl font-bold text-nature-700 dark:text-nature-300">
              {trip.totalObservations}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="text-sm text-muted-foreground mb-1">New Species</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {trip.newSpeciesFound}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <div className="text-sm text-muted-foreground mb-1">Points Earned</div>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {trip.pointsEarned}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <div className="text-sm text-muted-foreground mb-1">Completion</div>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              {trip.completionScore?.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Target Species Checklist */}
      {trip.targetSpecies.length > 0 && (
        <div className="rounded-2xl border bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-nature-600" />
              Target Species
            </h2>
            <div className="text-sm text-muted-foreground">
              {spottedTargets} / {totalTargets} spotted
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-nature-500 to-nature-600 transition-all"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>

          {/* Target List */}
          <div className="space-y-3">
            {trip.targetSpecies
              .sort((a, b) => b.priority - a.priority)
              .map((target) => (
                <div
                  key={target.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    target.spotted
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {target.spotted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {iconicTaxonEmojis[target.iconicTaxon || ''] || '🌿'}
                      </span>
                      <div>
                        <div className="font-medium">
                          {target.commonName || target.taxonName}
                        </div>
                        {target.commonName && (
                          <div className="text-xs italic text-muted-foreground">
                            {target.taxonName}
                          </div>
                        )}
                      </div>
                    </div>

                    {target.spottedAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Spotted on {new Date(target.spottedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Priority Stars */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: target.priority }).map((_, i) => (
                      <span key={i} className="text-yellow-500 text-sm">⭐</span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Observations */}
      {trip.observations.length > 0 && (
        <div className="rounded-2xl border bg-white dark:bg-gray-800 p-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-4">
            <ImageIcon className="h-6 w-6 text-nature-600" />
            Observations ({trip.observations.length})
          </h2>

          <div className="space-y-3">
            {trip.observations.map((tripObs) => (
              <div
                key={tripObs.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  tripObs.isTargetSpecies
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                    : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                }`}
              >
                <span className="text-lg">
                  {iconicTaxonEmojis[tripObs.observation.iconicTaxon || ''] || '🌿'}
                </span>

                <div className="flex-1">
                  <div className="font-medium">
                    {tripObs.observation.commonName || tripObs.observation.taxonName || 'Unknown'}
                  </div>
                  {tripObs.observation.commonName && tripObs.observation.taxonName && (
                    <div className="text-xs italic text-muted-foreground">
                      {tripObs.observation.taxonName}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(tripObs.observation.observedOn).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right">
                  {tripObs.observation.rarity && (
                    <div className={`text-xs font-semibold ${rarityColors[tripObs.observation.rarity as keyof typeof rarityColors] || 'text-gray-600'}`}>
                      {tripObs.observation.rarity.toUpperCase()}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {tripObs.observation.pointsAwarded} pts
                  </div>
                  {tripObs.isTargetSpecies && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
                      TARGET ✓
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {trip.achievements.length > 0 && (
        <div className="rounded-2xl border bg-white dark:bg-gray-800 p-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-4">
            <Award className="h-6 w-6 text-nature-600" />
            Achievements ({trip.achievements.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trip.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      {trip.notes && (
        <div className="rounded-2xl border bg-white dark:bg-gray-800 p-6">
          <h2 className="text-xl font-display font-bold mb-3">Trip Notes</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{trip.notes}</p>
        </div>
      )}

      {/* Weather & Conditions */}
      {(trip.weather || trip.conditions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trip.weather && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
              <h3 className="font-semibold mb-2">Weather</h3>
              <p className="text-sm text-muted-foreground">{trip.weather}</p>
            </div>
          )}

          {trip.conditions && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
              <h3 className="font-semibold mb-2">Conditions</h3>
              <p className="text-sm text-muted-foreground">{trip.conditions}</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State for Observations */}
      {trip.observations.length === 0 && trip.status !== 'planned' && (
        <div className="text-center py-12 rounded-2xl border border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-2">No observations yet</h3>
          <p className="text-muted-foreground mb-4">
            Link observations to this trip to track your progress
          </p>
        </div>
      )}
    </motion.div>
  );
}
