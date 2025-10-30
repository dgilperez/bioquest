import { prisma } from '@/lib/db/prisma';
import { Quest } from '@/types';
import { QualityGrade } from '@prisma/client';

/**
 * Strategy interface for quest progress calculation
 */
export interface QuestProgressCalculator {
  /**
   * Calculate progress for a group of quests of the same criteria type
   * @returns Map of questId -> progress percentage (0-100)
   */
  calculateBatch(
    userId: string,
    quests: Quest[],
    earliestStartDate: Date
  ): Promise<Map<string, number>>;
}

/**
 * Helper to calculate progress percentage
 */
function calculateProgressPercent(current: number, target: number): number {
  return Math.min(100, Math.floor((current / target) * 100));
}

/**
 * Calculator for observation count quests
 */
export class ObservationCountCalculator implements QuestProgressCalculator {
  async calculateBatch(
    userId: string,
    quests: Quest[],
    earliestStartDate: Date
  ): Promise<Map<string, number>> {
    const totalCount = await prisma.observation.count({
      where: {
        userId,
        createdAt: { gte: earliestStartDate },
      },
    });

    const progressMap = new Map<string, number>();
    for (const quest of quests) {
      const criteria = quest.criteria as any;
      progressMap.set(quest.id, calculateProgressPercent(totalCount, criteria.target));
    }

    return progressMap;
  }
}

/**
 * Calculator for species count quests
 */
export class SpeciesCountCalculator implements QuestProgressCalculator {
  async calculateBatch(
    userId: string,
    quests: Quest[],
    earliestStartDate: Date
  ): Promise<Map<string, number>> {
    const observations = await prisma.observation.findMany({
      where: {
        userId,
        createdAt: { gte: earliestStartDate },
        taxonId: { not: null },
      },
      select: { taxonId: true },
      distinct: ['taxonId'],
    });

    const uniqueSpecies = observations.length;
    const progressMap = new Map<string, number>();

    for (const quest of quests) {
      const criteria = quest.criteria as any;
      progressMap.set(quest.id, calculateProgressPercent(uniqueSpecies, criteria.target));
    }

    return progressMap;
  }
}

/**
 * Calculator for taxon observation quests (e.g., "observe 5 birds")
 */
export class TaxonObservationCalculator implements QuestProgressCalculator {
  async calculateBatch(
    userId: string,
    quests: Quest[],
    earliestStartDate: Date
  ): Promise<Map<string, number>> {
    const progressMap = new Map<string, number>();

    // Group quests by taxon filter to minimize queries
    const questsByFilter = new Map<string, Quest[]>();
    for (const quest of quests) {
      const filter = (quest.criteria as any).taxonFilter;
      if (!questsByFilter.has(filter)) {
        questsByFilter.set(filter, []);
      }
      questsByFilter.get(filter)!.push(quest);
    }

    // Query once per unique filter
    for (const [filter, filterQuests] of Array.from(questsByFilter.entries())) {
      const count = await prisma.observation.count({
        where: {
          userId,
          createdAt: { gte: earliestStartDate },
          taxonName: { contains: filter },
        },
      });

      for (const quest of filterQuests) {
        const criteria = quest.criteria as any;
        progressMap.set(quest.id, calculateProgressPercent(count, criteria.target));
      }
    }

    return progressMap;
  }
}

/**
 * Calculator for quality grade quests (e.g., "get 5 research grade observations")
 */
export class QualityGradeCalculator implements QuestProgressCalculator {
  async calculateBatch(
    userId: string,
    quests: Quest[],
    earliestStartDate: Date
  ): Promise<Map<string, number>> {
    const progressMap = new Map<string, number>();

    // Group quests by quality grade
    const questsByGrade = new Map<string, Quest[]>();
    for (const quest of quests) {
      const grade = (quest.criteria as any).qualityGrade;
      if (!questsByGrade.has(grade)) {
        questsByGrade.set(grade, []);
      }
      questsByGrade.get(grade)!.push(quest);
    }

    // Query once per unique grade
    for (const [grade, gradeQuests] of Array.from(questsByGrade.entries())) {
      const count = await prisma.observation.count({
        where: {
          userId,
          createdAt: { gte: earliestStartDate },
          qualityGrade: grade as QualityGrade,
        },
      });

      for (const quest of gradeQuests) {
        const criteria = quest.criteria as any;
        progressMap.set(quest.id, calculateProgressPercent(count, criteria.target));
      }
    }

    return progressMap;
  }
}

/**
 * Calculator for location variety quests (e.g., "observe in 3 different locations")
 */
export class LocationVarietyCalculator implements QuestProgressCalculator {
  async calculateBatch(
    userId: string,
    quests: Quest[],
    earliestStartDate: Date
  ): Promise<Map<string, number>> {
    const observations = await prisma.observation.findMany({
      where: {
        userId,
        createdAt: { gte: earliestStartDate },
        placeGuess: { not: null },
      },
      select: { placeGuess: true },
      distinct: ['placeGuess'],
    });

    const uniqueLocations = observations.length;
    const progressMap = new Map<string, number>();

    for (const quest of quests) {
      const criteria = quest.criteria as any;
      progressMap.set(quest.id, calculateProgressPercent(uniqueLocations, criteria.target));
    }

    return progressMap;
  }
}

/**
 * Calculator for photo count quests (e.g., "upload 10 observations with 3+ photos")
 */
export class PhotoCountCalculator implements QuestProgressCalculator {
  async calculateBatch(
    userId: string,
    quests: Quest[],
    earliestStartDate: Date
  ): Promise<Map<string, number>> {
    const observations = await prisma.observation.findMany({
      where: {
        userId,
        createdAt: { gte: earliestStartDate },
      },
      select: { photosCount: true },
    });

    const progressMap = new Map<string, number>();

    for (const quest of quests) {
      const criteria = quest.criteria as any;
      const minPhotos = criteria.minPhotos || 1;
      const qualifyingObs = observations.filter(o => (o.photosCount || 0) >= minPhotos);
      progressMap.set(quest.id, calculateProgressPercent(qualifyingObs.length, criteria.target));
    }

    return progressMap;
  }
}

/**
 * Registry of progress calculators by criteria type
 */
export const PROGRESS_CALCULATORS: Record<string, QuestProgressCalculator> = {
  observation_count: new ObservationCountCalculator(),
  species_count: new SpeciesCountCalculator(),
  taxon_observation: new TaxonObservationCalculator(),
  quality_grade: new QualityGradeCalculator(),
  location_variety: new LocationVarietyCalculator(),
  photo_count: new PhotoCountCalculator(),
};

/**
 * Get calculator for a criteria type, with fallback
 */
export function getCalculator(criteriaType: string): QuestProgressCalculator | null {
  return PROGRESS_CALCULATORS[criteriaType] || null;
}
