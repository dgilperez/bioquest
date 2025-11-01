# Background Rarity Classification System

## Problem Statement

Current sync process classifies rarity for ALL species synchronously, which:
- Takes too long for users with many observations (1000+ obs can take 30+ minutes)
- Blocks user from using the app during onboarding
- Fails completely if network issues occur
- Doesn't resume if user closes the app

## Requirements

1. **Two-Phase Sync**:
   - Phase 1 (Fast): Sync observations + classify first 200 unique species (~2-3 minutes)
   - Phase 2 (Background): Classify remaining species in background queue

2. **Resilient Error Handling**:
   - Mark failed taxa as `rarity_status: 'pending'` instead of `'common'`
   - Retry transient errors (network timeouts)
   - Skip persistent errors, queue for later retry

3. **Resumable Process**:
   - Persist classification queue in database
   - Resume on app restart
   - Allow user to continue using app while classification happens

4. **User Visibility**:
   - Small bubble/indicator showing background processing
   - Click to see progress (X/Y species classified)
   - Unobtrusive, can be dismissed

## Database Schema Changes

### New Table: `rarity_classification_queue`

```prisma
model RarityClassificationQueue {
  id            String   @id @default(cuid())
  userId        String
  taxonId       Int
  priority      Int      @default(0)  // Higher priority taxa processed first
  attempts      Int      @default(0)  // Retry counter
  lastAttemptAt DateTime?
  lastError     String?
  status        String   @default("pending") // pending, processing, completed, failed
  createdAt     DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, taxonId])
  @@index([userId, status, priority])
}
```

### Modify `observation` table

Add `rarityStatus` field to track classification state:

```prisma
model Observation {
  // ... existing fields
  rarity       String?  // 'common', 'rare', 'legendary', etc.
  rarityStatus String   @default("pending") // 'pending', 'classified', 'failed'
  // ...
}
```

## Architecture

### Components

1. **Fast Initial Sync** (`syncUserObservations()` modification)
   - Fetch all observations from iNat
   - Classify rarity for first 200 unique taxa
   - Queue remaining taxa for background processing
   - Return to user quickly

2. **Background Queue Processor** (new: `/src/lib/rarity-queue/processor.ts`)
   - Runs as background job (cron or on-demand)
   - Processes X taxa per minute (respects rate limits)
   - Updates observations with classified rarity
   - Retries failed taxa with exponential backoff
   - Marks persistent failures for manual review

