import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { Toaster } from '@/components/notifications/Toaster';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
