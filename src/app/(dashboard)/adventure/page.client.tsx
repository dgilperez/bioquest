'use client';

import Link from 'next/link';
import { Network, List, Map, Target, ArrowRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaxonProgress {
  id: number;
  name: string;
  rank: string;
  speciesCount: number;
  observationCount: number;
  completionPercent: number;
  totalSpeciesGlobal: number;
}

interface Trip {
  id: string;
  title: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  plannedDate: string | null;
  place: {
    displayName: string;
  } | null;
  targetSpecies: {
    spotted: boolean;
  }[];
}

interface AdventureClientProps {
  iconicTaxaProgress: TaxonProgress[];
  activeTrips: Trip[];
}

const statusColors = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300',
  in_progress: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300',
};

export function AdventureClient({ iconicTaxaProgress, activeTrips }: AdventureClientProps) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          Your Next Adventure
        </h1>
        <p className="text-lg text-muted-foreground">
          Explore the tree of life, discover new species, and plan your naturalist journey
        </p>
      </div>

      {/* Tree of Life Progress Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Tree of Life Progress</h2>
            <p className="text-sm text-muted-foreground">
              Track your completeness across major taxonomic groups
            </p>
          </div>
          <Link href="/tree-of-life">
            <Button variant="outline" className="gap-2">
              <Network className="h-4 w-4" />
              Explore Tree
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {iconicTaxaProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {iconicTaxaProgress.map((taxon) => {
              const progressPercent = taxon.completionPercent || 0;
              const speciesObserved = taxon.speciesCount || 0;
              const totalSpecies = taxon.totalSpeciesGlobal || 1;

              return (
                <Link
                  key={taxon.id}
                  href="/tree-of-life"
                  className="p-5 rounded-lg border bg-card hover:bg-accent transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-nature-600 transition-colors">
                        {taxon.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {speciesObserved.toLocaleString()} of {totalSpecies.toLocaleString()} species
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-nature-600">
                        {progressPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-nature-500 to-nature-600 transition-all"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    {taxon.observationCount.toLocaleString()} observations
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-lg border border-dashed text-center">
            <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Start observing to track your taxonomic progress
            </p>
            <Link href="/tree-of-life">
              <Button>Explore Tree of Life</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Active Trips Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Active Adventures</h2>
            <p className="text-sm text-muted-foreground">
              Your planned and in-progress trips
            </p>
          </div>
          <Link href="/trips">
            <Button variant="outline" className="gap-2">
              <Map className="h-4 w-4" />
              All Trips
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {activeTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTrips.slice(0, 4).map((trip) => {
              const spottedCount = trip.targetSpecies.filter(t => t.spotted).length;
              const totalTargets = trip.targetSpecies.length;
              const progress = totalTargets > 0 ? (spottedCount / totalTargets) * 100 : 0;

              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="p-6 rounded-lg border bg-card hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-nature-600 transition-colors truncate">
                        {trip.title}
                      </h3>
                      {trip.place && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Map className="h-3 w-3" />
                          {trip.place.displayName}
                        </p>
                      )}
                      {trip.plannedDate && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(trip.plannedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[trip.status]}`}>
                      {trip.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {totalTargets > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Target Species
                        </span>
                        <span className="text-sm font-medium">
                          {spottedCount} / {totalTargets}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-nature-500 to-nature-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-lg border border-dashed text-center">
            <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No active trips yet. Plan your first naturalist adventure!
            </p>
            <Link href="/explore">
              <Button>Plan a Trip</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/tree-of-life"
          className="p-6 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Network className="h-5 w-5 text-green-600" />
            Tree of Life
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Explore taxonomic groups and discover gaps in your observations
          </p>
          <Button variant="outline" className="w-full">
            Explore Tree
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>

        <Link
          href="/stats/life-list"
          className="p-6 rounded-lg border bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <List className="h-5 w-5 text-blue-600" />
            Life List
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse all species you&apos;ve observed with search and filters
          </p>
          <Button variant="outline" className="w-full">
            View Life List
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>

        <Link
          href="/trips"
          className="p-6 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Map className="h-5 w-5 text-purple-600" />
            Plan Trip
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a new adventure with species targets and locations
          </p>
          <Button variant="outline" className="w-full">
            Start Planning
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
