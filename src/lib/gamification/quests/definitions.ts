import { QuestType } from '@/types';

export interface QuestDefinition {
  code: string;
  title: string;
  description: string;
  type: QuestType;
  durationDays: number;
  criteria: {
    type: 'observation_count' | 'species_count' | 'taxon_observation' | 'quality_grade' | 'photo_count' | 'location_variety';
    target: number;
    taxonFilter?: string; // e.g., "Aves", "Plantae", "Insecta"
    qualityGrade?: 'research' | 'needs_id';
    minPhotos?: number;
    uniqueLocations?: number;
  };
  reward: {
    points: number;
    badge?: string;
  };
}

/**
 * Daily Quest Definitions
 * Refreshed every day at midnight UTC
 */
export const DAILY_QUEST_POOL: QuestDefinition[] = [
  {
    code: 'daily_three_observations',
    title: 'Daily Observer',
    description: 'Record 3 observations today',
    type: 'daily',
    durationDays: 1,
    criteria: {
      type: 'observation_count',
      target: 3,
    },
    reward: {
      points: 50,
    },
  },
  {
    code: 'daily_new_species',
    title: 'Species Hunter',
    description: 'Find a new species you haven\'t observed before',
    type: 'daily',
    durationDays: 1,
    criteria: {
      type: 'species_count',
      target: 1,
    },
    reward: {
      points: 100,
    },
  },
  {
    code: 'daily_birds',
    title: 'Bird Watcher',
    description: 'Observe 2 bird species today',
    type: 'daily',
    durationDays: 1,
    criteria: {
      type: 'taxon_observation',
      target: 2,
      taxonFilter: 'Aves',
    },
    reward: {
      points: 75,
    },
  },
  {
    code: 'daily_plants',
    title: 'Botanist',
    description: 'Document 3 plant observations',
    type: 'daily',
    durationDays: 1,
    criteria: {
      type: 'taxon_observation',
      target: 3,
      taxonFilter: 'Plantae',
    },
    reward: {
      points: 75,
    },
  },
  {
    code: 'daily_quality',
    title: 'Quality Observer',
    description: 'Make 1 research-grade observation',
    type: 'daily',
    durationDays: 1,
    criteria: {
      type: 'quality_grade',
      target: 1,
      qualityGrade: 'research',
    },
    reward: {
      points: 100,
    },
  },
  {
    code: 'daily_photographer',
    title: 'Shutterbug',
    description: 'Upload observations with at least 3 photos each (2 observations)',
    type: 'daily',
    durationDays: 1,
    criteria: {
      type: 'photo_count',
      target: 2,
      minPhotos: 3,
    },
    reward: {
      points: 80,
    },
  },
];

/**
 * Weekly Quest Definitions
 * Refreshed every Monday at midnight UTC
 */
export const WEEKLY_QUEST_POOL: QuestDefinition[] = [
  {
    code: 'weekly_twenty_observations',
    title: 'Active Week',
    description: 'Record 20 observations this week',
    type: 'weekly',
    durationDays: 7,
    criteria: {
      type: 'observation_count',
      target: 20,
    },
    reward: {
      points: 300,
    },
  },
  {
    code: 'weekly_ten_species',
    title: 'Diversity Seeker',
    description: 'Find 10 different species this week',
    type: 'weekly',
    durationDays: 7,
    criteria: {
      type: 'species_count',
      target: 10,
    },
    reward: {
      points: 400,
    },
  },
  {
    code: 'weekly_insects',
    title: 'Entomologist',
    description: 'Observe 15 insect specimens',
    type: 'weekly',
    durationDays: 7,
    criteria: {
      type: 'taxon_observation',
      target: 15,
      taxonFilter: 'Insecta',
    },
    reward: {
      points: 350,
    },
  },
  {
    code: 'weekly_research_grade',
    title: 'Research Contributor',
    description: 'Achieve 5 research-grade observations',
    type: 'weekly',
    durationDays: 7,
    criteria: {
      type: 'quality_grade',
      target: 5,
      qualityGrade: 'research',
    },
    reward: {
      points: 500,
    },
  },
  {
    code: 'weekly_explorer',
    title: 'Local Explorer',
    description: 'Observe species in 5 different locations',
    type: 'weekly',
    durationDays: 7,
    criteria: {
      type: 'location_variety',
      target: 5,
      uniqueLocations: 5,
    },
    reward: {
      points: 400,
    },
  },
  {
    code: 'weekly_fungi',
    title: 'Mycologist',
    description: 'Document 10 fungi observations',
    type: 'weekly',
    durationDays: 7,
    criteria: {
      type: 'taxon_observation',
      target: 10,
      taxonFilter: 'Fungi',
    },
    reward: {
      points: 350,
    },
  },
];

