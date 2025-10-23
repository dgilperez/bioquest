import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getUserBadges } from '@/lib/gamification/badges/unlock';
import { BadgeCard } from '@/components/badges/BadgeCard';
import { BadgeFilters } from '@/components/badges/BadgeFilters';

export const metadata: Metadata = {
  title: 'Badges',
  description: 'Your BioQuest achievements and badges',
};

export default async function BadgesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) {
    redirect('/signin');
  }

  const { unlocked, locked } = await getUserBadges(user.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-nature-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-nature-600">Badge Collection</h1>
          <p className="text-sm text-muted-foreground">
            {unlocked.length} of {unlocked.length + locked.length} badges unlocked
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{unlocked.length + locked.length}</p>
            </div>
            <div className="rounded-lg border bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800 p-4">
              <p className="text-sm text-muted-foreground">Unlocked</p>
              <p className="text-2xl font-bold text-green-600">{unlocked.length}</p>
            </div>
            <div className="rounded-lg border bg-white dark:bg-gray-800 p-4">
              <p className="text-sm text-muted-foreground">Locked</p>
              <p className="text-2xl font-bold text-gray-400">{locked.length}</p>
            </div>
            <div className="rounded-lg border bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-200 dark:border-yellow-800 p-4">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {Math.round((unlocked.length / (unlocked.length + locked.length)) * 100)}%
              </p>
            </div>
          </div>

          {/* Filters */}
          <BadgeFilters />

          {/* Unlocked Badges */}
          {unlocked.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">🏆 Unlocked Badges</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlocked.map(badge => (
                  <BadgeCard key={badge.id} badge={badge} isUnlocked={true} />
                ))}
              </div>
            </section>
          )}

          {/* Locked Badges */}
          {locked.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                🔒 Locked Badges
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locked.map(badge => (
                  <BadgeCard key={badge.code} badge={badge} isUnlocked={false} />
                ))}
              </div>
            </section>
          )}

          {unlocked.length === 0 && locked.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No badges yet! Start observing to unlock achievements.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
