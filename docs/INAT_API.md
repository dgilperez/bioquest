# iNaturalist API Reference for BioQuest

**API Version:** v1.3.0
**Base URL:** `https://api.inaturalist.org/v1/`
**Rate Limits:** 100 requests/minute (recommended: 60/min, <10,000/day)
**Authentication:** OAuth 2.0 → JWT tokens (24-hour validity)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting Strategy](#rate-limiting-strategy)
3. [Observations API](#observations-api)
4. [Taxa API](#taxa-api)
5. [Users API](#users-api)
6. [Identifications API](#identifications-api)
7. [Places API](#places-api)
8. [Projects API](#projects-api)
9. [Comments & Annotations](#comments--annotations)
10. [Photo Assets](#photo-assets)
11. [Response Format](#response-format)
12. [Error Handling](#error-handling)
13. [BioQuest Usage Patterns](#bioquest-usage-patterns)

---

## Authentication

### OAuth 2.0 Flow

1. **Authorization URL:** `https://www.inaturalist.org/oauth/authorize`
   ```
   GET /oauth/authorize?
     client_id={CLIENT_ID}&
     redirect_uri={REDIRECT_URI}&
     response_type=code
   ```

2. **Token Exchange:**
   ```
   POST /oauth/token
   {
     "client_id": "{CLIENT_ID}",
     "client_secret": "{CLIENT_SECRET}",
     "code": "{AUTH_CODE}",
     "redirect_uri": "{REDIRECT_URI}",
     "grant_type": "authorization_code"
   }
   ```

3. **Response:**
   ```json
   {
     "access_token": "JWT_TOKEN",
     "token_type": "Bearer",
     "expires_in": 86400,
     "created_at": 1234567890
   }
   ```

4. **Using Token:**
   ```
   Authorization: Bearer {JWT_TOKEN}
   ```

### Implementation in BioQuest

```typescript
// src/lib/inat/auth.ts
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'inaturalist',
      name: 'iNaturalist',
      type: 'oauth',
      authorization: {
        url: 'https://www.inaturalist.org/oauth/authorize',
        params: { scope: 'write' },
      },
      token: 'https://www.inaturalist.org/oauth/token',
      userinfo: 'https://api.inaturalist.org/v1/users/me',
      clientId: process.env.INATURALIST_CLIENT_ID,
      clientSecret: process.env.INATURALIST_CLIENT_SECRET,
    },
  ],
};
```

---

## Rate Limiting Strategy

### BioQuest Implementation

```typescript
// src/lib/inat/rate-limiter.ts
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsThisMinute = 0;
  private windowStart = Date.now();

  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private readonly WINDOW_MS = 60000;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    // Reset window if needed
    const now = Date.now();
    if (now - this.windowStart >= this.WINDOW_MS) {
      this.requestsThisMinute = 0;
      this.windowStart = now;
    }

    // Process requests
    while (this.queue.length > 0 && this.requestsThisMinute < this.MAX_REQUESTS_PER_MINUTE) {
      const request = this.queue.shift()!;
      this.requestsThisMinute++;
      await request();
    }

    this.processing = false;

    // Schedule next batch if queue not empty
    if (this.queue.length > 0) {
      const delay = Math.max(0, this.WINDOW_MS - (Date.now() - this.windowStart));
      setTimeout(() => this.processQueue(), delay);
    }
  }
}
```

---

## Observations API

### GET /observations

**Purpose:** Search and filter observations
**Auth Required:** No (but private observations require auth)
**Rate Limit Impact:** High (cache aggressively)

#### Key Parameters for BioQuest

| Parameter | Type | Description | BioQuest Use Case |
|-----------|------|-------------|-------------------|
| `user_id` | integer | Filter by user | Fetch user's observations for stats |
| `taxon_id` | integer/array | Taxon filter | Quest requirements, species tracking |
| `place_id` | integer | Geographic area | Regional challenges |
| `quality_grade` | string | research/needs_id/casual | Points calculation |
| `photos` | boolean | Has photos | Photo bonuses |
| `sounds` | boolean | Has sounds | Audio bonuses |
| `identified` | boolean | Has community ID | Completion tracking |
| `d1`, `d2` | date | Date range (ISO format) | Time-based quests |
| `created_d1`, `created_d2` | date | Created date range | Sync logic |
| `per_page` | integer | Results per page (max 200) | Pagination |
| `page` | integer | Page number | Pagination |
| `order_by` | string | Sort field | Leaderboards |
| `id_above`, `id_below` | integer | Cursor pagination | Large datasets |

#### Response Structure

```json
{
  "total_results": 12345,
  "page": 1,
  "per_page": 30,
  "results": [
    {
      "id": 123456789,
      "uuid": "abc-123-def",
      "quality_grade": "research",
      "time_observed_at": "2025-01-15T14:30:00Z",
      "taxon": {
        "id": 12345,
        "name": "Passer domesticus",
        "common_name": { "en": "House Sparrow" },
        "rank": "species",
        "rank_level": 10,
        "ancestor_ids": [48460, 3, 355675, 7251, 8863],
        "iconic_taxon_name": "Aves",
        "threatened": false,
        "conservation_status": null
      },
      "user": {
        "id": 12345,
        "login": "naturelover",
        "name": "Nature Lover"
      },
      "place_guess": "San Francisco, CA, USA",
      "location": "37.7749,-122.4194",
      "geojson": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      },
      "positional_accuracy": 10,
      "geoprivacy": "open",
      "taxon_geoprivacy": "obscured",
      "photos": [
        {
          "id": 98765,
          "license_code": "cc-by-nc",
          "url": "https://static.inaturalist.org/photos/98765/medium.jpg",
          "attribution": "(c) naturelover, some rights reserved (CC BY-NC)"
        }
      ],
      "observation_photos": [
        { "id": 11111, "position": 0, "photo": { "id": 98765 } }
      ],
      "num_identification_agreements": 5,
      "num_identification_disagreements": 0,
      "identifications_count": 5,
      "comments_count": 2,
      "faves_count": 3,
      "created_at": "2025-01-15T15:00:00Z",
      "updated_at": "2025-01-16T10:00:00Z"
    }
  ]
}
```

#### BioQuest Usage Examples

```typescript
// src/lib/inat/client.ts

/**
 * Fetch user's recent observations for sync
 */
export async function syncUserObservations(
  userId: number,
  sinceDate: Date
): Promise<INatObservation[]> {
  const params = {
    user_id: userId,
    created_d1: sinceDate.toISOString().split('T')[0],
    per_page: 200,
    order_by: 'created_at',
    order: 'desc',
  };

  const response = await rateLimiter.execute(() =>
    fetch(`${BASE_URL}/observations?${new URLSearchParams(params)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );

  return response.json();
}

/**
 * Get observations for rarity calculation
 */
export async function getSpeciesObservationCount(
  taxonId: number
): Promise<number> {
  const cached = await cache.get(`taxon:${taxonId}:count`);
  if (cached) return cached;

  const response = await rateLimiter.execute(() =>
    fetch(`${BASE_URL}/observations?taxon_id=${taxonId}&per_page=0`)
  );

  const data = await response.json();
  await cache.set(`taxon:${taxonId}:count`, data.total_results, 3600); // 1hr cache

  return data.total_results;
}
```

---

### GET /observations/species_counts

**Purpose:** Count leaf taxa (species-level observations)
**Key for:** Rarity calculations, progress tracking

#### Parameters

| Parameter | Description | BioQuest Use |
|-----------|-------------|--------------|
| `user_id` | User filter | Personal species count |
| `place_id` | Geographic area | Regional rarity |
| `taxon_id` | Parent taxon | Taxonomic group progress |
| `quality_grade` | Filter by quality | Research-grade only for stats |

#### Response

```json
{
  "total_results": 150,
  "results": [
    {
      "count": 25,
      "taxon": {
        "id": 12345,
        "name": "Passer domesticus",
        "rank": "species"
      }
    }
  ]
}
```

---

### GET /observations/observers

**Purpose:** Top observers with species counts
**Key for:** Leaderboards

#### Response

```json
{
  "total_results": 100,
  "results": [
    {
      "user_id": 12345,
      "observation_count": 1234,
      "species_count": 456,
      "user": {
        "login": "topobserver",
        "name": "Top Observer"
      }
    }
  ]
}
```

---

### GET /observations/histogram

**Purpose:** Temporal distribution of observations
**Key for:** Activity charts, streaks

#### Parameters

- `date_field`: created_at, observed_on
- `interval`: year, month, week, day, hour

---

### POST /observations

**Purpose:** Create new observation
**Auth Required:** Yes
**Rate Limit Impact:** Low (user-initiated)

#### Request Body

```json
{
  "observation": {
    "species_guess": "House Sparrow",
    "taxon_id": 12345,
    "observed_on_string": "2025-01-15T14:30:00",
    "description": "Observed feeding near park bench",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "positional_accuracy": 10,
    "geoprivacy": "open",
    "captive": false
  }
}
```

#### Response

Returns created observation with ID.

---

### PUT /observations/{id}

**Purpose:** Update observation
**Auth Required:** Yes (own observations only)

#### BioQuest Use Case
Allow users to edit their observations through the app.

---

### GET /observations/{id}/taxon_summary

**Purpose:** Get taxon context (ancestors, descendants, related species)
**Key for:** Rarity context, "first in region" detection

#### Response

```json
{
  "listed_taxon": {
    "taxon_id": 12345,
    "place": { "id": 97394, "name": "United States" },
    "establishment_means": "native",
    "list": { "title": "U.S. Check List" }
  },
  "wikipedia_summary": "...",
  "conservation_status": {
    "status": "LC",
    "authority": "IUCN Red List"
  }
}
```

---

## Taxa API

### GET /taxa

**Purpose:** Search taxonomic data
**Key for:** Species identification, taxon info

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Name search |
| `taxon_id` | integer | Specific taxon |
| `rank` | string | species, genus, family, etc. |
| `is_active` | boolean | Only valid taxa |
| `parent_id` | integer | Children of parent |

---

### GET /taxa/{id}

**Purpose:** Get detailed taxon information
**Cache:** Aggressively (taxa rarely change)

#### Response

```json
{
  "results": [
    {
      "id": 12345,
      "name": "Passer domesticus",
      "rank": "species",
      "rank_level": 10,
      "iconic_taxon_name": "Aves",
      "ancestry": "48460/1/2/355675/3/7251/8863",
      "ancestor_ids": [48460, 1, 2, 355675, 3, 7251, 8863],
      "default_photo": {
        "medium_url": "https://..."
      },
      "wikipedia_url": "https://en.wikipedia.org/wiki/House_sparrow",
      "observations_count": 1234567,
      "atlas_id": 12345,
      "complete_species_count": 1,
      "conservation_status": null,
      "conservation_statuses": [],
      "is_endemic": false,
      "establishment_means": "native"
    }
  ]
}
```

---

### GET /taxa/autocomplete

**Purpose:** Name-based suggestions (max 30)
**Key for:** Search UI, taxon picker

#### Parameters

- `q`: Query string
- `per_page`: Max 30

---

## Users API

### GET /users/me

**Purpose:** Get current authenticated user
**Auth Required:** Yes
**Key for:** Initial profile sync, session validation

#### Response

```json
{
  "results": [
    {
      "id": 12345,
      "login": "naturelover",
      "name": "Nature Lover",
      "icon_url": "https://...",
      "observations_count": 1234,
      "identifications_count": 567,
      "species_count": 456,
      "created_at": "2020-01-01T00:00:00Z",
      "roles": [],
      "site_id": 1,
      "locale": "en",
      "place_id": 97394,
      "suspended": false,
      "flags": []
    }
  ]
}
```

---

### GET /users/{id}

**Purpose:** Get user profile
**Auth Required:** No
**Key for:** User profiles, leaderboards

---

## Identifications API

### GET /identifications

**Purpose:** Search identifications
**Key for:** Community ID tracking, expert validation

#### Parameters

| Parameter | Description |
|-----------|-------------|
| `observation_id` | IDs for specific observation |
| `user_id` | Filter by identifier |
| `current` | true=active, false=withdrawn |
| `category` | improving, supporting, leading, maverick |

---

### POST /identifications

**Purpose:** Create identification
**Auth Required:** Yes
**Key for:** In-app ID suggestions

#### Request Body

```json
{
  "identification": {
    "observation_id": 123456789,
    "taxon_id": 12345,
    "body": "Looks like a House Sparrow to me"
  }
}
```

---

## Places API

### GET /places/{id}

**Purpose:** Get place details (max 500 places)
**Key for:** Regional quests, location context

#### Admin Levels

- `-10`: Continent
- `0`: Country
- `10`: State/Province
- `20`: County
- `30`: Town/City
- `100`: Park/Protected Area

---

### GET /places/autocomplete

**Purpose:** Location search
**Key for:** Place picker UI

---

### GET /places/nearby

**Purpose:** Find nearby places
**Parameters:** Bounding box (nelat, nelng, swlat, swlng)

---

## Projects API

### GET /projects

**Purpose:** Search projects
**Key for:** Community features, project-based quests

#### Parameters

- `featured`: true/false
- `type`: collection, umbrella, bioblitz
- `place_id`: Location-based projects
- `member_id`: User's projects

---

### POST /projects/{id}/join

**Purpose:** Join project
**Auth Required:** Yes

---

### POST /projects/{id}/add

**Purpose:** Add observation to project
**Auth Required:** Yes

---

## Comments & Annotations

### Comments

- `POST /comments`: Create comment
- `PUT /comments/{id}`: Update comment
- `DELETE /comments/{id}`: Delete comment

### Annotations

**Purpose:** Add controlled attributes (e.g., life stage, sex)

- `POST /annotations`: Create annotation
- `DELETE /annotations/{id}`: Delete annotation
- `POST /votes/vote/annotation/{id}`: Vote on annotation

---

## Photo Assets

### Domains

- **Restricted licenses:** `static.inaturalist.org`
- **Open licenses:** `inaturalist-open-data.s3.amazonaws.com` (bulk download available)

### Size Variants

| Variant | Max Dimension | Use Case |
|---------|---------------|----------|
| `original` | 2048px | Full resolution |
| `large` | 1024px | Desktop detail |
| `medium` | 500px | Mobile detail |
| `small` | 240px | Thumbnails |
| `thumb` | 100px | Icons |
| `square` | 75x75px | Avatars |

### URL Pattern

```
https://static.inaturalist.org/photos/{photo_id}/{size}.{ext}
```

### BioQuest Image Optimization

```typescript
// src/components/ObservationPhoto.tsx
import Image from 'next/image';

export function ObservationPhoto({ photo, alt, size = 'medium' }: Props) {
  const url = photo.url.replace(/\/medium\./, `/${size}.`);

  return (
    <Image
      src={url}
      alt={alt}
      width={getSizeWidth(size)}
      height={getSizeHeight(size)}
      loading="lazy"
    />
  );
}
```

---

## Response Format

### Standard Structure

All responses return JSON:

```json
{
  "total_results": 12345,
  "page": 1,
  "per_page": 30,
  "results": [...]
}
```

### Pagination

1. **Page-based:**
   ```
   ?page=1&per_page=30
   ```

2. **Cursor-based (large datasets):**
   ```
   ?id_above=12345&per_page=200
   ?id_below=12345&per_page=200
   ```

---

## Error Handling

### HTTP Status Codes

- `200`: Success
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `422`: Unprocessable Entity (validation error)
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

### Error Response

```json
{
  "error": "Unauthorized",
  "status": 401
}
```

### BioQuest Error Handler

```typescript
// src/lib/inat/error-handler.ts
export class INatAPIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

export async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 429:
        throw new INatAPIError(429, 'Rate limit exceeded', true);
      case 401:
        // Refresh token or re-authenticate
        throw new INatAPIError(401, 'Unauthorized', false);
      case 500:
        throw new INatAPIError(500, 'Server error', true);
      default:
        throw new INatAPIError(response.status, error.error || 'Unknown error', false);
    }
  }

  return response.json();
}
```

---

## BioQuest Usage Patterns

### 1. Initial Sync (New User)

```typescript
async function initialSync(userId: number, token: string) {
  // 1. Get user profile
  const user = await inat.getUser('me', token);

  // 2. Fetch all observations (paginated)
  const observations = await inat.getAllUserObservations(userId, token);

  // 3. Get species counts
  const speciesCounts = await inat.getSpeciesCounts(userId);

  // 4. Calculate points and badges
  await gamification.processObservations(observations);

  // 5. Store in database
  await db.user.upsert({
    where: { inatId: userId },
    create: { ...user, observations },
    update: { observations },
  });
}
```

### 2. Daily Sync (Returning User)

```typescript
async function dailySync(userId: number, lastSync: Date, token: string) {
  // Only fetch new/updated observations
  const newObservations = await inat.getUserObservations(userId, {
    created_d1: lastSync.toISOString().split('T')[0],
    per_page: 200,
  }, token);

  // Process new observations
  if (newObservations.length > 0) {
    await gamification.processNewObservations(newObservations);
    await updateUserStats(userId);
  }
}
```

### 3. Rarity Calculation

```typescript
async function calculateRarity(taxonId: number): Promise<RarityTier> {
  // Check cache first
  const cached = await cache.get(`rarity:${taxonId}`);
  if (cached) return cached;

  // Get global observation count
  const count = await inat.getSpeciesObservationCount(taxonId);

  // Get conservation status
  const taxon = await inat.getTaxon(taxonId);
  const isRedList = taxon.conservation_status?.iucn !== null;

  let rarity: RarityTier;
  if (count < 100 || isRedList) {
    rarity = 'legendary';
  } else if (count < 1000) {
    rarity = 'rare';
  } else {
    rarity = 'normal';
  }

  // Cache for 24 hours
  await cache.set(`rarity:${taxonId}`, rarity, 86400);

  return rarity;
}
```

### 4. Leaderboard Query

```typescript
async function getGlobalLeaderboard(placeId?: number): Promise<LeaderboardEntry[]> {
  const params = {
    per_page: 100,
    order_by: 'species_count',
    ...(placeId && { place_id: placeId }),
  };

  const response = await inat.getObservers(params);

  return response.results.map((observer, index) => ({
    rank: index + 1,
    userId: observer.user_id,
    username: observer.user.login,
    speciesCount: observer.species_count,
    observationCount: observer.observation_count,
  }));
}
```

### 5. Quest Progress Tracking

```typescript
async function checkQuestProgress(userId: number, quest: Quest): Promise<QuestProgress> {
  const params = {
    user_id: userId,
    taxon_id: quest.taxonId,
    place_id: quest.placeId,
    d1: quest.startDate,
    d2: quest.endDate,
    quality_grade: 'research,needs_id',
  };

  const response = await inat.getObservations(params);

  return {
    current: response.total_results,
    required: quest.target,
    completed: response.total_results >= quest.target,
  };
}
```

---

## Caching Strategy for BioQuest

| Data Type | Cache Duration | Invalidation Trigger |
|-----------|----------------|---------------------|
| Taxon details | 7 days | Never (static) |
| User profile | 1 hour | User action |
| Observation counts | 1 hour | New sync |
| Species counts | 1 hour | New sync |
| Rarity tiers | 24 hours | Manual refresh |
| Leaderboards | 15 minutes | Scheduled |
| User observations | Until sync | Sync event |

---

## Performance Best Practices

1. **Batch Requests:** Use `id` arrays instead of multiple single requests
2. **Cursor Pagination:** Use `id_above`/`id_below` for large datasets
3. **Selective Fields:** Don't request unnecessary data
4. **Cache Aggressively:** Most iNat data is slow-changing
5. **Respect Rate Limits:** Implement queue system
6. **Use ETags:** For conditional requests (if supported)
7. **Background Sync:** Don't block UI for data fetches

---

## Compliance & Ethics

### Terms of Service

- API is "intended to support application development, not data scraping"
- Violations may result in blocks without notice
- Credit photo/observation authors
- Respect license requirements (CC-BY, CC0, All Rights Reserved)
- Link back to original iNat observations

### Privacy

- Respect `geoprivacy` settings (open, obscured, private)
- Don't expose precise locations for threatened species
- Honor `taxon_geoprivacy` (set by species conservation status)
- User data deletion on request

### Data Attribution

Every observation/photo display must include:

```typescript
// src/components/ObservationCard.tsx
<div className="attribution">
  Photo © {observation.user.name}, licensed under {observation.photos[0].license_code}
  <a href={`https://www.inaturalist.org/observations/${observation.id}`}>
    View on iNaturalist
  </a>
</div>
```

---

## Developer Resources & Data Exports

### Open Source Repositories

iNaturalist maintains three open source repositories that can be studied for integration patterns and best practices:

1. **Web Application (Rails):** https://github.com/inaturalist/inaturalist
   - Main platform codebase
   - API implementation reference
   - Business logic patterns

2. **iOS App:** https://github.com/inaturalist/INaturalistIOS
   - Native iOS implementation
   - Offline-first patterns
   - Camera/photo upload workflows

3. **Android App:** https://github.com/inaturalist/iNaturalistAndroid
   - Native Android implementation
   - Sync mechanisms
   - UI/UX patterns

**Contribution Note:** iNaturalist encourages discussing feature requests on the [iNaturalist Forum](https://forum.inaturalist.org) before submitting pull requests.

---

### Bulk Data Exports

For analytics, ML training, or offline processing, iNaturalist provides several large-scale datasets:

#### 1. GBIF DarwinCore Archive (Research-Grade Observations)

- **Size:** ~17 GB (as of January 2025)
- **Update Frequency:** Weekly
- **Format:** DarwinCore Archive (CSV + XML metadata)
- **Content:** All research-grade observations
- **Access:** https://www.gbif.org/dataset/50c9509d-22c7-4a22-a47d-8c48425ef4a7

**BioQuest Use Cases:**
- Offline rarity calculations
- Historical trend analysis
- ML model training for species distribution

```typescript
// Example: Processing GBIF export for rarity tiers
async function buildRarityDatabase(gbifExportPath: string) {
  const speciesCounts = new Map<number, number>();

  // Parse DarwinCore CSV
  const observations = await parseGBIFExport(gbifExportPath);

  observations.forEach(obs => {
    const count = speciesCounts.get(obs.taxonId) || 0;
    speciesCounts.set(obs.taxonId, count + 1);
  });

  // Store in local database for fast lookups
  await db.rarityCache.createMany({
    data: Array.from(speciesCounts.entries()).map(([taxonId, count]) => ({
      taxonId,
      globalCount: count,
      tier: calculateTier(count),
      updatedAt: new Date(),
    })),
  });
}
```

#### 2. Taxonomy DarwinCore Archive

- **Update Frequency:** Monthly
- **Format:** DarwinCore Archive
- **Content:** Complete taxonomic tree with common names and synonyms
- **Access:** Via iNaturalist data exports page

**BioQuest Use Cases:**
- Offline taxon lookups
- Taxonomic hierarchy navigation
- Multi-language common names

#### 3. Licensed Observation Images (Amazon Open Data)

- **Update Frequency:** Monthly
- **Format:** JPEG images + metadata JSON
- **Content:** All observations with open licenses (CC-BY, CC0, etc.)
- **Access:** Amazon S3 Open Data Sponsorship Program
- **Domain:** `inaturalist-open-data.s3.amazonaws.com`

**Important:** Images on `static.inaturalist.org` have restricted licenses. Only images on the S3 bucket are bulk-downloadable.

**BioQuest Use Cases:**
- Offline image caching for PWA
- ML model training
- Species recognition features

#### 4. Range Maps Dataset

- **Update Frequency:** Monthly
- **Content:** Range maps for 100,000+ taxa modeled from iNaturalist observations
- **Format:** GeoJSON (individual species) and Geopackage (.gpkg, up to 5,000 species)
- **First Released:** February 25, 2025
- **License:** CC-BY
- **Grid System:** H3-4 hexagonal grid (~1,770 km² per cell, ~22.6 km edge length)
- **Methodology:** Spatial implicit neural representation (Cole et al., 2023)
- **Minimum Data:** ~100 observations required per taxon for map generation
- **Official Docs:** https://www.inaturalist.org/pages/range_maps

**Data Sources:**
- iNaturalist observation records with geospatial coordinates
- Elevation data for improved distribution modeling
- Joint estimation across all taxa using the iNaturalist Geomodel

**API Access:**
```
# Individual species GeoJSON
https://inaturalist-open-data.s3.us-east-1.amazonaws.com/geomodel/geojsons/latest/{taxon_id}.geojson

# Version-specific access
https://inaturalist-open-data.s3.us-east-1.amazonaws.com/geomodel/geojsons/2.20/{taxon_id}.geojson
```

**Accuracy Indicators:**
- **White areas:** No observations (no data)
- **Yellow areas:** 1-99 observations (low confidence)
- **Red areas:** 100+ observations (high confidence)

**Limitations:**
- Reliability varies by geographic region based on observation density
- No temporal/seasonal patterns (static snapshots)
- Assumes equal detectability across species/regions
- May include noise from captive/escaped populations
- Recent colonizations may not be reflected

**BioQuest Use Cases:**
- **Out-of-range detection:** Award bonus points for observations >100km from known range
- **Regional rarity calculations:** Combine range presence with observation counts
- **Geographic quest design:** "Find species outside their typical range"
- **Educational context:** Show expected vs. unexpected species for location
- **Range expansion tracking:** Identify potential climate change impacts
- **Invasive species detection:** Flag non-native species far from origin

**Example Implementation:**
```typescript
// src/lib/inat/range-maps.ts
import * as turf from '@turf/turf';

export async function checkSpeciesRange(
  taxonId: number,
  lat: number,
  lng: number
): Promise<{ inRange: boolean; distance: number }> {
  // Fetch range map from S3 (with caching)
  const url = `https://inaturalist-open-data.s3.us-east-1.amazonaws.com/geomodel/geojsons/latest/${taxonId}.geojson`;
  const response = await fetch(url);

  if (!response.ok) {
    // No range map available (likely <100 observations)
    return { inRange: true, distance: 0 };
  }

  const rangeMap = await response.json();
  const point = turf.point([lng, lat]);

  // Check if point is within any range polygon
  for (const feature of rangeMap.features) {
    if (turf.booleanPointInPolygon(point, feature.geometry)) {
      return { inRange: true, distance: 0 };
    }
  }

  // Calculate distance to nearest range polygon
  const distances = rangeMap.features.map(feature => {
    const line = turf.polygonToLine(feature.geometry);
    return turf.pointToLineDistance(point, line, { units: 'kilometers' });
  });

  return { inRange: false, distance: Math.min(...distances) };
}

// Award bonus points for out-of-range observations
export function calculateRangeBonus(distanceKm: number): number {
  if (distanceKm > 1000) return 500; // Continental-scale range expansion
  if (distanceKm > 500) return 300;  // Regional range expansion
  if (distanceKm > 100) return 150;  // Local range expansion
  if (distanceKm > 50) return 50;    // Edge of range
  return 0;
}
```

**Caching Strategy:**
```typescript
// Cache range maps for 30 days (they update monthly)
const RANGE_MAP_CACHE_TTL = 30 * 24 * 60 * 60;

// Store in Redis or database
await cache.set(`rangemap:${taxonId}`, rangeMapGeoJSON, RANGE_MAP_CACHE_TTL);
```

**References:**
- **Technical Details:** See [RANGE_MAPS.md](./RANGE_MAPS.md) for comprehensive documentation
- **Implementation RFC:** See [RFC-001](./rfcs/RFC-001-Enhanced-Rarity-System.md) for enhanced rarity system design
- **Research Paper:** Cole et al. (2023) - "Spatial implicit neural representations for global-scale species mapping" (ICML)
- **Official Page:** https://www.inaturalist.org/pages/range_maps

#### 5. Places Dataset

- **Update Frequency:** Weekly
- **Format:** CSV
- **Content:** All place boundaries with IDs and bounding boxes
- **Fields:** place_id, name, admin_level, nelat, nelng, swlat, swlng

**BioQuest Use Cases:**
- Offline place autocomplete
- Regional quest boundaries
- Location-based achievements

```typescript
// Example: Loading places for offline use
async function syncPlacesDatabase() {
  const placesCSV = await fetchPlacesExport();

  await db.place.createMany({
    data: placesCSV.map(row => ({
      inatId: row.place_id,
      name: row.name,
      adminLevel: row.admin_level,
      boundingBox: {
        ne: { lat: row.nelat, lng: row.nelng },
        sw: { lat: row.swlat, lng: row.swlng },
      },
    })),
  });
}
```

#### 6. Computer Vision Training Datasets

iNaturalist has released datasets for the Fine-Grained Visual Categorization (FGVC) challenges:

- **2017 Challenge:** 675,000 photos
- **2021 Challenge:** 3.3 million photos
- **Purpose:** Species recognition model training
- **Access:** FGVC website / academic competitions

**BioQuest Future Use:**
- Build custom species recognition for common taxa
- Train region-specific models
- Validate observation quality

---

### Rate Limits (Expanded)

#### API Rate Limits

- **Requests:** 100 requests/minute (hard limit)
- **Recommended:** 60 requests/minute or lower
- **Daily Guideline:** <10,000 requests/day

**Violation Consequences:** Temporary or permanent IP/API key blocks without notice.

#### Media Download Rate Limits

- **Hourly Limit:** 5 GB of images/media
- **Daily Limit:** 24 GB of images/media
- **Violation:** Permanent blocking

**BioQuest Strategy:**
```typescript
// Track media download bandwidth
class MediaDownloadTracker {
  private hourlyBytes = 0;
  private dailyBytes = 0;
  private hourStart = Date.now();
  private dayStart = Date.now();

  private readonly HOURLY_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB
  private readonly DAILY_LIMIT = 24 * 1024 * 1024 * 1024; // 24 GB

  async canDownload(estimatedBytes: number): Promise<boolean> {
    this.resetWindows();

    if (this.hourlyBytes + estimatedBytes > this.HOURLY_LIMIT) {
      console.warn('Approaching hourly media download limit');
      return false;
    }

    if (this.dailyBytes + estimatedBytes > this.DAILY_LIMIT) {
      console.warn('Approaching daily media download limit');
      return false;
    }

    return true;
  }

  recordDownload(bytes: number) {
    this.hourlyBytes += bytes;
    this.dailyBytes += bytes;
  }

  private resetWindows() {
    const now = Date.now();

    if (now - this.hourStart > 3600000) { // 1 hour
      this.hourlyBytes = 0;
      this.hourStart = now;
    }

    if (now - this.dayStart > 86400000) { // 24 hours
      this.dailyBytes = 0;
      this.dayStart = now;
    }
  }
}
```

---

### Community Tools & Examples

Third-party developers have created successful integrations with iNaturalist that can serve as inspiration:

#### 1. Dronefly (Discord Bot)
- **Platform:** Discord
- **Features:** Species lookup, observation stats, project info
- **Relevance:** Demonstrates conversational UI for biodiversity data
- **Lessons:** Caching strategies, natural language queries

#### 2. iSeahorse
- **Focus:** Seahorse conservation project
- **Features:** Specialized observation tracking, targeted data collection
- **Relevance:** Domain-specific gamification
- **Lessons:** Custom badges, conservation integration

#### 3. Find-A-Pest
- **Focus:** Invasive species tracking
- **Features:** Alert systems, targeted observation campaigns
- **Relevance:** Quest-like challenges, community coordination
- **Lessons:** Push notifications, urgent quests

#### 4. ifieldnotes.org
- **Focus:** Field research tool
- **Features:** Expedition planning, observation organization
- **Relevance:** Trip/journey tracking
- **Lessons:** Offline workflows, expedition grouping

#### 5. tatzpiteva.org
- **Region:** Regional biodiversity platform
- **Relevance:** Localized leaderboards, regional challenges

**BioQuest Differentiation:**
- Full gamification layer (points, levels, XP)
- Cross-taxa quests and challenges
- Social features (friends, teams)
- Rarity tiers and legendary finds
- Youth-focused engagement

---

### Observation Export Tool

In addition to bulk downloads, users can export their own observations via the web interface:

**Features:**
- CSV format
- Customizable fields
- Date range filtering
- Quality grade filtering

**BioQuest Use Case:**
Allow users to export their BioQuest stats and achievements alongside iNat data.

```typescript
// Example: Generate enhanced export with BioQuest data
async function exportUserData(userId: number) {
  const inatObs = await inat.getUserObservations(userId);
  const bioquestStats = await db.userStats.findUnique({ where: { userId } });
  const badges = await db.userBadge.findMany({ where: { userId } });

  return {
    observations: inatObs,
    stats: {
      totalPoints: bioquestStats.points,
      level: bioquestStats.level,
      rarityBreakdown: {
        normal: bioquestStats.normalCount,
        rare: bioquestStats.rareCount,
        legendary: bioquestStats.legendaryCount,
      },
    },
    badges: badges.map(b => ({ name: b.badgeName, unlockedAt: b.unlockedAt })),
    exportDate: new Date().toISOString(),
  };
}
```

---

## Useful Links

- **API Documentation:** https://api.inaturalist.org/v1/docs/
- **Swagger JSON:** https://api.inaturalist.org/v1/swagger.json
- **Developer Resources:** https://www.inaturalist.org/pages/developers
- **Open Source Repos:** https://github.com/inaturalist
- **Developer Forum:** https://forum.inaturalist.org/c/general/api/
- **Terms of Service:** https://www.inaturalist.org/pages/terms
- **Privacy Policy:** https://www.inaturalist.org/pages/privacy
- **OAuth Apps:** https://www.inaturalist.org/oauth/applications
- **GBIF Dataset:** https://www.gbif.org/dataset/50c9509d-22c7-4a22-a47d-8c48425ef4a7
- **Data Exports:** https://www.inaturalist.org/pages/developers#data

---

## Next Steps for Implementation

1. ✅ Document API endpoints (this file)
2. ⬜ Implement `INatClient` class with rate limiting
3. ⬜ Set up NextAuth.js with iNat OAuth
4. ⬜ Create observation sync system
5. ⬜ Implement caching layer (Redis/Vercel KV)
6. ⬜ Build rarity calculation service
7. ⬜ Test rate limiting under load
8. ⬜ Monitor API usage in production

---

**Last Updated:** 2025-01-15
**Maintained by:** BioQuest Development Team
