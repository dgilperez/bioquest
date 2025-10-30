# Logo Integration Guide

## Philosophy

The BioQuest logo is an organic, illustrative piece featuring intertwined botanical elements. Rather than treating it as a simple icon to drop everywhere, we integrate it thoughtfully into the design:

1. **Transparent versions** blend with any background
2. **Watermark versions** create ambient decorative elements
3. **Subtle presence** in navigation, prominent in landing/onboarding
4. **Organic placement** with glow effects, layering, and natural positioning

## Logo Assets

All logo variants are generated from the original `public/images/logo.png`:

### Primary Versions
- **`logo.png`** (2.6MB) - Original with cream background, square format
- **`logo-transparent.png`** (3.0MB) - No background, blends with any surface
- **`logo-circle.png`** (1.5MB) - Circular crop for tight spaces

### Specialized Versions
- **`logo-nav.png`** (8KB) - 48x48 small icon for navigation
- **`logo-nav@2x.png`** (28KB) - 96x96 retina version
- **`logo-watermark.png`** (364KB) - 8% opacity for decorative backgrounds

### Regenerating Assets

Run the processing script anytime the source logo changes:

```bash
./scripts/process-logo.sh
```

## Usage Patterns

### 1. Navigation (Dashboard Header)

**Approach**: Minimal, text-focused with subtle decorative hint

```tsx
<Link href="/dashboard" className="group relative">
  <h1 className="text-2xl md:text-3xl font-display font-bold
                 bg-gradient-to-r from-nature-600 to-nature-800
                 bg-clip-text text-transparent
                 transition-all group-hover:tracking-wide">
    BioQuest
  </h1>
  {/* Tiny decorative element */}
  <div className="absolute -left-6 top-1/2 -translate-y-1/2
                  w-4 h-4 opacity-60 group-hover:opacity-100">
    <Image src="/images/logo-transparent.png" width={16} height={16} />
  </div>
</Link>
```

**Why**: The header is functional space - logo shouldn't dominate. The tiny transparent version provides brand continuity without clutter.

### 2. Landing Page (Hero)

**Approach**: Prominent logo with watermark background layer

```tsx
<div className="text-center space-y-6 relative">
  {/* Decorative watermark layer */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2
                  -translate-y-1/4 w-96 h-96 pointer-events-none">
    <Image
      src="/images/logo-watermark.png"
      width={384}
      height={384}
      className="opacity-40 dark:opacity-20"
    />
  </div>

  {/* Main logo */}
  <div className="relative flex justify-center mb-8">
    <Image
      src="/images/logo-transparent.png"
      width={180}
      height={180}
      priority
      className="drop-shadow-2xl"
    />
  </div>

  <h1>Welcome to <span className="text-nature-600">BioQuest</span></h1>
</div>
```

**Why**: Landing page can be immersive. Layered watermark creates depth, main logo commands attention.

### 3. Sign In Page

**Approach**: Decorative watermarks in corners + centered logo

```tsx
<div className="relative overflow-hidden">
  {/* Corner decorations */}
  <div className="absolute top-10 right-10 w-64 h-64
                  opacity-20 dark:opacity-10 pointer-events-none">
    <Image src="/images/logo-watermark.png" width={256} height={256} />
  </div>
  <div className="absolute bottom-10 left-10 w-64 h-64
                  opacity-20 dark:opacity-10 pointer-events-none rotate-180">
    <Image src="/images/logo-watermark.png" width={256} height={256} />
  </div>

  {/* Main content with logo */}
  <div className="relative z-10">
    <Image
      src="/images/logo-transparent.png"
      width={140}
      height={140}
      className="drop-shadow-2xl"
    />
    <h1>Welcome to BioQuest</h1>
  </div>
</div>
```

**Why**: Corner watermarks create organic, natural framing without overwhelming the sign-in form.

### 4. Onboarding Welcome

**Approach**: Animated logo with ambient glow

