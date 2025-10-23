import { BadgeDefinition, BadgeCategory } from '@/types';

/**
 * Badge definitions for BioQuest
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ============================================================================
  // MILESTONE BADGES
  // ============================================================================
  {
    code: 'first_steps',
    name: 'First Steps',
    description: 'Made your first observation',
    category: 'milestone',
    tier: 'bronze',
    criteria: { minObservations: 1 },
    isSecret: false,
  },
  {
    code: 'century_club',
    name: 'Century Club',
    description: 'Recorded 100 observations',
    category: 'milestone',
    tier: 'silver',
    criteria: { minObservations: 100 },
    isSecret: false,
  },
  {
    code: 'thousand_eyes',
    name: 'Thousand Eyes',
    description: 'Recorded 1,000 observations',
    category: 'milestone',
    tier: 'gold',
    criteria: { minObservations: 1000 },
    isSecret: false,
  },
  {
    code: 'ten_thousand_strong',
    name: 'Ten Thousand Strong',
    description: 'Recorded 10,000 observations',
    category: 'milestone',
    tier: 'platinum',
    criteria: { minObservations: 10000 },
    isSecret: false,
  },

  // ============================================================================
  // TAXON EXPLORER BADGES
  // ============================================================================
  {
    code: 'bird_watcher',
    name: 'Bird Watcher',
    description: 'Observed 50 bird species',
    category: 'taxon',
    tier: 'bronze',
    criteria: { iconicTaxon: 'Aves', minSpecies: 50 },
    isSecret: false,
  },
  {
    code: 'ornithologist',
    name: 'Ornithologist',
    description: 'Observed 200 bird species',
    category: 'taxon',
    tier: 'gold',
    criteria: { iconicTaxon: 'Aves', minSpecies: 200 },
    isSecret: false,
  },
  {
    code: 'botanist',
    name: 'Botanist',
    description: 'Observed 100 plant species',
    category: 'taxon',
    tier: 'silver',
    criteria: { iconicTaxon: 'Plantae', minSpecies: 100 },
    isSecret: false,
  },
  {
    code: 'master_botanist',
    name: 'Master Botanist',
    description: 'Observed 500 plant species',
    category: 'taxon',
    tier: 'platinum',
    criteria: { iconicTaxon: 'Plantae', minSpecies: 500 },
    isSecret: false,
  },
  {
    code: 'entomologist',
    name: 'Entomologist',
    description: 'Observed 100 insect species',
    category: 'taxon',
    tier: 'silver',
    criteria: { iconicTaxon: 'Insecta', minSpecies: 100 },
    isSecret: false,
  },
  {
    code: 'bug_master',
    name: 'Bug Master',
    description: 'Observed 500 insect species',
    category: 'taxon',
    tier: 'platinum',
    criteria: { iconicTaxon: 'Insecta', minSpecies: 500 },
    isSecret: false,
  },
  {
    code: 'fungal_friend',
    name: 'Fungal Friend',
    description: 'Observed 50 fungi species',
    category: 'taxon',
    tier: 'silver',
    criteria: { iconicTaxon: 'Fungi', minSpecies: 50 },
    isSecret: false,
  },
  {
    code: 'mammal_tracker',
    name: 'Mammal Tracker',
    description: 'Observed 30 mammal species',
    category: 'taxon',
    tier: 'silver',
    criteria: { iconicTaxon: 'Mammalia', minSpecies: 30 },
    isSecret: false,
  },

  // ============================================================================
  // RARITY BADGES
  // ============================================================================
  {
    code: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Found your first rare species',
    category: 'rarity',
    tier: 'bronze',
    criteria: { minRareObservations: 1 },
    isSecret: false,
  },
  {
    code: 'rare_collector',
    name: 'Rare Collector',
    description: 'Found 10 rare species',
    category: 'rarity',
    tier: 'silver',
    criteria: { minRareObservations: 10 },
    isSecret: false,
  },
  {
    code: 'legendary_finder',
    name: 'Legendary Finder',
    description: 'Found your first legendary species',
    category: 'rarity',
    tier: 'gold',
    criteria: { minLegendaryObservations: 1 },
    isSecret: false,
  },
  {
    code: 'mythic_naturalist',
    name: 'Mythic Naturalist',
    description: 'Found 10 legendary species',
    category: 'rarity',
    tier: 'platinum',
    criteria: { minLegendaryObservations: 10 },
    isSecret: false,
  },
  {
    code: 'first_contact',
    name: 'First Contact',
    description: 'Made the first iNaturalist observation of a species',
    category: 'rarity',
    tier: 'platinum',
    criteria: { hasFirstGlobalObservation: true },
    isSecret: false,
  },

  // ============================================================================
  // GEOGRAPHY BADGES
  // ============================================================================
  {
    code: 'local_expert',
    name: 'Local Expert',
    description: 'Made 100 observations in your home location',
    category: 'geography',
    tier: 'bronze',
    criteria: { minObservationsInPlace: 100 },
    isSecret: false,
  },
  {
    code: 'explorer',
    name: 'Explorer',
    description: 'Observed species in 5 different locations',
    category: 'geography',
    tier: 'silver',
    criteria: { minUniqueLocations: 5 },
    isSecret: false,
  },
  {
    code: 'globetrotter',
    name: 'Globetrotter',
    description: 'Observed species in 3 different countries',
    category: 'geography',
    tier: 'gold',
    criteria: { minCountries: 3 },
    isSecret: false,
  },

  // ============================================================================
  // TIME/SEASONAL BADGES
  // ============================================================================
  {
    code: 'early_bird',
    name: 'Early Bird',
    description: 'Made observations before 6 AM',
    category: 'time',
    tier: 'bronze',
    criteria: { hasEarlyMorningObservation: true },
    isSecret: false,
  },
  {
    code: 'night_owl',
    name: 'Night Owl',
    description: 'Made observations after 10 PM',
    category: 'time',
    tier: 'bronze',
    criteria: { hasNightObservation: true },
    isSecret: false,
  },
  {
    code: 'daily_naturalist',
    name: 'Daily Naturalist',
    description: 'Observed for 7 days in a row',
    category: 'time',
    tier: 'silver',
    criteria: { minStreak: 7 },
    isSecret: false,
  },
  {
    code: 'dedicated_observer',
    name: 'Dedicated Observer',
    description: 'Observed for 30 days in a row',
    category: 'time',
    tier: 'gold',
    criteria: { minStreak: 30 },
    isSecret: false,
  },
  {
    code: 'all_seasons',
    name: 'All Seasons',
    description: 'Made observations in all four seasons',
    category: 'time',
    tier: 'gold',
    criteria: { hasAllSeasons: true },
    isSecret: false,
  },

  // ============================================================================
  // SECRET BADGES
  // ============================================================================
  {
    code: 'photogenic',
    name: 'Photogenic',
    description: 'Uploaded an observation with 10+ photos',
    category: 'secret',
    criteria: { minPhotosInOneObservation: 10 },
    isSecret: true,
  },
  {
    code: 'quality_seeker',
    name: 'Quality Seeker',
    description: 'Achieved Research Grade on 50 observations',
    category: 'secret',
    criteria: { minResearchGradeObservations: 50 },
    isSecret: true,
  },
  {
    code: 'taxonomist',
    name: 'Taxonomist',
    description: 'Observed species from 10 different phyla',
    category: 'secret',
    tier: 'platinum',
    criteria: { minPhyla: 10 },
    isSecret: true,
  },
];

/**
 * Get badge by code
 */
export function getBadgeByCode(code: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(b => b.code === code);
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(b => b.category === category);
}

/**
 * Get total badge count
 */
export function getTotalBadgeCount(): number {
  return BADGE_DEFINITIONS.length;
}
