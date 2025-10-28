import { LocationRecommendation } from './recommendations-optimized';

/**
 * Generate seasonal data using current month logic
 */
function generateSeasonalData() {
  const currentMonth = new Date().getMonth();
  let currentSeason: 'spring' | 'summer' | 'fall' | 'winter';

  if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'spring';
  else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'summer';
  else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'fall';
  else currentSeason = 'winter';

  const patterns = {
    spring: {
      season: 'spring' as const,
      months: 'March-May',
      peakActivity: 85,
      topTaxa: ['Plantae', 'Aves', 'Insecta'],
      recommendation: 'Peak time for wildflowers, migratory birds, and emerging insects',
    },
    summer: {
      season: 'summer' as const,
      months: 'June-August',
      peakActivity: 75,
      topTaxa: ['Insecta', 'Plantae', 'Aves'],
      recommendation: 'Great for butterflies, summer wildflowers, and resident birds',
    },
    fall: {
      season: 'fall' as const,
      months: 'September-November',
      peakActivity: 70,
      topTaxa: ['Aves', 'Fungi', 'Plantae'],
      recommendation: 'Excellent for fall migrants, mushrooms, and autumn foliage',
    },
    winter: {
      season: 'winter' as const,
      months: 'December-February',
      peakActivity: 45,
      topTaxa: ['Aves', 'Mammalia', 'Fungi'],
      recommendation: 'Good for wintering birds, mammals, and mushrooms',
    },
  };

  const result = [patterns[currentSeason]];
  const others = (['spring', 'summer', 'fall', 'winter'] as const).filter(s => s !== currentSeason);
  others.forEach(s => result.push(patterns[s]));

  return result;
}

const seasonalData = generateSeasonalData();

/**
 * Mock location recommendations for development
 */
