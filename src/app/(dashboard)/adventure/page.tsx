import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { AdventureClient } from './page.client';
import { getIconicTaxaProgress } from '@/lib/stats/iconic-taxa';

export const metadata: Metadata = {
  title: 'Adventure',
  description: 'Explore biodiversity and plan your next adventure',
};

export default async function AdventurePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    redirect('/signin');
  }

  // Get user's progress for iconic taxa (optimized - no N+1 queries)
  const iconicTaxaProgress = await getIconicTaxaProgress(user.id);

  // Get active trips (planned and in_progress)
  const activeTrips = await prisma.trip.findMany({
    where: {
      userId: user.id,
      status: {
        in: ['planned', 'in_progress'],
      },
    },
    include: {
      place: {
        select: {
          displayName: true,
        },
      },
      targetSpecies: {
        select: {
          spotted: true,
        },
      },
    },
    orderBy: [
      {
        status: 'desc', // in_progress first
      },
      {
        plannedDate: 'asc',
      },
    ],
    take: 10,
  });

  // Transform trips to match client interface (convert Date to string)
  const transformedTrips = activeTrips.map(trip => ({
    ...trip,
    plannedDate: trip.plannedDate ? trip.plannedDate.toISOString() : null,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <AdventureClient
        iconicTaxaProgress={iconicTaxaProgress.slice(0, 6)} // Top 6 iconic taxa
        activeTrips={transformedTrips}
      />
    </div>
  );
}