```tsx
<div className="relative">
  {/* Ambient glow behind logo */}
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 0.3, scale: 1.2 }}
    transition={{ duration: 1 }}
    className="absolute w-96 h-96 bg-nature-400
               rounded-full blur-3xl"
  />

  {/* Logo with entrance animation */}
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', duration: 0.8 }}
  >
    <Image
      src="/images/logo-transparent.png"
      width={160}
      height={160}
      priority
    />
  </motion.div>
</div>
```

**Why**: First impression moment deserves drama. Glow effect creates energy, rotation animation mirrors the spiral motifs in the logo itself.

## Design Principles

### DO ✅
- Use transparent versions on colored backgrounds
- Layer watermarks for depth and ambiance
- Let the logo breathe - generous whitespace
- Match animations to logo's organic nature (spirals, springs)
- Use drop-shadow for depth, not borders
- Responsive sizing (smaller on mobile)

### DON'T ❌
- Don't use the cream-background version on non-cream surfaces
- Don't place logo in a box/border (it's already organic)
- Don't use the full logo at tiny sizes (use icon versions)
- Don't compete with logo - keep surrounding content simple
- Don't distort aspect ratio
- Don't overlay text directly on the logo

## Accessibility

- Always provide `alt` text for main logo instances
- Use empty `alt=""` for decorative watermarks
- Ensure logo doesn't obscure interactive elements
- Watermarks use `pointer-events-none` to avoid blocking clicks
- Maintain sufficient contrast with backgrounds

## Performance

- Use `priority` loading on above-the-fold logos (landing, sign-in)
- Lazy load watermark decorations
- Next.js Image component auto-optimizes all versions
- Watermark is low-opacity so highly compressible

## Ambient Background Watermarks

For a truly immersive experience, add **super subtle** watermarks throughout the app:

### Using the Component

```tsx
import { AmbientLogo, AmbientLogoSet } from '@/components/ui/AmbientLogo';

// Single watermark
<AmbientLogo position="top-right" size={400} opacity={3} rotate={12} />

// Multiple watermarks (preset)
<AmbientLogoSet />

// Custom positioning
<AmbientLogo
  position="top-1/4 right-1/3"
  size={350}
  opacity={2}
  rotate={-15}
/>
```

### Opacity Guidelines

The key is to make them **barely visible** - they should create ambiance, not distraction:

- **Dashboard/Content areas**: opacity 2-3% (almost imperceptible)
- **Landing pages**: opacity 4-5% (slightly more present)
- **Sign in/Onboarding**: opacity 10-20% (visible but not dominant)
- **Dark mode**: Automatically 33% less opacity

### Placement Strategy

- **Fixed positioning**: Watermarks stay in place as user scrolls
- **Multiple layers**: Use 2-3 watermarks at different sizes/rotations
- **Vary rotation**: ±12-45° for organic feel
- **Corner anchoring**: Top-right, bottom-left creates diagonal flow
- **Center subtle**: Large center watermark at very low opacity for depth

### Example: Dashboard Background

```tsx
<div className="min-h-screen relative overflow-x-hidden">
  {/* Subtle ambient watermarks */}
  <AmbientLogo position="top-right" size={400} rotate={12} opacity={3} />
  <AmbientLogo position="bottom-left" size={350} rotate={-12} opacity={3} />
  <AmbientLogo position="center" size={600} opacity={2} />

  {/* Main content */}
  <main className="relative z-10">
    {children}
  </main>
</div>
```

The watermarks create a **nature-inspired atmosphere** - like dappled sunlight through leaves, present but not demanding attention.

## Brand Consistency

The logo represents:
- **Nature & Biodiversity**: Mushrooms, ferns, flora
- **Interconnection**: Spiraling, intertwined elements
- **Organic Growth**: Hand-drawn, not geometric
- **Exploration**: Diverse species in one ecosystem

Keep this spirit in all implementations - the logo should feel like it grew into the design, not dropped onto it. The ambient watermarks reinforce this by making the logo feel **woven into the fabric** of every page.
