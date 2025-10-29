'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Trophy, Target, LogOut, Compass, BookOpen } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/quest', label: 'Quest', icon: Target },
    { href: '/adventure', label: 'Adventure', icon: Compass },
    { href: '/profile', label: 'Profile', icon: Trophy },
    { href: '/journal', label: 'Journal', icon: BookOpen },
  ];

  return (
    <nav className="flex items-center gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        // Check if current path starts with this section (handles nested routes)
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              isActive
                ? 'bg-nature-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden md:inline">{label}</span>
          </Link>
        );
      })}
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
