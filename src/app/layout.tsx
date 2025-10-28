import type { Metadata } from 'next';
import { Outfit, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { AutoSyncProvider } from '@/components/sync/AutoSyncProvider';
import { Toaster } from '@/components/notifications/Toaster';

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BioQuest',
    description: 'Transform your iNaturalist observations into an engaging game',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
        <SessionProvider>
          <AutoSyncProvider>
            {children}
            <Toaster />
          </AutoSyncProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
