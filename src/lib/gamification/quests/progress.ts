import { prisma } from '@/lib/db/prisma';
import { Quest } from '@/types';
import { QualityGrade } from '@prisma/client';

/**
 * Result of checking quest progress
 */
export interface QuestProgressResult {
  questId: string;
  previousProgress: number;
  newProgress: number;
  isCompleted: boolean;
  isNewlyCompleted: boolean;
  quest: Quest;
}

/**
 * Calculate progress for observation count criteria
 */
async function calculateObservationCountProgress(
  userId: string,
  questStartDate: Date,
  target: number
): Promise<number> {
  const count = await prisma.observation.count({
    where: {
      userId,
      createdAt: {
        gte: questStartDate,
      },
    },
  });

  return Math.min(100, Math.floor((count / target) * 100));
}

/**
 * Calculate progress for species count criteria
 */
async function calculateSpeciesCountProgress(
  userId: string,
  questStartDate: Date,
  target: number
): Promise<number> {
  // Count unique species (taxonId) observed since quest start
  const observations = await prisma.observation.findMany({
    where: {
      userId,
      createdAt: {
        gte: questStartDate,
      },
      taxonId: {
        not: null,
      },
    },
    select: {
      taxonId: true,
    },
    distinct: ['taxonId'],
  });

  const uniqueSpecies = observations.length;
  return Math.min(100, Math.floor((uniqueSpecies / target) * 100));
}

/**
 * Calculate progress for taxon observation criteria
 */
async function calculateTaxonObservationProgress(
  userId: string,
  questStartDate: Date,
  target: number,
  taxonFilter?: string
): Promise<number> {
  if (!taxonFilter) {
    return 0;
  }

  // For kingdom diversity, count unique kingdoms
  if (taxonFilter === 'kingdom_diversity') {
    const observations = await prisma.observation.findMany({
      where: {
        userId,
        createdAt: {
          gte: questStartDate,
        },
        taxonName: {
          not: null,
        },
      },
      select: {
        taxonName: true,
      },
    });

    // Extract unique kingdoms from taxon ancestry
    // This would need proper parsing of the taxon ancestry
    // For now, simplified version
    const uniqueTaxa = new Set(observations.map(o => o.taxonName));
    const progress = Math.min(100, Math.floor((uniqueTaxa.size / target) * 100));
    return progress;
  }

  // Count observations of specific taxon
  // Note: SQLite is case-insensitive by default for LIKE/contains
  const count = await prisma.observation.count({
    where: {
      userId,
      createdAt: {
        gte: questStartDate,
      },
      taxonName: {
        contains: taxonFilter,
      },
    },
  });

  return Math.min(100, Math.floor((count / target) * 100));
}

/**
 * Calculate progress for quality grade criteria
 */
async function calculateQualityGradeProgress(
  userId: string,
  questStartDate: Date,
  target: number,
  qualityGrade?: string
): Promise<number> {
  if (!qualityGrade) {
    return 0;
  }

  const count = await prisma.observation.count({
    where: {
      userId,
      createdAt: {
        gte: questStartDate,
      },
      qualityGrade: qualityGrade as QualityGrade,
    },
  });

  return Math.min(100, Math.floor((count / target) * 100));
}

/**
 * Calculate progress for photo count criteria
 */
async function calculatePhotoCountProgress(
  userId: string,
  questStartDate: Date,
  target: number,
  minPhotos?: number
): Promise<number> {
  if (!minPhotos) {
    return 0;
  }

  // Count observations with at least minPhotos
  const observations = await prisma.observation.findMany({
    where: {
      userId,
      createdAt: {
        gte: questStartDate,
      },
    },
    select: {
      photosCount: true,
    },
  });

  const qualifyingObs = observations.filter(o => (o.photosCount || 0) >= minPhotos);
  return Math.min(100, Math.floor((qualifyingObs.length / target) * 100));
}

/**
 * Calculate progress for location variety criteria
 */
async function calculateLocationVarietyProgress(
  userId: string,
  questStartDate: Date,
  target: number
): Promise<number> {
  // Count unique locations (simplified - based on place_guess)
  const observations = await prisma.observation.findMany({
    where: {
      userId,
      createdAt: {
        gte: questStartDate,
      },
      placeGuess: {
        not: null,
      },
    },
    select: {
      placeGuess: true,
    },
    distinct: ['placeGuess'],
  });

  return Math.min(100, Math.floor((observations.length / target) * 100));
}

/**
 * Calculate progress for a single quest
 */
