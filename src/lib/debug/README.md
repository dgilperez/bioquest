# Animation Error Debugging Tools

This directory contains tools to help debug Framer Motion animation errors during development.

## Features

### 1. Enhanced Console Error Reporting

The `animation-error-reporter.ts` automatically intercepts Framer Motion SVG errors and provides:

- **Clear problem identification**: Shows which element and attribute is causing the issue
- **Specific solutions**: Provides code examples for fixing the issue
- **File location hints**: Suggests where to look in your codebase
- **Deduplication**: Only shows each unique error once to avoid console spam

### 2. Error Boundary Component

The `AnimatedIconErrorBoundary` component (in `src/components/common/AnimatedIcon.tsx`) catches rendering errors in icon components.

## Setup

The error reporter is automatically installed in development mode via the `DevToolsProvider` in your root layout. No additional setup required!

## Example Enhanced Error Output

When a Framer Motion error occurs, you'll see:

```
🎯 Framer Motion SVG Animation Error Detected
  Error: <path> attribute d: Expected moveto path command ('M' or 'm'), "undefined"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 DIAGNOSIS:
   SVG Element: <path>
   Attribute: d
   Issue: Attribute value is "undefined" during render
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 COMMON CAUSES & FIXES:

❌ Problem: <motion.path> d attribute is undefined

✅ Solution 1: Add initial={false}
   <motion.path
     d="M 10 10 L 20 20"
     initial={false}  ← Add this
     animate={animate ? "idle" : undefined}
     variants={pathVariants}
   />

✅ Solution 2: Add "initial" state to variants
   const pathVariants = {
     initial: { d: "M 10 10 L 20 20" },  ← Add this
     idle: { d: [...], transition: {...} }
   };

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DEBUGGING TIPS:
   1. Check the React component stack above
   2. Look for motion.* elements in that component
   3. Search for: animate={{  or  animate.*d
   4. Verify all variants have initial states
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Using Error Boundaries

Wrap icon components to prevent errors from breaking the UI:

```tsx
import { AnimatedIconErrorBoundary } from '@/components/common/AnimatedIcon';

function MyComponent() {
  return (
    <AnimatedIconErrorBoundary iconName="Insecta">
      <InsectaIcon size={64} animate={true} />
    </AnimatedIconErrorBoundary>
  );
}
```

If the icon crashes, it will show a fallback icon instead of breaking the page.

## Common Framer Motion SVG Issues

### Issue 1: Animating `d` attribute without initial state

**Problem:**
```tsx
<motion.path
  d="M 10 10 L 20 20"
  animate={{ d: ["M 10 10 L 20 20", "M 15 15 L 25 25"] }}
/>
```

**Fix:**
```tsx
<motion.path
  d="M 10 10 L 20 20"
  initial={false}  // ← Tells Framer Motion to use the d prop
  animate={{ d: ["M 10 10 L 20 20", "M 15 15 L 25 25"] }}
/>
```

### Issue 2: Animating `cx`, `cy`, `r` attributes

**Problem:**
```tsx
<motion.circle
  cx={40}
  cy={40}
  r={10}
  animate={{ cy: [40, 50, 40] }}  // ❌ Don't animate geometric attributes
/>
```

**Fix (Use CSS transforms):**
```tsx
<motion.circle
  cx={40}
  cy={40}
  r={10}
  animate={{ y: [0, 10, 0] }}  // ✅ Use transform instead
/>
```

### Issue 3: Missing initial state in variants

**Problem:**
```tsx
const variants = {
  idle: { pathLength: [0, 1] }
};

<motion.path
  d="M 10 10 L 20 20"
  animate="idle"
  variants={variants}  // ❌ No initial state
/>
```

**Fix:**
```tsx
const variants = {
  initial: { pathLength: 0 },  // ✅ Add initial state
  idle: { pathLength: 1 }
};

<motion.path
  d="M 10 10 L 20 20"
  initial="initial"
  animate="idle"
  variants={variants}
/>
```

## Disabling in Production

The error reporter only runs in development (`NODE_ENV === 'development'`). It's automatically disabled in production builds.

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [SVG Animations Guide](https://www.framer.com/motion/component/#svg)
- [Animation Variants](https://www.framer.com/motion/animation/#variants)
