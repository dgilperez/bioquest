# Badge Icon Generation Guide

## Overview

This document outlines the strategy for creating consistent, animated SVG badge icons for BioQuest's gamification system.

## Current State

### Implemented Icons

**Rarity Icons** (`src/components/icons/rarity/`)
- ✅ CircleIcon (Common) - Subtle pulse, gray gradient
- ✅ DiamondShapeIcon (Uncommon) - Blue shimmer, gentle pulse
- ✅ GemIcon (Rare) - Purple hexagonal gem, rotating facets
- ✅ StarIcon (Epic) - Golden 5-pointed star, continuous rotation
- ✅ SparklesIcon (Legendary) - 5 twinkling sparkles, golden glow
- ✅ DiamondIcon (Mythic) - Rainbow gradient, rotating facets, cascading sparkles

**Taxonomic Icons** (`src/components/icons/animated/`)
- ✅ MammaliaIcon - Deer with head bobbing, antler shaking, ear twitching
- ✅ AmphibiaIcon - Frog with hopping, throat pulsing, eye blinking

### Animation Strategy

**Hover-Triggered (Default):**
- Educational contexts (RarityLegend, XPCalculator)
- UI elements in lists/cards
- Navigation elements

**Always-Animated (Celebrations):**
- Badge unlock ceremonies - Use `<RarityBadge rarity="mythic" animated={true} />`
- Level up screens
- Quest completion modals
- Rare species discovery alerts
- Achievement notifications

## Badge Icon Requirements

### Needed Badge Collections

1. **Milestone Badges**
   - First Steps (10 observations)
   - Dedicated Observer (100 observations)
   - Master Naturalist (1000 observations)
   - Legend (5000+ observations)

2. **Taxon Explorer Badges**
   - Bird Watcher (10+ bird species)
   - Botanist (10+ plant species)
   - Entomologist (10+ insect species)
   - Herpetologist (10+ reptile/amphibian species)
   - Mycologist (10+ fungi species)
   - Marine Biologist (10+ marine species)

3. **Rarity Hunter Badges**
   - Rare Find (first rare observation)
   - Legendary Hunter (10+ rare observations)
   - Mythic Seeker (first mythic observation)

4. **Geography Badges**
   - Explorer (5+ locations)
   - Traveler (10+ locations)
   - Globetrotter (25+ locations)

5. **Time/Seasonal Badges**
   - 7-Day Streak
   - 30-Day Streak
   - 365-Day Streak
   - Spring Observer
   - Summer Observer
   - Fall Observer
   - Winter Observer

6. **Challenge/Quest Badges**
   - Quest Completer
   - Challenge Master
   - Speedrunner (quest completed in record time)

7. **Secret/Special Badges**
   - Early Adopter
   - Community Helper (helping with IDs)
   - First in Region
   - First Global Observation

## AI Icon Generation Tools

### Recommended: Recraft AI ⭐
- **URL:** https://www.recraft.ai/
- **Best For:** Creating entire badge collections with consistent style
- **Workflow:**
  1. Define a custom style preset
  2. Generate all badges in that style
  3. Export as SVG
  4. Convert to animated React components
- **Pros:**
  - Style consistency across entire collection
  - Production-quality SVG output
  - Free tier available
  - Best for 20-50+ icons

### Alternative: text2icon.app
- **URL:** https://text2icon.app/
- **Best For:** Quick individual badge designs
- **Pros:**
  - Fast generation
  - Professional SVG output
  - Good for one-offs