async function calculateQuestProgress(
  userId: string,
  quest: Quest
): Promise<number> {
  const criteria = quest.criteria as any;

  switch (criteria.type) {
    case 'observation_count':
      return calculateObservationCountProgress(userId, quest.startDate, criteria.target);

    case 'species_count':
      return calculateSpeciesCountProgress(userId, quest.startDate, criteria.target);

    case 'taxon_observation':
      return calculateTaxonObservationProgress(
        userId,
        quest.startDate,
        criteria.target,
        criteria.taxonFilter
      );

    case 'quality_grade':
      return calculateQualityGradeProgress(
        userId,
        quest.startDate,
        criteria.target,
        criteria.qualityGrade
      );

    case 'photo_count':
      return calculatePhotoCountProgress(
        userId,
        quest.startDate,
        criteria.target,
        criteria.minPhotos
      );

    case 'location_variety':
      return calculateLocationVarietyProgress(userId, quest.startDate, criteria.target);

    default:
      return 0;
  }
}

/**
 * Update progress for a single user quest
 */
export async function updateQuestProgress(
  userId: string,
  questId: string
): Promise<QuestProgressResult | null> {
  const userQuest = await prisma.userQuest.findFirst({
    where: {
      userId,
      questId,
      status: 'active',
    },
    include: {
      quest: true,
    },
  });

  if (!userQuest) {
    return null;
  }

  const previousProgress = userQuest.progress;
  const newProgress = await calculateQuestProgress(userId, userQuest.quest as Quest);

  // Update progress in database
  await prisma.userQuest.update({
    where: {
      id: userQuest.id,
    },
    data: {
      progress: newProgress,
    },
  });

  const isCompleted = newProgress >= 100;
  const isNewlyCompleted = isCompleted && previousProgress < 100;

  // If newly completed, mark as completed and award rewards
  if (isNewlyCompleted) {
    await completeQuest(userQuest.id, userId, userQuest.quest as Quest);
  }

  return {
    questId,
    previousProgress,
    newProgress,
    isCompleted,
    isNewlyCompleted,
    quest: userQuest.quest as Quest,
  };
}

/**
 * Complete a quest and award rewards
 */
async function completeQuest(userQuestId: string, userId: string, quest: Quest): Promise<void> {
  // Mark quest as completed
  await prisma.userQuest.update({
    where: {
      id: userQuestId,
    },
    data: {
      status: 'completed',
      completedAt: new Date(),
      progress: 100,
    },
  });

  // Award points
  if (quest.reward.points) {
    await prisma.userStats.update({
      where: {
        userId,
      },
      data: {
        totalPoints: {
          increment: quest.reward.points,
        },
      },
    });
  }

  // Award badge if specified
  if (quest.reward.badge) {
    const badge = await prisma.badge.findUnique({
      where: {
        code: quest.reward.badge,
      },
    });

    if (badge) {
      // Check if user already has this badge
      const existingBadge = await prisma.userBadge.findFirst({
        where: {
          userId,
          badgeId: badge.id,
        },
      });

      if (!existingBadge) {
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
            progress: 100,
          },
        });
      }
    }
  }
}

/**
 * Update progress for all active quests for a user
 */
export async function updateAllQuestProgress(userId: string): Promise<QuestProgressResult[]> {
  const activeQuests = await prisma.userQuest.findMany({
    where: {
      userId,
      status: 'active',
    },
    include: {
      quest: true,
    },
  });

  const results: QuestProgressResult[] = [];

  for (const userQuest of activeQuests) {
    const result = await updateQuestProgress(userId, userQuest.questId);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Get completed quests count
 */
export async function getCompletedQuestsCount(userId: string): Promise<number> {
  return prisma.userQuest.count({
    where: {
      userId,
      status: 'completed',
    },
  });
}

/**
 * Get quest completion summary
 */
export async function getQuestCompletionSummary(userId: string): Promise<{
  totalCompleted: number;
  dailyCompleted: number;
  weeklyCompleted: number;
  monthlyCompleted: number;
}> {
  const completed = await prisma.userQuest.findMany({
    where: {
      userId,
      status: 'completed',
    },
    include: {
      quest: {
        select: {
          type: true,
        },
      },
    },
  });

  return {
    totalCompleted: completed.length,
    dailyCompleted: completed.filter(q => q.quest.type === 'daily').length,
    weeklyCompleted: completed.filter(q => q.quest.type === 'weekly').length,
    monthlyCompleted: completed.filter(q => q.quest.type === 'monthly').length,
  };
}
