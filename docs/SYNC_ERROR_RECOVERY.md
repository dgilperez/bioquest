# Sync Error Recovery Guide

This document provides guidance for diagnosing and recovering from sync errors.

## Error Classification

Sync errors are classified by **severity** and **phase** to help determine the appropriate recovery strategy.

### Error Severity Levels

1. **FATAL** - Sync must be aborted, user cannot proceed
   - Examples: Authentication failures, database constraint violations
   - Recovery: User must take action (re-authenticate, contact support)

2. **RECOVERABLE** - Sync can be retried, temporary issue
   - Examples: Network errors, rate limits, timeouts
   - Recovery: Retry after suggested delay

3. **WARNING** - Sync continues, but some functionality degraded
   - Examples: Background processing failed, leaderboard update failed
   - Recovery: No action needed, will retry automatically

### Sync Phases

Errors are tagged with the phase where they occurred:

1. **Initialization** (Phase 0) - Loading stats, initializing progress
2. **Fetch** (Phase 1) - Fetching observations from iNaturalist API
3. **Location** (Phase 2) - Updating user location data
4. **Enrichment** (Phase 3) - Classifying rarity, calculating points
5. **Storage** (Phase 4) - Saving observations to database (transactional)
6. **Stats** (Phase 5) - Calculating and updating user stats (transactional)
7. **Achievements** (Phase 6) - Checking badges, quests, leaderboards
8. **Background** (Phase 7) - Queueing taxa for background classification

## Common Error Scenarios

### Network/Connection Errors

**Error Codes:**
- `FETCH_NETWORK_ERROR`
- `FETCH_TIMEOUT`
- `FETCH_INAT_API_ERROR`

**Severity:** RECOVERABLE

**User Message:** "Network connection error. Please check your internet connection and try again."

**Recovery:**
1. Check internet connectivity
2. Retry after 3-5 seconds
3. If persistent, check iNaturalist status page

**Technical Details:**
```typescript
{
  code: 'FETCH_NETWORK_ERROR',
  severity: 'RECOVERABLE',
  phase: 'fetching',
  recovery: {
    canRetry: true,
    retryDelayMs: 3000,
    suggestedAction: 'Check your internet connection and try again.'
  }
}
```

### Rate Limiting

**Error Code:** `FETCH_RATE_LIMIT`

**Severity:** RECOVERABLE

**User Message:** "Too many requests to iNaturalist. Please wait a few minutes and try again."

**Recovery:**
1. Wait 60 seconds before retrying
2. Reduce sync frequency if persistent
3. Check for other apps/scripts using iNaturalist API

**Technical Details:**
```typescript
{
  code: 'FETCH_RATE_LIMIT',
  severity: 'RECOVERABLE',
  phase: 'fetching',
  recovery: {
    canRetry: true,
    retryDelayMs: 60000, // 1 minute
    suggestedAction: 'Wait a minute before trying again.'
  }
}
```

### Authentication Errors

**Error Code:** `FETCH_AUTH_ERROR`

**Severity:** FATAL

**User Message:** "Authentication failed. Please sign out and sign in again."

**Recovery:**
1. Sign out of BioQuest
2. Sign in again to refresh OAuth token
3. If persistent, revoke app access in iNaturalist settings and re-authorize

**Technical Details:**
```typescript
{
  code: 'FETCH_AUTH_ERROR',
  severity: 'FATAL',
  phase: 'fetching',
  recovery: {
    canRetry: false,
    suggestedAction: 'Sign out and sign in again to refresh your authentication.'
  }
}
```

### Database Transaction Rollback

**Error Codes:**
- `STORE_DATABASE_ERROR`
- `STORE_TRANSACTION_ROLLBACK`
- `STATS_UPDATE_FAILED`

**Severity:** RECOVERABLE

**User Message:** "Sync was interrupted and rolled back. No changes were made. Please try again."

**Recovery:**
1. Transaction ensures database consistency - no partial writes
2. Retry immediately - previous attempt made no changes
3. If persistent, check database connectivity and disk space

**Technical Details:**
```typescript
{
  code: 'STORE_TRANSACTION_ROLLBACK',
  severity: 'RECOVERABLE',
  phase: 'storing',
  recovery: {
    canRetry: true,
    retryDelayMs: 1000,
    suggestedAction: 'Try syncing again.'
  }
}
```

**Important:** The transaction wraps:
- `storeObservations()` - Batch create/update observations
- `tx.observation.count()` - Count rare/legendary observations
- `updateUserStatsInDB()` - Update user stats

If ANY of these fail, ALL changes are rolled back atomically.

### Background Processing Errors

**Error Codes:**
- `QUEUE_CLASSIFICATION_FAILED`
- `BACKGROUND_PROCESSING_FAILED`

**Severity:** WARNING

**User Message:** "Background processing encountered an error. This does not affect your sync."

**Recovery:**
1. No action needed - sync completed successfully
2. Background classification will retry automatically
3. Taxa will be classified in future syncs if retry fails

**Technical Details:**
```typescript
{
  code: 'BACKGROUND_PROCESSING_FAILED',
  severity: 'WARNING',
  phase: 'background',
  recovery: {
    canRetry: true,
    suggestedAction: 'No action needed. Background tasks will retry automatically.'
  }
}
```

## Error Code Reference

### Initialization Errors
| Code | Severity | User Message | Recovery |
|------|----------|--------------|----------|
| `INIT_STATS_FETCH_FAILED` | RECOVERABLE | "Failed to load your sync progress." | Retry immediately |
| `INIT_PROGRESS_FAILED` | RECOVERABLE | "Failed to initialize sync tracking." | Retry immediately |

