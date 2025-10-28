'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Trophy, Eye, Target, BarChart3, Users, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/observations', label: 'Observations', icon: Eye },
    { href: '/stats', label: 'Statistics', icon: BarChart3 },
    { href: '/badges', label: 'Badges', icon: Trophy },
    { href: '/quests', label: 'Quests', icon: Target },
    { href: '/leaderboards', label: 'Leaderboards', icon: Users },
  ];

  return (
    <nav className="flex items-center gap-1">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            pathname === href
              ? 'bg-nature-600 text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden md:inline">{label}</span>
        </Link>
      ))}
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden md:inline">Sign Out</span>
      </button>
    </nav>
  );
}
