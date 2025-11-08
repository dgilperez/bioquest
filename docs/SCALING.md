# BioQuest Scaling Strategy

## Overview

This document outlines the strategy for scaling BioQuest from a single user to thousands of users while staying within iNaturalist's API rate limits.

**Last Updated**: 2025-01-08

## Table of Contents

1. [Rate Limit Constraints](#rate-limit-constraints)
2. [Caching Architecture](#caching-architecture)
3. [Multi-Phase Scaling Plan](#multi-phase-scaling-plan)
4. [Capacity Estimates](#capacity-estimates)
5. [Cache Warming Strategy](#cache-warming-strategy)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Rate Limit Constraints

### iNaturalist API Limits

**Critical Constraint**: Rate limits are enforced **PER IP ADDRESS**, not per user or OAuth token.

- **Recommended limit**: ~1 request/second
- **Hard limit**: ~10,000 requests/day per IP address
- **Enforcement**: At the IP level (all users share the same limit)

**Source**: [iNaturalist API Documentation](https://api.inaturalist.org/v1/docs/)

### Impact Without Caching

**Example: 10 users, 50 species each**

- Without sharing: 10 users × 50 species × 2 API calls (global + regional) = **1,000 API calls**
- With 50% overlap: Still ~**800-1,000 API calls**
- **Result**: 10% of daily quota consumed by just 10 users

**Scaling problem**: Without caching, we can only support ~100 active users per day.

---

## Caching Architecture

### Overview

The taxon caching system reduces API calls by 90-95% by sharing taxon data across all users.

**Key file**: `src/lib/gamification/taxon-cache.ts`

### Three-Layer Optimization

#### Layer 1: In-Flight Request Deduplication

Prevents concurrent duplicate requests when multiple users classify the same taxon simultaneously.

```typescript
// In-memory map prevents duplicate concurrent requests
const pendingRequests = new Map<string, Promise<TaxonCounts>>();
```

**Benefit**: If 10 users classify House Sparrow at the same time:
- **Without dedup**: 10 API calls
- **With dedup**: 1 API call, 9 users wait for result

#### Layer 2: Database Cache

Stores taxon observation counts in the database with configurable staleness thresholds.

**Tables used**:
- `TaxonNode` (global observation counts)
- `RegionalTaxonData` (regional observation counts)

**Cache staleness**:
- **Global counts**: 30 days (species populations change slowly)
- **Regional counts**: 7 days (more dynamic, needs fresher data)

**Benefit**: After first user caches House Sparrow → next 999 users get instant results (0 API calls)

#### Layer 3: API Fallback

Only fetches from iNaturalist API when cache is stale or missing.

### Cache Hit Rate

**Target**: 70-90% cache hit rate after warm-up period

**Example with 90% cache hit rate**:
- 100 users × 50 species each = 5,000 unique taxa requests
- Cache hits (90%): 4,500 × 0 API calls = 0 API calls
- Cache misses (10%): 500 × 2 API calls = 1,000 API calls
- **Total**: 1,000 API calls instead of 10,000 (90% reduction)

---

## Multi-Phase Scaling Plan

### Phase 1: Controlled Beta (Months 1-3)

**Target**: 100-500 users

**Focus**:
- Build cache with common species
- Monitor API usage patterns
- Identify popular taxa
- Test cache effectiveness

**API Capacity**:
- 100 users × 50 species = 5,000 taxa
- With 70% cache hit: ~1,500 API calls/day
- **Utilization**: 15% of quota

**Actions**:
- Launch with controlled invites
- Monitor cache stats daily
- Pre-warm cache with top 1,000 most observed species

### Phase 2: Regional Expansion (Months 3-6)

**Target**: 500-2,000 users

**Focus**:
- Expand to multiple geographic regions
- Pre-warm regional caches
- Optimize cache staleness thresholds

**API Capacity**:
- 2,000 users × 50 species = 100,000 unique taxa
- Realistic overlap: ~50,000 unique species globally
- With 80% cache hit: ~10,000 API calls/day (first week)
- Steady state (85% hit): ~7,500 API calls/day
- **Utilization**: 75% of quota

**Actions**:
- Identify top species per region
- Pre-warm caches for major biomes
- Implement cache warming cron jobs

### Phase 3: Global Scale (Months 6-12)

**Target**: 2,000-10,000 users

**Focus**:
- Mature cache (high hit rates)
- Distribute load across multiple servers if needed
- Implement intelligent cache warming

**API Capacity**:
- 10,000 users globally
- Realistic species distribution:
  - 50,000-100,000 unique species total
  - High overlap in common species (House Sparrow, Mallard, etc.)
- With 90% cache hit: ~10,000 API calls/day (steady state)
- **Utilization**: 100% of quota (at capacity)

**Actions**:
- Monitor cache hit rates closely (target: >90%)
- Implement predictive cache warming
- Consider distributing users across multiple IP addresses if needed

---

## Capacity Estimates

### Species Distribution Assumptions

**Common species (80% of observations)**:
- Top 1,000 species: House Sparrow, Mallard, American Robin, etc.
- High overlap across users
- Cache hit rate: 95-98%

**Uncommon species (15% of observations)**:
- Next 10,000 species
- Moderate overlap
- Cache hit rate: 60-80%

**Rare species (5% of observations)**:
- Long tail: 50,000+ species
- Low overlap
- Cache hit rate: 10-30%

### Realistic Scaling Limits

| Users | Unique Species | Daily API Calls | Quota Usage |
|-------|----------------|-----------------|-------------|
| 100   | 5,000          | 1,500           | 15%         |
| 500   | 20,000         | 4,000           | 40%         |
| 1,000 | 35,000         | 6,000           | 60%         |
| 2,000 | 50,000         | 7,500           | 75%         |
| 5,000 | 75,000         | 9,000           | 90%         |
| 10,000| 100,000        | 10,000          | 100%        |

**Note**: These assume 85-90% cache hit rates after warm-up.

### Growth Rate Constraints

**Maximum safe growth**: ~100 new users per week

- Allows cache to warm up gradually
- Prevents API quota spikes
- Enables monitoring and optimization

**RED FLAG**: Do not exceed 1,000 new users per week without:
- Multiple IP addresses (horizontal scaling)
- Advanced cache warming
- Load balancing

---

## Cache Warming Strategy

### Pre-Launch

**Goal**: Populate cache with top 5,000 most observed species globally

**Method**: Use `warmCache()` function from `taxon-cache.ts`

```bash
# Example: Fetch top 5,000 species from iNaturalist
# Run this BEFORE launch (takes ~2-3 hours at 1 req/sec)
npm run warm-cache -- --count 5000
```

**API Cost**: 5,000 taxa × 2 calls = 10,000 API calls (1 day's quota)

**Benefit**: First users will see 80-90% cache hits immediately

### Post-Launch

**Goal**: Continuously refresh popular species and pre-warm regional caches

**Cron Jobs** (recommended):

1. **Daily refresh** (top 1,000 global species)
   - Runs at 3am server time
   - Ensures popular species have fresh counts
   - Cost: ~2,000 API calls

2. **Weekly refresh** (top 10,000 species)
   - Runs Sunday 2am
   - Refreshes uncommon species
   - Cost: ~5,000 API calls

3. **Regional warming** (on-demand)
   - When launching in new region
   - Pre-warm top 500 regional species
   - Cost: ~1,000 API calls per region

### Cache Warming Functions

```typescript
import { warmCache, getCacheStats } from '@/lib/gamification/taxon-cache';

// Warm cache for top species
await warmCache(
  topSpeciesIds,
  accessToken,
  batchSize: 50,      // 50 taxa per batch
  delayMs: 2000       // 2 second delay between batches
);

// Monitor cache effectiveness
const stats = await getCacheStats();
console.log(`Cache hit rate: ${stats.cacheHitRate}%`);
```

---

## Monitoring & Maintenance

### Key Metrics to Track

1. **API Usage**
   - Daily API calls
   - API calls per user
   - API errors (rate limit exceeded)

2. **Cache Performance**
   - Cache hit rate (target: >85%)
   - Cache size (total taxa cached)
   - Stale cache percentage
   - Average cache age

3. **User Experience**
   - Rarity classification latency
   - Failed classifications
   - Queue processing time

### Monitoring Tools

**Database queries**:

```sql
-- Cache statistics
SELECT
  COUNT(*) as total_taxa,
  COUNT(*) FILTER (WHERE "cachedAt" > NOW() - INTERVAL '30 days') as fresh_taxa,
  AVG(EXTRACT(EPOCH FROM (NOW() - "cachedAt")) / 86400) as avg_age_days
FROM "TaxonNode";

-- API usage (approximate from cache misses)
SELECT
  COUNT(*) as cache_misses
FROM "TaxonNode"
WHERE "cachedAt" > NOW() - INTERVAL '1 day'
  AND "updatedAt" > "cachedAt";
```

**Application logging**:

```typescript
// Cache hit/miss logging (already in taxon-cache.ts)
console.log(`✓ Cache HIT: taxon ${taxonId}`);
console.log(`⚠️ Cache MISS: taxon ${taxonId}`);
```

### Alerts

**Set up alerts for**:

1. **Cache hit rate < 70%**
   - Action: Review cache warming strategy
   - Possible cause: New user surge, new region launch

2. **Daily API calls > 8,000**
   - Action: Investigate unusual activity
   - Possible cause: Cache warming job running, viral growth

3. **API rate limit errors**
   - Action: Immediate investigation (RED ALERT)
   - Possible cause: Exceeded quota, need horizontal scaling

### Maintenance Tasks

**Weekly**:
- Review cache statistics
- Check for stale data patterns
- Monitor API usage trends

**Monthly**:
- Refresh top 10,000 species cache
- Analyze species popularity trends
- Update cache staleness thresholds if needed

**Quarterly**:
- Review scaling roadmap
- Evaluate need for horizontal scaling
- Update species lists for cache warming

---

## Horizontal Scaling (Future)

If we exceed 10,000 users, we'll need to scale horizontally.

### Options

1. **Multiple deployment instances** (different IP addresses)
   - Split users across 2-3 Vercel deployments
   - Each gets 10k req/day quota
   - Total capacity: 30,000 users (3 instances)

2. **Shared database cache**
   - All instances share same database
   - Cache benefits multiply
   - Reduces per-instance API usage

3. **Smart load balancing**
   - Route users by region
   - Each region has its own instance
   - Better cache locality

### When to Scale Horizontally

**Triggers**:
- Consistent API usage >9,000 req/day for 7+ days
- User base >8,000 active users
- Multiple rate limit errors per day

**Cost**: Proportional to number of instances (database, hosting)

---

## Implementation Checklist

- [x] Create taxon cache module (`taxon-cache.ts`)
- [x] Update rarity classification to use cache
- [x] Update background processor to use cache
- [x] Write comprehensive tests (179 tests passing)
- [x] Document scaling strategy (this file)
- [ ] Implement cache warming CLI command
- [ ] Set up cache statistics dashboard
- [ ] Configure monitoring alerts
- [ ] Create cache warming cron jobs
- [ ] Document cache warming procedures for new regions

---

## Related Documentation

- [Background Rarity System](./BACKGROUND-RARITY-SYSTEM.md) - Rarity classification architecture
- [iNaturalist API](./INAT_API.md) - API client implementation
- [Performance](./PERFORMANCE.md) - General performance optimization
- [Architecture](./ARCHITECTURE.md) - Overall system architecture

---

## Contact & Questions

If you have questions about the scaling strategy, please refer to:
- This document (SCALING.md)
- Code comments in `src/lib/gamification/taxon-cache.ts`
- iNaturalist API documentation

**Last Updated**: 2025-01-08
