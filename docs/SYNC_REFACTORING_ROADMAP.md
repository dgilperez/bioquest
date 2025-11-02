# Sync System Refactoring Roadmap

**Status**: Current code works and is tested (61/61 tests passing)
**Goal**: Make it maintainable, predictable, and easy to extend

## ✅ Completed

- [x] Write comprehensive integration tests (27 tests covering main flow)
- [x] Add race condition tests (atomic locking)
- [x] Add double-counting prevention tests
- [x] Add progress tracking tests
- [x] **BUG FIX**: Cursor logic (was `fetchedAll ? null : null`, now `fetchedAll ? null : newestObservationDate`)
- [x] **Phase 1**: Extract helper functions (`prepareSyncContext`, `calculatePointsForNewObservations`, `buildXPBreakdown`, `buildSyncResult`)
- [x] **Phase 1**: Write unit tests for extracted functions (13 tests)
- [x] **Phase 1**: Refactor `syncUserObservations` to use helpers
- [x] **Phase 2**: Add transaction support to `storeObservations` and `updateUserStatsInDB`
- [x] **Phase 2**: Wrap critical database operations in Prisma transaction
- [x] **Phase 2**: Write transaction rollback tests (8 tests)
- [x] **Phase 2**: All tests passing (51 total: 30 integration + 13 helper + 8 transaction)
- [x] **Phase 3**: Create typed error system with SyncError class and error codes
- [x] **Phase 3**: Add error classification and auto-recovery guidance
- [x] **Phase 3**: Create comprehensive error recovery documentation
- [x] **Phase 3**: Enhanced error logging with structured context
- [x] **Phase 4**: Create structured logging utility with SyncLogger class
- [x] **Phase 4**: Integrate phase tracking into main sync function
- [x] **Phase 4**: Create health check API endpoint (/api/sync/health)
- [x] **Phase 4**: Verify all 51 tests still passing

## Current State Assessment

### Metrics
- **Production Code**: 1,103 lines
- **Test Code**: 1,326 lines (1.2:1 ratio - good!)
- **Test Files**: 5
- **Tests**: 61 passing
- **Main Function**: `syncUserObservations` - 367 lines (TOO LONG)

### Problems
1. **Tight Coupling**: Main function calls 6+ modules directly
2. **No Transactions**: Database writes not atomic
3. **Error Recovery Unclear**: What happens if step 5 fails? Steps 1-4 already committed
4. **Hard to Test in Isolation**: Requires mocking 12+ dependencies
5. **Single Responsibility Violated**: One function does everything

## Refactoring Strategy

### Phase 1: Extract Functions (No Architecture Change)
**Goal**: Break down `syncUserObservations` into smaller, testable functions
**Risk**: Low - just extracting existing code
**Effort**: 2-3 hours

#### Tasks
1. Extract `prepareSyncContext()` - lines 122-138
   ```typescript
   function prepareSyncContext(userId: string, currentStats: UserStats | null): SyncContext {
     const oldObservationCount = currentStats?.totalObservations || 0;
     const oldLevel = currentStats?.level || 1;
     const lastSyncedAt = currentStats?.lastSyncedAt;
     const syncCursor = currentStats?.syncCursor;
     const isFirstSync = oldObservationCount === 0;
     const maxObservations = isFirstSync ? FIRST_SYNC_LIMIT : MAX_OBSERVATIONS_PER_SYNC;
     return { oldObservationCount, oldLevel, lastSyncedAt, syncCursor, isFirstSync, maxObservations };
   }
   ```

2. Extract `calculatePointsForNewObservations()` - lines 224-230
   ```typescript
   function calculatePointsForNewObservations(
     enrichedObservations: EnrichedObservation[],
     newObservationIds: Set<number>
   ): number {
     return enrichedObservations
       .filter(e => newObservationIds.has(e.observation.id))
       .reduce((sum, e) => sum + e.points, 0);
   }
   ```

3. Extract `buildXPBreakdown()` - lines 278-292

4. Extract `buildSyncResult()` - lines 340-361

5. Write unit tests for each extracted function

### Phase 2: Add Transaction Support ✅ COMPLETED
**Goal**: Make critical database operations atomic
**Risk**: Medium - requires Prisma transaction API
**Effort**: 3-4 hours

