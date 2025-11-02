import { getINatClient, INatClient } from '@/lib/inat/client';
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
 * Analyze seasonal patterns for a location using iNat histogram API
 * Returns seasonal recommendations based on actual observation data
 */
async function analyzeSeasonalPatterns(
  placeId: number,
  _placeName: string,
  client: INatClient
): Promise<SeasonalInfo[]> {
  try {
    // Get observation histogram for this location (last 2 years for good seasonal data)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const histogramData = await client.getPlaceObservationsHistogram(
      placeId,
      'observed_on',
      'month'
    );

    // Aggregate by season
    const seasonalData = {
      spring: { months: [2, 3, 4], count: 0 }, // Mar, Apr, May
      summer: { months: [5, 6, 7], count: 0 }, // Jun, Jul, Aug
      fall: { months: [8, 9, 10], count: 0 },  // Sep, Oct, Nov
      winter: { months: [11, 0, 1], count: 0 }, // Dec, Jan, Feb
    };

    // Sum observations by season
    Object.entries(histogramData.results?.month || {}).forEach(([month, count]) => {
      const monthNum = parseInt(month) - 1; // iNat uses 1-12, JS uses 0-11
      const observationCount = count as number;

      if (seasonalData.spring.months.includes(monthNum)) {
        seasonalData.spring.count += observationCount;
      } else if (seasonalData.summer.months.includes(monthNum)) {
        seasonalData.summer.count += observationCount;
      } else if (seasonalData.fall.months.includes(monthNum)) {
        seasonalData.fall.count += observationCount;
      } else if (seasonalData.winter.months.includes(monthNum)) {
        seasonalData.winter.count += observationCount;
      }
    });

    // Convert to SeasonalInfo array, sorted by activity
    const seasons = [
      { season: 'spring' as const, count: seasonalData.spring.count },
      { season: 'summer' as const, count: seasonalData.summer.count },
      { season: 'fall' as const, count: seasonalData.fall.count },
      { season: 'winter' as const, count: seasonalData.winter.count },
    ].sort((a, b) => b.count - a.count);

    const totalObservations = seasons.reduce((sum, s) => sum + s.count, 0);

    const currentMonth = new Date().getMonth(); // 0-11

    // Determine current season
    let currentSeason: 'spring' | 'summer' | 'fall' | 'winter';
    if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'spring';
    else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'summer';
    else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'fall';
    else currentSeason = 'winter';

    // Map seasons to SeasonalInfo with real data
    const seasonalInfo: SeasonalInfo[] = seasons.map(s => {
      const peakActivity = totalObservations > 0 ? Math.round((s.count / totalObservations) * 100) : 50;

      const recommendations: Record<typeof s.season, string> = {
        spring: peakActivity > 25 ? 'Peak time for wildflowers, migratory birds, and emerging insects' : 'Moderate activity for spring species',
        summer: peakActivity > 25 ? 'Great for butterflies, dragonflies, and reptiles in warm weather' : 'Good time for summer species',
        fall: peakActivity > 25 ? 'Excellent for fall migrants, mushrooms, and autumn foliage' : 'Decent activity for fall observations',
        winter: peakActivity > 15 ? 'Best for winter birds and tracking mammals' : 'Lower activity but unique winter species present',
      };

      const monthRanges: Record<typeof s.season, string> = {
        spring: 'March-May',
        summer: 'June-August',
        fall: 'September-November',
        winter: 'December-February',
      };

      const typicalTaxa: Record<typeof s.season, string[]> = {
        spring: ['Plantae', 'Aves', 'Insecta'],
        summer: ['Insecta', 'Plantae', 'Reptilia'],
        fall: ['Aves', 'Fungi', 'Plantae'],
        winter: ['Aves', 'Mammalia'],
      };

      return {
        season: s.season,
        months: monthRanges[s.season],
        peakActivity,
        topTaxa: typicalTaxa[s.season],
        recommendation: recommendations[s.season],
      };
    });

    // Sort so current season is first, then by peak activity
    return seasonalInfo.sort((a, b) => {
      if (a.season === currentSeason) return -1;
      if (b.season === currentSeason) return 1;
      return b.peakActivity - a.peakActivity;
    });
  } catch (error) {
    console.error('Error analyzing seasonal patterns:', error);
    // Fallback to simplified seasonal data
    return getFallbackSeasonalData();
  }
}

