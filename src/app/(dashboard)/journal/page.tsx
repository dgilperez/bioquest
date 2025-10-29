import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { JournalClient } from './page.client';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Your chronological observation history',
};

export default async function JournalPage() {
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

  // Get recent observations (last 6)
  const recentObservations = await prisma.observation.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      observedOn: 'desc',
    },
    take: 6,
    select: {
      id: true,
      taxonName: true,
      observedOn: true,
      location: true,
      photosCount: true,
    },
  });

  // Calculate stats
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [totalObservations, thisWeek, thisMonth, thisYear] = await Promise.all([
    prisma.observation.count({ where: { userId: user.id } }),
    prisma.observation.count({
      where: {
        userId: user.id,
        observedOn: { gte: oneWeekAgo },
      },
    }),
    prisma.observation.count({
      where: {
        userId: user.id,
        observedOn: { gte: oneMonthAgo },
      },
    }),
    prisma.observation.count({
      where: {
        userId: user.id,
        observedOn: { gte: startOfYear },
      },
    }),
  ]);

  // Transform observations to match client interface
  const transformedObservations = recentObservations.map((obs) => ({
    id: obs.id.toString(),
    taxonName: obs.taxonName || 'Unknown',
    observedAt: obs.observedOn.toISOString(),
    place: obs.location,
    photoUrl: obs.photosCount > 0 ? 'has-photo' : null,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <JournalClient
        recentObservations={transformedObservations}
        stats={{
          totalObservations,
          thisWeek,
          thisMonth,
          thisYear,
        }}
      />
    </div>
  );
}
