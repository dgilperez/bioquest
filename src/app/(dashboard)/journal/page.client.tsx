'use client';

import Link from 'next/link';
import { Eye, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Observation {
  id: string;
  taxonName: string;
  observedAt: string;
  place: string | null;
  photoUrl: string | null;
}

interface ObservationStats {
  totalObservations: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
}

interface JournalClientProps {
  recentObservations: Observation[];
  stats: ObservationStats;
}

export function JournalClient({ recentObservations, stats }: JournalClientProps) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          Field Journal
        </h1>
        <p className="text-lg text-muted-foreground">
          Your chronological record of all nature observations and discoveries
        </p>
      </div>

      {/* Stats Overview */}
      <section>
        <h2 className="text-2xl font-display font-bold mb-6">Observation Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground mb-1">Total</div>
            <div className="text-3xl font-bold text-nature-600">
              {stats.totalObservations.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">All time</div>
          </div>

          <div className="p-5 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground mb-1">This Week</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.thisWeek.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Last 7 days</div>
          </div>

          <div className="p-5 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground mb-1">This Month</div>
            <div className="text-3xl font-bold text-blue-600">
              {stats.thisMonth.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Last 30 days</div>
          </div>

          <div className="p-5 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground mb-1">This Year</div>
            <div className="text-3xl font-bold text-purple-600">
              {stats.thisYear.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">2025</div>
          </div>
        </div>
      </section>

      {/* Recent Observations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Recent Observations</h2>
            <p className="text-sm text-muted-foreground">
              Your latest discoveries in the field
            </p>
          </div>
          <Link href="/observations">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentObservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentObservations.map((obs) => (
              <Link
                key={obs.id}
                href="/observations"
                className="p-4 rounded-lg border bg-card hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-16 h-16 bg-nature-100 dark:bg-nature-900/30 rounded-lg flex items-center justify-center text-2xl">
                    {obs.photoUrl ? '📷' : '🔍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-nature-600 transition-colors">
                      {obs.taxonName}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(obs.observedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {obs.place && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        📍 {obs.place}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-lg border border-dashed text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No observations yet. Start observing nature to build your field journal!
            </p>
            <Link href="/observations">
              <Button>View Observations</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/observations"
          className="p-6 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            All Observations
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse your complete chronological observation history
          </p>
          <Button variant="outline" className="w-full">
            View Observations
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>

        <Link
          href="/stats"
          className="p-6 rounded-lg border bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Statistics
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Analyze your observation patterns and trends over time
          </p>
          <Button variant="outline" className="w-full">
            View Stats
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