export const MOCK_RECOMMENDATIONS: LocationRecommendation[] = [
  {
    placeId: 97394,
    placeName: 'Muir Woods National Monument',
    displayName: 'Muir Woods National Monument, California, US',
    distance: 23,
    coordinates: { lat: 37.8963, lng: -122.5809 },
    score: 92,
    newSpeciesPossible: 87,
    totalSpeciesAtLocation: 342,
    recentActivity: 'high',
    recentObservationCount: 156,
    strongFor: ['Plantae', 'Aves', 'Fungi'],
    rareSpeciesCounts: {
      mythic: 2,
      legendary: 5,
      epic: 8,
      rare: 12,
    },
    bestSeasons: seasonalData,
    topTargets: [
      {
        taxonId: 51775,
        taxonName: 'Strix occidentalis caurina',
        commonName: 'Northern Spotted Owl',
        iconicTaxon: 'Aves',
        observationCount: 23,
        reason: 'never_seen',
      },
      {
        taxonId: 200215,
        taxonName: 'Ariolimax columbianus',
        commonName: 'Banana Slug',
        iconicTaxon: 'Mollusca',
        observationCount: 89,
        reason: 'never_seen',
      },
      {
        taxonId: 47126,
        taxonName: 'Sequoia sempervirens',
        commonName: 'Coast Redwood',
        iconicTaxon: 'Plantae',
        observationCount: 247,
        reason: 'never_seen',
      },
    ],
  },
  {
    placeId: 1416,
    placeName: 'Point Reyes National Seashore',
    displayName: 'Point Reyes National Seashore, California, US',
    distance: 38,
    coordinates: { lat: 38.0533, lng: -122.8786 },
    score: 88,
    newSpeciesPossible: 123,
    totalSpeciesAtLocation: 589,
    recentActivity: 'high',
    recentObservationCount: 203,
    strongFor: ['Aves', 'Plantae', 'Mammalia'],
    rareSpeciesCounts: {
      mythic: 1,
      legendary: 7,
      epic: 10,
      rare: 18,
    },
    topTargets: [
      {
        taxonId: 40610,
        taxonName: 'Callorhinus ursinus',
        commonName: 'Northern Fur Seal',
        iconicTaxon: 'Mammalia',
        observationCount: 12,
        reason: 'never_seen',
      },
      {
        taxonId: 8899,
        taxonName: 'Phocoena phocoena',
        commonName: 'Harbor Porpoise',
        iconicTaxon: 'Mammalia',
        observationCount: 8,
        reason: 'rare_globally',
      },
      {
        taxonId: 9460,
        taxonName: 'Larus occidentalis',
        commonName: 'Western Gull',
        iconicTaxon: 'Aves',
        observationCount: 142,
        reason: 'never_seen',
      },
    ],
  },
  {
    placeId: 2472,
    placeName: 'Mount Tamalpais State Park',
    displayName: 'Mount Tamalpais State Park, California, US',
    distance: 18,
    coordinates: { lat: 37.9235, lng: -122.5965 },
    score: 85,
    newSpeciesPossible: 76,
    totalSpeciesAtLocation: 412,
    recentActivity: 'medium',
    recentObservationCount: 84,
    strongFor: ['Plantae', 'Insecta', 'Aves'],
    rareSpeciesCounts: {
      mythic: 0,
      legendary: 3,
      epic: 6,
      rare: 14,
    },
    topTargets: [
      {
        taxonId: 144054,
        taxonName: 'Toxostoma redivivum',
        commonName: 'California Thrasher',
        iconicTaxon: 'Aves',
        observationCount: 34,
        reason: 'endemic',
      },
      {
        taxonId: 52653,
        taxonName: 'Aphelocoma californica',
        commonName: 'California Scrub-Jay',
        iconicTaxon: 'Aves',
        observationCount: 127,
        reason: 'never_seen',
      },
      {
        taxonId: 70130,
        taxonName: 'Mimulus aurantiacus',
        commonName: 'Sticky Monkeyflower',
        iconicTaxon: 'Plantae',
        observationCount: 93,
        reason: 'never_seen',
      },
    ],
  },
  {
    placeId: 5723,
    placeName: 'Golden Gate Park',
    displayName: 'Golden Gate Park, San Francisco, California, US',
    distance: 12,
    coordinates: { lat: 37.7694, lng: -122.4862 },
    score: 78,
    newSpeciesPossible: 54,
    totalSpeciesAtLocation: 387,
    recentActivity: 'high',
    recentObservationCount: 312,
    strongFor: ['Plantae', 'Aves', 'Insecta'],
    rareSpeciesCounts: {
      mythic: 0,
      legendary: 2,
      epic: 4,
      rare: 8,
    },
    topTargets: [
      {
        taxonId: 9083,
        taxonName: 'Branta canadensis',
        commonName: 'Canada Goose',
        iconicTaxon: 'Aves',
        observationCount: 198,
        reason: 'never_seen',
      },
      {
        taxonId: 19350,
        taxonName: 'Sciurus carolinensis',
        commonName: 'Eastern Gray Squirrel',
        iconicTaxon: 'Mammalia',
        observationCount: 156,
        reason: 'never_seen',
      },
      {
        taxonId: 56250,
        taxonName: 'Acer palmatum',
        commonName: 'Japanese Maple',
        iconicTaxon: 'Plantae',
        observationCount: 87,
        reason: 'never_seen',
      },
    ],
  },
  {
    placeId: 9032,
    placeName: 'Año Nuevo State Park',
    displayName: 'Año Nuevo State Park, California, US',
    distance: 67,
    coordinates: { lat: 37.1200, lng: -122.3319 },
    score: 75,
    newSpeciesPossible: 92,
    totalSpeciesAtLocation: 278,
    recentActivity: 'medium',
    recentObservationCount: 67,
    strongFor: ['Mammalia', 'Aves', 'Plantae'],
    rareSpeciesCounts: {
      mythic: 1,
      legendary: 4,
      epic: 7,
      rare: 15,
    },
    topTargets: [
      {
        taxonId: 43834,
        taxonName: 'Mirounga angustirostris',
        commonName: 'Northern Elephant Seal',
        iconicTaxon: 'Mammalia',
        observationCount: 145,
        reason: 'never_seen',
      },
      {
        taxonId: 5052,
        taxonName: 'Zalophus californianus',
        commonName: 'California Sea Lion',
        iconicTaxon: 'Mammalia',
        observationCount: 89,
        reason: 'never_seen',
      },
      {
        taxonId: 9487,
        taxonName: 'Pelecanus occidentalis',
        commonName: 'Brown Pelican',
        iconicTaxon: 'Aves',
        observationCount: 56,
        reason: 'never_seen',
      },
    ],
  },
];
