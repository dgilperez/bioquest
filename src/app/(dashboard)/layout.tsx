import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Navigation } from '@/components/layout/Navigation';
import { SyncButton } from '@/components/stats/SyncButton';
import { SyncProgress } from '@/components/sync/SyncProgress';
import { BackgroundClassificationBubble } from '@/components/sync/BackgroundClassificationBubble';
import { ClientErrorBoundary } from '@/components/errors/ClientErrorBoundary';
import Image from 'next/image';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-nature-50 via-white to-nature-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-x-hidden">
      {/* Subtle decorative watermarks in background */}
      <div className="fixed top-20 right-10 w-96 h-96 opacity-40 dark:opacity-25 pointer-events-none z-0 rotate-12">
        <Image
          src="/images/logo-watermark.png"
          alt=""
          width={384}
          height={384}
        />
      </div>
      <div className="fixed bottom-32 left-10 w-80 h-80 opacity-40 dark:opacity-25 pointer-events-none z-0 -rotate-12">
        <Image
          src="/images/logo-watermark.png"
          alt=""
          width={320}
          height={320}
        />
      </div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-30 dark:opacity-20 pointer-events-none z-0">
        <Image
          src="/images/logo-watermark.png"
          alt=""
          width={600}
          height={600}
        />
      </div>

      {/* Header with Navigation */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md dark:bg-gray-800/80 shadow-sm relative">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="group relative">
                <h1 className="text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent transition-all group-hover:tracking-wide">
                  BioQuest
                </h1>
                {/* Subtle decorative element */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Image
                    src="/images/logo-transparent.png"
                    alt=""
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                </div>
              </Link>
              <span className="text-sm text-muted-foreground font-body px-3 py-1 bg-nature-100 dark:bg-nature-900/30 rounded-full">
                {session.user.name || (session.user as any).inatUsername}
              </span>
            </div>
            {/* TODO: Move sync button to account settings page (profile edit/deletion section)
                For now hidden - sync happens automatically on onboarding and we'll add background
                rarity classification for ongoing syncs */}
            {/* <SyncButton
              userId={(session.user as any).id}
              inatUsername={(session.user as any).inatUsername}
              accessToken={(session as any).accessToken}
            /> */}
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <ClientErrorBoundary>
          {children}
        </ClientErrorBoundary>
      </main>

      {/* Sync Progress Toast */}
      <SyncProgress />

      {/* Background Classification Progress Bubble */}
      <BackgroundClassificationBubble />
    </div>
  );
}
