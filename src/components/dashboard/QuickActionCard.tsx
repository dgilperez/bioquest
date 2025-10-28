'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface QuickActionCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  index: number;
}

export function QuickActionCard({ href, icon, title, description, index }: QuickActionCardProps) {
  return (
    <Link href={href} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.8 + index * 0.1,
          type: 'spring',
          stiffness: 200,
          damping: 20,
        }}
        whileHover={{
          scale: 1.05,
          y: -8,
          boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)',
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.98 }}
        className="p-6 rounded-xl border bg-white dark:bg-gray-800 hover:bg-gradient-to-br hover:from-nature-50 hover:to-white dark:hover:from-gray-800 dark:hover:to-gray-700 transition-colors relative overflow-hidden group"
      >
        {/* Background Glow Effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 195, 74, 0.1) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10">
          {/* Animated Icon */}
          <motion.div
            className="text-4xl mb-3"
            whileHover={{
              scale: [1, 1.2, 1.1],
              rotate: [0, -10, 5, 0],
              transition: { duration: 0.5 },
            }}
          >
            {icon}
          </motion.div>

          <p className="font-display font-semibold text-lg mb-1">{title}</p>
          <p className="text-sm text-muted-foreground font-body">{description}</p>

          {/* Arrow Indicator */}
          <motion.div
            className="absolute top-4 right-4 text-nature-600 opacity-0 group-hover:opacity-100"
            initial={{ x: -10 }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}