#### Completed Tasks
1. ✅ Modified `storeObservations` to accept optional `tx` parameter (src/lib/sync/store-observations.ts:78-82)
2. ✅ Modified `updateUserStatsInDB` to accept optional `tx` parameter (src/lib/sync/calculate-stats.ts:126-130)
3. ✅ Wrapped critical operations in transaction (src/lib/stats/user-stats.ts:219-276):
   ```typescript
   await prisma.$transaction(async (tx) => {
     const { newCount, updatedCount, newObservationIds } = await storeObservations(userId, enrichedObservations, tx);
     // ... calculate stats ...
     const rareObservations = await tx.observation.count({ ... });
     const legendaryObservations = await tx.observation.count({ ... });
     await updateUserStatsInDB(userId, { ... }, tx);
     return { newObsCount, updatedCount, newObservationIds, updatedTotalObservations, updatedTotalPoints, stats };
   });
   ```
4. ✅ Added transaction rollback tests (src/lib/sync/__tests__/transaction-rollback.test.ts)
   - Tests for optional transaction parameter
   - Tests for rollback on failure
   - Tests for commit on success
   - Tests for transaction isolation
5. ✅ Updated integration test mocks to support `$transaction`
6. ✅ All 51 tests passing

#### Transaction Boundaries Documented
**Atomic Operations** (within single transaction):
- `storeObservations()` - Batch create/update observations
- `tx.observation.count()` - Count rare/legendary observations
- `updateUserStatsInDB()` - Update user stats

**Non-Atomic Operations** (outside transaction):
- `calculateUserStats()` - Read-only aggregations (iNat API, Prisma reads)
- `manageLeaderboards()` - Leaderboard updates (separate transaction)
- `checkAchievements()` - Badge/quest checks (read-heavy)

If `storeObservations` or `updateUserStatsInDB` fails, ALL database writes are rolled back atomically.

### Phase 3: Improve Error Handling ✅ COMPLETED
**Goal**: Clear error boundaries and recovery paths
**Risk**: Low - mainly adding try/catch and logging
**Effort**: 2 hours

#### Completed Tasks
1. ✅ Created `SyncError` class with typed error codes (src/lib/sync/sync-errors.ts)
   - 20+ error codes categorized by sync phase
   - Error severity levels: FATAL, RECOVERABLE, WARNING
   - Recovery strategy guidance (retry delays, user messages)
2. ✅ Added auto-classification function `classifyError()`
   - Automatically determines error code from message patterns
   - Enhances errors with sync context (phase, userId, severity)
3. ✅ Enhanced error handling in main sync function (src/lib/stats/user-stats.ts:371-392)
   - Structured error logging with code, severity, phase, recovery
   - User-friendly error messages via errorProgress()
4. ✅ Created comprehensive error recovery documentation (docs/SYNC_ERROR_RECOVERY.md)
   - Recovery strategies for all error codes
   - Error code reference table
   - Examples for developers
   - Monitoring and alerting recommendations

### Phase 4: Add Observability ✅ COMPLETED (PARTIAL)
**Goal**: Monitor sync health in production
**Risk**: Low - purely additive
**Effort**: 2-3 hours

#### Completed Tasks
1. ✅ Created structured logging utility (src/lib/sync/sync-logger.ts)
   - `SyncLogger` class for phase tracking
   - Automatic metrics collection (duration, success/failure per phase)
   - Production-ready JSON logging
   - Development-friendly emoji logging with phase indicators
   - Methods: `startPhase()`, `completePhase()`, `failPhase()`, `complete()`
   - Metrics retrieval: `getMetrics()`, `getSummary()`
2. ✅ Integrated logger into main sync function (src/lib/stats/user-stats.ts)
   - Phase tracking for all 7 sync phases: init, fetching, location, enriching, storing, calculating, achievements, background
   - Automatic duration tracking
   - Error phase tracking with error codes
   - Complete metrics summary on sync completion
3. ✅ Created health check API endpoint (src/app/api/sync/health/route.ts)
   - GET /api/sync/health - Returns sync system status
   - Metrics: syncs per hour/day, user stats, database connectivity
   - Returns 200 (healthy) or 503 (unhealthy)
   - No authentication required (suitable for monitoring systems)
