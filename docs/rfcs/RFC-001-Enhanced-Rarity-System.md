# RFC-001: Enhanced Geospatial Rarity System

**Status:** Approved
**Author:** BioQuest Development Team
**Created:** 2025-01-15
**Updated:** 2025-01-15
**Supersedes:** Basic rarity system (global observation count only)
**Decision:** Option 2 (H3 Grid Approximation) - See Implementation Approach section

---

## Summary

Enhance BioQuest's rarity calculation system to incorporate geospatial data from iNaturalist range maps, enabling detection of range expansions, regional endemism, and out-of-range observations. This will provide more scientifically meaningful and engaging rarity assessments while increasing the educational and citizen science value of observations.

---

## Motivation

### Current System Limitations

The current rarity system uses only global observation counts:

```typescript
// Current implementation (simplified)
function calculateRarity(globalCount: number): RarityTier {
  if (globalCount < 100) return 'legendary';
  if (globalCount < 1000) return 'rare';
  return 'normal';
}
```

**Problems:**
1. **Ubiquitous species appear common everywhere**: A House Sparrow in Antarctica would be "normal" despite being extraordinary
2. **Regional context ignored**: First observation of a species in a country is not recognized
3. **Range expansions missed**: Species colonizing new areas due to climate change appear mundane
4. **Scientific value undervalued**: Observations that matter to researchers receive no special recognition
5. **Engagement missed**: Users in well-observed regions feel their observations are always "common"

### Opportunity

iNaturalist's Open Range Map Dataset (February 2025) provides:
- Machine-learned species distributions for 100,000+ taxa
- H3-4 grid resolution (~22 km hexagons)
- Monthly updates as observations accumulate
- Open access via S3 (CC-BY license)

**Benefits of integration:**
- More nuanced rarity assessments
- Educational context (expected vs. unexpected species)
- Citizen science value (highlight scientifically important observations)
- Regional engagement (local rarities matter)
- Climate change tracking (range shifts)

---

## Proposed Design

### Multi-Factor Rarity Model

Replace single-factor (global count) with multi-dimensional scoring:

```typescript
interface RarityFactors {
  globalObservationCount: number;
  regionalObservationCount: number;
  distanceFromRange: number; // km from nearest known range polygon
  observationDensity: number; // observations per km² in region
  conservationStatus: IUCNStatus | null;
  isFirstInRegion: boolean;
  isRangeExpansion: boolean;
}

interface RarityScore {
  tier: 'normal' | 'rare' | 'legendary' | 'extraordinary';
  basePoints: number;
  bonusPoints: number;
  factors: string[]; // Human-readable reasons
  scientificValue: 'low' | 'medium' | 'high' | 'exceptional';
}
```

### Scoring Algorithm

```typescript
async function calculateEnhancedRarity(
  taxonId: number,
  location: { lat: number; lng: number },
  placeId: number
): Promise<RarityScore> {
  // Gather all factors
  const factors = await gatherRarityFactors(taxonId, location, placeId);

  // Initialize scoring
  let tier: RarityTier = 'normal';
  let basePoints = 10;
  let bonusPoints = 0;
  const reasons: string[] = [];
  let scientificValue: ScientificValue = 'low';

  // Factor 1: Global observation count (existing)
  if (factors.globalObservationCount < 100) {
    tier = upgradeTier(tier, 'legendary');
    bonusPoints += 500;
    reasons.push(`Extremely rare: only ${factors.globalObservationCount} observations globally`);
    scientificValue = 'exceptional';
  } else if (factors.globalObservationCount < 1000) {
    tier = upgradeTier(tier, 'rare');
    bonusPoints += 100;
    reasons.push(`Uncommon: only ${factors.globalObservationCount} observations globally`);
    scientificValue = 'high';
  }

  // Factor 2: Range map analysis (NEW)
  if (factors.distanceFromRange > 0) {
    const rangeBonus = calculateRangeBonus(factors.distanceFromRange);

    if (factors.distanceFromRange > 1000) {
      tier = upgradeTier(tier, 'extraordinary'); // New tier!
      bonusPoints += 1000;
      reasons.push(`Extraordinary: ${Math.round(factors.distanceFromRange)}km outside known range`);
      scientificValue = 'exceptional';
    } else if (factors.distanceFromRange > 500) {
      tier = upgradeTier(tier, 'legendary');
      bonusPoints += 500;
      reasons.push(`Range expansion: ${Math.round(factors.distanceFromRange)}km beyond typical range`);
      scientificValue = 'exceptional';
    } else if (factors.distanceFromRange > 100) {
      tier = upgradeTier(tier, 'rare');
      bonusPoints += 200;
      reasons.push(`Outside typical range by ${Math.round(factors.distanceFromRange)}km`);
      scientificValue = 'high';
    } else if (factors.distanceFromRange > 20) {
      bonusPoints += 50;
      reasons.push(`Near edge of known range`);
      scientificValue = 'medium';
    }
  }

  // Factor 3: Regional rarity (NEW)
  if (factors.isFirstInRegion) {
    tier = upgradeTier(tier, 'legendary');
    bonusPoints += 300;
    reasons.push('First observation in this region!');
    scientificValue = 'exceptional';
  } else if (factors.regionalObservationCount < 5) {
    tier = upgradeTier(tier, 'rare');
    bonusPoints += 150;
    reasons.push(`Only ${factors.regionalObservationCount} observations in this region`);
    scientificValue = 'high';
  } else if (factors.regionalObservationCount < 20) {
    bonusPoints += 75;
    reasons.push(`Uncommon in this region (${factors.regionalObservationCount} observations)`);
    scientificValue = 'medium';
  }

  // Factor 4: Conservation status (existing)
  if (factors.conservationStatus && isRedListSpecies(factors.conservationStatus)) {
    tier = upgradeTier(tier, 'legendary');
    bonusPoints += 400;
    reasons.push(`Threatened species: ${factors.conservationStatus}`);
    scientificValue = 'exceptional';
  }

  // Factor 5: Regional observation density adjustment (NEW)
  // In under-observed regions, give bonus for any observation
  if (factors.observationDensity < 0.1) { // < 0.1 observations per km²
    bonusPoints += 25;
    reasons.push('Observation in under-surveyed area');
    scientificValue = upgradeSciValue(scientificValue, 'medium');
  }

  return {
    tier,
    basePoints,
    bonusPoints,
    factors: reasons,
    scientificValue,
  };
}
```

