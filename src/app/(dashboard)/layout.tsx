import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Navigation } from '@/components/layout/Navigation';
import { SyncButton } from '@/components/stats/SyncButton';

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
    <div className="min-h-screen bg-gradient-to-b from-nature-50 via-white to-nature-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md dark:bg-gray-800/80 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-nature-600 to-nature-800 bg-clip-text text-transparent">
                BioQuest
              </h1>
              <span className="text-sm text-muted-foreground font-body px-3 py-1 bg-nature-100 dark:bg-nature-900/30 rounded-full">
                {session.user.name || (session.user as any).inatUsername}
              </span>
            </div>
            <SyncButton
              userId={(session.user as any).id}
              inatUsername={(session.user as any).inatUsername}
              accessToken={(session as any).accessToken}
            />
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
