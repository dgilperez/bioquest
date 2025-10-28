'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Target,
  CheckCircle2,
  Sparkles,
  Loader2,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { staggerContainer } from '@/lib/animations/variants';

interface Trip {
  id: string;
  placeId: number | null;
  title: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  plannedDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalObservations: number;
  newSpeciesFound: number;
  pointsEarned: number;
  rarityHighlight: string | null;
  completionScore: number | null;
  place: {
    id: number;
    name: string;
    displayName: string;
  } | null;
  targetSpecies: TripTarget[];
  observations: any[];
}

interface TripTarget {
  id: string;
  taxonId: number;
  spotted: boolean;
}

const statusColors = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300',
  in_progress: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300',
};

const rarityEmojis: Record<string, string> = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🟣',
  epic: '🔵',
  legendary: '🟡',
  mythic: '💎',
};

export function TripsListClient() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/trips?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }

      const data = await response.json();
      setTrips(data.trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusCounts = () => {
    return {
      all: trips.length,
      planned: trips.filter(t => t.status === 'planned').length,
      in_progress: trips.filter(t => t.status === 'in_progress').length,
      completed: trips.filter(t => t.status === 'completed').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
            Trip Journal
          </h1>
          <p className="text-muted-foreground font-body text-lg">
            Track your nature exploration adventures
          </p>
        </div>

        <Button
          onClick={() => router.push('/explore')}
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Plan New Trip
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-nature-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All Trips ({statusCounts.all})
        </button>

        <button
          onClick={() => setStatusFilter('planned')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'planned'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Planned ({statusCounts.planned})
        </button>

        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'in_progress'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          In Progress ({statusCounts.in_progress})
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'completed'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Completed ({statusCounts.completed})
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-nature-600" />
        </div>
      )}

      {/* Trips Grid */}
      {!isLoading && trips.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {trips.map((trip, index) => (
            <TripCard key={trip.id} trip={trip} index={index} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && trips.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed">
          <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {statusFilter === 'all' ? 'No trips yet' : `No ${statusFilter.replace('_', ' ')} trips`}
          </h3>
          <p className="text-muted-foreground mb-6">
            {statusFilter === 'all'
              ? 'Start planning your first nature exploration trip!'
              : `You don't have any ${statusFilter.replace('_', ' ')} trips`}
          </p>
          {statusFilter === 'all' && (
            <Button
              onClick={() => router.push('/explore')}
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Plan Your First Trip
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

interface TripCardProps {
  trip: Trip;
  index: number;
}

function TripCard({ trip, index }: TripCardProps) {
  const router = useRouter();

  const spottedTargets = trip.targetSpecies.filter(t => t.spotted).length;
  const totalTargets = trip.targetSpecies.length;
  const targetProgress = totalTargets > 0 ? (spottedTargets / totalTargets) * 100 : 0;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => router.push(`/trips/${trip.id}`)}
      className="rounded-2xl border bg-white dark:bg-gray-800 p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-display font-bold group-hover:text-nature-600 transition-colors">
              {trip.title}
            </h3>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-nature-600 transition-colors" />
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span>{trip.place?.displayName || 'Custom location'}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {trip.status === 'completed' && trip.completedAt
                ? `Completed ${formatDate(trip.completedAt)}`
                : trip.status === 'in_progress' && trip.startedAt
                ? `Started ${formatDate(trip.startedAt)}`
                : `Planned for ${formatDate(trip.plannedDate)}`}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[trip.status]}`}>
          {trip.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Stats (for completed trips) */}
      {trip.status === 'completed' && (
        <div className="grid grid-cols-3 gap-3 mb-4 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {trip.totalObservations}
            </div>
            <div className="text-xs text-muted-foreground">Observations</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {trip.newSpeciesFound}
            </div>
            <div className="text-xs text-muted-foreground">New Species</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {trip.pointsEarned}
            </div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
        </div>
      )}

      {/* Target Species Progress */}
      {totalTargets > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-nature-600" />
              <span className="text-sm font-medium">Target Species</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {spottedTargets} / {totalTargets}
            </span>
          </div>

          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-nature-500 to-nature-600 transition-all"
              style={{ width: `${targetProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Rarity Highlight (for completed trips) */}
      {trip.status === 'completed' && trip.rarityHighlight && trip.rarityHighlight !== 'common' && (
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700">
          <Sparkles className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium">
            Rarest find: {rarityEmojis[trip.rarityHighlight]} {trip.rarityHighlight}
          </span>
        </div>
      )}

      {/* Completion Score */}
      {trip.status === 'completed' && trip.completionScore !== null && (
        <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Completion</span>
          </div>
          <span className="text-lg font-bold text-green-700 dark:text-green-300">
            {trip.completionScore.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Description (for planned trips) */}
      {(trip.status === 'planned' || trip.status === 'in_progress') && trip.description && (
        <div className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {trip.description}
        </div>
      )}
    </motion.div>
  );
}
