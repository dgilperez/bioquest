import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
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

  // Get observation count from iNat to show in welcome
  const obsCount = user.stats?.totalObservations || 0;

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
