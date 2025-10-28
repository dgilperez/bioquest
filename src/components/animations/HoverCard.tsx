'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cardHover } from '@/lib/animations/variants';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function HoverCard({
  children,
  className = '',
  href,
  onClick,
  disabled = false,
}: HoverCardProps) {
  const Component = motion.div;

  const baseClasses = `relative rounded-lg transition-colors ${className}`;

  if (disabled) {
    return <div className={baseClasses}>{children}</div>;
  }

  return (
    <Component
      className={baseClasses}
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ cursor: onClick || href ? 'pointer' : 'default' }}
    >
      {children}
    </Component>
  );
}
