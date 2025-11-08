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

## Horizontal Scaling for Rapid Growth

### Single IP Limitations

**Maximum sustainable growth on single IP**:
- ~10,000 users with 90% cache hit rate
- ~6 months to reach from beta launch
- Growth rate: ~100 new users/week maximum

**What if you need to scale faster?**

### Rapid Scaling Scenario: 50,000 Users in 1 Month

**Problem**: Not feasible on single IP address

```
Monthly API budget: 10,000 calls/day × 30 days = 300,000 calls

50,000 users (even with 90% cache hit):
- Initial onboarding: 50,000 × 50 species × 0.10 × 2 = 500,000 calls
- ❌ 67% OVER budget

Even with 95% cache hit + aggressive pre-warming:
- Minimum needed: ~250,000 calls onboarding
- Plus syncs/updates: +50,000 calls
- Total: 300,000 calls (100% of budget, zero margin)
```

**Solution**: Horizontal scaling with multiple IP addresses

---

## Horizontal Scaling Architecture

### Overview

Deploy multiple instances of the app (each with different IP address), all sharing the same database cache.

**Key Insight**: Cache is shared, rate limits are not!

```
Instance 1 (IP #1): 10,000 calls/day + shared cache
Instance 2 (IP #2): 10,000 calls/day + shared cache
Instance 3 (IP #3): 10,000 calls/day + shared cache
...

Total capacity: N instances × 10,000 calls/day
Cache efficiency: Multiplies across all instances!
```

### Architecture Diagram

```
                    Load Balancer
                         |
        +----------------+----------------+
        |                |                |
    Instance 1       Instance 2       Instance 3
    (IP #1)          (IP #2)          (IP #3)
    10k/day          10k/day          10k/day
        |                |                |
        +----------------+----------------+
                         |
                  Shared PostgreSQL
                  (TaxonNode cache)
                         |
                  iNaturalist API
```

### Capacity Calculation for 50k Users

**Configuration**: 5 instances (5 different IPs)

```
Total API capacity: 5 × 10,000 = 50,000 calls/day

50,000 users distributed across 5 instances = 10,000 users/instance

Per instance monthly (90% cache hit):
- 10,000 users × 50 species × 0.10 miss × 2 = 100,000 calls/month
- Daily average: 3,333 calls/day
- ✅ 67% under limit per instance

Total monthly: 500,000 calls
Total capacity: 1,500,000 calls (5 × 300k)
✅ 67% headroom for growth/spikes
```

### Deployment Options

#### Option 1: Vercel (Easiest)

**Pros**:
- Zero-config horizontal scaling
- Each project gets separate IP
- Automatic HTTPS, CDN
- Simple deployment

**Setup**:
```bash
# Deploy 5 separate Vercel projects
vercel --prod --project bioquest-1
vercel --prod --project bioquest-2
vercel --prod --project bioquest-3
vercel --prod --project bioquest-4
vercel --prod --project bioquest-5

# All share same DATABASE_URL environment variable
```

**Load Balancing**:
- Cloudflare Load Balancer ($5/month)
- Or simple user-based routing (see below)

**Cost**:
- Free tier: 100 GB-hours/month (sufficient for 5 instances)
- Pro: $20/month per project if needed = $100/month
- Database: $25-50/month (Neon, Railway, Supabase)
- Load balancer: $5/month (Cloudflare)
- **Total: $30-155/month**

#### Option 2: Railway / Fly.io

**Pros**:
- More control over infrastructure
- Cheaper for high traffic
- Better for background jobs

**Setup**:
```bash
# Deploy 5 instances
railway up --project bioquest-1
railway up --project bioquest-2
# ... etc
```

**Cost**:
- $5-10/month per instance = $25-50/month
- Database: $25/month
- Load balancer: Included or $5/month
- **Total: $50-80/month**

#### Option 3: Self-Hosted (Maximum Control)

**Pros**:
- Full control
- Potentially cheapest at scale
- Custom optimizations

**Cons**:
- More complexity
- Requires DevOps expertise

**Cost**: $20-40/month (DigitalOcean, Hetzner, Linode)

### Load Balancing Strategies

#### Strategy 1: Hash-Based Routing (Simplest)

