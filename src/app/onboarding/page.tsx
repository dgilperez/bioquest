import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { INatClient } from '@/lib/inat/client';
import { OnboardingClient } from './page.client';

export const metadata: Metadata = {
  title: 'Welcome to BioQuest',
  description: 'Set up your naturalist profile',
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { stats: true, syncProgress: true },
  });

  if (!user) {
    redirect('/signin');
  }

  // If onboarding is already completed, redirect to dashboard
  if (user.onboardingCompleted) {
    redirect('/dashboard');
  }

  // Get actual observation count from iNaturalist API
  let obsCount = user.stats?.totalObservations || 0;

  // If stats are empty (fresh user), fetch from iNat API
  if (obsCount === 0) {
    try {
      const client = new INatClient({ accessToken: (session as any).accessToken });
      const response = await client.getUserObservations(user.inatUsername, { per_page: 1 });
      obsCount = response.total_results;
    } catch (error) {
      console.error('Failed to fetch observation count from iNat:', error);
      // Fall back to 0 if API fails
      obsCount = 0;
    }
  }

  return (
    <OnboardingClient
      userId={user.id}
      userName={user.name || user.inatUsername}
      inatUsername={user.inatUsername}
      accessToken={(session as any).accessToken}
      observationCount={obsCount}
      syncInProgress={user.syncProgress?.status === 'syncing'}
    />
  );
}
