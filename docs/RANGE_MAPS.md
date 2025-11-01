# iNaturalist Range Maps - Technical Documentation

**Last Updated:** 2025-01-15
**Dataset:** iNaturalist Open Range Map Dataset
**License:** CC-BY
**First Released:** February 25, 2025
**Update Frequency:** Approximately monthly

---

## Overview

The iNaturalist Open Range Map Dataset provides machine-learned species distribution maps for taxa with sufficient observation data. These maps are generated using advanced neural network models trained on iNaturalist's crowdsourced biodiversity observations and can be used to enhance rarity calculations, detect out-of-range observations, and provide geographic context for species discoveries.

---

## Technical Specifications

### Data Sources

1. **iNaturalist Observations**: Crowdsourced biodiversity records with geospatial coordinates
2. **Elevation Data**: Topographic information to improve distribution modeling
3. **Minimum Threshold**: ~100 observations required per taxon for range map generation

### Methodology

**Model:** iNaturalist Geomodel
- **Technique:** Spatial implicit neural representation
- **Reference:** Cole et al. (2023) - International Conference on Machine Learning
- **Grid System:** H3-4 hexagonal grid for standardized spatial representation
- **Approach:** Joint estimation of species distributions across all taxa

**H3-4 Grid Details:**
- Resolution: 4 (hexagons ~1,770 km² area)
- Edge length: ~22.6 km
- Suitable for regional/country-level patterns
- Globally consistent indexing

### Accuracy Considerations

Range map reliability varies by geographic region based on observation density:

| Color | Observation Count | Reliability |
|-------|-------------------|-------------|
| White | 0 observations | No data |
| Yellow | 1-99 observations | Low confidence |
| Red | 100+ observations | High confidence |

**Key Limitations:**
- **Sparse data regions:** Less accurate predictions in under-observed areas
- **Temporal bias:** Does not account for seasonal migrations or temporal patterns
- **Detection probability:** Assumes equal detectability across species/regions
- **Captive observations:** May include noise from escaped/introduced populations
- **Recent colonization:** May not reflect rapid range expansions

---

## Access & Formats

### Individual Species GeoJSON

**URL Pattern:**
```
https://inaturalist-open-data.s3.us-east-1.amazonaws.com/geomodel/geojsons/latest/[taxon_id].geojson
```

**Example:**
```bash
# House Sparrow (taxon_id: 9083)
curl https://inaturalist-open-data.s3.us-east-1.amazonaws.com/geomodel/geojsons/latest/9083.geojson
```

**Version-Specific Access:**
```
https://inaturalist-open-data.s3.us-east-1.amazonaws.com/geomodel/geojsons/2.20/[taxon_id].geojson
```

### Bulk Geopackage Format

**Format:** `.gpkg` (Geopackage - SQLite-based geospatial format)
**Capacity:** Up to 5,000 range maps per file
**Organization:** Grouped by taxonomic collection

**Access:** Via iNaturalist data exports page or AWS Open Data

---

## GeoJSON Structure

Example structure for a species range map:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-122.5, 37.5],
            [-122.4, 37.5],
            [-122.4, 37.6],
            [-122.5, 37.6],
            [-122.5, 37.5]
          ]
        ]
      },
      "properties": {
        "taxon_id": 12345,
        "probability": 0.85,
        "observation_count": 150,
        "h3_index": "842e30fffffffff"
      }
    }
  ]
}
```

**Properties:**
- `taxon_id`: iNaturalist taxon identifier
- `probability`: Model confidence (0-1)
- `observation_count`: Number of observations in region
- `h3_index`: H3 grid cell identifier

---

## BioQuest Integration Strategies

### 1. Out-of-Range Detection

Identify observations that fall outside expected species range:

```typescript
// src/lib/inat/range-checker.ts
import * as turf from '@turf/turf';

interface RangeCheck {
  inRange: boolean;
  probability: number | null;
  distance: number; // km from nearest range polygon
  rarityBonus: number;
}

export async function checkObservationRange(
  taxonId: number,
  lat: number,
  lng: number
): Promise<RangeCheck> {
  // Fetch range map (with caching)
  const rangeMap = await fetchRangeMap(taxonId);

  if (!rangeMap) {
    return { inRange: true, probability: null, distance: 0, rarityBonus: 0 };
  }

  const observationPoint = turf.point([lng, lat]);

  // Check if point is within any range polygon
  for (const feature of rangeMap.features) {
    if (turf.booleanPointInPolygon(observationPoint, feature.geometry)) {
      return {
        inRange: true,
        probability: feature.properties.probability,
        distance: 0,
        rarityBonus: 0,
      };
    }
  }

  // Calculate distance to nearest range polygon
  const distances = rangeMap.features.map(feature =>
    turf.pointToLineDistance(observationPoint, turf.polygonToLine(feature.geometry), {
      units: 'kilometers',
    })
  );

  const minDistance = Math.min(...distances);

  // Award bonus points for out-of-range observations
  const rarityBonus = calculateOutOfRangeBonus(minDistance);

  return {
    inRange: false,
    probability: null,
    distance: minDistance,
    rarityBonus,
  };
}