### New "Extraordinary" Tier

Introduce a tier above "legendary" for truly exceptional observations:

| Tier | Criteria | Points | Examples |
|------|----------|--------|----------|
| **Normal** | Common species in expected range | 10 | House Sparrow in London |
| **Rare** | Uncommon globally or regionally | 10 + 100-200 | Regional specialty bird |
| **Legendary** | Very rare or significant | 10 + 300-500 | IUCN Red List species, first in region |
| **Extraordinary** | Scientifically exceptional | 10 + 1000+ | 1000km+ range expansion, first global record |

**Extraordinary triggers:**
- >1000 km outside known range (potential invasive species or climate shift)
- First observation of species on iNaturalist globally
- Rediscovery of species thought extinct
- Significant conservation discovery

---

## Technical Implementation

### Architecture (Using H3 Grid Approach)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Observation Sync                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Rarity Calculation Service                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. Fetch global observation count (iNat API, cached)    │   │
│  │  2. Fetch regional observation count (iNat API, cached)  │   │
│  │  3. Get H3 cell set (Redis/Memory, <5ms)                │   │
│  │  4. H3 range check (O(1) lookup, <1ms)                  │   │
│  │  5. H3 distance approximation (ring search, ~10ms)       │   │
│  │  6. Check conservation status (cached)                   │   │
│  │  7. Compute multi-factor score (simplified buckets)      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               Three-Tier Cache Architecture                      │
│                                                                  │
│  L1: Memory (LRU) - Top 1000 species, <1ms                     │
│      └─> H3 cell sets (~50MB total)                            │
│                                                                  │
│  L2: Redis - 10,000 species, <5ms                              │
│      ├─> H3 cell sets (~500MB)                                 │
│      ├─> Regional counts (1hr TTL)                             │
│      └─> Bounding boxes                                        │
│                                                                  │
│  L3: PostgreSQL - Persistent storage                            │
│      ├─> Historical rarity calculations                        │
│      ├─> H3 cell sets (compressed)                             │
│      └─> Full GeoJSON (fallback, rarely accessed)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Origin: S3 (iNaturalist) - Only on cache miss                 │
│  • Fetch range map GeoJSON                                      │
│  • Convert to H3 cells (1-5s, done once)                       │
│  • Populate all cache layers                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Performance Targets (P95)

| Operation | Cold Cache | Warm Cache | Target |
|-----------|------------|------------|--------|
| H3 range check | 200ms | <5ms | ✅ <10ms |
| Distance approximation | 300ms | <10ms | ✅ <20ms |
| Regional count | 500ms | <5ms | ✅ <10ms |
| Global count | 500ms | <5ms | ✅ <10ms |
| **Total rarity calc** | **800ms** | **<50ms** | ✅ <100ms |

**Cache Hit Rates:**
- L1 (Memory): 70-80% (hot species)
- L2 (Redis): 95%+ (pre-warmed)
- L3 (Database): 99%+ (all species)

### Database Schema Changes

```prisma
// prisma/schema.prisma

model Observation {
  id                    String   @id @default(cuid())
  inatId                Int      @unique
  userId                String
  taxonId               Int

  // Enhanced rarity fields
  rarityTier            RarityTier
  rarityScore           Int      // Total points
  rarityFactors         String[] // Reasons (JSON array)
  scientificValue       ScientificValue
  distanceFromRange     Float?   // km, null if within range
  isFirstInRegion       Boolean  @default(false)
  isRangeExpansion      Boolean  @default(false)

  // Existing fields...
  latitude              Float
  longitude             Float
  placeId               Int?
  observedAt            DateTime
  qualityGrade          String

  user                  User     @relation(fields: [userId], references: [id])

  @@index([taxonId])
  @@index([rarityTier])
  @@index([scientificValue])
}

enum RarityTier {
  NORMAL
  RARE
  LEGENDARY
  EXTRAORDINARY
}

enum ScientificValue {
  LOW
  MEDIUM
  HIGH
  EXCEPTIONAL
}

model RangeMapCache {
  taxonId               Int      @id
  geojson               Json     // Cached GeoJSON
  observationCount      Int
  modelVersion          String
  fetchedAt             DateTime @default(now())

  @@index([fetchedAt]) // For cache invalidation
}

model RegionalRarityCache {
  taxonId               Int
  placeId               Int
  observationCount      Int
  updatedAt             DateTime @default(now())

  @@id([taxonId, placeId])
  @@index([updatedAt])
}
```

### Core Services (H3 Grid Implementation)

#### 1. H3 Range Map Service

