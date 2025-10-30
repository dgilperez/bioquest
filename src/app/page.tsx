import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-nature-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Ambient watermarks throughout the page */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] opacity-50 dark:opacity-30 pointer-events-none rotate-45">
        <Image
          src="/images/logo-watermark.png"
          alt=""
          width={500}
          height={500}
        />
      </div>
      <div className="fixed bottom-0 left-0 w-[450px] h-[450px] opacity-50 dark:opacity-30 pointer-events-none -rotate-45">
        <Image
          src="/images/logo-watermark.png"
          alt=""
          width={450}
          height={450}
        />
      </div>

      <div className="z-10 w-full max-w-4xl space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 relative">
          {/* Decorative logo watermark in background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-96 h-96 pointer-events-none">
            <Image
              src="/images/logo-watermark.png"
              alt=""
              width={384}
              height={384}
              className="opacity-60 dark:opacity-40"
            />
          </div>

          <div className="relative flex justify-center mb-8">
            <Image
              src="/images/logo-transparent.png"
              alt="BioQuest Logo"
              width={180}
              height={180}
              priority
              className="drop-shadow-2xl"
            />
          </div>
          <h1 className="relative text-5xl md:text-6xl font-bold tracking-tight">
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