Route users deterministically based on user ID:

```typescript
// In your main domain (bioquest.com)
// Redirect to instance based on user ID

function getInstanceForUser(userId: string): string {
  const instances = [
    'https://bioquest-1.vercel.app',
    'https://bioquest-2.vercel.app',
    'https://bioquest-3.vercel.app',
    'https://bioquest-4.vercel.app',
    'https://bioquest-5.vercel.app',
  ];

  const hash = userId.split('').reduce((acc, char) =>
    acc + char.charCodeAt(0), 0);
  const index = hash % instances.length;

  return instances[index];
}

// Middleware: redirect to assigned instance
export async function middleware(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) return NextResponse.next();

  const assignedInstance = getInstanceForUser(session.user.id);
  const currentHost = req.headers.get('host');

  if (!currentHost?.includes(assignedInstance)) {
    return NextResponse.redirect(assignedInstance + req.nextUrl.pathname);
  }

  return NextResponse.next();
}
```

**Pros**:
- No external dependencies
- Free
- Consistent user → instance mapping
- Users always hit same instance (better cache locality)

**Cons**:
- Manual instance updates
- No automatic failover

#### Strategy 2: Cloudflare Load Balancer (Recommended)

**Setup**:
1. Add all instance URLs as origin servers
2. Configure round-robin or least-connections
3. Enable health checks
4. Configure sticky sessions (optional)

**Pros**:
- Automatic failover
- Health monitoring
- DDoS protection
- Geographic routing

**Cons**:
- $5/month cost

**Configuration**:
```yaml
# Cloudflare Load Balancer Config
pools:
  - name: bioquest-instances
    origins:
      - name: instance-1
        address: bioquest-1.vercel.app
      - name: instance-2
        address: bioquest-2.vercel.app
      # ... etc

    monitor:
      path: /api/health
      interval: 60

load_balancer:
  default_pool: bioquest-instances
  session_affinity: cookie
  steering_policy: least_outstanding_requests
```

#### Strategy 3: DNS Round-Robin (Free but Basic)

**Setup**:
```
bioquest.com A 1.2.3.4 (instance 1)
bioquest.com A 5.6.7.8 (instance 2)
bioquest.com A 9.10.11.12 (instance 3)
# ... etc
```

**Pros**: Free, simple
**Cons**: No health checks, no sticky sessions, DNS caching issues

### Shared Database Configuration

**Critical**: All instances MUST share the same database to share cache!

```typescript
// .env (same for all instances)
DATABASE_URL=postgresql://user:pass@shared-db.railway.app/bioquest
```

**Database Requirements**:
- Connection pooling (all instances connect)
- Sufficient connections: `instances × 10 connections`
- For 5 instances: ~50 connection pool

**Recommended Providers**:
1. **Neon** (Serverless Postgres)
   - Auto-scaling connections
   - ~$25/month for 5-instance setup

2. **Railway** (Managed Postgres)
   - Simple, good performance
   - ~$25/month

3. **Supabase** (Postgres + realtime)
   - Free tier generous
   - $25/month pro tier

### Implementation Checklist

- [ ] Choose deployment platform (Vercel recommended)
- [ ] Set up shared database with connection pooling
- [ ] Deploy 5 instances with same `DATABASE_URL`
- [ ] Configure load balancer (Cloudflare or hash-based routing)
- [ ] Test API rate limiting per instance
- [ ] Pre-warm cache before launch
- [ ] Set up monitoring per instance
- [ ] Configure alerts for rate limits
- [ ] Test failover (disable one instance, verify traffic shifts)

### Capacity Planning Table

| Instances | Total API Calls/Day | Max Users (90% cache hit) | Monthly Cost |
|-----------|--------------------|-----------------------------|--------------|
| 1         | 10,000             | 10,000                      | $0-25        |
| 2         | 20,000             | 20,000                      | $10-50       |
| 3         | 30,000             | 30,000                      | $20-75       |
| 5         | 50,000             | 50,000                      | $30-155      |
| 10        | 100,000            | 100,000                     | $60-310      |

**Note**: Assumes 90% cache hit rate after warm-up period

### When to Scale Horizontally

