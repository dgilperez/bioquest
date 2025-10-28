import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExploreClient } from './page.client';

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover new places to observe nature',
};

export default async function ExplorePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ExploreClient />
    </div>
  );
}
