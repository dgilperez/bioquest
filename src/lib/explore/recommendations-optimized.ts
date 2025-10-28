import { getINatClient } from '@/lib/inat/client';
import { prisma } from '@/lib/db/prisma';

export interface LocationRecommendation {
  placeId: number;
  placeName: string;
  displayName: string;
  distance: number;
  coordinates: { lat: number; lng: number };
  score: number;
  newSpeciesPossible: number;
  totalSpeciesAtLocation: number;
  recentActivity: 'low' | 'medium' | 'high';
  recentObservationCount: number;
  strongFor: string[];
  topTargets: TargetSpecies[];
  rareSpeciesCounts: {
    mythic: number;
    legendary: number;
    epic: number;
    rare: number;
  };
  bestSeasons?: SeasonalInfo[];
}

export interface SeasonalInfo {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  months: string;
  peakActivity: number;
  topTaxa: string[];
  recommendation: string;
}

export interface TargetSpecies {
  taxonId: number;
  taxonName: string;
  commonName?: string;
  iconicTaxon: string;
  observationCount: number;
  reason: 'never_seen' | 'rare_globally' | 'endemic' | 'seasonal';
}

export interface UserExplorePreferences {
  maxDistance?: number;
  preferredTaxa?: string[];
  minNewSpecies?: number;
}

/**
 * Calculate center coordinates from bounding box
 */
function calculateCenterFromBbox(bbox: number[][]): { lat: number; lng: number } {
  // bbox is [[lng, lat], [lng, lat], ...]
  const lngs = bbox.map(coord => coord[0]);
  const lats = bbox.map(coord => coord[1]);

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get or fetch place with caching
 */
async function getOrFetchPlace(
  placeId: number,
  placeName: string,
  displayName: string,
  bbox: number[][],
  accessToken: string
): Promise<{ lat: number; lng: number; totalSpecies: number; recentObs: number } | null> {
  // Check cache first (data less than 7 days old)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const cached = await prisma.place.findUnique({
    where: { id: placeId },
  });

  if (cached && cached.cachedAt > sevenDaysAgo) {
    // Update query stats
    await prisma.place.update({
      where: { id: placeId },
      data: {
        queriedCount: { increment: 1 },
        lastQueriedAt: new Date(),
      },
    });

    return {
      lat: cached.latitude,
      lng: cached.longitude,
      totalSpecies: cached.totalSpecies,
      recentObs: cached.recentObservations,
    };
  }

  // Fetch fresh data
  const client = getINatClient(accessToken);
  const center = calculateCenterFromBbox(bbox);

  try {
    // Get species count
    const speciesResponse = await client.getPlaceSpeciesCounts(placeId, { per_page: 1 });
    const totalSpecies = speciesResponse.total_results;

    // Get recent observations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentObs = await client.getPlaceObservations(placeId, {
      per_page: 1,
      d1: thirtyDaysAgo.toISOString().split('T')[0],
    });
    const recentObservations = recentObs.total_results;

    // Cache the data
    await prisma.place.upsert({
      where: { id: placeId },
      update: {
        name: placeName,
        displayName,
        latitude: center.lat,
        longitude: center.lng,
        totalSpecies,
        recentObservations,
        cachedAt: new Date(),
        queriedCount: { increment: 1 },
        lastQueriedAt: new Date(),
      },
      create: {
        id: placeId,
        name: placeName,
        displayName,
        latitude: center.lat,
        longitude: center.lng,
        totalSpecies,
        recentObservations,
        queriedCount: 1,
      },
    });

    return { lat: center.lat, lng: center.lng, totalSpecies, recentObs: recentObservations };
  } catch (error) {
    console.error(`Error fetching place ${placeId}:`, error);
    return null;
  }
}

/**
 * Get user's taxonomic strengths (iconic taxa they've observed most)
 */
async function getUserTaxonomicStrengths(userId: string): Promise<Map<string, number>> {
  const observations = await prisma.observation.findMany({
    where: { userId },
    select: { iconicTaxon: true },
  });

  const taxonCounts = new Map<string, number>();
  observations.forEach(obs => {
    if (obs.iconicTaxon) {
      taxonCounts.set(obs.iconicTaxon, (taxonCounts.get(obs.iconicTaxon) || 0) + 1);
    }
  });

  return taxonCounts;
}

/**
 * Get user's life list (all species they've observed)
 */
async function getUserLifeList(userId: string): Promise<Set<number>> {
  const observations = await prisma.observation.findMany({
    where: {
      userId,
      taxonId: { not: null },
    },
    select: { taxonId: true },
    distinct: ['taxonId'],
  });

  return new Set(observations.map(obs => obs.taxonId!));
}

/**
 * Determine activity level
 */