4. ✅ Verified all 51 tests still passing

#### What We Skipped (Optional):
- Persistent metrics storage (would require new database tables)
- Grafana/Prometheus integration (production monitoring stack)
- Advanced performance analytics dashboard

The logging system now provides excellent observability during development (readable logs with emojis) and production (structured JSON logs). Health check endpoint can be monitored by uptime services.

#### Error Code Examples
```typescript
// Network error (auto-classified)
SyncErrorCode.FETCH_NETWORK_ERROR → RECOVERABLE, retry after 3s

// Auth error (auto-classified)
SyncErrorCode.FETCH_AUTH_ERROR → FATAL, user must re-authenticate

// Transaction rollback (auto-classified)
SyncErrorCode.STORE_TRANSACTION_ROLLBACK → RECOVERABLE, retry immediately

// Background processing (low severity)
SyncErrorCode.BACKGROUND_PROCESSING_FAILED → WARNING, sync continues
```

All errors now include:
- Typed error code
- Severity level (FATAL/RECOVERABLE/WARNING)
- Phase where error occurred
- User-friendly message
- Technical details for debugging
- Recovery strategy (canRetry, retryDelayMs, suggestedAction)

### Phase 4: Add Observability
**Goal**: Monitor sync health in production
**Risk**: Low - purely additive
**Effort**: 2-3 hours

#### Tasks
1. Add structured logging
   ```typescript
   logger.info('sync.phase.fetch.start', { userId, maxObservations });
   logger.info('sync.phase.fetch.complete', { userId, count: observations.length, duration });
   ```

2. Add metrics
   - Sync duration by phase
   - Success/failure rates
   - Observations processed per minute

3. Add health check endpoint `/api/sync/health`
   - Active syncs count
   - Failed syncs in last hour
   - Average sync duration

### Phase 5: Refactor to Command Pattern (Optional - Big Change)
**Goal**: Clean architecture with testable phases
**Risk**: High - major refactoring
**Effort**: 8-12 hours

Only do this if adding many new features to sync system.

#### Architecture
```
SyncOrchestrator
  ├─> LockManager (atomic locking)
  ├─> ProgressTracker (state management)
  └─> SyncPipeline
       ├─> FetchPhase
       ├─> EnrichPhase
       ├─> StorePhase (transactional)
       ├─> StatsPhase
       └─> AchievementsPhase
```

#### Benefits
- Each phase independently testable
- Easy to add new phases
- Clear state machine
- Retry/rollback per phase

#### Drawbacks
- More files/complexity
- Requires rewriting tests
- Risk of introducing bugs

## Recommended Approach

**For Now (MVP)**: Do Phases 1-3
- Extract functions (make code readable)
- Add transactions (make it safe)
- Improve error handling (make it predictable)

**Later (Post-Launch)**: Consider Phase 4
- Only if you see production issues
- Only if you need metrics

**Much Later**: Phase 5
- Only if sync becomes a major feature
- Only if you're adding many new capabilities

## Testing Strategy

For each phase:
1. Write tests FIRST (TDD)
2. Refactor code to make tests pass
3. Ensure ALL existing tests still pass
4. Add new tests for new behavior
5. Document changes in comments

## Success Metrics

- ✅ All tests passing
- ✅ Code coverage >80%
- ✅ Main function <150 lines
- ✅ Functions <50 lines each
- ✅ Clear error messages in logs
- ✅ Transactions for critical operations

## Current Status

**What Works**:
- Atomic locking (no duplicate syncs)
- Double-counting prevention (only NEW observations get XP)
- Cursor-based pagination (now fixed!)
- Progress tracking
- Background classification

**What Needs Work**:
- Transaction boundaries (store + stats update should be atomic)
- Error recovery (unclear what happens on failure)
- Observability (no metrics/monitoring)
- Code organization (367-line function is hard to maintain)

## Next Steps

1. **Immediate**: Extract functions from `syncUserObservations` (Phase 1)
2. **This Week**: Add transaction support (Phase 2)
3. **Next Week**: Improve error handling (Phase 3)
4. **Later**: Add observability if needed (Phase 4)
