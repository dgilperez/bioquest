# Comprehensive Test Improvement Plan

## Current State Analysis

### Problems Identified
1. **15 failing tests** - Integration tests trying to call real iNat API
2. **Test timeouts** - Tests taking 10+ hours due to real network calls
3. **Poor isolation** - Database state bleeding between tests
4. **Missing coverage** - Critical paths untested
5. **Flaky tests** - Race conditions, timing dependencies
6. **No API mocking** - Can't test API error scenarios

### Test Quality Issues
- Tests calling production APIs (slow, flaky, rate-limited)
- Duplicate test data causing unique constraint violations
- Mock mismatches after refactoring (`.update()` vs `.updateMany()`)
- Integration tests at wrong abstraction level
- No clear test organization by type (unit/integration/e2e)

## Comprehensive Test Strategy

### 1. Test Pyramid Structure

```
         /\
        /  \    E2E Tests (5%)
       /────\   - Full user flows with real DB
      /      \  - Manual/CI only
     /────────\ Integration Tests (15%)
    /          \ - API routes + DB
   /────────────\ - Real Prisma, mocked external APIs
  /              \ Unit Tests (80%)
 /────────────────\ - Pure functions
/                  \ - Mocked dependencies
────────────────────
```

### 2. Test Organization

```
tests/
├── unit/                    # Pure logic, fast, no DB
│   ├── lib/
│   │   ├── gamification/
│   │   │   ├── points.test.ts
│   │   │   ├── rarity.test.ts
│   │   │   └── badges.test.ts
│   │   ├── utils/
│   │   └── errors/
│   └── components/          # React component rendering
│
├── integration/             # API + DB, mocked external services
│   ├── api/
│   │   ├── sync.test.ts
│   │   ├── stats.test.ts
│   │   └── queue.test.ts
│   ├── sync/
│   │   ├── full-sync-flow.test.ts
│   │   ├── incremental-sync.test.ts
│   │   └── error-recovery.test.ts
│   └── queue/
│       ├── background-processing.test.ts
│       └── continuation.test.ts
│
└── e2e/                     # Full flows, real everything
    ├── onboarding.test.ts
    ├── sync-and-classify.test.ts
    └── dashboard.test.ts
```

## Priority Test Additions

### HIGH PRIORITY: Core Sync Flow (Missing Coverage)

#### 1. Sync System Tests (`tests/integration/sync/`)

**`sync-happy-path.test.ts`** - The golden path MUST work
```typescript
describe('Sync Happy Path', () => {
  it('should sync new observations from iNat and classify them', async () => {
    // Given: User with iNat account (50 observations)
    // When: User triggers sync
    // Then:
    //   - Fetches 50 observations from iNat (mocked)
    //   - Stores in DB
    //   - Queues 50 taxa for classification
    //   - Processes queue in background
    //   - ALL observations end up with rarityStatus='classified'
    //   - User stats updated (species count, points, etc.)
  });

  it('should handle pagination for large sync (200+ observations)', async () => {
    // Tests continuation across multiple pages
  });

  it('should skip already-synced observations', async () => {
    // Tests incremental sync efficiency
  });
});
```

**`sync-error-scenarios.test.ts`** - Real-world failure modes
```typescript
describe('Sync Error Scenarios', () => {
  it('should recover from iNat API 500 error mid-sync', async () => {
    // Mock: 1st page succeeds, 2nd page 500, 3rd page succeeds
    // Verify: Partial sync, user sees progress, can retry
  });

  it('should handle iNat rate limit (429)', async () => {
    // Verify: Backs off, retries, eventually succeeds
  });

  it('should handle network timeout', async () => {
    // Verify: Doesn't hang forever, fails gracefully
  });

  it('should handle invalid token (401)', async () => {
    // Verify: Prompts re-auth, doesn't corrupt data
  });

  it('should handle malformed iNat response', async () => {
    // Verify: Logs error, skips bad records, continues
  });
});
```

**`sync-concurrency.test.ts`** - Multi-user safety
```typescript
describe('Sync Concurrency', () => {
  it('should prevent duplicate syncs for same user', async () => {
    // Start sync, try to start again -> rejected
  });

  it('should allow concurrent syncs for different users', async () => {
    // User A and User B sync simultaneously -> both succeed
  });

  it('should handle sync interruption (server restart)', async () => {
    // Start sync, kill server, restart -> can resume or restart
  });
});
```

### HIGH PRIORITY: Rarity Classification System

#### 2. Rarity Queue Tests (`tests/integration/queue/`)

