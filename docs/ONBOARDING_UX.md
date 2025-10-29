# BioQuest Onboarding UX - Implementation Plan

## Overview

This document describes the "awe-inspiring" onboarding experience for BioQuest - designed to make users excited, not annoyed, during the 6-minute first sync of their 10k observations.

## Design Principles

1. **Immersive > Corner Toast** - Full-screen experience, not a dismissible notification
2. **Excitement > Boring** - Animations, colors, celebrations
3. **Context > Confusion** - Clear explanations of what's happening and why
4. **Celebration > Silence** - Epic completion ceremony, not just "Done"
5. **Required > Optional** - First sync is mandatory (but we make it fun)

## User Flow

```
Sign In (First Time)
  ↓
Redirect to /onboarding
  ↓
┌─────────────────────────────────────┐
│  Step 1: Welcome                     │
│  - Greeting with user name           │
│  - Show observation count            │
│  - Explain time estimate             │
│  - Show benefits (badges, rarity...) │
│  - [Let's Begin] button (required)   │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  Step 2: Feature Showcase            │
│  - Auto-advances every 4 seconds     │
│  - 4 slides total:                   │
│    1. Badges & Achievements          │
│    2. Rarity Classification          │
│    3. Quests & Challenges            │
│    4. Advanced Statistics            │
│  - Progress dots at bottom           │
│  - [Skip to import] button           │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  Step 3: Immersive Sync Progress     │
│  - Full-screen, dark nature theme    │
│  - Animated particles background     │
│  - Large circular spinner            │
│  - Giant percentage (40%)            │
│  - Progress bar                      │
│  - Observation counter (4,000/10,000)│
│  - Phase indicator                   │
│  - Time estimate                     │
│  - Motivational copy                 │
│  - CAN'T skip or cancel              │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  Step 4: Epic Completion             │
│  - Confetti animation (50 particles) │
│  - Large checkmark icon              │
│  - "🎉 You're All Set!" headline     │
│  - Stats summary                     │
│  - Two feature cards:                │
│    - Badges Unlocked                 │
│    - Rare Finds                      │
│  - [Explore Your Dashboard] CTA      │
└─────────────────────────────────────┘
  ↓
Dashboard (onboardingCompleted = true)
```

## Implementation Details

### Database Schema

```prisma
model User {
  onboardingCompleted Boolean @default(false)
  // ...
}

model SyncProgress {
  userId                 String    @id
  status                 String    // 'syncing' | 'completed' | 'error'
  phase                  String    // 'fetching' | 'enriching' | 'storing' | 'calculating'
  observationsProcessed  Int
  observationsTotal      Int
  estimatedTimeRemaining Int?
  // ...
}
```

### Route Structure

```
/onboarding
  ├── page.tsx (Server Component)
  │   - Checks auth
  │   - Checks onboardingCompleted
  │   - Fetches user data
  │   - Detects syncInProgress
  └── page.client.tsx (Client Component)
      - Multi-step wizard
      - Framer Motion animations
      - Progress polling
```

### API Endpoints

```typescript
POST /api/sync
// Triggers sync (existing)

GET /api/sync/progress
// Polls progress (existing, now uses DB)

POST /api/user/onboarding-complete
// Marks onboarding as done (new)
```

### State Management

```typescript
type Step = 'welcome' | 'features' | 'syncing' | 'complete';

// Client state
const [step, setStep] = useState<Step>('welcome');
const [currentFeature, setCurrentFeature] = useState(0);
const [syncProgress, setSyncProgress] = useState<any>(null);

// Auto-advance features every 4 seconds
useEffect(() => {
  if (step === 'features') {
    const interval = setInterval(() => {
      setCurrentFeature(prev => {
        if (prev < features.length - 1) return prev + 1;
        setStep('syncing');
        startSync();
        return prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }
}, [step]);

// Poll progress every 2 seconds
useEffect(() => {
  if (step === 'syncing') {
    const interval = setInterval(pollProgress, 2000);
    return () => clearInterval(interval);
  }
}, [step]);
```

### Animations

**Framer Motion Variants:**

```typescript
// Welcome screen
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>

// Icon entrance
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring' }}
>

// Text stagger
<motion.h1
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ delay: 0.4 }}
>

// Feature slides
<motion.div
  key={currentFeature}
  initial={{ opacity: 0, x: 100 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -100 }}
>

// Spinner rotation
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 2, repeat: Infinity }}
>

// Background particles
<motion.div
  animate={{ y: [0, -30, 0], opacity: [0.3, 1, 0.3] }}
  transition={{ duration: 3, repeat: Infinity }}
/>

// Confetti
<motion.div
  animate={{
    y: ['0vh', '110vh'],
    rotate: [0, 360],
    opacity: [1, 0]
  }}
  transition={{ duration: 3, repeat: Infinity }}
/>
```

### Color Scheme

```css
/* Dark nature theme */
background: bg-gradient-to-br from-nature-900 via-nature-800 to-nature-900

/* Feature gradients */
Badges:   from-yellow-500 to-orange-500
Rarity:   from-purple-500 to-pink-500
Quests:   from-blue-500 to-cyan-500
Stats:    from-green-500 to-emerald-500

/* Text */
Heading:  text-white
Body:     text-nature-100
Muted:    text-nature-300 / text-nature-400
```

### Copy Examples

