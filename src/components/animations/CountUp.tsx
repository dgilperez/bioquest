'use client';

import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';

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

  const { number } = useSpring({
    from: { number: previousValue.current },
    number: value,
    config: {
      duration,
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
