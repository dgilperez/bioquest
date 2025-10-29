import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Network, List, Map } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Adventure',
  description: 'Explore biodiversity and plan your next adventure',
};

export default async function AdventurePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          Adventure
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Explore the tree of life, discover new species, and plan your next naturalist adventure
        </p>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/tree-of-life"
            className="p-6 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            <Network className="h-12 w-12 text-nature-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tree of Life</h3>
            <p className="text-sm text-muted-foreground">
              Explore taxonomic groups and track your completeness
            </p>
          </Link>

          <Link
            href="/stats/life-list"
            className="p-6 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            <List className="h-12 w-12 text-nature-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Life List</h3>
            <p className="text-sm text-muted-foreground">
              Browse your complete species checklist
            </p>
          </Link>

          <Link
            href="/trips"
            className="p-6 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            <Map className="h-12 w-12 text-nature-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Trips</h3>
            <p className="text-sm text-muted-foreground">
              Plan your next observation adventure
            </p>
          </Link>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-nature-100 dark:bg-nature-900/20 border border-nature-200 dark:border-nature-800">
          <p className="text-sm text-nature-700 dark:text-nature-300">
            🚧 <strong>Phase 3 Enhancement Coming:</strong> This page will soon display tree of life
            completeness metrics, gap analysis, and integrated trip planning.
          </p>
        </div>
      </div>
    </div>
  );
}
