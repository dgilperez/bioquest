# RFC-0001: UX & Game Loop Restructure

**Status:** Draft
**Author:** Product Team
**Created:** 2025-01-29
**Updated:** 2025-01-29
**Target Release:** v0.2.0 (4 weeks)

---

## Abstract

BioQuest currently suffers from **feature fragmentation** - 8 separate navigation items that feel like disconnected tools rather than a unified game experience. This RFC proposes consolidating navigation from 8 items to 4 cohesive sections, establishing clear game rules (ludus), and creating a core game loop that makes BioQuest feel like an engaging game, not a feature dashboard.

**Core Problem:** "It feels like a bag of features, not a game."

**Core Solution:** Restructure around a clear game loop: QUEST → ADVENTURE → OBSERVE → CELEBRATE → PROFILE → repeat.

---

## Table of Contents

1. [Motivation](#motivation)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Solution](#proposed-solution)
4. [Feature Mapping](#feature-mapping)
5. [Implementation Plan](#implementation-plan)
6. [Success Metrics](#success-metrics)
7. [Risks & Mitigations](#risks--mitigations)
8. [Open Questions](#open-questions)
9. [References](#references)

---

## 1. Motivation

### 1.1 Jobs to be Done

When users "hire" BioQuest, they're trying to accomplish these core jobs:

#### Primary Jobs (95% of usage)

1. **"Help me discover what to observe next"**
   - Current pain: No clear guidance on where to go or what to look for
   - Expected outcome: Specific recommendations (locations, species, quests)
   - Frequency: Before every observation trip

2. **"Show me my progress and achievements"**
   - Current pain: Progress scattered across Stats, Badges, Leaderboards
   - Expected outcome: Unified view of "how am I doing?"
   - Frequency: Daily check-in, post-observation validation

3. **"Make my observations feel special"**
   - Current pain: Observations feel like data entry
   - Expected outcome: Celebration, rarity reveal, points awarded
   - Frequency: Immediately after syncing observations

4. **"Let me explore biodiversity knowledge"**
   - Current pain: Tree of Life is buried, taxonomic learning is passive
   - Expected outcome: Interactive exploration, "what exists that I haven't seen?"
   - Frequency: Weekly deep dives, planning sessions

#### Secondary Jobs (5% of usage)

5. **"Compare myself to others"**
   - Current pain: Leaderboards feel isolated
   - Expected outcome: Friendly competition context
   - Frequency: Occasional curiosity, after achievements

### 1.2 Current Problems

1. **No Clear Hierarchy**: All 8 nav items feel equally important (they're not)
2. **Fragmented Progress**: Stats, badges, and leaderboards are separate
3. **Passive Landing**: Dashboard is overview, not action-oriented
4. **Hidden Value**: Tree of Life and Trips aren't in main navigation
5. **Unclear Game Loop**: No sense of "what do I do → why → what's next?"
6. **Missing Ludus**: No clear rules, boundaries, or freedom of movement

### 1.3 Goals of This RFC

1. ✅ Consolidate navigation from 8 items to 4 sections
2. ✅ Establish clear game loop and progression
3. ✅ Define rules of play (ludus)
4. ✅ Create action-oriented entry point
5. ✅ Preserve all existing features (zero feature loss)
6. ✅ Improve discoverability of hidden features (Trips, Life List)
7. ✅ Make "game-ness" evident through structure, not just cosmetics

---

## 2. Current State Analysis

### 2.1 Existing Navigation (8 Items)

| Item | Icon | Current Purpose | Avg Usage* | Issues |
|------|------|----------------|-----------|---------|
| Dashboard | Home | Overview of stats | 80% | Passive, not actionable |
| Explore | Compass | Location recommendations | 20% | Buried, disconnected from quests |
| Observations | Eye | List all observations | 60% | Feels like database, not journal |
| Tree of Life | Network | Taxonomic browser | 15% | Hidden value, not integrated |
| Statistics | BarChart | Charts and graphs | 25% | Vanity metrics, no context |
| Badges | Trophy | Achievement collection | 35% | Isolated from other progress |
| Quests | Target | Challenge tracker | 40% | Separate from recommendations |
| Leaderboards | Users | Rankings | 10% | Isolated, no context |

*Estimated based on typical gamification app patterns

### 2.2 Existing Pages (Complete Inventory)

```
src/app/(dashboard)/
├── dashboard/page.tsx           ← Overview (will become /quest landing)
├── explore/page.tsx             ← Location recommendations
├── observations/page.tsx        ← Observation list
├── tree-of-life/page.tsx        ← Taxonomic browser
├── stats/
│   ├── page.tsx                 ← Advanced statistics
│   └── life-list/page.tsx       ← Species checklist (hidden!)
├── badges/page.tsx              ← Badge collection
├── quests/page.tsx              ← Quest list
├── leaderboards/page.tsx        ← Rankings
└── trips/
    ├── page.tsx                 ← Trip list (hidden!)
    └── [tripId]/page.tsx        ← Trip details (hidden!)
```

**Total:** 11 pages, but only 8 in main navigation

**Hidden features (not in nav):**
- `/stats/life-list` - Full species checklist
- `/trips` - Trip planning
- `/trips/[id]` - Trip details

### 2.3 Current User Journey (Problematic)

```
User opens app
  ↓
Lands on Dashboard (passive overview)
  ↓
Wonders "what should I do?"
  ↓
Clicks through 8 menu items looking for guidance
  ↓
Eventually goes to iNaturalist to observe (no clear connection to BioQuest goals)
  ↓
Returns to BioQuest, manually clicks Sync
  ↓
No celebration, just updated numbers
  ↓
Checks Badges page separately
  ↓
Checks Leaderboards page separately
  ↓
Loses motivation, logs out
```

**Pain points:** No clear direction, scattered rewards, no sense of progression

---

## 3. Proposed Solution

### 3.1 New Navigation (4 Sections)

| Section | Icon | Purpose | Mental Model |
|---------|------|---------|--------------|
| **QUEST** | 🎯 Target | "What should I do today?" | MMO quest log |
| **ADVENTURE** | 🗺️ Compass | "What exists that I haven't seen?" | Pokédex collection |
| **PROFILE** | 🏆 Trophy | "How am I doing overall?" | RPG character sheet |
| **JOURNAL** | 📖 Book | "My observation history" | Field journal |

### 3.2 The Core Game Loop

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  QUEST → ADVENTURE → OBSERVE → CELEBRATE → PROFILE  │
│    ↑                                           ↓     │
│    └───────────────── Return ─────────────────┘     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### Phase 1: QUEST (Motivation)
**"What should I do today?"**
- Landing page shows 3 active quests (1 daily, 1 weekly, 1 monthly)
- Each quest shows progress bars, XP rewards, and time remaining
- Below quests: 3 recommended locations based on gap analysis
- CTA: "Plan Adventure" or "View Quest Details"

**Rules of Play:**
- Maximum 3 active quests per tier (daily/weekly/monthly)
- Completing quests awards XP, badges, and unlocks new quests
- Quests refresh on schedule (daily at midnight, weekly on Monday, monthly on 1st)

#### Phase 2: ADVENTURE (Exploration)
**"Where should I go? What exists that I haven't seen?"**
- Tree of Life shows completeness percentages: "You've seen 23/98 Diptera families in your region"
- Click any taxon to see missing species and where to find them
- Create trip with target species
- Gap analysis highlights high-value targets (rare + nearby + seasonal)

**Rules of Play:**
- The biodiversity world is your game board
- You "unlock" species by observing them (like Pokémon)
- Completeness % is your progression metric at each taxonomic level
- Regional filtering changes your "difficulty level" (local = easier, global = harder)

#### Phase 3: OBSERVE (Action)
**[This happens in iNaturalist - outside BioQuest]**
- User goes outside with trip plan
- Makes observations in iNaturalist app
- Returns to BioQuest to sync

#### Phase 4: CELEBRATE (Reward)
**"What did I just accomplish?"**
- Sync triggers immediate feedback:
  - Rarity reveal animation for each observation
  - Points awarded with visual counter
  - Level up celebration (if applicable)
  - Badge unlocks (if triggered)
  - Quest progress updates
  - Streak milestone (if achieved)

**Rules of Play:**
- Every observation has value (base points)
- Rarer observations = exponentially more points
- Consecutive rare finds = streak multiplier
- Certain combinations trigger badges
- Filling taxonomic gaps awards bonus XP

#### Phase 5: PROFILE (Validation)
**"How am I doing overall?"**
- Level and XP prominently displayed
- Badge wall showing unlocked + locked badges with unlock criteria
- Leaderboard rank (local + global)
- Lifetime stats (species count, observation count, rarest finds)

**Rules of Play:**
- Your level is permanent and always increases
- Badges are permanent achievements
- Leaderboards reset monthly/yearly (temporary competition)
- Stats accumulate forever (long-term progression)

### 3.3 Key Interactions (Primary Verbs)

The game centers around these **active verbs**, not passive "view stats":

1. **ACCEPT** (quests) - "Accept this daily quest"
2. **EXPLORE** (biodiversity) - "Explore Diptera families"
3. **TARGET** (species) - "Add to target list"
4. **PLAN** (adventures/trips) - "Plan adventure to Muir Woods"
5. **SYNC** (observations) - "Sync my observations" → triggers reward cascade
6. **UNLOCK** (badges/achievements) - "You unlocked Badge X!"
7. **COMPLETE** (quests/trips) - "Quest complete! +200 XP"
8. **COMPARE** (leaderboards) - "Compare with naturalists in my region"

---

## 4. Feature Mapping

### 4.1 Complete Route Mapping

This section ensures **zero feature loss** during migration.

#### **QUEST Section** (4 pages)

| New Route | Migrated From | Purpose |
|-----------|---------------|---------|
| `/quest` | `/dashboard` | Landing: active quests, recommendations |
| `/quest/all` | `/quests` | Browse all available quests |
| `/quest/[id]` | `/quests/[id]` (new) | Individual quest details |
| `/quest/locations` | `/explore` | Full location recommendation list |

**New features:**
- Quest recommendations integrated with location suggestions
- Quest acceptance/completion flows
- Time-limited quest expiration UI

#### **ADVENTURE Section** (7 pages)

| New Route | Migrated From | Purpose |
|-----------|---------------|---------|
| `/adventure` | New | Landing: tree overview, gap analysis |
| `/adventure/tree` | `/tree-of-life` | Tree of Life browser |
| `/adventure/tree/[taxonId]` | `/tree-of-life/[taxonId]` (new) | Taxon detail view |
| `/adventure/life-list` | `/stats/life-list` | Species checklist |
| `/adventure/trips` | `/trips` | Trip planning list |
| `/adventure/trips/[id]` | `/trips/[id]` | Trip details |
| `/adventure/observations` | `/observations` (filtered) | Observation browser with filters |

**New features:**
- Tree of Life landing with completeness metrics
- Gap analysis integration
- Trip creation flow from target species

#### **PROFILE Section** (4 pages)

| New Route | Migrated From | Purpose |
|-----------|---------------|---------|
| `/profile` | New | Landing: level, badges preview, rank |
| `/profile/badges` | `/badges` | Full badge collection |
| `/profile/leaderboards` | `/leaderboards` | Rankings |
| `/profile/stats` | `/stats` | Advanced statistics |

**New features:**
- Unified achievement dashboard
- XP progress bar
- Level title display
- Badge preview with AnimatedBadgeCard (compact mode)
- Visual consistency between preview and full collection

#### **JOURNAL Section** (3 pages)

| New Route | Migrated From | Purpose |
|-----------|---------------|---------|
| `/journal` | `/observations` | Chronological observation feed |
| `/journal/[id]` | `/observations/[id]` (new) | Observation detail view |
| `/journal/stats` | New | Observation patterns, accumulation charts |

**New features:**
- Chronological feed (diary-style)
- Observation detail pages
- Quick stats for observation patterns

### 4.2 Feature Preservation Checklist

- [x] Dashboard overview → QUEST landing
- [x] Explore locations → QUEST/locations
- [x] Observations list → JOURNAL + ADVENTURE/observations
- [x] Tree of Life → ADVENTURE/tree
- [x] Statistics → PROFILE/stats
- [x] Life List (hidden) → ADVENTURE/life-list ✅ Now visible!
- [x] Badges → PROFILE/badges
- [x] Quests → QUEST/all
- [x] Leaderboards → PROFILE/leaderboards
- [x] Trips (hidden) → ADVENTURE/trips ✅ Now visible!
- [x] Trip details (hidden) → ADVENTURE/trips/[id] ✅ Now visible!

**Result:** All 11 existing pages accounted for, 0 features lost, 2 hidden features surfaced.

### 4.3 Redirect Plan

To prevent broken bookmarks and links:

```typescript
// next.config.js redirects
const redirects = [
  { source: '/dashboard', destination: '/quest', permanent: false }, // ✅ IMPLEMENTED
  // NOTE: /explore redirect INTENTIONALLY NOT IMPLEMENTED
  // Reason: /explore is essential for trip planning flow in ADVENTURE section
  // Trip planning: Adventure → /explore (location recommendations) → TripCreationModal → trip detail
  // Future: Consider moving /explore to /adventure/plan or integrating into Adventure page
  { source: '/observations', destination: '/journal', permanent: false },
  { source: '/tree-of-life', destination: '/adventure/tree', permanent: false },
  { source: '/tree-of-life/:taxonId', destination: '/adventure/tree/:taxonId', permanent: false },
  { source: '/stats', destination: '/profile/stats', permanent: false },
  { source: '/stats/life-list', destination: '/adventure/life-list', permanent: false },
  { source: '/badges', destination: '/profile/badges', permanent: false }, // ✅ IMPLEMENTED
  { source: '/quests', destination: '/quest/all', permanent: false },
  { source: '/leaderboards', destination: '/profile/leaderboards', permanent: false },
  { source: '/trips', destination: '/adventure/trips', permanent: false },
  { source: '/trips/:id', destination: '/adventure/trips/:id', permanent: false },
];
```

---

## 5. Implementation Plan

### 5.1 Phase 1: Navigation Restructure (Week 1)

**Goal:** Implement new 4-section navigation, route all existing pages

**Tasks:**
1. Update `Navigation.tsx` component with 4 new sections
2. Create landing page files:
   - `/quest/page.tsx` (reuse dashboard components)
   - `/adventure/page.tsx` (new)
   - `/profile/page.tsx` (new)
   - `/journal/page.tsx` (reuse observations components)
3. Move existing pages to new routes (file renames)
4. Add redirects in `next.config.js`
5. Update all internal links to use new routes
6. Test all page transitions

**Files to modify:**
- `src/components/layout/Navigation.tsx`
- `src/app/(dashboard)/layout.tsx`
- `next.config.js`
- Create 4 new landing page files

**Success criteria:**
- All existing functionality accessible
- Zero broken links
- Navigation feels cleaner (visual improvement)
- Type-check passes
- Build succeeds

**Testing checklist:**
- [ ] All 8 old routes redirect correctly
- [ ] All 4 new sections load
- [ ] Navigation highlighting works on active routes
- [ ] Mobile navigation displays properly
- [ ] Deep links work (e.g., `/adventure/trips/123`)

### 5.2 Phase 2: QUEST Landing Page (Week 2)

**Goal:** Make QUEST the compelling entry point

**Tasks:**
1. Create quest summary cards with progress bars
2. Integrate location recommendations from Explore
3. Add quest acceptance/completion flows
4. Wire up quest refresh countdown timers
5. Add "Plan Adventure" CTA that links to trip creation

**Files to modify:**
- `src/app/(dashboard)/quest/page.tsx`
- Reuse components from `src/app/(dashboard)/quests/`
- Pull recommendations from `src/app/(dashboard)/explore/`

**New components:**
- `QuestCard.tsx` - Individual quest with progress
- `LocationRecommendation.tsx` - Suggested location card
- `QuestTimer.tsx` - Countdown to quest expiration

**Success criteria:**
- Users land on actionable content
- Clear CTAs for next steps
- Quest progress visible at a glance
- Time pressure visible (countdowns)

**Testing checklist:**
- [ ] Active quests display with accurate progress
- [ ] Location recommendations show distance and species count
- [ ] Quest timers count down accurately
- [ ] "Plan Adventure" creates trip with quest targets
- [ ] Quest completion triggers celebration

### 5.3 Phase 3: ADVENTURE Hub (Week 3)

**Goal:** Create cohesive biodiversity exploration center

**Tasks:**
1. Tree of Life overview with completeness metrics
2. Gap analysis integration (missing families/species)
3. Life list preview with quick links
4. Trip planning shortcut
5. Active trips widget

**Files to modify:**
- `src/app/(dashboard)/adventure/page.tsx` (new landing)
- Pull data from existing tree-of-life, stats, trips pages
- Reuse `src/components/stats/SpeciesAccumulationChart.tsx`

**New components:**
- `TaxonCompletenessCard.tsx` - Shows % completion by kingdom
- `GapAnalysisWidget.tsx` - Highlights missing taxa
- `ActiveTripsWidget.tsx` - Shows ongoing trips

**Success criteria:**
- Users understand "what I've seen vs. what exists"
- Gap analysis is actionable (click to explore)
- Tree of Life feels central to exploration
- Trips are discoverable

**Testing checklist:**
- [ ] Completeness percentages calculate correctly
- [ ] Gap analysis identifies missing taxa
- [ ] Clicking taxon drills down to detail view
- [ ] Life list preview shows top species
- [ ] Trip creation flows from gap analysis

### 5.4 Phase 4: PROFILE Hub (Week 4)

**Goal:** Consolidate achievement validation

**Tasks:**
1. Level display with XP progress bar
2. Badge showcase (top 6 recent unlocks)
3. Leaderboard rank summary
4. Stats overview with deep-dive links
5. "Character sheet" visual design

**Files to modify:**
- `src/app/(dashboard)/profile/page.tsx` (new landing)
- Pull widgets from badges, leaderboards, stats pages

**New components:**
- `LevelCard.tsx` - Level, XP, progress bar
- `BadgeShowcase.tsx` - Featured badges
- `LeaderboardRankCard.tsx` - Your rank summary
- `StatsOverview.tsx` - Key stats at a glance

**Badge Preview Enhancement:** ✅ IMPLEMENTED
- Recent Achievements section uses AnimatedBadgeCard (compact mode)
- Compact mode: smaller padding (p-3), smaller icons (w-12 h-12), simpler animations
- Visual consistency: same tier colors, gradients, hover effects as full collection
- Click behavior: navigate to /profile/badges (not ceremony modal)
- Grid layout: responsive 2/3/3/4 columns (mobile/md/lg/xl)
- Disabled shimmer effect and unlock dates in preview context

**Success criteria:**
- Users see holistic view of accomplishments
- XP progress motivates next level
- Badge showcase creates FOMO for locked badges
- Leaderboard provides social validation
- Visual consistency between badge preview and full collection ✅

**Testing checklist:**
- [x] Level and XP display correctly ✅
- [x] XP progress bar animates on load ✅
- [x] Badge showcase shows most recent unlocks ✅
- [ ] Locked badges show unlock criteria
- [ ] Leaderboard rank updates after sync
- [x] Stats link to detailed views ✅
- [x] Badge preview uses AnimatedBadgeCard with compact mode ✅
- [x] Clicking badge navigates to /profile/badges ✅
- [x] Visual style matches between preview and full page ✅

### 5.5 Phase 5: Polish & Testing (Week 4-5)

**Tasks:**
1. Add one-time migration tooltip: "We've reorganized!"
2. Create in-app migration guide
3. Comprehensive testing of all flows
4. Mobile responsiveness testing
5. Performance optimization
6. Analytics event tracking for new navigation

**Success criteria:**
- Users understand the reorganization
- All features discoverable within 2 clicks
- Mobile navigation smooth
- Performance metrics maintained
- Analytics tracking implemented

---

## 6. Success Metrics

### 6.1 Engagement Metrics

| Metric | Current Baseline | Target (4 weeks post-launch) | How to Measure |
|--------|------------------|------------------------------|----------------|
| Time to first action | ~60s (estimated) | <30s | Analytics: page load → first click |
| Avg session duration | ~3min (estimated) | +40% (~4.2min) | Analytics: session start → end |
| Pages per session | ~2.5 (estimated) | 5+ | Analytics: page views per session |
| Daily active users (DAU) | TBD | +25% | User login events |
| Weekly retention | TBD | >45% | Week 2 return rate |

### 6.2 Feature Discovery

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| % users accessing Tree of Life | ~15% | >60% | Weekly active users visiting `/adventure/tree` |
| % users creating trips | ~5% (hidden!) | >40% | Users creating at least 1 trip per week |
| % users checking leaderboards | ~10% | >50% | Weekly active users visiting `/profile/leaderboards` |
| % users viewing life list | ~5% (hidden!) | >50% | Weekly active users visiting `/adventure/life-list` |

### 6.3 Quest Engagement

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Quest acceptance rate | >80% | Daily quests accepted / daily quests offered |
| Quest completion rate | >70% | Active quests completed / active quests accepted |
| Average active quests per user | 2-3 | Active quests in UserQuest table |

### 6.4 User Satisfaction (Qualitative)

**Survey (1 week post-launch):**
- "I know what to do next in BioQuest" - Target: >80% agree/strongly agree
- "BioQuest feels like a game" - Target: >75% agree/strongly agree
- "The navigation is clear and intuitive" - Target: >85% agree/strongly agree
- "I can find features easily" - Target: >80% agree/strongly agree

### 6.5 Analytics Implementation

Add tracking for:
```typescript
// Navigation events
trackEvent('navigation_click', { section: 'quest' | 'adventure' | 'profile' | 'journal' });

// Quest events
trackEvent('quest_accepted', { questId, questTier: 'daily' | 'weekly' | 'monthly' });
trackEvent('quest_completed', { questId, timeToComplete });

// Adventure events
trackEvent('tree_explored', { taxonId, taxonRank });
trackEvent('trip_created', { tripId, targetSpeciesCount });
trackEvent('gap_analysis_clicked', { missingTaxon });

// Profile events
trackEvent('badge_viewed', { badgeId, isUnlocked });
trackEvent('leaderboard_checked', { leaderboardType: 'global' | 'local' | 'taxon' });
```

---

## 7. Risks & Mitigations

### 7.1 Risk: User Confusion from Navigation Change

**Impact:** High (affects all users)
**Probability:** Medium (major UX change)

**Mitigations:**
1. Add one-time tooltip on first visit: "We've reorganized! Your features are now in QUEST, ADVENTURE, PROFILE, and JOURNAL"
2. Create in-app migration guide accessible from help menu
3. Redirect all old URLs to new structure (prevents 404s)
4. Announce change via email/notification before launch
5. Provide feedback mechanism for users to report confusion

**Rollback plan:** Keep old navigation component in codebase, can switch back via feature flag if adoption is poor.

### 7.2 Risk: Feature Discoverability

**Impact:** Medium (some features may be harder to find initially)
**Probability:** Medium (users have muscle memory)

**Mitigations:**
1. Ensure all existing pages accessible within 2 clicks from landing pages
2. Add search functionality to find specific features (future enhancement)
3. Include site map link in footer
4. Track analytics on feature access rates, iterate on discoverability

### 7.3 Risk: Development Complexity

**Impact:** Medium (timeline and scope creep)
**Probability:** Medium (4-week aggressive timeline)

**Mitigations:**
1. Phase implementation over 4 weeks (iterative releases)
2. Reuse existing components (minimal new code)
3. Focus on routing/layout changes, not feature rebuilds
4. Test each phase before proceeding
5. Have dedicated QA pass at end of each week

**Timeline buffer:** Week 5 for polish and bug fixes.

### 7.4 Risk: Mobile Navigation Crowding

**Impact:** Medium (mobile-first user base)
**Probability:** Low (4 items should fit)

**Mitigations:**
1. Use bottom tab bar on mobile (native app pattern)
2. Icons clearly represent sections
3. Test on small screens (iPhone SE size) early
4. Consider hamburger menu if needed (but avoid if possible)

### 7.5 Risk: Performance Regression

**Impact:** Medium (affects user experience)
**Probability:** Low (mostly static routing changes)

**Mitigations:**
1. Maintain Server Component usage (no unnecessary client components)
2. Code-split landing pages
3. Lazy load widgets on landing pages
4. Monitor Core Web Vitals before/after
5. Run Lighthouse audits on new pages

---

## 8. Open Questions

### 8.1 Design Decisions Needed

**Q1:** Should QUEST be the default landing page after login?
- **Options:**
  - A) Always land on `/quest` (action-oriented)
  - B) Land on last visited section (preserve user preference)
- **Recommendation:** A (force action-oriented entry), but track analytics to validate

**Q2:** How should we handle the sync celebration cascade?
- **Options:**
  - A) Full-screen overlay (immersive, blocks interaction)
  - B) Toast notifications (non-blocking, less celebratory)
  - C) Modal with skip button (middle ground)
- **Recommendation:** C (modal with skip, but auto-dismiss after 5 seconds per reward)

**Q3:** Should we remove "Dashboard" terminology entirely?
- **Options:**
  - A) Keep `/dashboard` as redirect, update all copy to "Quest"
  - B) Keep "Dashboard" as synonym (e.g., breadcrumbs say "Dashboard / Quest")
- **Recommendation:** A (fully commit to game terminology)

**Q4:** Should trips be shown in main ADVENTURE landing or hidden until created?
- **Options:**
  - A) Always show "Active Trips" section (even if empty with CTA)
  - B) Only show trips widget if user has created trips