function determineActivityLevel(recentCount: number): 'low' | 'medium' | 'high' {
  if (recentCount > 100) return 'high';
  if (recentCount > 20) return 'medium';
  return 'low';
}

/**
 * Analyze seasonal patterns for a location
 * Returns simple seasonal recommendations based on current month
 */
function analyzeSeasonalPatterns(_placeId: number, _placeName: string): SeasonalInfo[] {
  // For MVP, provide general seasonal guidance
  // In production, this would call iNat histogram API for actual data

  const currentMonth = new Date().getMonth(); // 0-11

  // Determine current season
  let currentSeason: 'spring' | 'summer' | 'fall' | 'winter';
  if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'spring';
  else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'summer';
  else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'fall';
  else currentSeason = 'winter';

  // General seasonal recommendations
  const seasonalPatterns: Record<string, SeasonalInfo> = {
    spring: {
      season: 'spring',
      months: 'March-May',
      peakActivity: 85,
      topTaxa: ['Plantae', 'Aves', 'Insecta'],
      recommendation: 'Peak time for wildflowers, migratory birds, and emerging insects',
    },
    summer: {
      season: 'summer',
      months: 'June-August',
      peakActivity: 75,
      topTaxa: ['Insecta', 'Plantae', 'Reptilia'],
      recommendation: 'Great for butterflies, dragonflies, and reptiles in warm weather',
    },
    fall: {
      season: 'fall',
      months: 'September-November',
      peakActivity: 70,
      topTaxa: ['Aves', 'Fungi', 'Plantae'],
      recommendation: 'Excellent for fall migrants, mushrooms, and autumn foliage',
    },
    winter: {
      season: 'winter',
      months: 'December-February',
      peakActivity: 45,
      topTaxa: ['Aves', 'Mammalia'],
      recommendation: 'Best for winter birds, tracking mammals in snow',
    },
  };

  // Return current season first, then others in order
  const seasons: SeasonalInfo[] = [];
  seasons.push(seasonalPatterns[currentSeason]);

  // Add other seasons
  const otherSeasons = (['spring', 'summer', 'fall', 'winter'] as const).filter(
    s => s !== currentSeason
  );
  otherSeasons.forEach(season => seasons.push(seasonalPatterns[season]));

  return seasons;
}

/**
 * Analyze a location - OPTIMIZED with caching
 */
async function analyzeLocation(
  placeId: number,
  placeName: string,
  displayName: string,
  bbox: number[][],
  userCoordinates: { lat: number; lng: number },
  userLifeList: Set<number>,
  userStrengths: Map<string, number>,
  accessToken: string
): Promise<LocationRecommendation | null> {
  // Get or fetch place data (with caching)
  const placeData = await getOrFetchPlace(placeId, placeName, displayName, bbox, accessToken);
  if (!placeData) return null;

  const { lat, lng, totalSpecies, recentObs } = placeData;

  // Calculate distance
  const distance = calculateDistance(userCoordinates.lat, userCoordinates.lng, lat, lng);

  const client = getINatClient(accessToken);

  try {
    // Get top species at location (limit to 50 for speed)
    const speciesResponse = await client.getPlaceSpeciesCounts(placeId, { per_page: 50 });

    // Calculate unseenspecies
    const unseenSpecies = speciesResponse.results.filter(
      result => !userLifeList.has(result.taxon.id)
    );
    const newSpeciesPossible = Math.min(unseenSpecies.length * 2, totalSpecies); // Estimate

    const recentActivity = determineActivityLevel(recentObs);

    // Determine taxonomic strengths at this location
    const taxonCounts = new Map<string, number>();
    speciesResponse.results.forEach(result => {
      const iconicTaxon = result.taxon.iconic_taxon_name || 'Unknown';
      taxonCounts.set(iconicTaxon, (taxonCounts.get(iconicTaxon) || 0) + result.count);
    });

    // Find matching strengths
    const strongFor: string[] = [];
    const sortedTaxa = Array.from(taxonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [taxon] of sortedTaxa) {
      const userCount = userStrengths.get(taxon) || 0;
      if (userCount > 5 && strongFor.length < 3) {
        strongFor.push(taxon);
      }
    }

    // Get top 3 target species
    const topTargets: TargetSpecies[] = unseenSpecies
      .slice(0, 3)
      .map(result => ({
        taxonId: result.taxon.id,
        taxonName: result.taxon.name,
        commonName: result.taxon.preferred_common_name,
        iconicTaxon: result.taxon.iconic_taxon_name || 'Unknown',
        observationCount: result.count,
        reason: 'never_seen' as const,
      }));

    // Calculate rarity counts for unseen species
    const rareSpeciesCounts = {
      mythic: 0,
      legendary: 0,
      epic: 0,
      rare: 0,
    };

    // Use the observation count as a proxy for rarity
    // Note: This is an approximation since we don't fetch full taxon details
    unseenSpecies.forEach(result => {
      const count = result.count;
      // Classify based on observation count at this location
      // (not perfect but gives a good indicator)
      if (count < 10) rareSpeciesCounts.mythic++;
      else if (count < 50) rareSpeciesCounts.legendary++;
      else if (count < 100) rareSpeciesCounts.epic++;
      else if (count < 500) rareSpeciesCounts.rare++;
    });

    // Calculate score
    let score = 0;
    score += Math.min(40, (newSpeciesPossible / 100) * 40);
    if (distance < 10) score += 25;
    else if (distance < 25) score += 20;
    else if (distance < 50) score += 15;
    else if (distance < 100) score += 10;
    else score += 5;
    if (recentActivity === 'high') score += 20;
    else if (recentActivity === 'medium') score += 12;
    else score += 5;
    score += strongFor.length * 5;

    // Get seasonal patterns
    const bestSeasons = analyzeSeasonalPatterns(placeId, placeName);

    return {
      placeId,
      placeName,
      displayName,
      distance: Math.round(distance),
      coordinates: { lat, lng },
      score: Math.round(score),
      newSpeciesPossible,
      totalSpeciesAtLocation: totalSpecies,
      recentActivity,
      recentObservationCount: recentObs,
      strongFor,
      topTargets,
      rareSpeciesCounts,
      bestSeasons,
    };
  } catch (error) {
    console.error(`Failed to analyze location ${placeName}:`, error);
    return null;
  }
}

