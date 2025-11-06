/**
 * Mock iNaturalist API Client for Testing
 *
 * Provides configurable mock responses for all iNat API endpoints.
 * Use this instead of calling real APIs in tests.
 */

import { vi } from 'vitest';
import type { INatClient } from '@/lib/inat/client';

export interface MockObservation {
  id: number;
  species_guess?: string;
  taxon?: {
    id: number;
    name: string;
    rank: string;
    iconic_taxon_name?: string;
  };
  observed_on: string;
  created_at: string;
  updated_at: string;
  location?: string;
  quality_grade: 'research' | 'needs_id' | 'casual';
  user: {
    id: number;
    login: string;
  };
}

export interface MockINatClientOptions {
  observations?: MockObservation[];
  totalObservations?: number;
  userInfo?: {
    id: number;
    login: string;
    name?: string;
  };
  speciesCounts?: Array<{ taxon_id: number; count: number }>;
  taxonObservationCount?: number;
  // Error simulation
  shouldFailWith?: {
    error: Error;
    onCall?: number; // Fail on specific call number (1-indexed)
  };
}

// Counter to ensure truly unique IDs even within same millisecond
let observationIdCounter = 0;

/**
 * Generate mock observations with sensible defaults
 * Uses timestamp + counter to ensure uniqueness across all test runs
 *
 * @param count Number of observations to generate
 * @param overrides Optional overrides for all observations
 * @param baseIdOverride Optional base ID to use (for test isolation)
 */
export function generateMockObservations(
  count: number,
  overrides?: Partial<MockObservation>,
  baseIdOverride?: number
): MockObservation[] {
  const observations: MockObservation[] = [];

  // Use provided baseId or generate one
  const baseId = baseIdOverride ?? (Date.now() * 100000 + (observationIdCounter++ * 1000)); // Large multiplier for uniqueness
  const baseTaxonId = Math.floor(Math.random() * 100000) + 100000;

  for (let i = 0; i < count; i++) {
    const baseDate = new Date(2025, 0, i + 1);
    observations.push({
      id: baseId + i,
      species_guess: `Species ${i}`,
      taxon: {
        id: baseTaxonId + i,
        name: `Taxon ${baseTaxonId + i}`,
        rank: 'species',
        iconic_taxon_name: ['Plantae', 'Animalia', 'Fungi', 'Mollusca'][i % 4],
      },
      observed_on: baseDate.toISOString().split('T')[0],
      created_at: baseDate.toISOString(),
      updated_at: baseDate.toISOString(),
      location: `${40 + i * 0.01},${-3 + i * 0.01}`,
      quality_grade: 'research',
      user: {
        id: 123456,
        login: 'testuser',
      },
      ...overrides,
    });
  }

  return observations;
}

/**
 * Create a fully mocked iNat client
 *
 * @example
 * ```typescript
 * const mockClient = createMockINatClient({
 *   observations: generateMockObservations(50),
 *   totalObservations: 50,
 * });
 *
 * vi.mocked(getINatClient).mockReturnValue(mockClient);
 * ```
 */
export function createMockINatClient(options: MockINatClientOptions = {}): INatClient {
  const {
    observations = generateMockObservations(10),
    totalObservations = observations.length,
    userInfo = { id: 123456, login: 'testuser', name: 'Test User' },
    speciesCounts = [],
    taxonObservationCount = 5000,
    shouldFailWith,
  } = options;

  let callCount = 0;

  const checkForError = () => {
    if (shouldFailWith) {
      callCount++;
      if (!shouldFailWith.onCall || callCount === shouldFailWith.onCall) {
        throw shouldFailWith.error;
      }
    }
  };

  return {
    getUserObservations: vi.fn().mockImplementation(async () => {
      checkForError();
      return {
        total_results: totalObservations,
        results: observations,
      };
    }),

    getUserInfo: vi.fn().mockImplementation(async () => {
      checkForError();
      return userInfo;
    }),

    getUserSpeciesCounts: vi.fn().mockImplementation(async () => {
      checkForError();
      return {
        total_results: speciesCounts.length,
        results: speciesCounts,
      };
    }),

    getTaxonObservationCount: vi.fn().mockImplementation(async () => {
      checkForError();
      return {
        total_results: taxonObservationCount,
      };
    }),

    // Add other methods as needed
  } as unknown as INatClient;
}

/**
 * Create a mock client that simulates common error scenarios
 */
export function createErrorMockINatClient(errorType: 'rate_limit' | 'timeout' | 'server_error' | 'not_found' | 'invalid_token'): INatClient {
  const errorMap = {
    rate_limit: new Error('Rate limit exceeded (429)'),
    timeout: new Error('ETIMEDOUT'),
    server_error: new Error('Internal Server Error (500)'),
    not_found: new Error('Not Found (404)'),
    invalid_token: new Error('Unauthorized (401)'),
  };

  return createMockINatClient({
    shouldFailWith: {
      error: errorMap[errorType],
    },
  });
}

/**
 * Create a mock client that fails on a specific call, then succeeds
 * Useful for testing retry logic
 */
export function createFlakeyMockINatClient(failOnCall: number): INatClient {
  return createMockINatClient({
    shouldFailWith: {
      error: new Error('Temporary failure'),
      onCall: failOnCall,
    },
  });
}
