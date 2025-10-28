import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { ObservationFilters } from '@/components/observations/ObservationFilters';
import { ObservationsClient } from './page.client';
import { AnimatedStatsCard } from '@/components/stats/AnimatedStatsCard';

export const metadata: Metadata = {
  title: 'Observations',
  description: 'Your iNaturalist observations',
};

export default async function ObservationsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      observations: {
        orderBy: { observedOn: 'desc' },
        take: 50,
      },
    },
  });

  if (!user) {
    redirect('/signin');
  }

  const { observations } = user;
  const filter = searchParams.filter;

  // Filter observations based on selected filter
  const filteredObservations = filter
    ? observations.filter((obs) => {
        if (filter === 'legendary') return obs.rarity === 'legendary';
        if (filter === 'rare') return obs.rarity === 'rare';
        if (filter === 'research') return obs.qualityGrade === 'research';
        return true;
      })
    : observations;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
            Observations
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-2">
            {observations.length > 0
              ? filter
                ? `Showing ${filteredObservations.length} of ${observations.length} observations`
                : `Showing ${Math.min(50, observations.length)} most recent observations`
              : 'No observations yet'}
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatedStatsCard
            title="Total"
            value={observations.length}
            icon="📸"
            color="blue"
            index={0}
          />
          <AnimatedStatsCard
            title="Rare"
            value={observations.filter(o => o.rarity === 'rare').length}
            icon="💜"
            color="purple"
            index={1}
          />
          <AnimatedStatsCard
            title="Legendary"
            value={observations.filter(o => o.rarity === 'legendary').length}
            icon="⭐"
            color="yellow"
            index={2}
          />
          <AnimatedStatsCard
            title="Research Grade"
            value={observations.filter(o => o.qualityGrade === 'research').length}
            icon="🔬"
            color="green"
            index={3}
          />
        </div>

        {/* Filters */}
        <ObservationFilters />

        {/* Observations Grid */}
        <ObservationsClient observations={filteredObservations} hasObservations={observations.length > 0} />
      </div>
    </div>
  );
}
