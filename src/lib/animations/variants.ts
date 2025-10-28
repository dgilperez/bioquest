/**
 * Reusable Framer Motion animation variants
 * for consistent animations across the app
 */

import { Variants } from 'framer-motion';
import { ANIMATION_DURATIONS, SPRING_CONFIGS, EASINGS } from '@/styles/design-tokens';

// Fade animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
    },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_CONFIGS.gentle,
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_CONFIGS.gentle,
  },
};

// Scale animations
export const scaleIn: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: SPRING_CONFIGS.bouncy,
  },
};

export const scaleInBounce: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: SPRING_CONFIGS.wobbly,
  },
};

// Card animations
export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
      ease: EASINGS.easeOut,
    },
  },
};

export const cardReveal: Variants = {
  hidden: {
    rotateY: 180,
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    rotateY: 0,
    scale: 1,
    opacity: 1,
    transition: SPRING_CONFIGS.bouncy,
  },
};

// Button animations
export const buttonPress: Variants = {
  rest: { scale: 1 },
  pressed: {
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATIONS.micro / 1000,
    },
  },
};

export const buttonHover: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  hover: {
    scale: 1.05,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
    },
  },
};

// Stagger children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_CONFIGS.gentle,
  },
};

// Badge unlock animation
export const badgeUnlock: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    rotate: -180,
  },
  visible: {
    scale: [0, 1.2, 1],
    opacity: 1,
    rotate: 0,
    transition: {
      duration: ANIMATION_DURATIONS.celebration / 1000,
      times: [0, 0.6, 1],
      ease: EASINGS.backOut,
    },
  },
};

// Level up animation
export const levelUp: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: [0, 1.5, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: ANIMATION_DURATIONS.celebration / 1000,
      times: [0, 0.5, 1],
      ease: EASINGS.anticipate,
    },
  },
};

// Shimmer effect
export const shimmer: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

// Pulse glow
export const pulseGlow: Variants = {
  initial: {
    boxShadow: '0 0 0px rgba(139, 195, 74, 0)',
  },
  animate: {
    boxShadow: [
      '0 0 0px rgba(139, 195, 74, 0)',
      '0 0 20px rgba(139, 195, 74, 0.4)',
      '0 0 0px rgba(139, 195, 74, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Floating animation
export const floating: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Page transitions
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_DURATIONS.normal / 1000,
      ease: EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: ANIMATION_DURATIONS.fast / 1000,
    },
  },
};

// Points popup
export const pointsPopup: Variants = {
  hidden: {
    opacity: 0,
    y: 0,
    scale: 0.5,
  },
  visible: {
    opacity: [0, 1, 1, 0],
    y: [0, -10, -50, -80],
    scale: [0.5, 1.2, 1, 0.8],
    transition: {
      duration: 2,
      times: [0, 0.2, 0.8, 1],
      ease: EASINGS.easeOut,
    },
  },
};

// Rarity glow variants
export const rarityGlow = {
  common: {
    initial: { boxShadow: '0 0 0px rgba(120, 144, 156, 0)' },
    animate: {
      boxShadow: [
        '0 0 0px rgba(120, 144, 156, 0)',
        '0 0 20px rgba(120, 144, 156, 0.3)',
        '0 0 0px rgba(120, 144, 156, 0)',
      ],
      transition: { duration: 2, repeat: Infinity },
    },
  },
  rare: {
    initial: { boxShadow: '0 0 0px rgba(123, 31, 162, 0)' },
    animate: {
      boxShadow: [
        '0 0 0px rgba(123, 31, 162, 0)',
        '0 0 30px rgba(123, 31, 162, 0.4)',
        '0 0 0px rgba(123, 31, 162, 0)',
      ],
      transition: { duration: 2, repeat: Infinity },
    },
  },
  legendary: {
    initial: { boxShadow: '0 0 0px rgba(245, 124, 0, 0)' },
    animate: {
      boxShadow: [
        '0 0 0px rgba(245, 124, 0, 0)',
        '0 0 40px rgba(245, 124, 0, 0.5)',
        '0 0 0px rgba(245, 124, 0, 0)',
      ],
      transition: { duration: 2, repeat: Infinity },
    },
  },
};