### Alternative: SVG AI
- **URL:** https://www.svgai.org/
- **Best For:** Brand-consistent icons with specific hex colors
- **Pros:**
  - Clean vector paths
  - Exact color control (#2D5016, etc.)
  - Scalable output

### Alternative: Freepik AI Icon Generator
- **URL:** https://www.freepik.com/ai/icon-generator
- **Best For:** Larger sets with unified aesthetic
- **Pros:**
  - Custom style feature
  - Commercial use allowed
  - Good variety

## BioQuest Badge Style Guidelines

### Visual Style

**Core Aesthetic:**
- Nature-themed flat design
- 2px rounded strokes
- Organic, flowing shapes
- Friendly and approachable
- Minimalist (not cluttered)
- Suitable for gamification

**Color Palette:**
```css
/* Primary Nature Colors */
--badge-forest-green: #2D5016;
--badge-sage-green: #4A7C59;
--badge-earth-brown: #8B7355;
--badge-sand: #D4A574;

/* Accent Colors */
--badge-sky-blue: #60a5fa;
--badge-sunset-orange: #F9A825;
--badge-amethyst: #a855f7;
--badge-coral: #ec4899;
```

### Prompt Template for Recraft AI

```
Style Definition:
"Flat design icon, nature-themed, 2px rounded stroke, organic shapes,
earth tone palette (#2D5016, #4A7C59, #8B7355, #D4A574),
minimalist, friendly, suitable for gamification badge,
clean SVG vector, no background"

Individual Badge Prompts:
- First Steps: "footprints on nature trail, simple"
- Observer: "binoculars with leaf accent"
- Taxonomist: "classification tree diagram with species branches"
- Photographer: "camera with butterfly on lens"
- 7-Day Streak: "flame with 7 leaves"
- Bird Watcher: "bird silhouette in circular frame"
- Botanist: "flower with classification tag"
- Rare Find: "magnifying glass over rare gem"
- Explorer: "compass with nature elements"
```

## Implementation Workflow

### 1. Generate Badge SVGs with Recraft AI

1. Create account at https://www.recraft.ai/
2. Define custom style (use prompt above)
3. Generate all needed badges in batch
4. Download SVGs

### 2. Organize Files

```bash
src/components/icons/badges/
├── index.ts                    # Export all badge icons
├── milestone/
│   ├── FirstStepsBadge.tsx
│   ├── DedicatedObserverBadge.tsx
│   └── MasterNaturalistBadge.tsx
├── taxon/
│   ├── BirdWatcherBadge.tsx
│   ├── BotanistBadge.tsx
│   └── EntomologistBadge.tsx
├── rarity/
│   ├── RareFinderBadge.tsx
│   └── LegendaryHunterBadge.tsx
├── geography/
│   ├── ExplorerBadge.tsx
│   └── TravelerBadge.tsx
├── streak/
│   ├── Streak7Badge.tsx
│   ├── Streak30Badge.tsx
│   └── Streak365Badge.tsx
└── special/
    ├── EarlyAdopterBadge.tsx
    └── FirstRegionalBadge.tsx
```

### 3. Convert SVG to Animated React Component

**Template:**

```typescript
'use client';

import { motion } from 'framer-motion';

interface BadgeIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function FirstStepsBadge({
  size = 64,
  className = '',
  animate = true
}: BadgeIconProps) {
  // Define animation variants
  const glowVariants = {
    idle: {
      opacity: [0.2, 0.4, 0.2],
      scale: [1, 1.1, 1],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const iconVariants = {
    idle: {
      scale: [1, 1.05, 1],
      rotate: [0, 2, 0, -2, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
    >
      <defs>
        {/* Gradients from Recraft AI output */}
        <linearGradient id="badge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2D5016" />
          <stop offset="100%" stopColor="#4A7C59" />
        </linearGradient>
      </defs>

      {/* Outer glow (only if animated) */}
      {animate && (
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          fill="url(#badge-gradient)"
          opacity="0.2"
          variants={glowVariants}
          animate="idle"
        />
      )}

      {/* Main badge icon (paste paths from Recraft AI SVG) */}
      <motion.g
        animate={animate ? 'idle' : undefined}
        variants={iconVariants}
      >
        {/* SVG paths from Recraft AI go here */}
        <path
          d="M... (paths from generated SVG)"
          fill="url(#badge-gradient)"
          stroke="#fff"
          strokeWidth="1"
        />
      </motion.g>
    </motion.svg>
  );
}
```

### 4. Update Badge Components

**Update `src/components/badges/BadgeCard.tsx`:**

```typescript
import { FirstStepsBadge } from '@/components/icons/badges/milestone/FirstStepsBadge';
import { BirdWatcherBadge } from '@/components/icons/badges/taxon/BirdWatcherBadge';
// ... import all badge icons

const badgeIconMap: Record<string, React.ComponentType<BadgeIconProps>> = {
  'first-steps': FirstStepsBadge,
  'bird-watcher': BirdWatcherBadge,
  // ... map all badges
};

export function BadgeCard({ badge }: { badge: Badge }) {
  const IconComponent = badgeIconMap[badge.id] || DefaultBadgeIcon;

  return (
    <div className="badge-card">
      <IconComponent size={64} animate={badge.unlocked} />
      {/* ... rest of card */}
    </div>
  );
}
```

### 5. Use in Celebrations

```typescript
import { RareFinderBadge } from '@/components/icons/badges/rarity/RareFinderBadge';

export function BadgeUnlockCelebration({ badge }: Props) {
  return (
    <motion.div>
      <RareFinderBadge size={128} animate={true} />
      <h2>{badge.name} Unlocked!</h2>
    </motion.div>
  );
}
```

## Animation Patterns

### For Milestone Badges
- **Subtle pulse:** Scale 1.0 → 1.05 → 1.0 (3s loop)
- **Gentle glow:** Opacity 0.2 → 0.4 → 0.2
- **Small rotation wobble:** ±2 degrees

### For Achievement Badges
- **Shine effect:** Sweeping light across badge
- **Particle sparkles:** Small dots appearing/disappearing
- **Color shift:** Subtle hue rotation

### For Streak Badges
- **Flame flicker:** For fire/streak elements
- **Pulsing intensity:** Faster pulse for longer streaks
- **Glow strength:** Stronger glow = longer streak

### For Rare/Special Badges
- **Complex animations:** Multiple moving parts
- **Rainbow gradients:** For mythic/legendary badges
- **Cascading effects:** Sparkles, stars, confetti-like elements

## Performance Considerations

1. **Lazy load badge icons:** Don't load all 50+ badge icons on initial page load
2. **Disable animations on mobile:** Save battery
3. **Use CSS transforms:** GPU-accelerated animations
4. **Limit animation complexity:** Max 3-4 animated elements per badge
5. **Debounce hover animations:** Prevent animation spam

## Next Steps

- [ ] Generate initial 10 milestone badges with Recraft AI
- [ ] Convert first badge to animated React component (establish pattern)
- [ ] Create badge icon mapper utility
- [ ] Update BadgeCard to use new icons
- [ ] Test animations in celebration contexts
- [ ] Generate remaining badge collections
- [ ] Document specific animation patterns per badge category
- [ ] Add badge icon selection UI to badge management

## References

- **Recraft AI:** https://www.recraft.ai/
- **Framer Motion Docs:** https://www.framer.com/motion/
- **SVG Animation Guide:** https://css-tricks.com/guide-svg-animations-smil/
- **Existing Implementation:** `src/components/icons/rarity/` (reference for animation patterns)