**Triggers**:
1. Consistent API usage >9,000 req/day for 7+ days
2. User base >8,000 active users on single instance
3. Multiple rate limit errors per day
4. Need to onboard >500 users/week

**Recommendations**:
- **0-10k users**: Single instance (current setup)
- **10k-50k users**: 5 instances (as documented above)
- **50k-100k users**: 10 instances
- **100k+ users**: Consider iNaturalist partnership for higher limits

### Monitoring Multi-Instance Setup

**Per-Instance Metrics**:
```sql
-- Track which instance is making calls
-- Add instance_id to request logs

SELECT
  instance_id,
  DATE(created_at) as date,
  COUNT(*) as api_calls
FROM api_request_log
GROUP BY instance_id, date
ORDER BY date DESC, instance_id;
```

**Aggregate Monitoring**:
- Total API calls across all instances
- Cache hit rate (should be same for all - shared cache!)
- Per-instance load distribution
- Failover events

**Alerts**:
- Any single instance >9,500 calls/day
- Aggregate >45,000 calls/day (for 5 instances)
- Cache hit rate <80%
- Instance health check failures

---

## Hybrid Client/Server Architecture

### Overview

**Key Insight**: iNaturalist rate limits are per IP address, BUT user OAuth tokens allow browser-based API calls that count against the USER's IP, not the server's IP!

This means we can offload read-heavy operations to the client browser, achieving:
- **Per-user rate limits** for client-side operations (effectively unlimited)
- **Shared server cache** for background processing and cross-user features
- **Combined 94% API call reduction** (vs 90% server-only)

### Rationale

**Without hybrid approach (server-only)**:
```
All API calls → Server IP → 10k/day limit
Even with 90% cache: Limited to ~10k users per instance
```

**With hybrid approach**:
```
Real-time user reads → User's browser → User's IP → No shared limit!
Background processing → Server IP → 10k/day limit (with 90% cache)

Result: Server handles 60% fewer calls, users get instant responses
```

### Client vs Server Responsibilities

#### Client-Side Operations (User's IP)

**What should run in browser**:
- ✅ **User's own observations**: Fetching my observations, my species counts
- ✅ **Search/browse**: Searching taxa, places, other users
- ✅ **Profile data**: Getting user info, updating profile
- ✅ **Identifications**: Fetching IDs for user's observations
- ✅ **Real-time validation**: Checking photo quality, location accuracy

**Why client-side**:
- User-initiated actions (immediate feedback)
- Per-user rate limit (no shared quota)
- Reduces server load
- Better UX (faster responses, no server round-trip)

**Example operations**:
```typescript
// Browser makes direct call to iNat API
const response = await fetch('https://api.inaturalist.org/v1/observations?user_id=123', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});
```

#### Server-Side Operations (Server IP)

**What must stay on server**:
- ✅ **Background rarity classification**: Queue processing for all users
- ✅ **Taxon cache management**: Shared cache updates, warming, maintenance
- ✅ **Cross-user features**: Leaderboards, community stats, achievements
- ✅ **Sensitive operations**: Points calculation, badge unlocking, anti-cheat
- ✅ **Batch processing**: Syncing 1000s of observations, bulk rarity checks
- ✅ **Scheduled jobs**: Cache warming, stats aggregation, cleanup

**Why server-side**:
- Shared data (cache, stats)
- Security (points, badges)
- Performance (batch operations)
- Reliability (background jobs)

**Example operations**:
```typescript
// Server uses shared cache for rarity classification
const rarity = await classifyObservationRarity(obs, token, placeId);
// Uses taxon cache - benefits all users!
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │   BioQuest UI        │    │   Direct iNat API Calls      │  │
│  │  (Next.js Client)    │───▶│  - User observations         │  │
│  │                      │    │  - Search taxa/places        │  │
│  │  useINatAPI() hook   │    │  - Profile data              │  │
│  └──────────────────────┘    └──────────────────────────────┘  │
│           │                              │                      │
│           │ (user data)                  │ (via user's IP)     │
│           ▼                              ▼                      │
└───────────────────────────────────────────────────────────────┘
            │                           iNaturalist API
            │                          (user's IP quota)
            │
            │ (gamification, background tasks)
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BioQuest Server                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Background Queue Processor                              │  │
│  │  - Rarity classification (with cache)                    │  │
│  │  - Points calculation                                    │  │
│  │  - Badge checking                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                                                     │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Taxon Cache (PostgreSQL)                                │  │
│  │  - TaxonNode (global counts, 30-day cache)               │  │
│  │  - RegionalTaxonData (regional counts, 7-day cache)      │  │
│  │  - 90-95% hit rate!                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│           │                                                     │
│           │ (only on cache miss)                               │
│           ▼                                                     │
└─────────────────────────────────────────────────────────────────┘
            │
            │ (via server IP)
            ▼
      iNaturalist API
     (server IP quota)
       10k/day limit
```

