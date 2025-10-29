import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Trophy, TrendingUp, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Your achievements, stats, and rankings',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your level, achievements, and how you compare to other naturalists
        </p>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/badges"
            className="p-6 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            <Trophy className="h-12 w-12 text-nature-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Badges</h3>
            <p className="text-sm text-muted-foreground">
              Your collection of unlocked achievements
            </p>
          </Link>

          <Link
            href="/stats"
            className="p-6 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            <TrendingUp className="h-12 w-12 text-nature-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Statistics</h3>
            <p className="text-sm text-muted-foreground">
              Detailed charts and analytics
            </p>
          </Link>

          <Link
            href="/leaderboards"
            className="p-6 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
          >
            <Users className="h-12 w-12 text-nature-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Leaderboards</h3>
            <p className="text-sm text-muted-foreground">
              Compare your progress with others
            </p>
          </Link>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-nature-100 dark:bg-nature-900/20 border border-nature-200 dark:border-nature-800">
          <p className="text-sm text-nature-700 dark:text-nature-300">
            🚧 <strong>Phase 4 Enhancement Coming:</strong> This page will soon display your level/XP
            progress, featured badges, leaderboard rank summary, and key stats at a glance.
          </p>
        </div>
      </div>
    </div>
  );
}
