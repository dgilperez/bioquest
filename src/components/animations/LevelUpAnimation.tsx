'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LevelUpAnimationProps {
  newLevel: number;
  levelTitle: string;
  onComplete?: () => void;
}

export function LevelUpAnimation({ newLevel, levelTitle, onComplete }: LevelUpAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShow(true), 100);

    // Auto-hide after animation
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => onComplete?.(), 300);
    }, 3500);

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
          'relative transform transition-all duration-700',
          show ? 'scale-100 translate-y-0' : 'scale-50 translate-y-20'
        )}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-60 animate-pulse" />

        {/* Level card */}
        <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl p-12 shadow-2xl border-4 border-purple-300">
          <div className="text-center">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4 tracking-wider">
              LEVEL UP!
            </h2>
            <div className="text-6xl font-black text-yellow-300 mb-2 drop-shadow-lg">
              {newLevel}
            </div>
            <p className="text-2xl font-semibold text-white/90">{levelTitle}</p>
          </div>
        </div>

        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-3xl animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '2s',
              }}
            >
              {['🎊', '🎉', '⭐', '✨', '🌟'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>

        {/* Rays of light */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
              style={{
                transform: `rotate(${i * 45}deg)`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
