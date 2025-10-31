'use client';

import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  value,
  duration = 1000,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
}: CountUpProps) {
  const previousValue = useRef(0);
  const reducedMotion = useReducedMotion();

  const { number } = useSpring({
    from: { number: reducedMotion ? value : previousValue.current },
    number: value,
    config: {
      duration: reducedMotion ? 0 : duration,
      easing: (t: number) => {
        // Ease out cubic
        return 1 - Math.pow(1 - t, 3);
      },
    },
  });

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  return (
    <animated.span className={className}>
      {number.to((n) => `${prefix}${n.toFixed(decimals)}${suffix}`)}
    </animated.span>
  );
}
