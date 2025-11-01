import type { Metadata, Viewport } from 'next';
import { Outfit, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { AutoSyncProvider } from '@/components/sync/AutoSyncProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { Toaster } from '@/components/notifications/Toaster';
import { SyncStatus } from '@/components/sync/SyncStatus';

// Display font - Bold, adventurous for headlines
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Body font - Clean, readable for content
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#588157' },
    { media: '(prefers-color-scheme: dark)', color: '#3a5a40' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'BioQuest - Gamified Nature Exploration',
    template: '%s | BioQuest',
  },
  description:
    'Transform your iNaturalist observations into an engaging game. Earn points, unlock badges, complete quests, and discover rare species.',
  keywords: [
    'iNaturalist',
    'biodiversity',
    'nature',
    'citizen science',
    'gamification',
    'wildlife',
    'species identification',
  ],
  authors: [{ name: 'BioQuest Team' }],
  creator: 'BioQuest',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'BioQuest - Gamified Nature Exploration',
    description: 'Transform your iNaturalist observations into an engaging game',
    siteName: 'BioQuest',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BioQuest - Gamified Nature Exploration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BioQuest',
    description: 'Transform your iNaturalist observations into an engaging game',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/icon-192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/icon-512.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className="font-body antialiased">
        <QueryProvider>
          <SessionProvider>
            <AutoSyncProvider>
              {children}
              <Toaster />
              <InstallPrompt />
              <OfflineIndicator />
              <SyncStatus />
            </AutoSyncProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