```typescript
// src/lib/inat/range-map-h3-service.ts
import { polyfill, latLngToCell, gridRing } from 'h3-js';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';

export class RangeMapH3Service {
  private static readonly BASE_URL =
    'https://inaturalist-open-data.s3.us-east-1.amazonaws.com/geomodel/geojsons/latest';

  private static readonly H3_RESOLUTION = 6; // ~2km cells
  private static readonly CACHE_TTL_DAYS = 30;

  // In-memory LRU cache for hot species
  private memoryCache = new LRUCache<number, Set<string>>({
    max: 1000, // Top 1000 species
    ttl: 3600000, // 1 hour
  });

  /**
   * Fetch range map and convert to H3 cells (with caching)
   */
  async getH3Cells(taxonId: number): Promise<Set<string>> {
    // L1: Check memory cache
    const cached = this.memoryCache.get(taxonId);
    if (cached) return cached;

    // L2: Check Redis
    const redisKey = `rangemap:h3:${taxonId}`;
    const redisCached = await redis.get(redisKey);
    if (redisCached) {
      const cells = new Set(JSON.parse(redisCached));
      this.memoryCache.set(taxonId, cells);
      return cells;
    }

    // L3: Check database
    const dbCached = await db.rangeMapCache.findUnique({
      where: { taxonId },
      select: { h3Cells: true, fetchedAt: true },
    });

    if (dbCached && this.isCacheValid(dbCached.fetchedAt)) {
      const cells = new Set(dbCached.h3Cells);
      await this.populateCaches(taxonId, cells);
      return cells;
    }

    // Origin: Fetch from S3 and convert
    return await this.fetchAndConvert(taxonId);
  }

  /**
   * Check if observation is in range (fast!)
   */
  async checkRange(
    taxonId: number,
    lat: number,
    lng: number
  ): Promise<{ inRange: boolean; approximateDistance: number }> {
    const h3Cells = await this.getH3Cells(taxonId);

    if (h3Cells.size === 0) {
      // No range map available
      return { inRange: true, approximateDistance: 0 };
    }

    const observationCell = latLngToCell(lat, lng, RangeMapH3Service.H3_RESOLUTION);

    // O(1) hash lookup
    if (h3Cells.has(observationCell)) {
      return { inRange: true, approximateDistance: 0 };
    }

    // Approximate distance via H3 rings (~2km per ring)
    for (let ring = 1; ring <= 250; ring++) { // 250 rings = ~500km
      const ringCells = gridRing(observationCell, ring);

      if (ringCells.some(cell => h3Cells.has(cell))) {
        return {
          inRange: false,
          approximateDistance: ring * 2, // ~2km per ring
        };
      }

      // Stop at 500km (sufficient for rarity tiers)
      if (ring * 2 > 500) break;
    }

    return { inRange: false, approximateDistance: 500 };
  }

  /**
   * Fetch GeoJSON from S3 and convert to H3 cells
   */
  private async fetchAndConvert(taxonId: number): Promise<Set<string>> {
    try {
      const response = await fetch(`${RangeMapH3Service.BASE_URL}/${taxonId}.geojson`);

      if (!response.ok) {
        // No range map available (likely <100 observations)
        await this.cacheNullResult(taxonId);
        return new Set();
      }

      const geojson = await response.json();

      // Convert polygons to H3 cells
      const h3Cells = new Set<string>();

      for (const feature of geojson.features) {
        const cells = polyfill(
          feature.geometry,
          RangeMapH3Service.H3_RESOLUTION
        );
        cells.forEach(cell => h3Cells.add(cell));
      }

      // Store in all cache layers
      await this.populateCaches(taxonId, h3Cells);

      // Store in database with metadata
      await db.rangeMapCache.upsert({
        where: { taxonId },
        create: {
          taxonId,
          h3Cells: [...h3Cells],
          h3Resolution: RangeMapH3Service.H3_RESOLUTION,
          observationCount: this.extractObservationCount(geojson),
          modelVersion: this.extractModelVersion(geojson),
        },
        update: {
          h3Cells: [...h3Cells],
          observationCount: this.extractObservationCount(geojson),
          modelVersion: this.extractModelVersion(geojson),
          fetchedAt: new Date(),
        },
      });

      return h3Cells;
    } catch (error) {
      console.error(`Failed to fetch/convert range map for taxon ${taxonId}:`, error);
      return new Set();
    }
  }

  private async populateCaches(taxonId: number, cells: Set<string>) {
    // L1: Memory
    this.memoryCache.set(taxonId, cells);

    // L2: Redis (30 day TTL)
    await redis.setex(
      `rangemap:h3:${taxonId}`,
      RangeMapH3Service.CACHE_TTL_DAYS * 24 * 60 * 60,
      JSON.stringify([...cells])
    );
  }

  private async cacheNullResult(taxonId: number) {
    const emptySet = new Set<string>();
    await this.populateCaches(taxonId, emptySet);

    await db.rangeMapCache.upsert({
      where: { taxonId },
      create: {
        taxonId,
        h3Cells: [],
        h3Resolution: RangeMapH3Service.H3_RESOLUTION,
        observationCount: 0,
        modelVersion: 'none',
      },
      update: { fetchedAt: new Date() },
    });
  }

  private isCacheValid(fetchedAt: Date): boolean {
    const now = new Date();
    const diffDays = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < RangeMapH3Service.CACHE_TTL_DAYS;
  }

  private extractObservationCount(geojson: any): number {
    return geojson.features[0]?.properties?.observation_count || 0;
  }

  private extractModelVersion(geojson: any): string {
    return geojson.features[0]?.properties?.model_version || 'unknown';
  }

  /**
   * Pre-warm cache for top species
   */
  async prewarmCache(taxonIds: number[]) {
    console.log(`Pre-warming cache for ${taxonIds.length} species...`);

    // Process in batches of 50
    for (let i = 0; i < taxonIds.length; i += 50) {
      const batch = taxonIds.slice(i, i + 50);
      await Promise.allSettled(
        batch.map(taxonId => this.getH3Cells(taxonId))
      );
    }

    console.log('Cache pre-warming complete');
  }
}
```

#### 2. Optimized Rarity Calculator

