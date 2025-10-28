import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { ObservationCard } from '@/components/observations/ObservationCard';
import { ObservationFilters } from '@/components/observations/ObservationFilters';
import { Navigation } from '@/components/layout/Navigation';

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
    <div className="min-h-screen bg-gradient-to-b from-nature-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-nature-600 mb-4">Observations</h1>
          <Navigation />
          <p className="text-sm text-muted-foreground mt-4">
            {observations.length > 0
              ? filter
                ? `Showing ${filteredObservations.length} of ${observations.length} observations`
                : `Showing ${Math.min(50, observations.length)} most recent observations`
              : 'No observations yet'}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Filters */}
          <ObservationFilters />

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{observations.length}</p>
            </div>
            <div className="rounded-lg border bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800 p-4">
              <p className="text-sm text-muted-foreground">Rare</p>
              <p className="text-2xl font-bold text-purple-600">
                {observations.filter(o => o.rarity === 'rare').length}
              </p>
            </div>
            <div className="rounded-lg border bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-200 dark:border-yellow-800 p-4">
              <p className="text-sm text-muted-foreground">Legendary</p>
              <p className="text-2xl font-bold text-yellow-600">
                {observations.filter(o => o.rarity === 'legendary').length}
              </p>
            </div>
            <div className="rounded-lg border bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800 p-4">
              <p className="text-sm text-muted-foreground">Research Grade</p>
              <p className="text-2xl font-bold text-green-600">
                {observations.filter(o => o.qualityGrade === 'research').length}
              </p>
            </div>
          </div>

          {/* Observations Grid */}
          {filteredObservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredObservations.map(observation => (
                <ObservationCard key={observation.id} observation={observation} />
              ))}
            </div>
          ) : observations.length > 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                No observations match the selected filter.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                No observations yet. Click the Sync button on the dashboard to fetch your observations!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