**Welcome Screen:**
> Welcome to BioQuest, Daniel!
>
> Let's transform your 10,247 iNaturalist observations into an epic adventure
>
> This will take about 6 minutes to import and classify your observations.
>
> You'll unlock:
> ✨ Rarity classifications
> 🏆 Badges & achievements
> 📊 Advanced statistics
> 🎯 Personalized quests

**Feature Slide - Rarity:**
> Discover if your observations are Common, Rare, or Legendary! We analyze global and regional data to classify every species.

**Sync Progress:**
> Importing Your Naturalist Journey
>
> 40%
>
> 4,000 / 10,000 observations
>
> Classifying rarity and calculating points
>
> Est. 3m 30s remaining
>
> While you wait, Daniel, we're analyzing every observation, classifying rarity, calculating points, and preparing your personalized quests...

**Completion:**
> 🎉 You're All Set!
>
> Successfully imported 10,247 observations
>
> [Explore Your Dashboard]

## Technical Safeguards

### Prevent Infinite Loops

```typescript
// AutoSync checks if sync is already running
const progressRes = await fetch('/api/sync/progress');
if (progressData.status === 'syncing') {
  // Don't trigger new sync, just show progress UI
  window.dispatchEvent(new Event('sync-started'));
  return;
}
```

### Page Reload Handling

- Progress persisted in database
- On reload during sync:
  - Page checks `syncProgress.status`
  - If 'syncing', shows immersive progress immediately
  - Continues polling from where it left off
- No data loss, no duplicate syncs

### Skip/Cancel Buttons

**Welcome:** No skip (sync required)
**Features:** Skip to import (user might be impatient)
**Syncing:** No skip/cancel (would waste API calls)
**Complete:** Auto-redirect after viewing

## Future Enhancements

### Phase 2 - Live Discovery Feed

Instead of just showing phase/message, show discoveries in real-time:

```
Syncing...
  ↓
🌿 Northern Cardinal discovered! (+100 pts)
  ↓
💎 RARE: Red-headed Woodpecker! (+500 pts)
  ↓
✨ LEGENDARY: Piping Plover! (+1000 pts)
```

**Implementation:**
- Sync API streams observations as they're classified
- WebSocket or Server-Sent Events
- Client shows toast-like notifications as discoveries happen
- Makes 6-minute wait feel faster

### Phase 2 - Pause/Background Mode

Allow user to minimize sync and browse other pages:

```
[Minimize] button on sync progress
  ↓
Small progress indicator in header
  ↓
User can browse features, docs, etc.
  ↓
Notification when complete
```

**Implementation:**
- Add `minimized` state
- Sync continues in background
- Small progress bar in navigation
- Browser notification API for completion alert

### Phase 3 - Smart Resume

If sync fails or user closes tab:

```
User returns
  ↓
Check lastObservationDate in SyncProgress
  ↓
Resume from where left off (e.g., obs #4,532)
  ↓
Only fetch/classify remaining observations
```

**Implementation:**
- Store `lastObservationDate` in SyncProgress
- Use iNat's `updated_since` parameter with ID cursor
- Skip already-processed observations in DB

## Testing Checklist

### Manual Testing

- [ ] First-time user flow (no onboardingCompleted)
- [ ] Feature auto-advance timing (4s each)
- [ ] Skip to import button works
- [ ] Progress bar updates smoothly
- [ ] Time estimate is accurate (±20%)
- [ ] Confetti animation plays on completion
- [ ] Dashboard redirect works after completion
- [ ] Returning user (onboardingCompleted=true) goes straight to dashboard

### Edge Cases

- [ ] User refreshes page during welcome
- [ ] User refreshes page during features
- [ ] User refreshes page during sync (should resume showing progress)
- [ ] User closes tab during sync (progress persists in DB)
- [ ] User returns 1 hour later (sync should be complete)
- [ ] Sync fails (error message, retry button)
- [ ] User with 100 observations (1-minute sync)
- [ ] User with 50,000 observations (30-minute sync)

### Performance

- [ ] Page loads in <2 seconds
- [ ] Animations run at 60fps
- [ ] No memory leaks (polling intervals cleaned up)
- [ ] Progress polling doesn't overload server
- [ ] Database queries are indexed

## Metrics to Track

1. **Onboarding Completion Rate**
   - Goal: >95% of users complete onboarding
   - Measure: % who reach dashboard with onboardingCompleted=true

2. **Sync Duration by Observation Count**
   - Goal: <1 minute per 1000 observations
   - Measure: `completedAt - startedAt` grouped by `observationsTotal`

3. **User Engagement During Sync**
   - Goal: Users don't close tab
   - Measure: % who stay on page until completion

4. **Time to First Interaction**
   - Goal: <30 seconds from welcome to feature slides
   - Measure: Time from page load to first button click

5. **Skip Rate**
   - Measure: % who click "Skip to import" on features
   - Insight: If high, features aren't engaging enough

## Summary

This onboarding experience transforms a necessary technical process (syncing 10k observations) into an exciting, immersive adventure. By combining:

- Clear communication (what's happening, why, how long)
- Beautiful animations (Framer Motion, particles, confetti)
- Celebration (epic completion, not just "Done")
- Technical reliability (persistent progress, no infinite loops)

We create an experience users will remember and share. This is how you make users go "Wow!" instead of "Ugh, this is slow."

**The goal:** Users should finish onboarding and think "That was actually fun" not "Finally, that's over."