```typescript
// src/lib/gamification/rarity-calculator-optimized.ts
import { RangeMapH3Service } from '@/lib/inat/range-map-h3-service';
import { INatClient } from '@/lib/inat/client';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';

export class OptimizedRarityCalculator {
  private h3Service: RangeMapH3Service;
  private inatClient: INatClient;

  constructor() {
    this.h3Service = new RangeMapH3Service();
    this.inatClient = new INatClient();
  }

  async calculate(
    taxonId: number,
    location: { lat: number; lng: number },
    placeId: number | null
  ): Promise<RarityScore> {
    // Gather all factors in parallel (all cached!)
    const [rangeCheck, regionalCount, globalCount, conservationStatus] =
      await Promise.all([
        this.h3Service.checkRange(taxonId, location.lat, location.lng),
        placeId ? this.getRegionalCount(taxonId, placeId) : Promise.resolve(0),
        this.getGlobalCount(taxonId),
        this.getConservationStatus(taxonId),
      ]);

    // Apply simplified tier logic (using distance buckets)
    return this.calculateTiers(
      rangeCheck.inRange,
      rangeCheck.approximateDistance,
      regionalCount,
      globalCount,
      conservationStatus
    );
  }

  private calculateTiers(
    inRange: boolean,
    distance: number,
    regionalCount: number,
    globalCount: number,
    conservationStatus: any
  ): RarityScore {
    let tier: RarityTier = 'normal';
    let points = 10;
    const reasons: string[] = [];
    let scientificValue: ScientificValue = 'low';

    // Priority 1: Global rarity (most important)
    if (globalCount < 100) {
      tier = 'legendary';
      points += 500;
      reasons.push(`Extremely rare: ${globalCount} observations globally`);
      scientificValue = 'exceptional';
    } else if (globalCount < 1000) {
      tier = upgradeTier(tier, 'rare');
      points += 100;
      reasons.push(`Uncommon: ${globalCount} observations globally`);
      scientificValue = 'high';
    }

    // Priority 2: Distance-based (simplified buckets)
    if (!inRange) {
      if (distance > 500) {
        tier = 'extraordinary';
        points += 500;
        reasons.push(`>500km outside known range`);
        scientificValue = 'exceptional';
      } else if (distance > 100) {
        tier = upgradeTier(tier, 'legendary');
        points += 300;
        reasons.push(`${Math.floor(distance / 50) * 50}km+ outside range`);
        scientificValue = 'exceptional';
      } else if (distance > 20) {
        tier = upgradeTier(tier, 'rare');
        points += 100;
        reasons.push('Outside typical range');
        scientificValue = 'high';
      } else if (distance > 0) {
        points += 50;
        reasons.push('Near edge of range');
        scientificValue = 'medium';
      }
    }

    // Priority 3: Regional rarity
    if (regionalCount === 1) {
      tier = upgradeTier(tier, 'legendary');
      points += 300;
      reasons.push('First in region!');
      scientificValue = 'exceptional';
    } else if (regionalCount < 5) {
      tier = upgradeTier(tier, 'legendary');
      points += 200;
      reasons.push(`Only ${regionalCount} in region`);
      scientificValue = 'high';
    } else if (regionalCount < 20) {
      tier = upgradeTier(tier, 'rare');
      points += 100;
      reasons.push(`Uncommon in region (${regionalCount})`);
      scientificValue = 'medium';
    }

    // Priority 4: Conservation status
    if (conservationStatus && this.isRedList(conservationStatus)) {
      tier = upgradeTier(tier, 'legendary');
      points += 400;
      reasons.push(`Threatened: ${conservationStatus.status}`);
      scientificValue = 'exceptional';
    }

    return { tier, points, reasons, scientificValue };
  }

  private async getGlobalCount(taxonId: number): Promise<number> {
    const cacheKey = `rarity:global:${taxonId}`;
    const cached = await redis.get(cacheKey);

    if (cached) return parseInt(cached);

    const response = await this.inatClient.getObservations({
      taxon_id: taxonId,
      per_page: 0,
    });

    await redis.setex(cacheKey, 3600, response.total_results.toString()); // 1hr
    return response.total_results;
  }

  private async getRegionalCount(taxonId: number, placeId: number): Promise<number> {
    const cacheKey = `rarity:regional:${taxonId}:${placeId}`;
    const cached = await redis.get(cacheKey);

    if (cached) return parseInt(cached);

    const response = await this.inatClient.getObservations({
      taxon_id: taxonId,
      place_id: placeId,
      per_page: 0,
    });

    await redis.setex(cacheKey, 3600, response.total_results.toString()); // 1hr
    return response.total_results;
  }

  private async getConservationStatus(taxonId: number): Promise<any> {
    // Cached lookup, TTL: 90 days
  }

  private isRedList(status: any): boolean {
    return ['CR', 'EN', 'VU', 'NT'].includes(status.status);
  }
}

function upgradeTier(current: RarityTier, proposed: RarityTier): RarityTier {
  const hierarchy = ['normal', 'rare', 'legendary', 'extraordinary'];
  const currentIndex = hierarchy.indexOf(current);
  const proposedIndex = hierarchy.indexOf(proposed);
  return proposedIndex > currentIndex ? proposed : current;
}
```

### API Route

```typescript
// src/app/api/rarity/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { EnhancedRarityCalculator } from '@/lib/gamification/rarity-calculator-v2';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taxonId, latitude, longitude, placeId } = await req.json();

  const calculator = new EnhancedRarityCalculator();
  const rarity = await calculator.calculate(
    taxonId,
    { lat: latitude, lng: longitude },
    placeId
  );

  return NextResponse.json(rarity);
}
```

---

## Performance Considerations

### Caching Strategy

| Data Type | Cache Duration | Storage | Invalidation |
|-----------|----------------|---------|--------------|
| Range maps | 30 days | Database (JSONB) | Monthly model updates |
| Regional counts | 1 hour | Database | New observations |
| Global counts | 1 hour | Database | New observations |
| Conservation status | 90 days | Database | Manual refresh |
| Observation density | 7 days | Database | Weekly recalculation |

### Computational Cost

Per observation rarity calculation:
- 1-2 iNat API calls (if not cached)
- 1 S3 fetch for range map (if not cached)
- 1-5 Turf.js geospatial operations
- 3-5 database queries

**Estimated latency:**
- Cold cache: 2-5 seconds
- Warm cache: 50-200ms

**Optimization:**
- Preload range maps for top 1000 species
- Batch process observations during sync
- Use background jobs for slow calculations

### Scalability

At 1000 users with 100 observations each:
- 100,000 observations to process
- ~10,000 unique taxa (assuming diversity)
- ~10,000 range maps to cache (50-500 MB)
- ~100,000 regional count caches (10-50 MB)

**Storage requirements:** <1 GB for rarity system data

---

## Migration Strategy

### Phase 1: Parallel System (Weeks 1-2)

1. Implement new rarity calculator alongside existing system
2. Run both systems in parallel for all new observations
3. Compare results and validate accuracy
4. **No user-facing changes yet**

```typescript
// Run both calculators
const legacyRarity = await calculateLegacyRarity(taxonId);
const enhancedRarity = await calculateEnhancedRarity(taxonId, location, placeId);

// Log differences for analysis
logRarityComparison(observationId, legacyRarity, enhancedRarity);

// Use legacy for now
await storeRarity(observationId, legacyRarity);
```