- **Recommendation:** A (educate users about trip feature)

### 8.2 Technical Decisions Needed

**Q5:** Should we use Next.js redirects or rewrite routes?
- **Options:**
  - A) Redirects (301/302) - old URLs redirect to new URLs in browser
  - B) Rewrites (transparent) - old URLs show new content, URL doesn't change
- **Recommendation:** A (redirects) - make the URL change visible to users, helps with bookmarking

**Q6:** Should landing pages be Server Components or Client Components?
- **Recommendation:** Server Components with client islands (maintain performance)

**Q7:** Should we version the API routes for this change?
- **Recommendation:** No, API routes remain unchanged (this is frontend-only)

---

## 9. References

### 9.1 Internal Documents

- [Project CLAUDE.md](/.claude/CLAUDE.md) - Project overview and guidelines
- [ARCHITECTURE.md](/docs/ARCHITECTURE.md) - System architecture
- [GAMIFICATION.md](/docs/GAMIFICATION.md) - Points, badges, quests design
- [ONBOARDING_UX.md](/docs/ONBOARDING_UX.md) - User onboarding flow

### 9.2 External References

- **Ludus:** Structured play within defined rules (vs. Paidea - freeform play)
  - Source: Roger Caillois, "Man, Play and Games" (1961)
- **Jobs to be Done Framework:** Clayton Christensen, "Competing Against Luck"
- **Game Loop Design:** Jesse Schell, "The Art of Game Design"
- **MMO Quest Design Patterns:** World of Warcraft, Final Fantasy XIV
- **Collection Mechanics:** Pokémon GO, iNaturalist (ironically)

