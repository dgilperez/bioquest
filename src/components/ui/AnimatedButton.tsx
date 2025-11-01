'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState, MouseEvent } from 'react';
import { buttonHover } from '@/lib/animations/variants';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  showRipple?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  showRipple = true,
}: AnimatedButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    if (showRipple) {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const newRipple: Ripple = {
        id: Date.now(),
        x,
        y,
        size,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.();
  };

  const baseClasses = 'relative overflow-hidden font-display font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-nature-500 focus:ring-offset-2';

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
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <LoadingSpinner size={size} />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </span>
    </motion.button>
  );
}

function LoadingSpinner({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const spinnerSize = {
    sm: 14,
    md: 16,
    lg: 20,
  }[size];

  return (
    <motion.svg
      width={spinnerSize}
      height={spinnerSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="40 20"
        opacity="0.8"
      />
    </motion.svg>
  );
}