### Phase 2: Soft Launch (Weeks 3-4)

1. Enable enhanced system for opt-in beta users
2. Show both scores in UI for comparison
3. Gather user feedback
4. Tune scoring thresholds based on data

```typescript
const user = await getUser();
const useEnhanced = user.betaFeatures.includes('enhanced-rarity');

const rarity = useEnhanced
  ? await calculateEnhancedRarity(...)
  : await calculateLegacyRarity(...);
```

### Phase 3: Full Rollout (Weeks 5-6)

1. Enable enhanced system for all users
2. Backfill historical observations (background job)
3. Update documentation and help text
4. Monitor for edge cases

### Phase 4: Cleanup (Week 7+)

1. Remove legacy rarity calculator code
2. Deprecate old database fields
3. Finalize documentation

---

## User Experience Changes

### Before (Legacy System)

```
┌────────────────────────────────┐
│  House Sparrow                 │
│  📍 San Francisco, CA          │
│  ⭐ NORMAL                     │
│  +10 points                    │
└────────────────────────────────┘
```

### After (Enhanced System)

```
┌────────────────────────────────┐
│  House Sparrow                 │
│  📍 San Francisco, CA          │
│  ⭐ NORMAL                     │
│  +10 points                    │
│                                │
│  Expected in this region       │
│  🌍 1.2M observations globally │
└────────────────────────────────┘
```

```
┌────────────────────────────────┐
│  California Condor             │
│  📍 Big Sur, CA                │
│  🔥 LEGENDARY                  │
│  +410 points                   │
│                                │
│  • Critically Endangered       │
│  • Only 234 observations       │
│  • High scientific value       │
│  🧬 Exceptional contribution   │
└────────────────────────────────┘
```

```
┌────────────────────────────────┐
│  European Starling             │
│  📍 São Paulo, Brazil          │
│  💥 EXTRAORDINARY              │
│  +1010 points                  │
│                                │
│  • 2,847 km outside range!     │
│  • Possible invasive species   │
│  • Report to iNaturalist       │
│  🧬 Exceptional contribution   │
└────────────────────────────────┘
```

### New UI Elements

#### Rarity Explanation Modal

When user taps on rarity badge:

```
┌─────────────────────────────────────────┐
│  Why is this LEGENDARY?                 │
├─────────────────────────────────────────┤
│  This observation earned legendary      │
│  status for the following reasons:      │
│                                         │
│  ✓ Only 234 observations globally       │
│  ✓ IUCN Critically Endangered           │
│  ✓ First in this region this year       │
│                                         │
│  Your observation contributes valuable  │
│  data to conservation efforts!          │
│                                         │
│  [View on iNaturalist] [Share]          │
└─────────────────────────────────────────┘
```

#### Range Map Overlay

Show expected range on map view:

```
┌─────────────────────────────────────────┐
│  Species Range Map                      │
├─────────────────────────────────────────┤
│  [MAP showing green polygons for range, │
│   red dot for this observation]         │
│                                         │
│  🟢 Expected range                      │
│  🔴 Your observation (547 km outside)   │
│                                         │
│  This could be a range expansion due    │
│  to climate change or an escaped pet.   │
└─────────────────────────────────────────┘
```

---

## Edge Cases & Handling

### 1. No Range Map Available

**Scenario:** Species has <100 observations, no range map generated

**Handling:** Fall back to global count-based rarity
```typescript
if (!rangeMap) {
  // Use legacy calculation
  return calculateLegacyRarity(globalCount);
}
```

### 2. Observation in Under-Mapped Region

**Scenario:** User observes in remote area with few historical observations

**Handling:**
- Award bonus for under-surveyed area
- Don't penalize for lack of regional data
- Show encouragement message

### 3. Captive/Cultivated Observations

**Scenario:** Zoo observation shows "out of range"

**Handling:**
- Check iNat `captive_cultivated` flag
- If true, disable range-based bonuses
- Show "Captive observation" label

### 4. Migratory Species

**Scenario:** Bird observed during migration, outside breeding range

**Handling:**
- Acknowledge in explanation: "May be seasonal visitor"
- Don't flag as extraordinary if common migrant
- Use temporal data if available (future enhancement)

### 5. Introduced/Invasive Species

**Scenario:** European Starling in Australia (far from native range)

**Handling:**
- Flag as "Introduced species" if known
- Still award out-of-range bonus
- Add educational note about invasive status

### 6. Taxonomy Changes

**Scenario:** Species split or lumped, range map stale

**Handling:**
- Cache invalidation on taxon ID change
- Graceful degradation if map unavailable
- Manual review for major changes

---

## Testing Strategy

### Unit Tests

```typescript
describe('Enhanced Rarity Calculator', () => {
  it('awards bonus for out-of-range observation', async () => {
    const result = await calculator.calculate(
      9083, // House Sparrow
      { lat: -33.8688, lng: 151.2093 }, // Sydney (outside native range)
      null
    );

    expect(result.tier).toBe('rare');
    expect(result.bonusPoints).toBeGreaterThan(0);
    expect(result.factors).toContain('Outside typical range');
  });

  it('detects first observation in region', async () => {
    const result = await calculator.calculate(
      54321, // Rare endemic
      { lat: 40.7128, lng: -74.0060 }, // NYC
      null
    );

    expect(result.isFirstInRegion).toBe(true);
    expect(result.tier).toBe('legendary');
  });

  it('handles species without range map', async () => {
    const result = await calculator.calculate(
      999999, // Very rare, no map
      { lat: 0, lng: 0 },
      null
    );

    expect(result.tier).toBe('normal'); // Falls back gracefully
  });
});
```

### Integration Tests

```typescript
describe('Rarity Calculation Integration', () => {
  it('processes real observation with all factors', async () => {
    const observation = {
      taxonId: 9083,
      latitude: 37.7749,
      longitude: -122.4194,
      placeId: 97394,
    };

    const result = await calculateEnhancedRarity(
      observation.taxonId,
      { lat: observation.latitude, lng: observation.longitude },
      observation.placeId
    );

    expect(result).toHaveProperty('tier');
    expect(result).toHaveProperty('bonusPoints');
    expect(result.factors).toBeInstanceOf(Array);
  });
});
```

