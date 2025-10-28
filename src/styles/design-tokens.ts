/**
 * BioQuest Design System Tokens
 * Nature-themed color palette and design constants for game feel
 */

export const BIOQUEST_COLORS = {
  // Primary Nature Palette - Inspired by forest ecosystems
  nature: {
    moss: '#2D5016',      // Deep forest floor
    fern: '#4A7C30',      // Mid-tone foliage
    leaf: '#6BA644',      // Bright new growth
    spring: '#8BC34A',    // Fresh spring green
    meadow: '#AED581',    // Light grassland
    mist: '#DCEDC8',      // Morning fog
  },

  // Rarity System - Inspired by natural phenomena
  rarity: {
    common: {
      base: '#78909C',    // River stone
      glow: '#B0BEC5',
      particle: '#CFD8DC',
    },
    rare: {
      base: '#7B1FA2',    // Orchid purple
      glow: '#BA68C8',
      particle: '#E1BEE7',
    },
    legendary: {
      base: '#F57C00',    // Sunset amber
      glow: '#FFB74D',
      particle: '#FFE0B2',
    },
    mythic: {             // New tier for "first ever" discoveries
      base: '#0288D1',    // Bioluminescent blue
      glow: '#4FC3F7',
      particle: '#B3E5FC',
    }
  },

  // Badge Tiers - Natural materials
  badge: {
    bronze: {
      primary: '#8D6E63',
      secondary: '#A1887F',
      shimmer: '#BCAAA4',
    },
    silver: {
      primary: '#90A4AE',
      secondary: '#B0BEC5',
      shimmer: '#ECEFF1',
    },
    gold: {
      primary: '#F9A825',
      secondary: '#FDD835',
      shimmer: '#FFF59D',
    },
    platinum: {
      primary: '#5E35B1',
      secondary: '#7E57C2',
      shimmer: '#B39DDB',
    }
  },

  // Seasonal Themes (future enhancement)
  seasons: {
    spring: { primary: '#8BC34A', accent: '#FFEB3B' },
    summer: { primary: '#FFC107', accent: '#4CAF50' },
    autumn: { primary: '#FF6F00', accent: '#D84315' },
    winter: { primary: '#0288D1', accent: '#B0BEC5' },
  }
} as const;

// Animation timing constants
export const ANIMATION_DURATIONS = {
  micro: 150,           // Micro-interactions (hover, focus)
  fast: 250,            // Fast transitions
  normal: 300,          // Standard transitions
  slow: 500,            // Slow, emphasized transitions
  celebration: 1500,    // Badge unlocks, level ups
  ambient: 3000,        // Background/ambient animations
} as const;

// Spring physics configurations
export const SPRING_CONFIGS = {
  // Gentle, natural movement
  gentle: {
    type: 'spring' as const,
    stiffness: 120,
    damping: 14,
  },

  // Bouncy, playful
  bouncy: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 20,
  },

  // Snappy, responsive
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },

  // Wobbly, fun
  wobbly: {
    type: 'spring' as const,
    stiffness: 180,
    damping: 12,
  },

  // Slow, smooth
  smooth: {
    type: 'spring' as const,
    stiffness: 80,
    damping: 20,
  },
} as const;

// Easing curves
export const EASINGS = {
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  easeInOut: [0.87, 0, 0.13, 1],
  anticipate: [0.36, 0, 0.66, -0.56],
  backOut: [0.34, 1.56, 0.64, 1],
  circOut: [0, 0.55, 0.45, 1],
} as const;

// Spacing scale
export const SPACING = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
} as const;

// Border radius
export const RADIUS = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Shadows for depth
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  glow: {
    common: '0 0 20px rgba(120, 144, 156, 0.3)',
    rare: '0 0 30px rgba(123, 31, 162, 0.4)',
    legendary: '0 0 40px rgba(245, 124, 0, 0.5)',
    mythic: '0 0 50px rgba(2, 136, 209, 0.6)',
  }
} as const;

// Typography scale
export const FONT_SIZES = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
} as const;

// Font weights
export const FONT_WEIGHTS = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

// Z-index scale
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
  celebration: 9999,
} as const;

// Particle system configs
export const PARTICLE_CONFIGS = {
  common: {
    count: 20,
    colors: [BIOQUEST_COLORS.rarity.common.base, BIOQUEST_COLORS.rarity.common.glow],
    spread: 50,
    lifetime: 1000,
  },
  rare: {
    count: 50,
    colors: [BIOQUEST_COLORS.rarity.rare.base, BIOQUEST_COLORS.rarity.rare.glow],
    spread: 80,
    lifetime: 1500,
  },
  legendary: {
    count: 100,
    colors: [BIOQUEST_COLORS.rarity.legendary.base, BIOQUEST_COLORS.rarity.legendary.glow],
    spread: 120,
    lifetime: 2000,
  },
  mythic: {
    count: 150,
    colors: [BIOQUEST_COLORS.rarity.mythic.base, BIOQUEST_COLORS.rarity.mythic.glow],
    spread: 160,
    lifetime: 2500,
  },
} as const;

// Helper function to get rarity config
export function getRarityConfig(rarity: 'common' | 'rare' | 'legendary' | 'mythic' | 'normal') {
  // Map 'normal' to 'common' for consistency
  const rarityKey = rarity === 'normal' ? 'common' : rarity;
  return {
    colors: BIOQUEST_COLORS.rarity[rarityKey],
    particles: PARTICLE_CONFIGS[rarityKey],
    shadow: SHADOWS.glow[rarityKey],
  };
}