function calculateOutOfRangeBonus(distanceKm: number): number {
  // Progressive bonus for distance from known range
  if (distanceKm > 1000) return 500; // Continental-scale range expansion
  if (distanceKm > 500) return 300;  // Regional range expansion
  if (distanceKm > 100) return 150;  // Local range expansion
  if (distanceKm > 50) return 50;    // Edge of range
  return 0;
}
```

### 2. Regional Rarity Enhancement

Combine global observation counts with regional presence:

```typescript
// src/lib/gamification/rarity-enhanced.ts
interface EnhancedRarityTier {
  tier: 'normal' | 'rare' | 'legendary';
  reasons: string[];
  bonusPoints: number;
}

export async function calculateEnhancedRarity(
  taxonId: number,
  observationLocation: { lat: number; lng: number },
  placeId: number
): Promise<EnhancedRarityTier> {
  const reasons: string[] = [];
  let bonusPoints = 0;

  // 1. Global observation count (existing logic)
  const globalCount = await getGlobalObservationCount(taxonId);

  // 2. Regional observation count
  const regionalCount = await getRegionalObservationCount(taxonId, placeId);

  // 3. Range map analysis
  const rangeCheck = await checkObservationRange(
    taxonId,
    observationLocation.lat,
    observationLocation.lng
  );

  // Determine tier
  let tier: 'normal' | 'rare' | 'legendary' = 'normal';

  // Legendary conditions
  if (globalCount < 100) {
    tier = 'legendary';
    reasons.push(`Only ${globalCount} observations globally`);
    bonusPoints += 500;
  } else if (!rangeCheck.inRange && rangeCheck.distance > 100) {
    tier = 'legendary';
    reasons.push(`${Math.round(rangeCheck.distance)}km outside known range`);
    bonusPoints += rangeCheck.rarityBonus;
  } else if (regionalCount === 1) {
    tier = 'legendary';
    reasons.push('First observation in region');
    bonusPoints += 300;
  }

  // Rare conditions (if not already legendary)
  if (tier === 'normal') {
    if (globalCount < 1000) {
      tier = 'rare';
      reasons.push(`Only ${globalCount} observations globally`);
      bonusPoints += 100;
    } else if (regionalCount < 10) {
      tier = 'rare';
      reasons.push(`Only ${regionalCount} observations in region`);
      bonusPoints += 150;
    } else if (!rangeCheck.inRange && rangeCheck.distance > 20) {
      tier = 'rare';
      reasons.push(`${Math.round(rangeCheck.distance)}km outside typical range`);
      bonusPoints += rangeCheck.rarityBonus;
    }
  }

  return { tier, reasons, bonusPoints };
}
```

### 3. Range Map Caching Strategy

```typescript
// src/lib/inat/range-map-cache.ts
import { redis } from '@/lib/redis';

const RANGE_MAP_CACHE_TTL = 30 * 24 * 60 * 60; // 30 days

