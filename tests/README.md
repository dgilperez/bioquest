# BioQuest Test Suite

Comprehensive testing infrastructure for the BioQuest application.

## Quick Start

```bash
# Run all tests
npm test

# Run only unit tests (fast, no DB)
npm run test:unit

# Run only integration tests (with DB)
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── helpers/              # Test utilities
│   ├── mock-inat-client.ts   # Mock iNat API responses
│   └── db.ts                   # Database test factories
├── fixtures/             # Test data
│   ├── inat-responses/    # Recorded API responses
│   └── database/          # DB test data
├── unit/                 # Fast, isolated tests
└── integration/          # DB + API tests
```

## Test Helpers

### Mock iNat Client

Use `createMockINatClient()` to avoid calling real APIs:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createMockINatClient, generateMockObservations } from '../helpers/mock-inat-client';
import { getINatClient } from '@/lib/inat/client';

vi.mock('@/lib/inat/client');

describe('Sync System', () => {
  it('should sync observations from iNat', async () => {
    // Create mock client with 50 observations
    const mockClient = createMockINatClient({
      observations: generateMockObservations(50),
      totalObservations: 50,
    });

    vi.mocked(getINatClient).mockReturnValue(mockClient);

    // Your test code here...

    // Verify API was called
    expect(mockClient.getUserObservations).toHaveBeenCalled();
  });
});
```

### Simulating Errors

```typescript
import { createErrorMockINatClient } from '../helpers/mock-inat-client';

// Simulate rate limit error
const mockClient = createErrorMockINatClient('rate_limit');

// Simulate temporary failure (fails once, then succeeds)
const flakeyClient = createFlakeyMockINatClient(1); // Fails on 1st call
```

### Database Factories

Use factory functions to create test data:

```typescript
import {
  createTestUser,
  createTestObservations,
  createTestUserWithObservations,
  cleanupTestUser
} from '../helpers/db';

describe('Stats Calculation', () => {
  let userId: string;

  beforeEach(async () => {
    // Create test user with 10 observations
    const { user, observations } = await createTestUserWithObservations(10);
    userId = user.id;
  });

  afterEach(async () => {
    await cleanupTestUser(userId);
  });

  it('should calculate species count', async () => {
    const stats = await calculateUserStats(userId);
    expect(stats.speciesCount).toBe(10);
  });
});
```

### Unique Test IDs

Always use unique IDs to avoid conflicts:

```typescript
import { generateTestId, generateTestINatId } from '../helpers/db';

const userId = generateTestId('user');      // "user-1704067200000-1234"
const inatId = generateTestINatId();        // 123456
```

## Writing Tests

### Unit Test Pattern

Test pure logic without DB or external APIs:

```typescript
// tests/unit/lib/gamification/points.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePoints } from '@/lib/gamification/points';

describe('Points Calculation', () => {
  it('should award base points for observation', () => {
    const result = calculatePoints({
      qualityGrade: 'research',
      rarity: 'common',
    });

    expect(result.basePoints).toBe(10);
  });

  it('should award bonus for rare observation', () => {
    const result = calculatePoints({
      qualityGrade: 'research',
      rarity: 'rare',
    });

    expect(result.bonusPoints.rarity).toBe(100);
  });
});
```

### Integration Test Pattern

Test with real DB, mocked external APIs:

```typescript
// tests/integration/sync/sync-happy-path.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockINatClient, generateMockObservations } from '../../helpers/mock-inat-client';
import { createTestUser, cleanupTestUser } from '../../helpers/db';
import { getINatClient } from '@/lib/inat/client';
import { syncUserObservations } from '@/lib/stats/user-stats';

vi.mock('@/lib/inat/client');

describe('Sync Happy Path', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;

    // Mock iNat API
    const mockClient = createMockINatClient({
      observations: generateMockObservations(50),
      totalObservations: 50,
    });
    vi.mocked(getINatClient).mockReturnValue(mockClient);
  });

  afterEach(async () => {
    await cleanupTestUser(userId);
  });

  it('should sync all observations from iNat', async () => {
    const result = await syncUserObservations(userId, 'testuser', 'mock-token');

    expect(result.newObservations).toBe(50);

    // Verify data in DB
    const observations = await prisma.observation.findMany({
      where: { userId },
    });
    expect(observations).toHaveLength(50);
  });
});
```

## Best Practices

### ✅ DO

- Use factory functions for test data
- Mock external APIs (iNat, etc.)
- Clean up test data in `afterEach`
- Use descriptive test names
- Test behavior, not implementation
- Keep tests fast (<10ms for unit tests)

### ❌ DON'T

- Call real iNat API in tests
- Share state between tests
- Use hard-coded test IDs
- Test implementation details
- Skip cleanup (causes test interference)
- Write tests that depend on order

## Troubleshooting

### Tests failing with "Unique constraint violation"

**Problem**: Test data from previous run wasn't cleaned up.

**Solution**: Use `generateTestId()` for unique IDs, and ensure `afterEach` calls `cleanupTestUser()`.

### Tests timing out

**Problem**: Calling real API or infinite loop.

**Solution**: Ensure all external APIs are mocked with `createMockINatClient()`.

### Tests pass individually but fail in suite

**Problem**: Test interference due to shared state.

**Solution**:
1. Ensure each test uses unique IDs
2. Clean up properly in `afterEach`
3. Check that tests don't depend on execution order

### "Cannot find module" errors

**Problem**: TypeScript path aliases not resolved.

**Solution**: Check `vitest.config.ts` has correct path aliases:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

## Test Coverage Goals

- **Unit tests**: 90%+ coverage
- **Integration tests**: 80%+ coverage
- **Critical paths**: 100% coverage

## Contributing

When adding new features:

1. Write tests FIRST (TDD)
2. Use existing helpers and patterns
3. Ensure all tests pass before PR
4. Add new helpers if needed (update this README)

## Examples

See existing test files for patterns:

- **Unit test example**: `src/lib/stats/__tests__/calculate-stats.test.ts`
- **Integration test example**: `src/lib/sync/__tests__/sync-interruption-recovery.test.ts`
- **With mocks**: `src/lib/rarity-queue/__tests__/processor-edge-cases.test.ts`