### Fetch Errors
| Code | Severity | User Message | Recovery |
|------|----------|--------------|----------|
| `FETCH_INAT_API_ERROR` | RECOVERABLE | "Unable to fetch observations from iNaturalist." | Wait 3s, retry |
| `FETCH_NETWORK_ERROR` | RECOVERABLE | "Network connection error." | Check connection, retry |
| `FETCH_TIMEOUT` | RECOVERABLE | "Request timed out." | Wait 5s, retry |
| `FETCH_AUTH_ERROR` | FATAL | "Authentication failed." | Re-authenticate |
| `FETCH_RATE_LIMIT` | RECOVERABLE | "Too many requests." | Wait 60s, retry |

### Storage/Transaction Errors
| Code | Severity | User Message | Recovery |
|------|----------|--------------|----------|
| `STORE_DATABASE_ERROR` | RECOVERABLE | "Database error while saving observations." | Retry immediately |
| `STORE_TRANSACTION_ROLLBACK` | RECOVERABLE | "Sync interrupted and rolled back." | Retry immediately |
| `STORE_CONSTRAINT_VIOLATION` | FATAL | "Data integrity error." | Contact support |

### Stats Errors
| Code | Severity | User Message | Recovery |
|------|----------|--------------|----------|
| `STATS_CALCULATION_FAILED` | RECOVERABLE | "Failed to calculate statistics." | Retry immediately |
| `STATS_UPDATE_FAILED` | RECOVERABLE | "Failed to update your statistics." | Retry immediately |

### Non-Critical Errors (Warnings)
| Code | Severity | User Message | Recovery |
|------|----------|--------------|----------|
| `LOCATION_UPDATE_FAILED` | WARNING | "Failed to update location." | Continue sync |
| `ENRICH_RARITY_CLASSIFICATION_FAILED` | WARNING | "Failed to classify rarity." | Continue sync |
| `ACHIEVEMENTS_CHECK_FAILED` | WARNING | "Failed to check achievements." | Continue sync |
| `LEADERBOARD_UPDATE_FAILED` | WARNING | "Failed to update leaderboards." | Continue sync |
| `QUEUE_CLASSIFICATION_FAILED` | WARNING | "Failed to queue classification." | Continue sync |
| `BACKGROUND_PROCESSING_FAILED` | WARNING | "Background processing error." | Continue sync |

## For Developers

### How to Use SyncError

```typescript
import { SyncError, SyncErrorCode, SyncErrorSeverity } from '@/lib/sync/sync-errors';

// Throw a typed sync error
throw new SyncError(
  SyncErrorCode.FETCH_NETWORK_ERROR,
  'Failed to fetch observations',
  {
    severity: SyncErrorSeverity.RECOVERABLE,
    phase: 'fetching',
    userId: userId,
    context: { endpoint: '/observations', statusCode: 500 },
    cause: originalError,
    recovery: {
      retryDelayMs: 3000,
      suggestedAction: 'Check your network connection.'
    }
  }
);
```

### Auto-Classification of Unknown Errors

The `classifyError()` function automatically classifies unknown errors based on message patterns:

```typescript
import { classifyError } from '@/lib/sync/sync-errors';

try {
  await fetchObservations();
} catch (error) {
  // Automatically classify and enhance the error
  const syncError = classifyError(error, 'fetching', userId);
  throw syncError;
}
```

Patterns recognized:
- `fetch`, `network` → `FETCH_NETWORK_ERROR`
- `timeout`, `ETIMEDOUT` → `FETCH_TIMEOUT`
- `401`, `Unauthorized` → `FETCH_AUTH_ERROR`
- `429`, `rate limit` → `FETCH_RATE_LIMIT`
- `transaction`, `rollback` → `STORE_TRANSACTION_ROLLBACK`

### Logging Structured Errors

SyncError implements `toJSON()` for structured logging:

```typescript
console.error('Sync failed:', syncError.toJSON());

// Outputs:
// {
//   name: 'SyncError',
//   code: 'FETCH_NETWORK_ERROR',
//   message: 'Failed to fetch observations',
//   severity: 'RECOVERABLE',
//   phase: 'fetching',
//   userId: 'user-123',
//   context: { endpoint: '/observations' },
//   recovery: { canRetry: true, retryDelayMs: 3000, ... },
//   stack: '...',
//   cause: 'Network request failed'
// }
```

### Testing Error Scenarios

See `src/lib/sync/__tests__/incremental-sync.test.ts` for examples:

```typescript
it('should handle fetch errors gracefully', async () => {
  fetchUserObservations.mockRejectedValue(new Error('API Error'));

  await expect(
    syncUserObservations(userId, username, token)
  ).rejects.toThrow(); // Now throws SyncError
});
```

## Monitoring and Alerts

### Recommended Alerts

1. **High Error Rate** - If >10% of syncs fail in 1 hour
2. **Fatal Errors** - Any `FATAL` severity error
3. **Transaction Rollbacks** - If >5 rollbacks in 1 hour
4. **Auth Errors** - May indicate OAuth token issues

### Metrics to Track

- Error rate by code
- Error rate by severity
- Average retry attempts per sync
- Transaction rollback rate
- Time to recovery (for recoverable errors)

## Support Escalation

### When to Contact Support

Users should contact support if:
1. Errors persist after 3 retry attempts
2. `FATAL` errors occur (especially auth errors)
3. `STORE_CONSTRAINT_VIOLATION` errors
4. Any error lasting >24 hours

### Information to Provide

When reporting errors, include:
- Error code (`FETCH_NETWORK_ERROR`, etc.)
- Error severity (`FATAL`, `RECOVERABLE`, `WARNING`)
- Sync phase where error occurred
- Timestamp of error
- Number of retry attempts
- User ID (for support team internal use)
