# BioQuest Sync Strategy

## Overview

BioQuest implements an intelligent sync strategy optimized for accounts with thousands of observations while being a good API citizen.

## Key Principles

1. **Calculate Once, Cache Forever**: Rarity and points are stored in the database and never recalculated
2. **Incremental Updates**: After first sync, only fetch new/modified observations
3. **Respect Rate Limits**: Stay well under iNaturalist's 60 requests/minute limit
4. **Automatic Background Sync**: No manual intervention required after first trigger
5. **Progress Feedback**: Real-time updates with time estimates

## Sync Flow

### First Sync (Onboarding)

**For 10,000 observations**:

```
User triggers sync → Background process starts
  │
  ├─ Fetch 1000 observations (5 pages, ~3 seconds)
  ├─ Classify ~300 unique species (~30 seconds)
  ├─ Store in database (~1 second)
  ├─ Calculate stats (~1 second)
  │
  └─ Repeat until all observations processed
     Total: ~10 iterations × 35 seconds = ~6 minutes
```

**Progress UI**:
```
Syncing observations...
Processed 1,000 / 10,000 (10%)
Current: Classifying rarity for 300 species
Estimated time remaining: 5 minutes
```

### Subsequent Syncs (Daily Use)

**For typical daily usage** (0-10 new observations):

```
Auto-sync on page load
  │
  ├─ Check for updates (1 request, instant)
  ├─ Fetch new observations (1 request, ~1 second)
  ├─ Classify new species (~3-5 requests, ~3 seconds)
  ├─ Update database (instant)
  └─ Done (< 10 seconds total)
```

**No UI needed** - completes before user notices

### Modified Observations

iNaturalist reports when observations are modified (ID changed, quality upgraded, etc.):

```
Auto-sync detects 2 modified observations
  │
  ├─ Fetch updated data
  ├─ Re-classify rarity (may have changed if ID changed)
  ├─ Update database
  └─ Done
```

Works for **any observation** (old or new)

## API Rate Limiting

### iNaturalist Limits
- **Hard limit**: 60 requests/minute
- **Our usage**: ~50 requests/minute (safety margin)

### How We Stay Under

**Page Fetching**:
- 200 observations per page
- 500ms delay between pages
- Rate: 2 pages/second = 120 requests/minute capacity
- **Usage**: ~50% of capacity

**Rarity Classification**:
- 10 taxa per batch
- 1 second delay between batches
- Rate: 60 requests/minute (at limit, but safe with batching)
- **Usage**: 100% of capacity, but controlled

**Combined**:
- Fetching and rarity run sequentially, not in parallel
- Total rate never exceeds 60 req/min

## Database Caching

### What's Cached Forever

In `observations` table:
```typescript
{
  id: number,
  rarity: Rarity,              // ← Cached
  pointsAwarded: number,        // ← Cached
  globalCount: number,          // ← Cached
  regionalCount: number,        // ← Cached
  isFirstGlobal: boolean,       // ← Cached
  isFirstRegional: boolean,     // ← Cached
  // ... other fields
}
```

### When We Recalculate

**Never**, unless:
- Observation is in `updated_since` response (iNat reports change)
- User manually triggers "Recalculate All" (admin feature)

## Progress Tracking

### Implementation

```typescript
// Server-side progress store (in-memory for now, Redis for production)
interface SyncProgress {
  userId: string;
  status: 'syncing' | 'completed' | 'error';
  phase: 'fetching' | 'enriching' | 'storing' | 'calculating';
  observationsProcessed: number;
  observationsTotal: number;
  estimatedTimeRemaining: number; // seconds
  message: string;
}

// Client polls /api/sync/progress every 2 seconds
```

### UI Components

**Progress Bar**:
```tsx
<div className="sync-progress">
  <div className="progress-bar" style={{ width: `${percent}%` }} />
  <p>{observationsProcessed} / {observationsTotal}</p>
  <p>{phase}: {message}</p>
  <p>Est. {formatTime(estimatedTimeRemaining)} remaining</p>
</div>
```

**States**:
1. **idle**: No sync in progress, button shows "Sync Observations"
2. **syncing**: Progress bar visible, button disabled
3. **completed**: Success message, fade out after 3 seconds
4. **error**: Error message with retry button

## Auto-Sync Behavior

### On First Visit (No lastSyncedAt)

```typescript
useEffect(() => {
  // Auto-trigger sync if never synced before
  if (!stats.lastSyncedAt) {
    startSync();
  }
}, [stats]);
```

### On Subsequent Visits

```typescript
useEffect(() => {
  // Auto-sync if last sync was > 1 hour ago
  const hourAgo = Date.now() - 60 * 60 * 1000;
  if (stats.lastSyncedAt < hourAgo) {
    startSync();
  }
}, []);
```

### Manual Sync

User can always click "Sync Now" button to force sync

## Chunking Strategy

### Current: 1000 observations per sync

**Rationale**:
- Completes in ~35 seconds (acceptable wait time)
- Uses ~600 API calls (within limits)
- Automatic continuation until all processed

### Alternative: Larger chunks with pause

**For production at scale**:
```typescript
if (observationsRemaining > 5000) {
  // Process 1000, then pause 60 seconds
  // Allows other users to share API quota
  await processChunk(1000);
  await delay(60000);
}
```

## Error Handling

### Network Failures
- Retry with exponential backoff
- Max 3 retries
- Show error UI with manual retry button

### Rate Limiting (429)
- Pause for 60 seconds
- Resume automatically
- Show "Pausing to respect API limits..." message

### Incomplete Syncs
- lastSyncedAt only updated after full completion
- Next sync will pick up where left off
- No duplicate processing (check existing IDs)

## Monitoring

### Metrics to Track

1. **Sync Duration** by observation count
   - Goal: <1 minute per 1000 observations
2. **API Call Count** per sync
   - Goal: <700 calls per 1000 observations
3. **Success Rate**
   - Goal: >95% successful syncs
4. **User Wait Time** (first sync)
   - Goal: <10 minutes for 10k observations

### Alerts

- Sync duration > 2 minutes per 1000 obs
- API rate limit errors
- Sync failures > 5% of attempts

## Future Optimizations

### Phase 1 (Current)
✅ Basic caching
✅ Incremental sync
✅ Rate limiting
✅ Progress tracking

### Phase 2 (Next)
- [ ] Redis-based progress store
- [ ] Background job queue (BullMQ)
- [ ] Webhooks for real-time updates
- [ ] Server-sent events for live progress

### Phase 3 (Future)
- [ ] Dedicated sync workers
- [ ] Multi-region API proxying
- [ ] Offline-first with service workers
- [ ] Smart prefetching

## Testing

### Manual Test Cases

**10k Observations Account**:
1. First sync completes in < 10 minutes
2. Progress bar updates every 2 seconds
3. Time estimate within 20% accuracy
4. Subsequent sync < 10 seconds

**Network Interruption**:
1. Pause sync mid-way
2. Resume where left off
3. No duplicate observations

**Concurrent Users**:
1. Multiple users sync simultaneously
2. None hit rate limits
3. Fair resource sharing

## Summary

The sync strategy balances:
- **User Experience**: Auto-sync, progress feedback, fast subsequent syncs
- **API Citizenship**: Respects rate limits, batches requests, caches aggressively
- **Scalability**: Works for 100 or 100,000 observations
- **Reliability**: Handles errors, resumes gracefully, prevents duplicates

**For your 10k observations**:
- First sync: ~6 minutes (one-time cost)
- Daily syncs: <10 seconds (instant)
- API usage: ~1200 total calls (first sync), then <20/day
- Good citizen: Always under 60 req/min