**`queue-end-to-end.test.ts`** - THE BUG WE JUST EXPOSED
```typescript
describe('Rarity Queue End-to-End', () => {
  it('CRITICAL: should process ALL queued taxa, not just first 20', async () => {
    // Queue 100 taxa
    // Process with batchSize=20
    // Verify: ALL 100 get classified (not just 20)
    // This was BROKEN - test MUST exist
  });

  it('should retry failed classifications up to 3 times', async () => {
    // Mock: API fails 2 times, succeeds 3rd time
    // Verify: Item retried, eventually succeeds
  });

  it('should skip taxa that fail 3+ times', async () => {
    // Mock: API always fails
    // Verify: After 3 attempts, marked as failed, excluded from processing
  });
});
```

**`queue-performance.test.ts`** - Scalability
```typescript
describe('Queue Performance', () => {
  it('should handle 1000+ queued taxa without timeout', async () => {
    // Stress test with many items
  });

  it('should batch API calls efficiently', async () => {
    // Verify: Uses batch endpoint if available
  });

  it('should respect rate limits (no more than 60 req/min)', async () => {
    // Time-based test with many items
  });
});
```

### MEDIUM PRIORITY: Stats & Gamification

#### 3. Stats Calculation Tests (`tests/unit/lib/stats/`)

**`stats-calculation.test.ts`** - Pure logic
```typescript
describe('Stats Calculation', () => {
  it('should calculate species count correctly', () => {
    // Pure function test - no DB
  });

  it('should calculate points from rarity', () => {
    // Normal: 10pts, Rare: 100pts, Legendary: 500pts
  });

  it('should award bonus points for research grade', () => {
    // Test point calculation logic
  });
});
```

**`stats-refresh.test.ts`** - DB integration
```typescript
describe('Stats Refresh', () => {
  it('should recalculate all stats after sync', async () => {
    // Given: 50 observations in DB
    // When: refreshUserStats(userId)
    // Then: Stats match actual data
  });

  it('should update Tree of Life progress', async () => {
    // Verify: iconicTaxon counts updated correctly
    // (This is where iconicTaxonId bug was!)
  });
});
```

### MEDIUM PRIORITY: Error Handling

#### 4. Error Handler Tests (`tests/unit/lib/errors/`)

**`error-classification.test.ts`**
```typescript
describe('Error Classification', () => {
  it('should classify 429 as transient (retry)', () => {
    expect(isTransientError(new Error('429'))).toBe(true);
  });

  it('should classify 404 as permanent (no retry)', () => {
    expect(isTransientError(new Error('404'))).toBe(false);
  });

  it('should classify network timeout as transient', () => {
    expect(isTransientError(new Error('ETIMEDOUT'))).toBe(true);
  });
});
```

### LOW PRIORITY: UI Components

#### 5. Component Tests (`tests/unit/components/`)

Focus on **user-facing behavior**, not implementation details:

```typescript
describe('<SyncButton />', () => {
  it('should show loading state during sync', async () => {
    // User clicks → button disabled, spinner shown
  });

  it('should show error message on failure', async () => {
    // Sync fails → error displayed to user
  });

  it('should show success message on completion', async () => {
    // Sync succeeds → success message shown
  });
});
```

## Test Infrastructure Improvements

### 1. iNaturalist API Mocking

**Create mock iNat client** (`tests/helpers/mock-inat-client.ts`)
```typescript
export function createMockINatClient(overrides?: Partial<INatClient>) {
  return {
    getUserObservations: vi.fn().mockResolvedValue({
      total_results: 100,
      results: mockObservations,
    }),
    getUserInfo: vi.fn().mockResolvedValue(mockUser),
    getTaxonObservationCount: vi.fn().mockResolvedValue({ total_results: 5000 }),
    getUserSpeciesCounts: vi.fn().mockResolvedValue({ total_results: 50, results: [] }),
    ...overrides,
  };
}
```

**Fixture-based testing**
```typescript
tests/fixtures/
├── inat-responses/
│   ├── user-observations-page1.json
│   ├── user-observations-page2.json
│   ├── taxon-details.json
│   └── error-responses.json
└── database/
    ├── user-with-observations.ts
    └── empty-user.ts
```

### 2. Database Test Utilities

**Transaction-based isolation** (`tests/helpers/db.ts`)
```typescript
export async function withTestTransaction<T>(
  fn: () => Promise<T>
): Promise<T> {
  // Use Prisma interactive transactions
  return prisma.$transaction(async (tx) => {
    const result = await fn();
    throw new Error('ROLLBACK'); // Always rollback
  }).catch(err => {
    if (err.message === 'ROLLBACK') return result;
    throw err;
  });
}
```

