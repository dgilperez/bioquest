# Testing the Background Rarity Classification System

## Quick Start

The background rarity system is now fully implemented and ready to test!

### What Changed

- **Sync button hidden** from header (commented out in `src/app/(dashboard)/layout.tsx`)
- **Onboarding now uses fast sync** - classifies only top 200 taxa immediately
- **Remaining taxa queued** for background processing
- **New bubble UI** appears when background queue is active

---

## Test Scenario 1: Fresh Onboarding

This tests the full two-phase sync experience.

### 1. Clear Database (Simulate New User)

```bash
cd /Users/dgilperez/src/personal/bioquest

sqlite3 prisma/dev.db <<EOF
DELETE FROM observations;
DELETE FROM rarity_classification_queue;
DELETE FROM sync_progress;
DELETE FROM user_stats;
EOF
```

### 2. Sign In & Start Onboarding

1. Go to http://localhost:3001
2. Sign in with your iNaturalist account
3. You should be redirected to `/onboarding`
4. Click **"Let's Begin"**

### 3. Watch Fast Sync (Should Complete in 2-3 Minutes)

You should see:
- Progress bar moving through phases
- "Classifying rarity (batch X/Y)" messages
- Funny rotating naturalist messages
- **Important**: Sync should complete MUCH faster than before (~2-3 min instead of 30+ min)

### 4. Verify Queue Created

After onboarding completes, check the queue:

```bash
sqlite3 prisma/dev.db "SELECT status, COUNT(*) FROM rarity_classification_queue GROUP BY status;"
```

Expected output:
```
pending|635  (or similar - depends on your observation count)
```

### 5. Check Background Bubble Appears

- Go to `/dashboard`
- Look for floating bubble in bottom-right corner
- Should show: "Classifying species... X/Y complete (Z%)"
- Click to expand and see detailed stats

### 6. Verify Observations Status

```bash
sqlite3 prisma/dev.db "SELECT rarityStatus, COUNT(*) FROM observations GROUP BY rarityStatus;"
```

Expected output:
```
classified|800  (observations with top 200 taxa)
pending|200     (observations with remaining taxa)
```

---

## Test Scenario 2: Manual Queue Processing

This tests the background processor.

### 1. Check Queue Status via API

```bash
curl http://localhost:3001/api/rarity-queue/status \
  -H "Cookie: $(cat ~/.bioquest-session-cookie)"
```

Expected response:
```json
{
  "userId": "...",
  "pending": 635,
  "processing": 0,
  "completed": 0,
  "failed": 0,
  "total": 635,
  "percentComplete": 0
}
```

### 2. Trigger Processing

```bash
curl -X POST "http://localhost:3001/api/rarity-queue/process?batchSize=20" \
  -H "Cookie: $(cat ~/.bioquest-session-cookie)"
```

Expected response:
```json
{
  "success": true,
  "processed": 20,
  "succeeded": 20,
  "failed": 0
}
```

### 3. Watch Progress in UI

- Refresh dashboard (or wait 10s for auto-refresh)
- Bubble should show updated counts
- Percentage should increase

### 4. Process More Batches

Run the process endpoint multiple times to simulate continuous background processing:

```bash
for i in {1..10}; do
  echo "Batch $i..."
  curl -X POST http://localhost:3001/api/rarity-queue/process?batchSize=20 \
    -H "Cookie: $(cat ~/.bioquest-session-cookie)"
  sleep 2
done
```

### 5. Verify Observations Updated

```bash
sqlite3 prisma/dev.db "SELECT rarityStatus, COUNT(*) FROM observations GROUP BY rarityStatus;"
```

Should see increasing `classified` count and decreasing `pending` count.

---

## Test Scenario 3: Error Resilience

This tests retry logic and error handling.

### 1. Simulate Network Error

Temporarily modify `src/lib/inat/client.ts` to inject errors:

```typescript
// In INatClient.request() method, add at the beginning:
if (Math.random() < 0.3) { // 30% error rate
  throw new Error('Simulated network error');
}
```

### 2. Run Processing

```bash
curl -X POST http://localhost:3001/api/rarity-queue/process?batchSize=20 \
  -H "Cookie: $(cat ~/.bioquest-session-cookie)"
```

### 3. Check Queue for Retries

```bash
sqlite3 prisma/dev.db "
SELECT status, attempts, COUNT(*)
FROM rarity_classification_queue
GROUP BY status, attempts;
"
```

Expected output:
```
pending|1|5   (items that failed once, will retry)
pending|2|3   (items that failed twice, will retry again)
completed|0|12 (items that succeeded)
```

### 4. Verify Retry Behavior

Items should:
- Move back to `pending` status after transient errors
- Increment `attempts` counter
- Be retried on next processing run
- Only fail permanently after 3 attempts

### 5. Remove Error Injection