export async function fetchRangeMap(taxonId: number): Promise<any | null> {
  // Check cache first
  const cached = await redis.get(`rangemap:${taxonId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from S3
  try {
    const url = `https://inaturalist-open-data.s3.us-east-1.amazonaws.com/geomodel/geojsons/latest/${taxonId}.geojson`;
    const response = await fetch(url);

    if (!response.ok) {
      // No range map available (likely < 100 observations)
      await redis.setex(`rangemap:${taxonId}`, RANGE_MAP_CACHE_TTL, 'null');
      return null;
    }

    const rangeMap = await response.json();

    // Cache the range map
    await redis.setex(
      `rangemap:${taxonId}`,
      RANGE_MAP_CACHE_TTL,
      JSON.stringify(rangeMap)
    );

    return rangeMap;
  } catch (error) {
    console.error(`Failed to fetch range map for taxon ${taxonId}:`, error);
    return null;
  }
}
```

### 4. Bulk Range Map Preloading

For common species or regional focus, preload range maps:

```typescript
// src/lib/inat/range-map-preload.ts
export async function preloadRegionalRangeMaps(placeId: number) {
  // Get top 100 species in region
  const topSpecies = await inat.getSpeciesCounts({
    place_id: placeId,
    per_page: 100,
    quality_grade: 'research',
  });

  // Batch fetch range maps
  const promises = topSpecies.results.map(result =>
    fetchRangeMap(result.taxon.id)
  );

  await Promise.allSettled(promises);

  console.log(`Preloaded range maps for ${topSpecies.results.length} species`);
}
```

---

## Use Cases for BioQuest

### 1. **Enhanced Rarity Scoring**

Combine multiple factors:
- Global observation count
- Regional observation count
- Distance from known range
- Conservation status

### 2. **"First in Region" Detection**

Award badges for:
- First observation in a country/state
- Significant range expansions
- Colonization events

### 3. **Quest Design**

Create location-based quests:
- "Find a species outside its typical range"
- "Observe all birds expected in [Region]"
- "Discover a range expansion"

### 4. **Educational Context**

Show users:
- Expected species for their location
- Range maps overlaid on observations
- Unusual observation explanations

### 5. **Citizen Science Value**

Highlight observations with scientific importance:
- Range expansions due to climate change
- Invasive species spread
- Migration pattern changes

---

## Performance Considerations

### File Sizes

- **Individual GeoJSON:** 10 KB - 5 MB (varies by range complexity)
- **Geopackage collections:** 100 MB - 2 GB

### Optimization Strategies

1. **Lazy Loading:** Only fetch range maps when needed
2. **Aggressive Caching:** Range maps change monthly, cache for 30 days
3. **Simplified Geometries:** Use Turf.js simplify for web display
4. **Regional Focus:** Preload only local species
5. **CDN Hosting:** Consider mirroring frequently-used range maps

### Computational Cost

Range polygon operations (point-in-polygon, distance calculations) are O(n) where n = number of vertices. For complex ranges:

- Use spatial indexing (R-tree)
- Simplify geometries for fast checks
- Cache results per observation location

---

## Limitations & Cautions

### 1. **Temporal Dynamics**

Range maps are static snapshots:
- Don't reflect seasonal migrations
- May not capture recent colonizations
- Climate change impacts not real-time

**BioQuest Solution:** Combine with recent observation data for temporal context.

### 2. **Observation Bias**

Range maps reflect observer effort:
- Urban areas over-represented
- Remote regions under-represented
- Charismatic species better documented

**BioQuest Solution:** Weight rarity by regional observation density.

### 3. **Taxonomic Coverage**

Not all taxa have range maps:
- Minimum ~100 observations required
- Favors common, conspicuous species
- Rare species may lack coverage

**BioQuest Solution:** Graceful fallback to global count-based rarity.

### 4. **Spatial Resolution**

H3-4 grid is coarse (~22 km hexagons):
- May miss fine-scale habitat patches
- Not suitable for micro-habitat specialists
- Better for regional/continental patterns

**BioQuest Solution:** Use for broad patterns, not precise habitat modeling.

---

## Example API Responses

### House Sparrow (Passer domesticus) - Global range

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          // Europe
          [[[-10, 35], [40, 35], [40, 70], [-10, 70], [-10, 35]]],
          // North America
          [[[-130, 25], [-60, 25], [-60, 60], [-130, 60], [-130, 25]]],
          // etc.
        ]
      },
      "properties": {
        "taxon_id": 9083,
        "observation_count": 1234567,
        "model_version": "2.20"
      }
    }
  ]
}
```

### Endemic Species (Limited range)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [[-124.5, 40.0], [-124.0, 40.0], [-124.0, 40.5], [-124.5, 40.5], [-124.5, 40.0]]
        ]
      },
      "properties": {
        "taxon_id": 54321,
        "observation_count": 234,
        "probability": 0.92
      }
    }
  ]
}
```

---

## Testing Strategies

### Unit Tests

```typescript
// tests/lib/inat/range-checker.test.ts
import { describe, it, expect, vi } from 'vitest';
import { checkObservationRange } from '@/lib/inat/range-checker';

describe('Range Checker', () => {
  it('detects observation within range', async () => {
    const result = await checkObservationRange(9083, 37.7749, -122.4194); // SF
    expect(result.inRange).toBe(true);
    expect(result.rarityBonus).toBe(0);
  });

  it('detects observation outside range', async () => {
    const result = await checkObservationRange(
      54321, // Endemic to California
      51.5074, -0.1278 // London
    );
    expect(result.inRange).toBe(false);
    expect(result.distance).toBeGreaterThan(0);
    expect(result.rarityBonus).toBeGreaterThan(0);
  });

  it('handles taxa without range maps', async () => {
    const result = await checkObservationRange(999999, 0, 0);
    expect(result.inRange).toBe(true); // Default to "in range" if no map
    expect(result.probability).toBeNull();
  });
});
```

---

## References

- **Cole et al. (2023):** "Spatial implicit neural representations for global-scale species mapping" - International Conference on Machine Learning
- **H3 Grid System:** https://h3geo.org/
- **Turf.js:** https://turfjs.org/ (Geospatial operations)
- **GeoJSON Specification:** https://geojson.org/
- **Geopackage:** https://www.geopackage.org/

---

## Related Documentation

- [INAT_API.md](./INAT_API.md) - Main API reference
- [GAMIFICATION.md](./GAMIFICATION.md) - Rarity and points system
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design

---

**Maintained by:** BioQuest Development Team
**Contact:** For questions about range maps, see iNaturalist Forum or Cole et al. (2023) paper
