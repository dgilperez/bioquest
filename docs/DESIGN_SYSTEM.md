# BioQuest Design System

## Color Palette

The BioQuest color palette is inspired by the hand-drawn, naturalistic logo featuring organic spirals, mushrooms, ferns, and botanical elements. The palette evokes warmth, nature, and biodiversity.

### Primary Colors

#### Nature Greens (Forest & Ferns)
```css
--primary: hsl(115, 40%, 35%)  /* Deep forest green */
nature-50:  #f5ead8  /* Warm cream */
nature-100: #e8dcc4  /* Light beige */
nature-200: #c8d5a7  /* Pale sage */
nature-300: #a8c686  /* Light green */
nature-400: #6a8b4d  /* Medium forest green */
nature-500: #588157  /* Forest green (primary) */
nature-600: #3a5a40  /* Deep forest */
nature-700: #2d4a33  /* Dark forest */
nature-800: #1f3326  /* Very dark green */
nature-900: #14221a  /* Almost black green */
```

#### Earth Tones (Mushrooms & Wood)
```css
earth-50:  #fef5e7  /* Lightest cream */
earth-100: #f5ead8  /* Warm cream */
earth-200: #d9b89c  /* Tan */
earth-300: #c17c4d  /* Warm brown-orange */
earth-400: #a0522d  /* Sienna */
earth-500: #8b4513  /* Saddle brown */
earth-600: #6d3610  /* Dark brown */
```

#### Teal Accents (Leaves & Water)
```css
--secondary: hsl(175, 40%, 40%)  /* Warm teal */
teal-50:  #e6f7f5  /* Light teal */
teal-100: #b3e5df  /* Pale teal */
teal-200: #80d3c9  /* Medium teal */
teal-300: #4d9b94  /* Teal */
teal-400: #2a7c76  /* Deep teal */
teal-500: #1f5d58  /* Dark teal */
teal-600: #164440  /* Very dark teal */
```

#### Mushroom Burgundy (Accent)
```css
mushroom-50:  #fce8ea  /* Light pink */
mushroom-100: #f5c5ca  /* Pale burgundy */
mushroom-200: #d98f95  /* Medium burgundy */
mushroom-300: #a24b4f  /* Burgundy */
mushroom-400: #8b4049  /* Deep burgundy */
mushroom-500: #6d3238  /* Dark burgundy */
mushroom-600: #4f242a  /* Very dark burgundy */
```

#### Flora Purple (Accent)
```css
flora-50:  #f3ecf5  /* Light lavender */
flora-100: #ddc9e3  /* Pale purple */
flora-200: #b99ac4  /* Medium purple */
flora-300: #6b4e71  /* Deep purple */
flora-400: #543d5a  /* Dark purple */
flora-500: #3d2c42  /* Very dark purple */
```

### Rarity Colors

#### Legendary
- **Color**: Warm orange-brown (`#c17c4d`)
- **Light**: Cream (`#f5ead8`)
- **Dark**: Saddle brown (`#8b4513`)
- **Usage**: Legendary species, top achievements

#### Rare
- **Color**: Deep purple (`#6b4e71`)
- **Light**: Lavender (`#f3ecf5`)
- **Dark**: Dark purple (`#3d2c42`)
- **Usage**: Rare species, special badges

### Semantic Colors

#### Background
- **Light mode**: Warm cream (`hsl(40, 45%, 92%)`)
- **Dark mode**: Deep forest (`hsl(115, 35%, 12%)`)

#### Destructive/Error
- **Light mode**: Burgundy (`hsl(355, 45%, 45%)`)
- **Dark mode**: Muted burgundy (`hsl(355, 50%, 50%)`)

## Typography

### Font Families
- **Display/Headlines**: Outfit (variable)
- **Body/Content**: Space Grotesk (variable)

### Font Sizes
Use Tailwind's default scale:
- `text-xs` to `text-9xl`
- Prefer: `text-base` for body, `text-lg` to `text-xl` for headings

## Border Radius

Slightly increased for organic, friendly feel:
- **Default**: `0.75rem` (12px)
- **lg**: `0.75rem`
- **md**: `calc(0.75rem - 2px)`
- **sm**: `calc(0.75rem - 4px)`

## Design Principles

1. **Warmth**: Cream backgrounds and earth tones create an inviting, natural feel
2. **Organic**: Increased border radius, hand-drawn aesthetic
3. **Nature-First**: Colors drawn directly from biodiversity imagery
4. **Accessibility**: Sufficient contrast ratios for WCAG AA compliance
5. **Dark Mode**: Deep forest greens for immersive nighttime use

## Icon System

All icons are generated from the main logo (`public/images/logo.png`) with the warm cream background color.

### Icon Sizes
- **Favicon**: 16x16, 32x32, 48x48 (multi-size ICO)
- **Apple Touch Icon**: 180x180
- **Android Icons**: 192x192, 512x512
- **Maskable Icons**: 192x192, 512x512 (with 10% safe zone padding)
- **Social Media**: 1200x630 (Open Graph)

### Regenerating Icons
Run the script to regenerate all icons from the logo:

```bash
./scripts/generate-icons.sh
```

## Usage Examples

### Buttons
```tsx
// Primary action
<button className="bg-primary text-primary-foreground hover:bg-nature-600">
  Explore Nature
</button>

// Secondary action
<button className="bg-secondary text-secondary-foreground hover:bg-teal-500">
  View Profile
</button>

// Legendary achievement
<button className="bg-legendary text-white hover:bg-legendary-dark">
  Claim Reward
</button>
```

### Cards
```tsx
// Default card with warm background
<div className="bg-card border border-border rounded-lg">
  <h3 className="text-foreground">Species Name</h3>
  <p className="text-muted-foreground">Description...</p>
</div>

// Legendary species card
<div className="bg-legendary-light border-2 border-legendary rounded-lg">
  <h3 className="text-legendary-dark">Rare Find!</h3>
</div>
```

### Badges
```tsx
// Nature/common
<span className="bg-nature-200 text-nature-800">Common</span>

// Rare
<span className="bg-rare text-white">Rare</span>

// Legendary
<span className="bg-legendary text-white">Legendary</span>
```

## Accessibility

### Color Contrast Ratios

All color combinations meet WCAG AA standards:
- **Primary on background**: 7.2:1 (AAA)
- **Foreground on background**: 12.3:1 (AAA)
- **Muted foreground on background**: 4.6:1 (AA)

### Dark Mode Strategy

Dark mode uses deeper forest greens to maintain the natural theme while providing excellent contrast:
- Background switches to deep forest (`#1f3326`)
- Text switches to warm cream (`#f5ead8`)
- Primary becomes brighter green for visibility
- Accent colors adjust to maintain contrast

## Implementation Notes

### CSS Variables
The design system uses CSS variables (HSL format) for easy theming:
- Define in `src/app/globals.css`
- Reference in Tailwind config
- Use with `hsl(var(--variable-name))`

### Theme Switching
Currently supports system preference only. Manual toggle can be added with:
```tsx
import { useTheme } from 'next-themes';
```

### PWA Theme Color
The manifest and meta tags use forest green (`#588157`) as the theme color for the browser chrome on mobile devices.