### 9.3 Competitive Analysis

- **Pokémon GO:** Clear game loop (catch → power up → battle → catch)
- **Duolingo:** Quest-based learning with streaks and levels
- **Strava:** Profile-centric with clear goals (challenges = quests)
- **Habitica:** RPG character sheet for habit tracking

---

## 10. Approval & Timeline

### 10.1 Approval Checklist

- [ ] Product Owner approval (design)
- [ ] Tech Lead approval (feasibility)
- [ ] UX review (wireframes/mockups)
- [ ] Security review (no new attack vectors)
- [ ] Performance review (no regressions expected)

### 10.2 Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | Phase 1 | Navigation restructured, all pages accessible |
| 2 | Phase 2 | QUEST landing page live |
| 3 | Phase 3 | ADVENTURE hub complete |
| 4 | Phase 4 | PROFILE hub complete |
| 5 | Phase 5 | Polish, testing, migration guide |
| 6 | Launch | Production deployment, monitoring |

**Launch date:** TBD (pending approval)

---

## 11. Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-29 | 0.1 | Initial draft | Product Team |
| 2025-01-30 | 0.2 | Badge UX flow improvements - Phase 4 partial implementation | Engineering Team |
| 2025-01-30 | 0.3 | Trip planning flow fix - /explore redirect removed | Engineering Team |
| TBD | 1.0 | Approved for implementation | TBD |