**Factory functions**
```typescript
export async function createTestUser(overrides?: Partial<User>) {
  return prisma.user.create({
    data: {
      id: `test-${Date.now()}`,
      inatId: Math.floor(Math.random() * 1000000),
      inatUsername: `testuser-${Date.now()}`,
      ...overrides,
    },
  });
}
```

### 3. Test Configuration

**Separate test configs**
```typescript
// vitest.config.unit.ts - Fast, no DB
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    mockReset: true,
    clearMocks: true,
  },
});

// vitest.config.integration.ts - DB required, sequential
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    poolOptions: { threads: { singleThread: true } },
    testTimeout: 30000,
  },
});
```

**Run scripts**
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest --config vitest.config.unit.ts",
    "test:integration": "vitest --config vitest.config.integration.ts",
    "test:e2e": "playwright test",
    "test:ci": "npm run test:unit && npm run test:integration"
  }
}
```

## Test Coverage Goals

### Minimum Coverage Requirements
- **Unit tests**: 90% coverage (pure logic)
- **Integration tests**: 80% coverage (critical paths)
- **E2E tests**: 100% of user flows

### Critical Paths (MUST have tests)
1. ✅ User signs in with iNaturalist
2. ✅ User syncs observations (first time)
3. ✅ User syncs observations (incremental)
4. ✅ Background classification processes all taxa
5. ✅ Stats update after classification
6. ✅ User sees correct points/badges
7. ✅ Sync recovers from errors
8. ✅ Concurrent users don't interfere

## Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Set up test infrastructure (mocking, fixtures, helpers)
- [ ] Fix all 15 failing tests
- [ ] Reorganize tests into unit/integration/e2e structure
- [ ] Add transaction-based DB isolation

### Phase 2: Core Coverage (Week 2)
- [ ] Sync happy path tests
- [ ] Sync error scenario tests
- [ ] Rarity queue end-to-end tests
- [ ] Stats calculation tests

### Phase 3: Edge Cases (Week 3)
- [ ] Concurrency tests
- [ ] Performance tests
- [ ] Error handling tests
- [ ] Component tests

### Phase 4: Maintenance (Ongoing)
- [ ] Add tests for every bug found
- [ ] Maintain 90%+ coverage on new code
- [ ] Run full suite in CI on every PR
- [ ] Weekly test review/cleanup

## Success Metrics

### Short Term (1 week)
- Zero failing tests
- Unit tests run in <10 seconds
- Integration tests run in <2 minutes

### Medium Term (1 month)
- 90%+ unit test coverage
- 80%+ integration test coverage
- All critical paths tested
- No flaky tests

### Long Term (3 months)
- Test suite trusted by team
- Tests catch bugs before production
- Easy to add tests for new features
- Fast feedback loop (tests guide development)

## Anti-Patterns to Avoid

### ❌ Don't Do This
1. **Testing implementation details** - Test behavior, not internals
2. **Mocking everything** - Use real DB for integration tests
3. **Giant test files** - One describe block per logical unit
4. **Unclear test names** - Name should explain what's tested
5. **Tests that call production APIs** - Mock external services
6. **Tests that depend on order** - Each test independent
7. **Tests without assertions** - Every test must verify something

### ✅ Do This Instead
1. **Test user-facing behavior** - What does the user see/experience?
2. **Use real dependencies** - Only mock boundaries (APIs, DB in unit tests)
3. **Small, focused tests** - One concept per test
4. **Descriptive names** - "should calculate points correctly for rare observation"
5. **Mock external APIs** - Fast, reliable, testable error cases
6. **Independent tests** - Can run in any order, in parallel
7. **Clear assertions** - `expect(result).toBe(expected)` with context

## Key Principles

1. **Fast feedback** - Unit tests run in seconds
2. **Realistic** - Integration tests use real DB
3. **Reliable** - No flaky tests tolerated
4. **Maintainable** - Easy to update when code changes
5. **Valuable** - Tests prevent real bugs, not busywork
6. **Pragmatic** - 80/20 rule - focus on critical paths first

## Conclusion

The current test suite has **quality over quantity** problems:
- Tests exist but don't test the right things
- Tests call real APIs (slow, flaky)
- Tests interfere with each other
- Critical bugs slip through

**Goal**: A comprehensive, fast, reliable test suite that gives confidence to ship.

**Measure of success**: Can we deploy on Friday afternoon without fear? That's when tests matter most.
