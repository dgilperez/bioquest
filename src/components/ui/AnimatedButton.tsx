'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { buttonPress, buttonHover } from '@/lib/animations/variants';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: AnimatedButtonProps) {
  const baseClasses = 'font-display font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-nature-500 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-nature-600 hover:bg-nature-700 text-white shadow-md',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-md',
    outline: 'border-2 border-nature-600 text-nature-600 hover:bg-nature-50 dark:hover:bg-nature-900/20',
    ghost: 'text-nature-600 hover:bg-nature-100 dark:hover:bg-nature-900/20',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      variants={buttonHover}
      initial="rest"
      whileHover={disabled || loading ? undefined : 'hover'}
      whileTap={disabled || loading ? undefined : { scale: 0.95 }}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            ⚙️
          </motion.span>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