3. **Queue Manager** (new: `/src/lib/rarity-queue/manager.ts`)
   - Add taxa to queue
   - Prioritize taxa (user's observations > general taxa)
   - Get queue status
   - Resume processing

4. **API Endpoints**
   - `GET /api/rarity-queue/status` - Get queue progress
   - `POST /api/rarity-queue/process` - Trigger background processing (admin/cron)
   - `POST /api/rarity-queue/resume` - Resume user's queue

5. **UI Components**
   - Background Processing Bubble (floating indicator)
   - Progress modal/drawer

## Processing Strategy

### Phase 1: Fast Initial Sync (during onboarding)

```typescript
// 1. Fetch all observations
const observations = await fetchUserObservations(...);

// 2. Get unique taxa, prioritize by observation count
const taxaCounts = new Map<number, number>();
observations.forEach(obs => {
  if (obs.taxon?.id) {
    taxaCounts.set(obs.taxon.id, (taxaCounts.get(obs.taxon.id) || 0) + 1);
  }
});

// Sort by count (descending) - classify most common species first
const sortedTaxa = Array.from(taxaCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([taxonId]) => taxonId);

// 3. Classify first 200 taxa immediately
const FAST_SYNC_LIMIT = 200;
const fastTaxa = sortedTaxa.slice(0, FAST_SYNC_LIMIT);
const backgroundTaxa = sortedTaxa.slice(FAST_SYNC_LIMIT);

// Classify fast taxa (blocking)
await classifyTaxaBatch(fastTaxa, accessToken);

// Queue remaining taxa for background
await queueTaxaForClassification(userId, backgroundTaxa);

// 4. Return to user
return {
  syncComplete: true,
  backgroundClassificationPending: backgroundTaxa.length > 0
};
```

### Phase 2: Background Processing

```typescript
// Cron job runs every minute (or on-demand via API)
export async function processRarityQueue(
  batchSize: number = 20,
  maxRetries: number = 3
) {
  // Get next batch of pending taxa
  const queueItems = await prisma.rarityClassificationQueue.findMany({
    where: {
      status: 'pending',
      attempts: { lt: maxRetries }
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' }
    ],
    take: batchSize,
  });

  if (queueItems.length === 0) return;

  // Process each taxon
  for (const item of queueItems) {
    try {
      // Mark as processing
      await prisma.rarityClassificationQueue.update({
        where: { id: item.id },
        data: { status: 'processing' }
      });

      // Classify rarity
      const rarity = await classifyTaxonRarity(item.taxonId, item.userId);

      // Update all observations with this taxon
      await prisma.observation.updateMany({
        where: {
          userId: item.userId,
          taxonId: item.taxonId
        },
        data: {
          rarity: rarity.rarity,
          rarityStatus: 'classified',
          bonusPoints: rarity.bonusPoints
        }
      });

      // Mark as completed
      await prisma.rarityClassificationQueue.update({
        where: { id: item.id },
        data: { status: 'completed' }
      });

    } catch (error) {
      // Handle transient vs persistent errors
      const isTransient = isTransientError(error);

      if (isTransient && item.attempts < maxRetries - 1) {
        // Retry later
        await prisma.rarityClassificationQueue.update({
          where: { id: item.id },
          data: {
            status: 'pending',
            attempts: item.attempts + 1,
            lastAttemptAt: new Date(),
            lastError: error.message
          }
        });
      } else {
        // Give up, mark as failed
        await prisma.rarityClassificationQueue.update({
          where: { id: item.id },
          data: {
            status: 'failed',
            attempts: item.attempts + 1,
            lastAttemptAt: new Date(),
            lastError: error.message
          }
        });
      }
    }
  }
}
```

## Error Classification

```typescript
function isTransientError(error: Error): boolean {
  // Network errors - retry
  if (error instanceof INatError && error.code === ErrorCode.API_NETWORK) {
    return true;
  }

  // Rate limit - retry (with backoff)
  if (error instanceof RateLimitError) {
    return true;
  }

  // 5xx server errors - retry
  if (error.message.includes('500') || error.message.includes('503')) {
    return true;
  }

  // 404, 401, 400 - persistent, don't retry
  return false;
}
```

## UI Implementation

### Floating Bubble Indicator

```tsx
// src/components/sync/BackgroundClassificationBubble.tsx
export function BackgroundClassificationBubble() {
  const { data: status } = useQuery({
    queryKey: ['rarity-queue-status'],
    queryFn: async () => {
      const res = await fetch('/api/rarity-queue/status');
      return res.json();
    },
    refetchInterval: 10000, // Poll every 10s
  });

  if (!status?.pending || status.pending === 0) return null;

  return (
    <motion.div
      className="fixed bottom-4 right-4 bg-nature-600 text-white rounded-full p-4 shadow-lg cursor-pointer z-50"
      whileHover={{ scale: 1.05 }}
      onClick={() => setShowDetails(true)}
    >
      <div className="flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">
          {status.classified}/{status.total} species classified
        </span>
      </div>
    </motion.div>
  );
}
```

## Migration Plan

1. **Schema Migration**
   - Add `rarity_classification_queue` table
   - Add `rarityStatus` column to observations
   - Migrate existing observations: mark classified ones as 'classified'

2. **Code Changes**
   - Modify `syncUserObservations()` for two-phase approach
   - Implement queue manager
   - Implement background processor
   - Add API routes
   - Add UI bubble component

3. **Deployment**
   - Set up cron job or background worker
   - Configure rate limiting for background processor
   - Monitor queue size and processing rate

## Open Questions

1. **Cron vs On-Demand Processing?**
   - Option A: Vercel Cron (runs every minute, processes all users)
   - Option B: User-triggered (only process when user is active)
   - **Recommendation**: Hybrid - Cron for active users, on-demand for inactive

2. **Processing Rate Limits**
   - Current: 60 req/min per user token
   - Background: Use server token? Or user tokens?
   - **Recommendation**: Use user tokens, limit to 20 taxa/min to leave headroom

3. **Priority Algorithm**
   - How to prioritize? User activity? Observation count?
   - **Recommendation**: Prioritize by user's observation count for that taxon

4. **Failed Taxa Recovery**
   - Should we periodically retry all failed taxa?
   - **Recommendation**: Yes, but with long backoff (1 week)

## Success Metrics

- ⚡ Fast sync: <3 minutes for onboarding
- 📊 Classification rate: 95%+ taxa classified within 24 hours
- 🔄 Resumability: 100% of interrupted syncs resume successfully
- 💚 User satisfaction: Users can use app immediately after onboarding
