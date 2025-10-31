'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  illustration?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Icon or Illustration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1,
        }}
        className="mb-6"
      >
        {illustration || (
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Icon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
          </div>
        )}
      </motion.div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-body max-w-md mb-6">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={action.onClick}
          className={`px-6 py-3 rounded-lg font-display font-semibold transition-colors min-h-[44px] touch-manipulation ${
            action.variant === 'secondary'
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
              : 'bg-nature-600 hover:bg-nature-700 text-white'
          }`}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