/**
 * Monthly Quest Definitions
 * Refreshed on the 1st of each month at midnight UTC
 */
export const MONTHLY_QUEST_POOL: QuestDefinition[] = [
  {
    code: 'monthly_hundred_observations',
    title: 'Century Naturalist',
    description: 'Record 100 observations this month',
    type: 'monthly',
    durationDays: 30,
    criteria: {
      type: 'observation_count',
      target: 100,
    },
    reward: {
      points: 1500,
    },
  },
  {
    code: 'monthly_fifty_species',
    title: 'Biodiversity Champion',
    description: 'Find 50 different species this month',
    type: 'monthly',
    durationDays: 30,
    criteria: {
      type: 'species_count',
      target: 50,
    },
    reward: {
      points: 2000,
    },
  },
  {
    code: 'monthly_all_kingdoms',
    title: 'Life Explorer',
    description: 'Observe species from 4 different kingdoms (Animalia, Plantae, Fungi, Chromista)',
    type: 'monthly',
    durationDays: 30,
    criteria: {
      type: 'taxon_observation',
      target: 4,
      taxonFilter: 'kingdom_diversity',
    },
    reward: {
      points: 1800,
      badge: 'life_explorer',
    },
  },
  {
    code: 'monthly_research_master',
    title: 'Research Master',
    description: 'Achieve 25 research-grade observations',
    type: 'monthly',
    durationDays: 30,
    criteria: {
      type: 'quality_grade',
      target: 25,
      qualityGrade: 'research',
    },
    reward: {
      points: 2500,
    },
  },
  {
    code: 'monthly_location_master',
    title: 'Geographic Explorer',
    description: 'Observe species in 15 different locations',
    type: 'monthly',
    durationDays: 30,
    criteria: {
      type: 'location_variety',
      target: 15,
      uniqueLocations: 15,
    },
    reward: {
      points: 1800,
    },
  },
];

/**
 * Get a random daily quest
 */
export function getRandomDailyQuest(): QuestDefinition {
  const index = Math.floor(Math.random() * DAILY_QUEST_POOL.length);
  return DAILY_QUEST_POOL[index];
}

/**
 * Get multiple random daily quests (non-repeating)
 */
export function getRandomDailyQuests(count: number): QuestDefinition[] {
  const shuffled = [...DAILY_QUEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, DAILY_QUEST_POOL.length));
}

/**
 * Get a random weekly quest
 */
export function getRandomWeeklyQuest(): QuestDefinition {
  const index = Math.floor(Math.random() * WEEKLY_QUEST_POOL.length);
  return WEEKLY_QUEST_POOL[index];
}

/**
 * Get multiple random weekly quests (non-repeating)
 */
export function getRandomWeeklyQuests(count: number): QuestDefinition[] {
  const shuffled = [...WEEKLY_QUEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, WEEKLY_QUEST_POOL.length));
}

/**
 * Get a random monthly quest
 */
export function getRandomMonthlyQuest(): QuestDefinition {
  const index = Math.floor(Math.random() * MONTHLY_QUEST_POOL.length);
  return MONTHLY_QUEST_POOL[index];
}

/**
 * Get multiple random monthly quests (non-repeating)
 */
export function getRandomMonthlyQuests(count: number): QuestDefinition[] {
  const shuffled = [...MONTHLY_QUEST_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, MONTHLY_QUEST_POOL.length));
}
