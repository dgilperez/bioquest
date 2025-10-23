/**
 * Core type definitions for BioQuest
 */

// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
  id: string;
  inatId: number;
  inatUsername: string;
  name?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// iNaturalist Data Types
// ============================================================================

export interface INatObservation {
  id: number;
  species_guess?: string;
  taxon?: INatTaxon;
  observed_on: string;
  created_at: string;
  updated_at: string;
  quality_grade: 'research' | 'needs_id' | 'casual';
  user: {
    id: number;
    login: string;
    name?: string;
  };
  photos?: Array<{
    id: number;
    url: string;
    attribution?: string;
    license_code?: string;
  }>;
  place_guess?: string;
  location?: string; // lat,lon
}

export interface INatTaxon {
  id: number;
  name: string;
  rank: string;
  rank_level: number;
  preferred_common_name?: string;
  observations_count?: number;
  iconic_taxon_name?: string;
  ancestor_ids?: number[];
  ancestry?: string;
}

// ============================================================================
// Gamification Types
// ============================================================================

export type Rarity = 'normal' | 'rare' | 'legendary';
export type RarityLevel = 'normal' | 'rare' | 'legendary';

export interface ObservationRarity {
  observationId: number;
  rarity: RarityLevel;
  globalCount: number;
  regionalCount?: number;
  isFirstGlobal?: boolean;
  isFirstRegional?: boolean;
}

export interface UserStats {
  userId: string;
  totalObservations: number;
  totalSpecies: number;
  totalPoints: number;
  level: number;
  pointsToNextLevel: number;
  rareObservations: number;
  legendaryObservations: number;
  updatedAt: Date;
}

export type BadgeCategory =
  | 'milestone'
  | 'taxon'
  | 'rarity'
  | 'geography'
  | 'time'
  | 'challenge'
  | 'secret';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  category: BadgeCategory;
  iconUrl: string | null;
  tier: BadgeTier | null;
  criteria: Record<string, unknown>; // Badge-specific criteria
  isSecret: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  category: BadgeCategory;
  iconUrl?: string;
  tier?: BadgeTier;
  criteria: Record<string, unknown>; // Badge-specific criteria
  isSecret: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  unlockedAt: Date;
  progress?: number; // 0-100 for multi-tier badges
}

export type QuestType = 'daily' | 'weekly' | 'monthly' | 'personal';
export type QuestStatus = 'active' | 'completed' | 'expired';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  startDate: Date;
  endDate: Date;
  criteria: Record<string, unknown>; // Quest-specific criteria
  reward: {
    points?: number;
    badge?: string;
  };
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  quest: Quest;
  status: QuestStatus;
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// Points & Leveling
// ============================================================================

export interface PointsCalculation {
  basePoints: number;
  bonusPoints: {
    newSpecies?: number;
    rarity?: number;
    researchGrade?: number;
    photos?: number;
  };
  totalPoints: number;
}

export interface LevelConfig {
  level: number;
  pointsRequired: number;
  title: string;
}

// ============================================================================
// Analytics & Stats
// ============================================================================

export interface TaxonomicBreakdown {
  kingdom?: Record<string, number>;
  phylum?: Record<string, number>;
  class?: Record<string, number>;
  order?: Record<string, number>;
  family?: Record<string, number>;
}

export interface GeographicStats {
  countries: string[];
  totalLocations: number;
  favoriteLocation?: {
    name: string;
    observationCount: number;
  };
}

export interface TimeStats {
  observationsByMonth: Record<string, number>;
  observationsByDayOfWeek: Record<string, number>;
  longestStreak: number;
  currentStreak: number;
}