### Performance Impact Calculation

**Scenario**: 1,000 users, each with 50 observations

#### Server-Only (Current):
```
Total operations: 1,000 users × 50 obs = 50,000 operations
Background processing: 50,000 × 100% = 50,000 rarity checks

With 90% cache hit:
- API calls: 50,000 × 0.10 × 2 = 10,000 calls
- Reduction: 90% vs no cache
```

#### Hybrid (Client + Server):
```
Total operations: 50,000 operations

Split:
- Client-side (40%): 20,000 user-initiated reads → User IPs (no server quota!)
- Server-side (60%): 30,000 background jobs → Server IP with 90% cache

Server API calls:
- Client operations: 0 calls (user's IP)
- Background: 30,000 × 0.10 × 2 = 6,000 calls
- Total: 6,000 calls

Reduction: 94% vs no cache/no hybrid (60,000 → 6,000)
           40% better than server-only (10,000 → 6,000)
```

**Benefit**: 40% reduction in server API calls by moving reads to client!

### Implementation Strategy

#### Phase 1: Keep Current Architecture (Recommended)

**Current state**: All operations server-side with 90% cache hit
- **Reason**: Already implemented, tested, working
- **Performance**: Good enough for 10k users
- **Next**: Only migrate to hybrid if needed for scaling

#### Phase 2: Migrate Reads to Client (Future Optimization)

**When**: After reaching 5k-10k users or 80% server quota usage

**Steps**:
1. Create client-side iNat API hook
2. Test CORS support (may need proxy)
3. Migrate GET operations (observations, search)
4. Keep POST/background on server
5. Monitor both client and server API usage

#### Phase 3: Optimize Based on Data

**Monitor**:
- Client-side API calls per user
- Server-side cache hit rates
- Total quota usage across both paths
- User experience (latency, errors)

### Client-Side Implementation

#### Create useINatAPI Hook

```typescript
// src/hooks/useINatAPI.ts
'use client';

import { useSession } from 'next-auth/react';
import { useState, useCallback } from 'react';

const INAT_API_BASE = 'https://api.inaturalist.org/v1';

export function useINatAPI() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const request = useCallback(async <T,>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    if (!session?.user?.accessToken) {
      throw new Error('No access token available');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${INAT_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`iNat API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Convenience methods for common operations
  const getUserObservations = useCallback(async (
    username: string,
    options?: { page?: number; per_page?: number }
  ) => {
    const params = new URLSearchParams({
      user_login: username,
      per_page: (options?.per_page || 50).toString(),
      page: (options?.page || 1).toString(),
    });

    return request(`/observations?${params.toString()}`);
  }, [request]);

  const searchTaxa = useCallback(async (query: string) => {
    const params = new URLSearchParams({ q: query });
    return request(`/taxa?${params.toString()}`);
  }, [request]);

  return {
    request,
    getUserObservations,
    searchTaxa,
    loading,
    error,
  };
}
```

#### Usage Example

```typescript
// src/components/observations/ObservationList.tsx
'use client';

import { useINatAPI } from '@/hooks/useINatAPI';
import { useEffect, useState } from 'react';

