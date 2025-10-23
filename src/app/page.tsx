import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-nature-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="z-10 w-full max-w-4xl space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Welcome to <span className="text-nature-600">BioQuest</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your iNaturalist observations into an engaging game.
          </p>
          <p className="text-lg text-muted-foreground">
            Earn points • Unlock badges • Complete quests • Discover legendary species
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-4 justify-center">
          <Link href="/signin">
            <Button size="lg" className="bg-nature-600 hover:bg-nature-700">
              Get Started
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </div>

        {/* Features Preview */}
        <div id="features" className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 border shadow-sm">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="font-semibold text-lg mb-2">Gamification</h3>
            <p className="text-sm text-muted-foreground">
              Earn XP, level up, and compete on leaderboards
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 border shadow-sm">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="font-semibold text-lg mb-2">Achievements</h3>
            <p className="text-sm text-muted-foreground">
              Unlock 40+ badges across 7 categories
            </p>
          </div>
          <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 border shadow-sm">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="font-semibold text-lg mb-2">Rare Finds</h3>
            <p className="text-sm text-muted-foreground">
              Discover legendary species and track your collection
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
