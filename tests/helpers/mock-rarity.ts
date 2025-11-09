/**
 * Test-Controllable Rarity Classification Mocking
 *
 * Provides per-test control over rarity classification behavior.
 * Solves the module-level mocking problem by using vi.spyOn.
 */

import { vi } from 'vitest';
import type { RarityResult } from '@/lib/gamification/rarity';

export interface MockRarityOptions {
  /** Default rarity for all classifications */
  defaultRarity?: string;
  /** Default global count */
  defaultGlobalCount?: number;
  /** Default regional count */
  defaultRegionalCount?: number;
  /** Should throw an error */
  shouldFail?: boolean;
  /** Error to throw */
  error?: Error;
  /** Per-taxon overrides: taxonId -> RarityResult */
  perTaxonResults?: Map<number, Partial<RarityResult>>;
}

/**
 * Default successful classification result
 */
export function createMockRarityResult(overrides?: Partial<RarityResult>): RarityResult {
  return {
    rarity: 'common',
    globalCount: 5000,
    regionalCount: 500,
    isFirstGlobal: false,
    isFirstRegional: false,
    bonusPoints: 0,
    ...overrides,
  } as RarityResult;
}

/**
 * Create a mock for classifyObservationRarity that can be controlled per-test
 *
 * Usage:
 * ```typescript
 * const mockClassify = await mockClassifyObservationRarity({
 *   defaultRarity: 'rare',
 *   defaultGlobalCount: 500,
 * });
 *
 * // In test
 * await processUserQueue(userId, 20);
 *
 * // Verify
 * expect(mockClassify).toHaveBeenCalled();
 *
 * // Cleanup
 * mockClassify.mockRestore();
 * ```
 */
export async function mockClassifyObservationRarity(options: MockRarityOptions = {}) {
  const {
    defaultRarity = 'common',
    defaultGlobalCount = 5000,
    defaultRegionalCount = 500,
    shouldFail = false,
    error = new Error('Mock rarity classification error'),
    perTaxonResults = new Map(),
  } = options;

  // Import the module dynamically
  const rarityModule = await import('@/lib/gamification/rarity');

  // Spy on the function
  const spy = vi.spyOn(rarityModule, 'classifyObservationRarity');

  // Mock implementation
  spy.mockImplementation(async (observation: any) => {
    if (shouldFail) {
      throw error;
    }

    const taxonId = observation.taxon?.id;

    // Check for per-taxon override
    if (taxonId && perTaxonResults.has(taxonId)) {
      const override = perTaxonResults.get(taxonId)!;
      return createMockRarityResult(override);
    }

    // Default result
    return createMockRarityResult({
      rarity: defaultRarity as any,
      globalCount: defaultGlobalCount,
      regionalCount: defaultRegionalCount,
    });
  });

  return spy;
}

/**
 * Create a mock for classifyObservationsRarity (batch version)
 */
export async function mockClassifyObservationsRarity(options: MockRarityOptions = {}) {
  const {
    defaultRarity = 'common',
    defaultGlobalCount = 5000,
    defaultRegionalCount = 500,
    perTaxonResults = new Map(),
  } = options;

  const rarityModule = await import('@/lib/gamification/rarity');
  const spy = vi.spyOn(rarityModule, 'classifyObservationsRarity');

  spy.mockImplementation(async (observations: any[]) => {
    const resultsMap = new Map();

    observations.forEach((obs: any) => {
      const taxonId = obs.taxon?.id;

      // Check for per-taxon override
      if (taxonId && perTaxonResults.has(taxonId)) {
        const override = perTaxonResults.get(taxonId)!;
        resultsMap.set(obs.id, createMockRarityResult(override));
      } else {
        // Default result
        resultsMap.set(obs.id, createMockRarityResult({
          rarity: defaultRarity as any,
          globalCount: defaultGlobalCount,
          regionalCount: defaultRegionalCount,
        }));
      }
    });

    return resultsMap;
  });

  return spy;
}

/**
 * Create error simulation mocks for testing error handling
 */
export async function mockClassifyObservationRarityWithError(errorType: 'rate_limit' | 'timeout' | 'server_error' | 'not_found') {
  const errorMap = {
    rate_limit: new Error('Rate limit exceeded (429)'),
    timeout: new Error('ETIMEDOUT'),
    server_error: new Error('Internal Server Error (500)'),
    not_found: new Error('Not Found (404)'),
  };

  return await mockClassifyObservationRarity({
    shouldFail: true,
    error: errorMap[errorType],
  });
}

/**
 * Restore all rarity mocks (use in afterEach)
 */
export function restoreRarityMocks() {
  vi.restoreAllMocks();
}