### Load Tests

```typescript
describe('Performance', () => {
  it('calculates rarity for 100 observations in <10s', async () => {
    const start = Date.now();

    const promises = Array(100).fill(null).map((_, i) =>
      calculator.calculate(9083, { lat: 37 + i * 0.1, lng: -122 }, null)
    );

    await Promise.all(promises);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10000);
  });
});
```

---

## Metrics & Monitoring

### Key Metrics to Track

1. **Rarity Distribution:**
   - % of observations in each tier
   - Target: ~70% normal, ~20% rare, ~8% legendary, ~2% extraordinary

2. **Cache Hit Rates:**
   - Range map cache: Target >95%
   - Regional count cache: Target >90%

3. **Calculation Latency:**
   - P50: <100ms
   - P95: <500ms
   - P99: <2s

4. **User Engagement:**
   - Do users click on rarity explanations?
   - Are legendary observations shared more?
   - Time spent viewing range maps

5. **Scientific Value:**
   - How many "exceptional" observations?
   - Are researchers notified?
   - Validation rate by experts

### Alerts

- Cache hit rate drops below 85%
- P99 latency exceeds 5s
- >5% of calculations fail
- >50% of observations marked "extraordinary" (tuning needed)

---

## Rollback Plan

If critical issues arise:

1. **Feature flag:** Instant disable of enhanced system
2. **Database rollback:** Revert to legacy rarity fields
3. **Cache clear:** Remove stale range map data
4. **User notification:** Explain points will be recalculated

```typescript
// Feature flag check
if (config.useEnhancedRarity) {
  return await calculateEnhancedRarity(...);
} else {
  return await calculateLegacyRarity(...);
}
```

---

## Future Enhancements

### Phase 2 (3-6 months)

1. **Temporal data:** Seasonal ranges for migratory species
2. **Habitat modeling:** Expected vs. actual habitat
3. **Community validation:** Let experts flag misidentified rarities
4. **ML predictions:** Predict likelihood of species at location

### Phase 3 (6-12 months)

1. **Real-time alerts:** Notify researchers of exceptional observations
2. **Climate change tracking:** Dashboard of range shifts
3. **Invasive species early detection:** Auto-flag potential invasives
4. **Integration with conservation orgs:** Direct data sharing

---

## Implementation Approaches Considered

### Research: What Others Do

Before deciding on implementation, we researched proven approaches:

#### eBird (Cornell Lab of Ornithology)
- **Grid-based system:** 20km × 20km fixed squares for rarity determination
- **Fallback grids:** 60km grid if <25 checklists, 100km for very sparse regions
- **Distance thresholds:** Checklists restricted to <10km length, 1.5km radius for matching
- **Time window:** 10 years of data, 3-week window centered on current date
- **Performance:** Pre-computed rarity per grid cell, simple grid lookup (no real-time polygon checks)

#### iNaturalist
- **H3-4 hexagonal grid:** ~22.6km edge length, ~1,770 km² per cell
- **Nearby feature:** 1km radius for species suggestions
- **Geomodel predictions:** Pre-computed, not real-time calculations
- **Accuracy:** 94% recall (correct species in suggestions)

**Key Insight:** Neither system uses precise polygon boundaries for real-time calculations. Both use grid-based approximations because:
1. Users don't perceive difference between "127km" and "130km"
2. Grid lookups are 10-100x faster than polygon operations
3. Coarse buckets (20-100km) are easier to understand
4. Infrastructure costs remain reasonable

### Option 1: Precise Polygon Calculations (Naive Approach)

**Description:** Use full GeoJSON polygons with Turf.js for precise point-in-polygon and distance calculations.

**Implementation:**
```typescript
import * as turf from '@turf/turf';

async function checkObservationRange(
  taxonId: number,
  lat: number,
  lng: number
): Promise<RangeCheck> {
  const rangeMap = await fetchRangeMap(taxonId); // GeoJSON from S3
  const observationPoint = turf.point([lng, lat]);

  // Check if point is within any range polygon
  for (const feature of rangeMap.features) {
    if (turf.booleanPointInPolygon(observationPoint, feature.geometry)) {
      return { inRange: true, distance: 0 };
    }
  }

  // Calculate precise distance to nearest boundary
  const distances = rangeMap.features.map(feature =>
    turf.pointToLineDistance(observationPoint, turf.polygonToLine(feature.geometry), {
      units: 'kilometers',
    })
  );

  return { inRange: false, distance: Math.min(...distances) };
}
```

**Performance Characteristics:**
- Point-in-polygon: 50-200ms per check (depends on polygon complexity)
- Distance calculation: 100-500ms (iterates all polygon vertices)
- Storage: 10KB-5MB GeoJSON per species
- Cache size: ~5GB for 10,000 species
- P95 latency (cold cache): 2-5 seconds
- P95 latency (warm cache): 50-200ms

**Pros:**
- Meter-level precision
- Accurate distance measurements
- Simple conceptually

