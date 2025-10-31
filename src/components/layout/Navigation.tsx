'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Trophy, Target, LogOut, Compass, BookOpen } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function Navigation() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Target },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/profile', label: 'Profile', icon: Trophy },
    { href: '/tree-of-life', label: 'Tree of Life', icon: BookOpen },
  ];

  return (
    <nav className="flex items-center gap-1 relative">
      {links.map(({ href, label, icon: Icon }) => {
        // Check if current path starts with this section (handles nested routes)
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link key={href} href={href} className="relative">
            <motion.div
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors relative z-10',
                isActive
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
              )}
              whileHover={reducedMotion ? {} : { scale: 1.05 }}
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
            >
              {/* Animated background for active state */}
              {isActive && (
                <motion.div
                  layoutId={reducedMotion ? undefined : 'activeNavItem'}
                  className="absolute inset-0 bg-nature-600 rounded-lg -z-10"
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }
                  }
                />
              )}

              {/* Icon with animation */}
              <motion.div
                animate={
                  reducedMotion || !isActive
                    ? {}
                    : {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }
                }
                transition={{
                  duration: 0.5,
                  ease: 'easeInOut',
                }}
              >
                <Icon className="h-4 w-4" />
              </motion.div>

              <span className="hidden md:inline">{label}</span>
            </motion.div>
          </Link>
        );
      })}

      {/* Sign Out Button */}
      <motion.button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative overflow-hidden group"
        whileHover={reducedMotion ? {} : { scale: 1.05 }}
        whileTap={reducedMotion ? {} : { scale: 0.95 }}
      >
        {/* Hover background effect */}
        <motion.div
          className="absolute inset-0 bg-red-500/10 -z-10"
          initial={{ x: '-100%' }}
          whileHover={reducedMotion ? {} : { x: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
        />

        <motion.div
          whileHover={reducedMotion ? {} : { rotate: [0, -15, 15, -15, 0] }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.5 }}
        >
          <LogOut className="h-4 w-4" />
        </motion.div>
        <span className="hidden md:inline">Sign Out</span>
      </motion.button>
    </nav>
  );
}
