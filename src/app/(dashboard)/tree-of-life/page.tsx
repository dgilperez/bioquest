import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TreeOfLifeClient } from './page.client';

export const metadata = {
  title: 'Tree of Life - BioQuest',
  description: 'Explore the taxonomic tree of life and track your completeness',
};

export default async function TreeOfLifePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return <TreeOfLifeClient />;
}
