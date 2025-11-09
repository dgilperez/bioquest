/**
 * Taxon Data Caching Layer
 *
 * SCALABILITY: Critical for supporting multiple users within iNat's 10k req/day limit
 *
 * Without caching:
 * - 10 users × 50 species each = 500 unique species × 2 API calls = 1,000 API calls
 * - With significant overlap, still ~800-1000 calls
 *
 * With caching:
 * - First user classifies House Sparrow (taxon 6892) → 2 API calls → cached
 * - Next 9 users classify House Sparrow → 0 API calls (cache hit!)
 * - 500 unique species × 70% cache hit rate = ~300 API calls (67% reduction)
 *
 * Cache strategy:
 * - Global counts: 30 days (changes slowly)
 * - Regional counts: 7 days (more dynamic)
 * - First observations: Permanent (never changes)
 */

import { prisma } from '@/lib/db/prisma';
import { getINatClient } from '@/lib/inat/client';

export interface TaxonCounts {
  global: number;
  regional?: number;
}

// In-flight request deduplication
// Prevents multiple concurrent users from fetching the same taxon simultaneously
const pendingRequests = new Map<string, Promise<TaxonCounts>>();

/**
 * Staleness thresholds (in milliseconds)
 */
const CACHE_STALENESS = {
  GLOBAL_COUNT: 30 * 24 * 60 * 60 * 1000, // 30 days
  REGIONAL_COUNT: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Check if cached data is stale
 */
function isStale(cachedAt: Date, maxAgeMs: number): boolean {
  return Date.now() - cachedAt.getTime() > maxAgeMs;
}

/**
 * Get cache key for pending requests deduplication
 */
function getCacheKey(taxonId: number, placeId?: number): string {
  return placeId ? `${taxonId}:${placeId}` : `${taxonId}`;
}

/**
 * Fetch taxon counts from API (no cache)
 */
async function fetchFromAPI(
  taxonId: number,
  accessToken: string,
  placeId?: number
): Promise<TaxonCounts> {
  const client = getINatClient(accessToken);

  // Fetch global count
  const global = await client.getTaxonObservationCount(taxonId);

  // Fetch regional count if requested
  let regional: number | undefined;
  if (placeId) {
    regional = await client.getTaxonObservationCount(taxonId, placeId);
  }

  return { global, regional };
}

/**
 * Update cache in database
 */
async function updateCache(
  taxonId: number,
  counts: TaxonCounts,
  placeId?: number
): Promise<void> {
  const now = new Date();

  // Update TaxonNode for global data
  await prisma.taxonNode.upsert({
    where: { id: taxonId },
    update: {
      globalObsCount: counts.global,
      cachedAt: now,
      updatedAt: now,
    },
    create: {
      id: taxonId,
      name: '', // Will be filled in later if needed
      rank: 'species', // Default, will be updated if needed
      globalObsCount: counts.global,
      cachedAt: now,
    },
  });

  // Update RegionalTaxonData if regional data requested
  if (placeId && counts.regional !== undefined) {
    await prisma.regionalTaxonData.upsert({
      where: {
        placeId_taxonId: {
          placeId,
          taxonId,
        },
      },
      update: {
        rgObservationCount: counts.regional,
        cachedAt: now,
        updatedAt: now,
      },
      create: {
        placeId,
        taxonId,
        placeName: '', // Will be filled in later if needed
        rank: 'species', // Default
        rgObservationCount: counts.regional,
        cachedAt: now,
      },
    });
  }
}

/**
 * Get taxon observation counts (with caching and deduplication)
 *
 * Cache hit path: ~1ms (database read)
 * Cache miss path: ~500-1000ms (API call + database write)
 *
 * Deduplication: If 10 users request the same taxon simultaneously:
 * - Without dedup: 10 API calls
 * - With dedup: 1 API call, 9 wait for result
 */
export async function getTaxonCounts(
  taxonId: number,
  accessToken: string,
  placeId?: number,
  options: {
    forceRefresh?: boolean; // Skip cache, force API call
    skipCache?: boolean;    // Don't check cache, but still write to it
  } = {}
): Promise<TaxonCounts> {
  const cacheKey = getCacheKey(taxonId, placeId);

  // OPTIMIZATION 1: Check for in-flight requests (deduplication)
  if (!options.forceRefresh && !options.skipCache && pendingRequests.has(cacheKey)) {
    console.log(`  ⏳ Waiting for in-flight request: taxon ${taxonId}${placeId ? ` in place ${placeId}` : ''}`);
    return pendingRequests.get(cacheKey)!;
  }

  // OPTIMIZATION 2: Check database cache
  if (!options.forceRefresh && !options.skipCache) {
    const cachedNode = await prisma.taxonNode.findUnique({
      where: { id: taxonId },
      select: {
        globalObsCount: true,
        cachedAt: true,
      },
    });

    // Check if global cache is fresh
    const globalFresh = cachedNode && cachedNode.cachedAt &&
      !isStale(cachedNode.cachedAt, CACHE_STALENESS.GLOBAL_COUNT);

    if (globalFresh) {
      console.log(`  ✓ Cache HIT: taxon ${taxonId} (global count: ${cachedNode!.globalObsCount})`);

      // If regional data requested, check regional cache
      if (placeId) {
        const cachedRegional = await prisma.regionalTaxonData.findUnique({
          where: {
            placeId_taxonId: {
              placeId,
              taxonId,
            },
          },
          select: {
            rgObservationCount: true,
            cachedAt: true,
          },
        });

        const regionalFresh = cachedRegional && cachedRegional.cachedAt &&
          !isStale(cachedRegional.cachedAt, CACHE_STALENESS.REGIONAL_COUNT);

        if (regionalFresh) {
          console.log(`    ✓ Regional cache HIT: place ${placeId} (count: ${cachedRegional!.rgObservationCount})`);
          return {
            global: cachedNode!.globalObsCount,
            regional: cachedRegional!.rgObservationCount,
          };
        } else {
          console.log(`    ⚠️  Regional cache MISS or STALE: place ${placeId}`);
          // Fall through to fetch from API
        }
      } else {
        // No regional data needed, return global only
        return { global: cachedNode!.globalObsCount };
      }
    } else {
      console.log(`  ⚠️  Cache MISS or STALE: taxon ${taxonId}`);
    }
  }

  // OPTIMIZATION 3: Fetch from API (cache miss)
  const fetchPromise = (async () => {
    try {
      console.log(`  🌐 Fetching from API: taxon ${taxonId}${placeId ? ` in place ${placeId}` : ''}...`);
      const counts = await fetchFromAPI(taxonId, accessToken, placeId);

      // Update cache in background (don't await)
      updateCache(taxonId, counts, placeId).catch(err => {
        console.error(`Failed to update cache for taxon ${taxonId}:`, err);
      });

      return counts;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store pending request for deduplication
  pendingRequests.set(cacheKey, fetchPromise);

  return fetchPromise;
}

/**
 * Batch get taxon counts (optimized for multiple taxa)
 *
 * Automatically deduplicates and uses cache when available
 */
export async function batchGetTaxonCounts(
  taxonIds: number[],
  accessToken: string,
  placeId?: number,
  onProgress?: (processed: number, total: number) => void
): Promise<Map<number, TaxonCounts>> {
  const results = new Map<number, TaxonCounts>();

  // Process in parallel (rate limiting handled by client)
  let processed = 0;
  const promises = taxonIds.map(async (taxonId) => {
    const counts = await getTaxonCounts(taxonId, accessToken, placeId);
    results.set(taxonId, counts);
    processed++;
    if (onProgress) {
      onProgress(processed, taxonIds.length);
    }
  });

  await Promise.all(promises);

  return results;
}

/**
 * Pre-warm cache for common species (run before launch)
 *
 * Example usage:
 * ```
 * // Fetch top 5000 most observed species globally
 * const topSpecies = await client.request('/observations/species_counts?per_page=5000');
 * await warmCache(topSpecies.results.map(s => s.taxon.id), accessToken);
 * ```
 */
export async function warmCache(
  taxonIds: number[],
  accessToken: string,
  batchSize: number = 50,
  delayMs: number = 2000
): Promise<{ processed: number; errors: number }> {
  console.log(`🔥 Warming cache for ${taxonIds.length} taxa...`);

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < taxonIds.length; i += batchSize) {
    const batch = taxonIds.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(taxonIds.length / batchSize);

    console.log(`  📦 Batch ${batchNum}/${totalBatches}: Processing ${batch.length} taxa...`);

    const results = await Promise.allSettled(
      batch.map(taxonId => getTaxonCounts(taxonId, accessToken, undefined, { skipCache: true }))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    processed += succeeded;
    errors += failed;

    console.log(`    ✓ Batch complete: ${succeeded} succeeded, ${failed} failed`);

    // Delay between batches to respect rate limits
    if (i + batchSize < taxonIds.length) {
      console.log(`    ⏳ Waiting ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`🎉 Cache warming complete: ${processed} cached, ${errors} errors`);

  return { processed, errors };
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats(): Promise<{
  totalTaxa: number;
  freshTaxa: number;
  staleTaxa: number;
  cacheHitRate: number;
}> {
  const now = Date.now();
  const globalStaleThreshold = new Date(now - CACHE_STALENESS.GLOBAL_COUNT);

  const [total, fresh] = await Promise.all([
    prisma.taxonNode.count(),
    prisma.taxonNode.count({
      where: {
        cachedAt: {
          gte: globalStaleThreshold,
        },
      },
    }),
  ]);

  return {
    totalTaxa: total,
    freshTaxa: fresh,
    staleTaxa: total - fresh,
    cacheHitRate: total > 0 ? (fresh / total) * 100 : 0,
  };
}
