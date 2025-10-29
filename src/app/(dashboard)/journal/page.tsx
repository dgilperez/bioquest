import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Your chronological observation history',
};

export default async function JournalPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          Journal
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your field journal of all observations in chronological order
        </p>

        {/* Quick Link to Observations */}
        <div className="grid grid-cols-1 gap-6">
          <Link
            href="/observations"
            className="p-6 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            <Eye className="h-12 w-12 text-nature-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Observations</h3>
            <p className="text-sm text-muted-foreground">
              Browse your complete observation history
            </p>
          </Link>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-nature-100 dark:bg-nature-900/20 border border-nature-200 dark:border-nature-800">
          <p className="text-sm text-nature-700 dark:text-nature-300">
            🚧 <strong>Phase 1 Note:</strong> This page currently links to the observations page.
            In future phases, it will display a diary-style chronological feed with observation
            details, patterns, and accumulation charts.
          </p>
        </div>
      </div>
    </div>
  );
}
