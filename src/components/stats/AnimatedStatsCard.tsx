'use client';

import { motion } from 'framer-motion';
import { CountUp } from '@/components/animations/CountUp';
import { staggerItem } from '@/lib/animations/variants';

interface AnimatedStatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'gray';
  index?: number;
}

const colorConfig = {
  blue: {
    bg: 'from-blue-500/10 to-blue-600/10',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    glow: '0 0 20px rgba(59, 130, 246, 0.3)',
  },
  green: {
    bg: 'from-green-500/10 to-green-600/10',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-600 dark:text-green-400',
    glow: '0 0 20px rgba(34, 197, 94, 0.3)',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/10',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
    glow: '0 0 20px rgba(168, 85, 247, 0.3)',
  },
  yellow: {
    bg: 'from-yellow-500/10 to-yellow-600/10',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-600 dark:text-yellow-400',
    glow: '0 0 20px rgba(234, 179, 8, 0.3)',
  },
  gray: {
    bg: 'from-gray-500/10 to-gray-600/10',
    border: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    glow: '0 0 20px rgba(107, 114, 128, 0.3)',
  },
};

export function AnimatedStatsCard({ title, value, icon, color, index = 0 }: AnimatedStatsCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{
        scale: 1.05,
        y: -8,
        boxShadow: config.glow,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-lg border ${config.border} bg-gradient-to-br ${config.bg} p-6 cursor-pointer`}
    >
      <motion.div
        className="text-4xl mb-3"
        whileHover={{
          rotate: [0, -3, 3, -3, 0],
          scale: [1, 1.1, 1.1, 1.1, 1],
          transition: {
            duration: 0.8,
            ease: 'easeInOut',
            times: [0, 0.2, 0.4, 0.6, 1],
          },
        }}
      >
        {icon}
      </motion.div>
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className={`text-3xl font-display font-bold ${config.text}`}>
        <CountUp value={value} duration={1500} />
      </p>
    </motion.div>
  );
}