**Cons:**
- **10-100x slower** than grid approaches
- **10x larger** storage footprint
- Overkill for gamification (users don't care about "127km vs 132km")
- Doesn't scale well (100,000 calculations/day = high compute cost)
- Complex polygons (islands, fragmented ranges) are very slow

**Decision:** ❌ **Rejected** - Precision is wasted on gamification, performance unacceptable.

---

### Option 2: H3 Grid Approximation (Chosen Approach)

**Description:** Convert GeoJSON polygons to H3 hexagonal grid cells, perform fast hash lookups instead of polygon operations.

**Implementation:**
```typescript
import { polyfill, latLngToCell, gridRing } from 'h3-js';

// Pre-processing (done once on range map fetch)
async function convertRangeMapToH3(geojson: any): Promise<Set<string>> {
  const h3Cells = new Set<string>();
  const resolution = 6; // ~2km cells

  for (const feature of geojson.features) {
    const cells = polyfill(feature.geometry, resolution);
    cells.forEach(cell => h3Cells.add(cell));
  }

  return h3Cells;
}

// Runtime check (fast!)
async function checkRange(
  taxonId: number,
  lat: number,
  lng: number
): Promise<{ inRange: boolean; approximateDistance: number }> {
  const h3Cells = await getH3Cells(taxonId); // From cache
  const observationCell = latLngToCell(lat, lng, 6);

  // O(1) hash lookup
  if (h3Cells.has(observationCell)) {
    return { inRange: true, approximateDistance: 0 };
  }

  // Approximate distance via H3 rings (~2km per ring)
  for (let ring = 1; ring <= 250; ring++) {
    const ringCells = gridRing(observationCell, ring);
    if (ringCells.some(cell => h3Cells.has(cell))) {
      return { inRange: false, approximateDistance: ring * 2 };
    }
    if (ring * 2 > 500) break; // Stop at 500km
  }

  return { inRange: false, approximateDistance: 500 };
}
```

**Performance Characteristics:**
- Range check: <5ms (O(1) hash lookup)
- Distance approximation: ~10ms (H3 ring search)
- Pre-processing: 1-5s per range map (done once, cached)
- Storage: ~50KB per species (vs 500KB GeoJSON)
- Cache size: ~500MB for 10,000 species
- P95 latency (cold cache): 200-500ms
- P95 latency (warm cache): <50ms

**Accuracy:**
- H3-6 cells: ~1.9km edge length, ~3.2km² area
- Distance error: ±2km
- For rarity scoring: **completely acceptable**
  - 100km ±2km = 98-102km (irrelevant for tier thresholds)
  - 500km ±2km = 498-502km (no user-facing difference)

**Simplified Distance Buckets:**

Instead of precise distances, use buckets aligned with eBird's approach:

| Bucket | Distance | Rarity Impact | Points | Use Case |
|--------|----------|---------------|--------|----------|
| **In Range** | 0 km | Normal (if common) | 0 | Expected observation |
| **Edge** | 1-20 km | Rare (if uncommon) | +50 | Near boundary |
| **Near** | 20-100 km | Rare | +100 | Possible range expansion |
| **Far** | 100-500 km | Legendary | +300 | Significant range expansion |
| **Very Far** | >500 km | Extraordinary | +500 | Continental-scale anomaly |

**Pros:**
- **40-200x faster** than polygon calculations
- **10x smaller** storage (50KB vs 500KB per species)
- **Sufficient accuracy** for gamification (±2km irrelevant)
- Aligns with proven systems (eBird's 20km grids, iNat's H3-4 grids)
- Scales well (can handle millions of checks/day)
- Simpler to explain to users ("Outside range by 100-200km")

**Cons:**
- ~2km resolution (not meter-perfect)
- Requires H3 library dependency
- Pre-processing step needed

**Decision:** ✅ **CHOSEN** - Best balance of speed, accuracy, and simplicity.

---

### Option 3: Bounding Box Pre-Filter + Polygon

**Description:** Quick bounding box check first, only run full polygon check if near boundary.

**Implementation:**
```typescript
interface BoundingBox {
  minLat: number; maxLat: number;
  minLng: number; maxLng: number;
}

function quickRangeCheck(
  lat: number,
  lng: number,
  bbox: BoundingBox
): 'inside' | 'outside' | 'boundary' {
  const buffer = 0.1; // ~10km buffer

  if (lat < bbox.minLat - buffer || lat > bbox.maxLat + buffer ||
      lng < bbox.minLng - buffer || lng > bbox.maxLng + buffer) {
    return 'outside'; // Definitely out of range
  }

  if (lat >= bbox.minLat + buffer && lat <= bbox.maxLat - buffer &&
      lng >= bbox.minLng + buffer && lng <= bbox.maxLng - buffer) {
    return 'inside'; // Likely in range (>99% accurate)
  }

  return 'boundary'; // Near edge, needs precise check
}
```

**Performance Characteristics:**
- Bounding box check: <0.1ms
- Full polygon (if needed): 50-200ms
- Only ~5% of cases need full polygon
- Average latency: ~10ms

**Pros:**
- Faster than pure polygon approach
- Meter-level precision when needed
- Minimal code changes

**Cons:**
- Still slower than H3 grid (10-20x)
- Complex edge case handling
- Still stores large GeoJSON files

**Decision:** ⚠️ **Fallback option** - Use for species with <100 observations (no H3 map available).

---

### Option 4: Regional Counts Only (No Geospatial)

**Approach:** Use only regional observation counts, ignore range maps entirely.

**Pros:**
- Simplest implementation
- No geospatial dependencies
- Very fast (database query only)

**Cons:**
- Misses out-of-range observations entirely
- Can't detect range expansions
- No educational context
- Less scientific value

**Decision:** ❌ **Rejected** - Range maps provide too much value to skip.

---

### Comparison Table

| Aspect | Option 1: Precise Polygon | Option 2: H3 Grid ✅ | Option 3: Bbox + Polygon | Option 4: No Geospatial |
|--------|---------------------------|---------------------|--------------------------|-------------------------|
| **Range check speed** | 50-200ms | <5ms | ~10ms avg | N/A |
| **Distance calc speed** | 100-500ms | ~10ms | 50-200ms (5%) | N/A |
| **Storage/species** | 500KB | 50KB | 500KB | 0KB |
| **Accuracy** | Meter-level | ±2km | Meter-level (boundary) | N/A |
| **Cache size (10k)** | 5GB | 500MB | 5GB | 0MB |
| **P95 cold cache** | 2-5s | 200-500ms | 800ms | <50ms |
| **P95 warm cache** | 50-200ms | <50ms | ~50ms | <5ms |
| **User benefit** | Precise but slow | Fast & sufficient | Medium | Limited |
| **Implementation** | Complex | Moderate | Complex | Simple |
| **Scalability** | Poor | Excellent | Good | Excellent |
| **Alignment** | None | eBird + iNat | Partial | None |

**Winner:** Option 2 (H3 Grid) provides 10-100x better performance with negligible accuracy loss for gamification purposes.

---

## Security & Privacy Considerations

### Geoprivacy

**Issue:** Range maps could reveal precise locations of threatened species

**Mitigation:**
- Respect iNaturalist's `geoprivacy` and `taxon_geoprivacy` settings
- Never show precise range maps for obscured species
- Generalize "out of range" messages for sensitive taxa

```typescript
if (observation.geoprivacy === 'obscured' || observation.taxonGeoprivacy) {
  return calculateRarityWithoutLocation(taxonId);
}
```

### Data Usage

**Issue:** Range maps are CC-BY, require attribution

**Mitigation:**
- Include attribution in UI: "Range maps from iNaturalist.org"
- Link back to range map source
- Include license in data exports

---

## Documentation & Education

### User-Facing Docs

1. **Help Article:** "Understanding Rarity Tiers"
2. **FAQ:** "Why is my common bird rare?"
3. **Tutorial:** "Reading Range Maps"
4. **Blog Post:** "Introducing Enhanced Rarity System"

### Developer Docs

1. Update `GAMIFICATION.md` with new system
2. Add `RANGE_MAPS.md` technical guide
3. API documentation for rarity endpoint
4. Code comments explaining scoring algorithm

---

## Success Criteria

Launch is considered successful if:

1. **Technical:**
   - ✅ Rarity calculation latency <500ms (P95)
   - ✅ Cache hit rate >90%
   - ✅ Zero critical bugs after 2 weeks
   - ✅ No significant performance degradation

2. **Product:**
   - ✅ User engagement with rarity explanations >30%
   - ✅ Legendary observation share rate increases >25%
   - ✅ User satisfaction survey: >80% positive

3. **Scientific:**
   - ✅ At least 10 scientifically valuable observations flagged/month
   - ✅ Positive feedback from iNaturalist community
   - ✅ At least 1 range expansion validated by experts

---

## Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| 1-2 | Development | Implement range map service, enhanced calculator |
| 3 | Testing | Unit tests, integration tests, load tests |
| 4 | Parallel System | Deploy alongside legacy, log comparisons |
| 5 | Beta | Enable for opt-in users, gather feedback |
| 6 | Tuning | Adjust scoring thresholds, fix edge cases |
| 7 | Launch | Enable for all users |
| 8 | Backfill | Historical observation reprocessing |
| 9-10 | Monitor | Track metrics, fix issues, iterate |

---

## Open Questions

1. **Scoring thresholds:** Are the bonus point values balanced?
   - **Answer:** Will tune based on data distribution in parallel phase

2. **Extraordinary tier:** Is a 4th tier too complex?
   - **Answer:** User testing will determine if it's valuable or confusing

3. **Regional boundaries:** Use placeId or calculate dynamically?
   - **Answer:** Use placeId for consistency with iNaturalist

4. **Mobile data usage:** Are range maps too large for mobile?
   - **Answer:** Implement optional download, offline-first for PWA

5. **Multi-species observations:** How to handle?
   - **Answer:** Calculate separately for each taxon

---

---

## Infrastructure Cost Analysis

### Monthly Costs (Option 2: H3 Grid)

| Resource | Spec | Cost | Notes |
|----------|------|------|-------|
| Redis | 2GB managed | $30-50 | Vercel KV, AWS ElastiCache, Railway |
| PostgreSQL | +10GB storage | $15-25 | Existing DB, minor increase |
| S3 egress | ~100GB/month | $10 | Range map fetches (decreases over time) |
| Compute | Baseline | $0 | No additional servers needed |
| **Total (1K users)** | | **$55-85/month** | |
| **Total (10K users)** | | **$250/month** | Scaled Redis (8GB), PG (50GB) |

**Per User Cost:**
- 1,000 users: $0.06-0.09/user/month
- 10,000 users: $0.025/user/month

**Comparison to Option 1 (Precise Polygon):**
- Would require 10GB+ Redis → $150/month minimum
- Higher compute costs for polygon operations
- Same egress costs
- **Option 2 is 40-60% cheaper at scale**

---

## Decision Summary

After thorough research and analysis, **Option 2 (H3 Grid Approximation) is approved** for the following reasons:

### Why H3 Grid Won

1. **Performance**: 10-100x faster than precise polygon calculations
2. **Accuracy**: ±2km error is irrelevant for gamification (users don't care about "127km vs 132km")
3. **Alignment**: Matches proven approaches from eBird and iNaturalist
4. **Scalability**: Can handle millions of calculations/day with modest infrastructure
5. **Cost**: 40-60% cheaper than precise polygon approach
6. **User Experience**: Faster response times, simpler explanations ("100-200km outside range")
7. **Simplicity**: Coarse distance buckets are easier to understand than precise measurements

### Implementation Timeline

- **Week 1-2:** Implement H3 conversion service and optimized calculator
- **Week 3:** Testing, benchmarking, cache tuning
- **Week 4:** Parallel deployment alongside legacy system
- **Week 5:** Beta rollout to opt-in users
- **Week 6:** Full rollout with monitoring
- **Week 7+:** Backfill historical observations, iterate based on metrics

---

## Approval

- [x] **Technical approach decided:** Option 2 (H3 Grid Approximation)
- [x] **Performance targets defined:** <100ms P95 latency
- [x] **Cost analysis complete:** $55-85/month for 1K users
- [x] **Research validated:** Aligns with eBird and iNaturalist approaches
- [ ] Product Owner approval pending
- [ ] Security review pending
- [ ] UX review pending (simplified distance display)
- [ ] Tests implementation pending

**Decision Made:** 2025-01-15
**Ready for Implementation:** Pending final approvals

---

## References

- Cole et al. (2023) - "Spatial implicit neural representations for global-scale species mapping"
- iNaturalist Range Maps: https://www.inaturalist.org/pages/range_maps
- H3 Grid System: https://h3geo.org/
- Turf.js Docs: https://turfjs.org/
- [RANGE_MAPS.md](./RANGE_MAPS.md) - Technical implementation guide
- [GAMIFICATION.md](./GAMIFICATION.md) - Original rarity system design

---

**Document Status:** Draft for review
**Next Review:** 2025-01-22
**Version:** 1.0