Remove the error simulation code before continuing.

---

## Test Scenario 4: Complete End-to-End Flow

This is the full production-like experience.

### 1. Fresh Start

```bash
# Clear everything
sqlite3 prisma/dev.db <<EOF
DELETE FROM observations;
DELETE FROM rarity_classification_queue;
DELETE FROM sync_progress;
DELETE FROM user_stats;
EOF
```

### 2. Onboard

- Sign in → Onboarding → "Let's Begin"
- Wait for fast sync to complete (~2-3 min)
- Go to dashboard

### 3. Manually Process Queue

Since we don't have cron yet, manually trigger processing:

```bash
# Process 5 batches of 20 taxa each (100 taxa total)
for i in {1..5}; do
  echo "Processing batch $i/5..."
  curl -X POST http://localhost:3001/api/rarity-queue/process?batchSize=20 \
    -H "Cookie: $(cat ~/.bioquest-session-cookie)" \
    -s | jq '.succeeded'
  sleep 2
done
```

### 4. Watch UI Update

- Bubble should show progress increasing: 0% → 15% → 30% → ...
- Expand bubble to see detailed stats
- Completed count should increase
- Remaining count should decrease

### 5. Complete Processing

Continue processing until queue is empty:

```bash
# Keep processing until no more pending
while true; do
  RESULT=$(curl -s -X POST http://localhost:3001/api/rarity-queue/process?batchSize=50 \
    -H "Cookie: $(cat ~/.bioquest-session-cookie)")

  PROCESSED=$(echo $RESULT | jq -r '.processed')

  if [ "$PROCESSED" = "0" ]; then
    echo "Queue empty!"
    break
  fi

  echo "Processed: $PROCESSED"
  sleep 2
done
```

### 6. Verify Completion

- Bubble should auto-dismiss after 3 seconds
- All observations should have `rarityStatus: 'classified'`
- Queue should be empty (or only have `completed` items)

---

## Verification Queries

### Check Queue Status
```sql
SELECT status, COUNT(*) FROM rarity_classification_queue GROUP BY status;
```

### Check Observation Status
```sql
SELECT rarityStatus, COUNT(*) FROM observations GROUP BY rarityStatus;
```

### Check Rarity Distribution
```sql
SELECT rarity, COUNT(*) FROM observations GROUP BY rarity ORDER BY
  CASE rarity
    WHEN 'mythic' THEN 6
    WHEN 'legendary' THEN 5
    WHEN 'epic' THEN 4
    WHEN 'rare' THEN 3
    WHEN 'uncommon' THEN 2
    WHEN 'common' THEN 1
  END DESC;
```

### Check Failed Taxa (if any)
```sql
SELECT taxonId, taxonName, attempts, lastError
FROM rarity_classification_queue
WHERE status = 'failed';
```

### Check Average Processing Time
```sql
SELECT
  AVG(julianday(updatedAt) - julianday(createdAt)) * 24 * 60 AS avg_minutes
FROM rarity_classification_queue
WHERE status = 'completed';
```

---

## Expected Results

### Performance
- **Initial sync**: 2-3 minutes for 1000 observations
- **Background processing**: ~1 taxon per second (with delays)
- **Total time to classify all**: Depends on manual triggering (future: automated via cron)

### Error Handling
- Network errors should NOT crash the sync
- Failed taxa should be retried up to 3 times
- Persistent errors should be marked as failed but not block progress

### User Experience
- User can access dashboard immediately after fast sync
- Background bubble shows clear progress
- No blocking or waiting for background classification

---

## Troubleshooting

### Bubble Doesn't Appear
- Check: `SELECT COUNT(*) FROM rarity_classification_queue WHERE status = 'pending';`
- Should have pending items
- Check browser console for API errors

### Processing Doesn't Work
- Check API response for errors
- Verify user is authenticated (cookie present)
- Check server logs for error details

### Progress Stuck at 0%
- Manually trigger processing (cron not set up yet)
- Use the curl command to process batches

### Failed Taxa
- Check `lastError` column for details
- Verify iNaturalist API is accessible
- Check network connectivity

---

## Future: Automated Processing

To enable automated background processing, set up a cron job or use Vercel Cron:

### Vercel Cron (Production)
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/process-rarity-queue",
    "schedule": "*/5 * * * *"
  }]
}
```

### Local Cron (Development)
```bash
# Add to crontab
*/5 * * * * curl -X POST http://localhost:3001/api/rarity-queue/process?batchSize=50
```

---

## Notes

- **Session Cookie**: Save your session cookie to `~/.bioquest-session-cookie` for testing
- **Rate Limiting**: Processing respects iNaturalist's 60 req/min limit
- **Priority**: Taxa with more observations are processed first
- **Cleanup**: Completed items can be deleted after 7 days (future enhancement)

---

Happy testing! 🎉