export function ObservationList({ username }: { username: string }) {
  const { getUserObservations, loading, error } = useINatAPI();
  const [observations, setObservations] = useState([]);

  useEffect(() => {
    async function loadObservations() {
      try {
        // Direct browser call to iNat API - uses user's IP quota!
        const data = await getUserObservations(username);
        setObservations(data.results);
      } catch (err) {
        console.error('Failed to load observations:', err);
      }
    }

    loadObservations();
  }, [username, getUserObservations]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {observations.map(obs => (
        <ObservationCard key={obs.id} observation={obs} />
      ))}
    </div>
  );
}
```

### CORS Considerations

#### Option 1: Direct Calls (If CORS Enabled)

**Test first**:
```typescript
// Check if iNat allows direct browser calls
const response = await fetch('https://api.inaturalist.org/v1/observations/1', {
  headers: { 'Authorization': `Bearer ${token}` }
});
// If this works → CORS is enabled, use direct calls!
```

**Status**: Need to test - iNaturalist may or may not have CORS enabled

#### Option 2: Proxy Pattern (If CORS Blocked)

If iNat blocks browser requests, create a simple proxy:

```typescript
// src/app/api/inat-proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await getServerSession();
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = params.path.join('/');
  const searchParams = req.nextUrl.searchParams;

  const response = await fetch(
    `https://api.inaturalist.org/v1/${path}?${searchParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
      },
    }
  );

  const data = await response.json();
  return NextResponse.json(data);
}
```

**Usage**:
```typescript
// Instead of: fetch('https://api.inaturalist.org/v1/observations')
// Use: fetch('/api/inat-proxy/observations')
```

**Trade-off**: Proxy still uses server IP, but keeps client code clean

### Security Considerations

#### Token Handling

**Client-side**:
```typescript
// ✅ SAFE: Token in memory, managed by NextAuth
const { data: session } = useSession();
const token = session?.user?.accessToken;

// ❌ UNSAFE: Never store token in localStorage
localStorage.setItem('token', token); // DON'T DO THIS!
```

**Best practice**: Use NextAuth session management - tokens stay in HTTP-only cookies

#### Rate Limit Abuse Prevention

**Problem**: Users could abuse client-side API access

**Solutions**:
1. **Client-side rate limiting**: Throttle requests in useINatAPI hook
2. **Server-side monitoring**: Track API usage per user
3. **Quotas**: Implement per-user daily limits (e.g., 1000 requests/day)
4. **Alerts**: Notify if user exceeds normal usage patterns

```typescript
// Simple client-side throttling
const [requestCount, setRequestCount] = useState(0);
const MAX_REQUESTS_PER_MINUTE = 60;

if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
  throw new Error('Rate limit exceeded - please wait');
}
```

### Migration Checklist

**Prerequisites**:
- [ ] Test iNat CORS support (direct browser calls)
- [ ] Decide: Direct calls or proxy pattern?
- [x] Create useINatAPI hook (`src/hooks/useINatAPI.ts`)
- [x] Add client-side rate limiting

**Phase 1: Read Operations**:
- [x] Create example component (`src/components/examples/ClientSideObservations.tsx`)
- [ ] Migrate user observations fetch to client (example ready, needs integration)
- [ ] Migrate taxa search to client (example ready, needs integration)
- [ ] Migrate user profile fetch to client
- [ ] Test and monitor usage

**Phase 2: Keep Critical Server-Side**:
- [x] Verify background queue stays on server (no changes to processor.ts)
- [x] Verify points/badges stay on server (no changes to gamification)
- [x] Verify cache management stays on server (no changes to taxon-cache.ts)

**Monitoring**:
- [ ] Track client API calls per user
- [ ] Track server API calls (should decrease)
- [ ] Monitor cache hit rates (should stay ~90%)
- [ ] Alert on unusual patterns

### Expected Outcomes

**Before Hybrid** (server-only, 10k users):
- Server API calls: 10,000/day (100% quota)
- User experience: Fast (cached)
- Scalability: Limited to 10k users

**After Hybrid** (client reads, 10k users):
- Server API calls: 6,000/day (60% quota)
- Client API calls: Distributed across 10k user IPs (no shared quota)
- User experience: Faster (no server round-trip)
- Scalability: Can support 16k users on same infrastructure!

**At 50k users (hybrid + 5 instances)**:
- Server API calls: 30,000/day across 5 instances (60% total quota)
- Client calls: Distributed across 50k user IPs
- Headroom: 40% for growth and spikes

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
