'use client';

import { useEffect, useState } from 'react';
import { Badge, BadgeDefinition } from '@/types';
import { cn } from '@/lib/utils';

interface BadgeUnlockAnimationProps {
  badge: Badge | BadgeDefinition;
  onComplete?: () => void;
}

export function BadgeUnlockAnimation({ badge, onComplete }: BadgeUnlockAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShow(true), 100);

    // Auto-hide after animation
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => onComplete?.(), 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300',
        show ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className={cn(
          'relative transform transition-all duration-500',
          show ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
        )}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-50 animate-pulse" />

        {/* Badge card */}
        <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 shadow-2xl border-4 border-yellow-300">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">Badge Unlocked!</h2>
            <h3 className="text-xl font-semibold text-yellow-100 mb-3">{badge.name}</h3>
            <p className="text-white/90 max-w-xs">{badge.description}</p>
          </div>
        </div>

        {/* Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            >
              ✨
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