/**
 * Fallback seasonal data when histogram API fails or in development
 */
function getFallbackSeasonalData(): SeasonalInfo[] {
  const currentMonth = new Date().getMonth();
  let currentSeason: 'spring' | 'summer' | 'fall' | 'winter';
  if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'spring';
  else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'summer';
  else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'fall';
  else currentSeason = 'winter';

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
    const bestSeasons = await analyzeSeasonalPatterns(placeId, placeName, client);

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

  // Use getNearbyPlaces to get places actually near the user's coordinates
  console.log(`🔍 Searching for places near (${userCoordinates.lat}, ${userCoordinates.lng}) within ${maxDistance}km`);

  let allPlaces: Array<{ id: number; name: string; displayName: string; bbox: number[][] }> = [];

  try {
    const response = await client.getNearbyPlaces(userCoordinates.lat, userCoordinates.lng, { per_page: 30 });
    console.log(`  📍 Found ${response.results.standard.length} standard places and ${response.results.community.length} community places nearby`);

    // Combine standard and community places, prioritize standard (better maintained)
    const nearbyPlaces = [
      ...response.results.standard.map(p => ({ ...p, type: 'standard' as const })),
      ...response.results.community.map(p => ({ ...p, type: 'community' as const }))
    ].slice(0, 20); // Limit to 20 places max for performance

    // Fetch place details in batches of 5 for better performance
    const batchSize = 5;
    const placeDetails: Array<{ id: number; name: string; displayName: string; bbox: number[][] } | null> = [];

    for (let i = 0; i < nearbyPlaces.length; i += batchSize) {
      const batch = nearbyPlaces.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (place) => {
          try {
            const details = await client.getPlace(place.id);
            if (details.bounding_box_geojson?.coordinates?.[0]) {
              const bbox = details.bounding_box_geojson.coordinates[0];
              const center = calculateCenterFromBbox(bbox);
              const distance = calculateDistance(
                userCoordinates.lat,
                userCoordinates.lng,
                center.lat,
                center.lng
              );

              console.log(`    - ${place.display_name}: ${distance.toFixed(1)}km away (${distance <= maxDistance ? 'INCLUDED' : 'TOO FAR'})`);

              if (distance <= maxDistance) {
                return {
                  id: place.id,
                  name: place.name,
                  displayName: place.display_name,
                  bbox,
                };
              }
            } else {
              console.log(`    - ${place.display_name}: NO BBOX (skipped)`);
            }
          } catch (error) {
            console.error(`Failed to fetch details for place ${place.id}:`, error);
          }
          return null;
        })
      );
      placeDetails.push(...batchResults);

      // Early exit if we already have 10+ valid places
      const validCount = placeDetails.filter(p => p !== null).length;
      if (validCount >= 10) {
        console.log(`⚡ Early exit: Found ${validCount} valid places`);
        break;
      }
    }

    allPlaces = placeDetails.filter((p): p is NonNullable<typeof p> => p !== null);
  } catch (error) {
    console.error(`❌ getNearbyPlaces failed:`, error);
  }

  // Deduplicate by place ID (shouldn't be needed but just in case)
  const uniquePlaces = Array.from(
    new Map(allPlaces.map(p => [p.id, p])).values()
  ).slice(0, 10); // Limit to top 10

  console.log(`Found ${uniquePlaces.length} unique places within ${maxDistance} km`);

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
  console.log('🔍 getUserCoordinates called for userId:', userId);

  const recentObservation = await prisma.observation.findFirst({
    where: {
      userId,
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { observedOn: 'desc' },
    select: { latitude: true, longitude: true },
  });

  console.log('🔍 Found recent observation:', recentObservation);

  if (recentObservation?.latitude && recentObservation?.longitude) {
    const coords = {
      lat: recentObservation.latitude,
      lng: recentObservation.longitude,
    };
    console.log('✅ Returning coordinates:', coords);
    return coords;
  }

  console.log('❌ No observations with coordinates found');
  return null;
}
