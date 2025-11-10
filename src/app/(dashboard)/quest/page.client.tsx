'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Compass, ListTodo, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuestCard } from '@/components/quests/QuestCard';
import { LocationRecommendation } from '@/lib/explore/recommendations-optimized';
import { Quest, QuestStatus } from '@/types';
import { toast } from 'sonner';

interface UserQuestWithProgress {
  quest: Quest;
  progress: number;
  status: QuestStatus;
}

interface QuestLandingProps {
  topQuests: UserQuestWithProgress[];
  totalActiveQuests: number;
}

export function QuestLandingClient({ topQuests, totalActiveQuests }: QuestLandingProps) {
  const [recommendations, setRecommendations] = useState<LocationRecommendation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  const loadRecommendations = async () => {
    setIsLoadingLocations(true);
    try {
      const response = await fetch('/api/explore/recommendations');
      if (!response.ok) throw new Error('Failed to load recommendations');

      const data = await response.json();
      setRecommendations(data.recommendations.slice(0, 3)); // Top 3
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Failed to load location recommendations');
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          What&apos;s Your Quest Today?
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete quests, explore new locations, and level up your naturalist skills
        </p>
      </div>

      {/* Active Quests Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Active Missions</h2>
            <p className="text-sm text-muted-foreground">
              {totalActiveQuests} {totalActiveQuests === 1 ? 'quest' : 'quests'} in progress
            </p>
          </div>
          <Link href="/quests">
            <Button variant="outline" className="gap-2">
              <ListTodo className="h-4 w-4" />
              View All Quests
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {topQuests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topQuests.map((userQuest) => (
              <QuestCard
                key={userQuest.quest.id}
                quest={userQuest.quest}
                progress={userQuest.progress}
                status={userQuest.status}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-muted-foreground mb-4">No active quests yet</p>
            <Link href="/quests">
              <Button>Browse Available Quests</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Location Recommendations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Recommended Adventures</h2>
            <p className="text-sm text-muted-foreground">
              Explore these locations based on your interests
            </p>
          </div>
          <Link href="/explore">
            <Button variant="outline" className="gap-2">
              <Compass className="h-4 w-4" />
              Explore More
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoadingLocations ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <div
                key={rec.placeId}
                className="p-6 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-nature-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{rec.displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {rec.distance ? `${rec.distance.toFixed(1)} mi away` : 'Distance unknown'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New species</span>
                    <span className="font-semibold text-nature-600">
                      {rec.newSpeciesPossible}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total recorded</span>
                    <span className="font-medium">{rec.totalSpeciesAtLocation}</span>
                  </div>
                </div>

                {rec.topTargets && rec.topTargets.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Target species:</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.topTargets.slice(0, 3).map((target) => (
                        <span
                          key={target.taxonId}
                          className="text-xs px-2 py-1 bg-nature-100 dark:bg-nature-900/30 rounded-full"
                        >
                          {target.commonName || target.taxonName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-muted-foreground mb-4">No location recommendations available</p>
            <Button onClick={loadRecommendations} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/trips"
          className="p-6 rounded-lg border bg-gradient-to-br from-nature-50 to-nature-100 dark:from-nature-900/20 dark:to-nature-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <Compass className="h-5 w-5 text-nature-600" />
            Plan an Adventure
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a trip with species targets and locations
          </p>
          <Button variant="outline" className="w-full">
            Start Planning
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>

        <Link
          href="/quests"
          className="p-6 rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-purple-600" />
            Browse All Quests
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            View daily, weekly, and monthly challenges
          </p>
          <Button variant="outline" className="w-full">
            View Quests
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