### Version 0.2 Notes (Badge UX Improvements)

**Implemented:**
- Moved `/badges` to `/profile/badges` per specification
- Added redirect for backward compatibility
- Enhanced AnimatedBadgeCard with compact mode
- Updated profile preview to use AnimatedBadgeCard (compact)
- Ensured visual consistency between preview and full collection
- All internal links updated to `/profile/badges`

**Impact:**
- Fixes UX inconsistency between profile preview and badges page
- Aligns with PROFILE hub information architecture
- Improves perceived game-like quality through visual consistency
- Maintains all existing functionality with better UX

**Commit:** fb977ee

### Version 0.3 Notes (Trip Planning Flow Fix)

**Issue Identified:**
- "Plan a Trip" buttons in Adventure page were redirecting to Quests (broken flow)
- RFC-0001 originally specified `/explore` → `/quest/locations` redirect
- But `/explore` was redirecting to `/quest` instead, breaking trip planning
- Trip planning requires location recommendations from `/explore` page

**Implemented:**
- Removed `/explore` redirect entirely to restore trip planning functionality
- Trip planning flow now works: Adventure → `/explore` → select location → TripCreationModal → trip detail
- Clarified in RFC that `/explore` redirect is intentionally not implemented
- Added note about future consideration to move `/explore` to `/adventure/plan`

**Impact:**
- Fixes broken trip planning flow from ADVENTURE section
- Maintains that trips belong to ADVENTURE hub (not QUEST)
- Preserves location recommendation and TripCreationModal functionality
- Users can now successfully create trips with target species and locations

**Commit:** 7542391

---

## Appendix A: Wireframes

*To be added after approval*

## Appendix B: User Flow Diagrams

*To be added after approval*

## Appendix C: Analytics Dashboard

*To be created post-launch*

---

**Status:** 🟡 Awaiting Approval

**Next Steps:**
1. Review RFC with team
2. Create detailed wireframes for landing pages
3. Get product owner sign-off
4. Begin Phase 1 implementation
