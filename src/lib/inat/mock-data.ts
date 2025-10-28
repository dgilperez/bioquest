/**
 * Mock data generator for development when iNaturalist OAuth is not yet approved
 */

import { QualityGrade, Rarity } from '@prisma/client';

const SPECIES_NAMES = [
  'Quercus robur', 'Parus major', 'Vulpes vulpes', 'Sciurus vulgaris',
  'Corvus corax', 'Buteo buteo', 'Apodemus sylvaticus', 'Fagus sylvatica',
  'Pinus sylvestris', 'Canis lupus', 'Lynx lynx', 'Ursus arctos',
  'Aquila chrysaetos', 'Strix aluco', 'Bufo bufo', 'Rana temporaria',
  'Salamandra salamandra', 'Lacerta agilis', 'Natrix natrix', 'Vipera berus',
  'Amanita muscaria', 'Boletus edulis', 'Cantharellus cibarius', 'Macrolepiota procera',
  'Apis mellifera', 'Bombus terrestris', 'Pieris rapae', 'Aglais urticae',
  'Lucanus cervus', 'Coccinella septempunctata'
];

const COMMON_NAMES = [
  'European Oak', 'Great Tit', 'Red Fox', 'Red Squirrel',
  'Common Raven', 'Common Buzzard', 'Wood Mouse', 'European Beech',
  'Scots Pine', 'Gray Wolf', 'Eurasian Lynx', 'Brown Bear',
  'Golden Eagle', 'Tawny Owl', 'Common Toad', 'Common Frog',
  'Fire Salamander', 'Sand Lizard', 'Grass Snake', 'Common Adder',
  'Fly Agaric', 'Porcini', 'Chanterelle', 'Parasol Mushroom',
  'Western Honey Bee', 'Buff-tailed Bumblebee', 'Small White', 'Small Tortoiseshell',
  'Stag Beetle', 'Seven-spot Ladybird'
];

const ICONIC_TAXA = [
  'Plantae', 'Aves', 'Mammalia', 'Mammalia',
  'Aves', 'Aves', 'Mammalia', 'Plantae',
  'Plantae', 'Mammalia', 'Mammalia', 'Mammalia',
  'Aves', 'Aves', 'Amphibia', 'Amphibia',
  'Amphibia', 'Reptilia', 'Reptilia', 'Reptilia',
  'Fungi', 'Fungi', 'Fungi', 'Fungi',
  'Insecta', 'Insecta', 'Insecta', 'Insecta',
  'Insecta', 'Insecta'
];

const PLACES = [
  'Central Park, New York',
  'Hyde Park, London',
  'Black Forest, Germany',
  'Scottish Highlands',
  'Yellowstone National Park',
  'Amazon Rainforest',
  'Serengeti National Park',
  'Great Barrier Reef',
  'Galápagos Islands',
  'Madagascar'
];

/**
 * Generate mock observations for a user
 */
export function generateMockObservations(count: number = 50) {
  const observations = [];
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const speciesIndex = Math.floor(Math.random() * SPECIES_NAMES.length);
    const observedDate = new Date(now - Math.random() * oneYear);
    const photosCount = Math.floor(Math.random() * 5);

    // Determine quality grade (80% research, 15% needs_id, 5% casual)
    let qualityGrade: QualityGrade;
    const qualityRoll = Math.random();
    if (qualityRoll < 0.80) {
      qualityGrade = 'research';
    } else if (qualityRoll < 0.95) {
      qualityGrade = 'needs_id';
    } else {
      qualityGrade = 'casual';
    }

    // Determine rarity (70% common, 25% rare, 5% legendary)
    let rarity: Rarity;
    let globalCount: number;
    let regionalCount: number;
    const rarityRoll = Math.random();
    if (rarityRoll < 0.70) {
      rarity = 'common';
      globalCount = Math.floor(Math.random() * 10000) + 1000;
      regionalCount = Math.floor(Math.random() * 1000) + 100;
    } else if (rarityRoll < 0.95) {
      rarity = 'rare';
      globalCount = Math.floor(Math.random() * 900) + 100;
      regionalCount = Math.floor(Math.random() * 90) + 10;
    } else {
      rarity = 'legendary';
      globalCount = Math.floor(Math.random() * 100);
      regionalCount = Math.floor(Math.random() * 10);
    }

    observations.push({
      id: 1000000 + i, // Mock observation IDs
      speciesGuess: SPECIES_NAMES[speciesIndex],
      taxonId: 100000 + speciesIndex,
      taxonName: SPECIES_NAMES[speciesIndex],
      taxonRank: 'species',
      commonName: COMMON_NAMES[speciesIndex],
      observedOn: observedDate,
      qualityGrade,
      photosCount,
      location: PLACES[Math.floor(Math.random() * PLACES.length)],
      placeGuess: PLACES[Math.floor(Math.random() * PLACES.length)],
      iconicTaxon: ICONIC_TAXA[speciesIndex],
      rarity,
      globalCount,
      regionalCount,
      isFirstGlobal: rarity === 'legendary' && globalCount === 0,
      isFirstRegional: rarity === 'legendary' && regionalCount === 0,
      pointsAwarded: 0, // Will be calculated by the points system
    });
  }

  return observations;
}

/**
 * Get mock user info
 */
export function getMockUserInfo(username: string) {
  return {
    id: 999999,
    login: username,
    name: `${username} (Mock User)`,
    icon: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
    observations_count: 50,
    identifications_count: 20,
    journal_posts_count: 5,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Get mock species count
 */
export function getMockSpeciesCount() {
  // Return unique species from our mock data
  return SPECIES_NAMES.length;
}

/**
 * Generate mock API response format
 */
export function formatMockObservationsResponse(observations: any[]) {
  return {
    total_results: observations.length,
    page: 1,
    per_page: observations.length,
    results: observations.map(obs => ({
      id: obs.id,
      species_guess: obs.speciesGuess,
      taxon: {
        id: obs.taxonId,
        name: obs.taxonName,
        rank: obs.taxonRank,
        preferred_common_name: obs.commonName,
        iconic_taxon_name: obs.iconicTaxon,
      },
      observed_on: obs.observedOn.toISOString().split('T')[0],
      quality_grade: obs.qualityGrade,
      photos: Array(obs.photosCount).fill(null).map((_, i) => ({
        id: obs.id * 10 + i,
        url: `https://picsum.photos/400/300?random=${obs.id + i}`,
      })),
      place_guess: obs.placeGuess,
      location: obs.location,
    })),
  };
}