/**
 * Get location recommendations - OPTIMIZED
 */
export async function getLocationRecommendations(
  userId: string,
  userCoordinates: { lat: number; lng: number },
  accessToken: string,
  preferences: UserExplorePreferences = {}
): Promise<LocationRecommendation[]> {
  const { maxDistance = 100, minNewSpecies = 10 } = preferences;

  const client = getINatClient(accessToken);

  // Search for nature-focused places using autocomplete (faster than nearby)
  const searchTerms = ['park', 'reserve', 'national', 'state park', 'wildlife'];
  const allPlaces: Array<{ id: number; name: string; displayName: string; bbox: number[][] }> = [];

  // Search in parallel for speed
  await Promise.all(
    searchTerms.map(async term => {
      try {
        const response = await client.searchPlaces(term, { per_page: 10 });
        response.results.forEach((place: any) => {
          if (place.bounding_box_geojson?.coordinates?.[0]) {
            const bbox = place.bounding_box_geojson.coordinates[0];
            const center = calculateCenterFromBbox(bbox);
            const distance = calculateDistance(
              userCoordinates.lat,
              userCoordinates.lng,
              center.lat,
              center.lng
            );

            if (distance <= maxDistance) {
              allPlaces.push({
                id: place.id,
                name: place.name,
                displayName: place.display_name,
                bbox,
              });
            }
          }
        });
      } catch (error) {
        console.error(`Search failed for term "${term}":`, error);
      }
    })
  );

  // Deduplicate by place ID
  const uniquePlaces = Array.from(
    new Map(allPlaces.map(p => [p.id, p])).values()
  ).slice(0, 10); // Limit to top 10

  console.log(`Found ${uniquePlaces.length} unique places within ${maxDistance} miles`);

  // Get user data
  const [userLifeList, userStrengths] = await Promise.all([
    getUserLifeList(userId),
    getUserTaxonomicStrengths(userId),
  ]);

  // Analyze places in parallel (max 3 at a time to respect rate limits)
  const recommendations: LocationRecommendation[] = [];
  const batchSize = 3;

  for (let i = 0; i < uniquePlaces.length; i += batchSize) {
    const batch = uniquePlaces.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(place =>
        analyzeLocation(
          place.id,
          place.name,
          place.displayName,
          place.bbox,
          userCoordinates,
          userLifeList,
          userStrengths,
          accessToken
        )
      )
    );

    recommendations.push(...results.filter(r => r !== null && r.newSpeciesPossible >= minNewSpecies) as LocationRecommendation[]);

    // Small delay between batches
    if (i + batchSize < uniquePlaces.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Sort by score
  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Get user's current coordinates from observations or location
 */
export async function getUserCoordinates(userId: string): Promise<{ lat: number; lng: number } | null> {
  const recentObservation = await prisma.observation.findFirst({
    where: {
      userId,
      location: { not: null },
    },
    orderBy: { observedOn: 'desc' },
    select: { location: true },
  });

  if (recentObservation?.location) {
    const [lat, lng] = recentObservation.location.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
}
