/**
 * Database Test Utilities
 *
 * Provides helpers for test data creation and cleanup.
 */

import { prisma } from '@/lib/db/prisma';
import type { User, Observation } from '@prisma/client';

/**
 * Generate unique test IDs to avoid conflicts
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate unique iNat ID for test users
 */
export function generateTestINatId(): number {
  return 100000 + Math.floor(Math.random() * 900000);
}

/**
 * Factory: Create a test user with sensible defaults
 */
export async function createTestUser(overrides?: Partial<User>): Promise<User> {
  const userId = generateTestId('user');
  const inatId = generateTestINatId();

  return prisma.user.create({
    data: {
      id: userId,
      inatId,
      inatUsername: `testuser-${inatId}`,
      email: `test-${inatId}@example.com`,
      accessToken: `mock-token-${userId}`,
      ...overrides,
    },
  });
}

/**
 * Factory: Create test observations for a user
 */
export async function createTestObservations(
  userId: string,
  count: number,
  overrides?: Partial<Observation>
): Promise<Observation[]> {
  const observations: Observation[] = [];

  for (let i = 0; i < count; i++) {
    const baseDate = new Date(2025, 0, i + 1);
    const obs = await prisma.observation.create({
      data: {
        id: 1000000 + Date.now() + i,
        userId,
        observedOn: baseDate,
        qualityGrade: 'research',
        taxonId: 100000 + i,
        taxonName: `Test Species ${i}`,
        taxonRank: 'species',
        iconicTaxon: ['Plantae', 'Animalia', 'Fungi'][i % 3],
        rarity: 'common',
        rarityStatus: 'pending',
        pointsAwarded: 10,
        latitude: 40.0 + i * 0.01,
        longitude: -3.0 + i * 0.01,
        photosCount: 1,
        ...overrides,
      },
    });
    observations.push(obs);
  }

  return observations;
}

/**
 * Factory: Create test user with observations
 */
export async function createTestUserWithObservations(
  observationCount: number = 10,
  userOverrides?: Partial<User>,
  obsOverrides?: Partial<Observation>
): Promise<{ user: User; observations: Observation[] }> {
  const user = await createTestUser(userOverrides);
  const observations = await createTestObservations(user.id, observationCount, obsOverrides);

  return { user, observations };
}

/**
 * Factory: Queue taxa for classification
 */
export async function createTestQueue(
  userId: string,
  taxonIds: number[],
  overrides?: { priority?: number; status?: string }
) {
  const items = taxonIds.map(taxonId => ({
    userId,
    taxonId,
    taxonName: `Taxon ${taxonId}`,
    priority: overrides?.priority ?? 5,
    status: overrides?.status ?? 'pending',
  }));

  return prisma.rarityClassificationQueue.createMany({
    data: items,
  });
}

/**
 * Cleanup: Delete all test data for a user
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  await Promise.all([
    prisma.observation.deleteMany({ where: { userId } }),
    prisma.rarityClassificationQueue.deleteMany({ where: { userId } }),
    prisma.userStats.deleteMany({ where: { userId } }),
    prisma.syncProgress.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }).catch(() => {}), // Ignore if already deleted
  ]);
}

/**
 * Cleanup: Delete all test data (for afterAll hooks)
 */
export async function cleanupAllTestData(): Promise<void> {
  // Delete test data by ID patterns
  await Promise.all([
    prisma.observation.deleteMany({
      where: {
        userId: {
          startsWith: 'test-',
        },
      },
    }),
    prisma.rarityClassificationQueue.deleteMany({
      where: {
        userId: {
          startsWith: 'test-',
        },
      },
    }),
    prisma.userStats.deleteMany({
      where: {
        userId: {
          startsWith: 'test-',
        },
      },
    }),
    prisma.syncProgress.deleteMany({
      where: {
        userId: {
          startsWith: 'test-',
        },
      },
    }),
    prisma.user.deleteMany({
      where: {
        id: {
          startsWith: 'test-',
        },
      },
    }),
  ]);
}

/**
 * Wait for condition to be true (useful for testing async operations)
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 10000,
    interval = 100,
    timeoutMessage = 'Condition not met within timeout',
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(timeoutMessage);
}

/**
 * Get database statistics for debugging
 */
export async function getTestDatabaseStats(): Promise<{
  users: number;
  observations: number;
  queueItems: number;
}> {
  const [users, observations, queueItems] = await Promise.all([
    prisma.user.count({ where: { id: { startsWith: 'test-' } } }),
    prisma.observation.count({ where: { userId: { startsWith: 'test-' } } }),
    prisma.rarityClassificationQueue.count({ where: { userId: { startsWith: 'test-' } } }),
  ]);

  return { users, observations, queueItems };
}
