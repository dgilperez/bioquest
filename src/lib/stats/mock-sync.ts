/**
 * Mock sync for development when iNaturalist OAuth is not yet approved
 */

import { prisma } from '@/lib/db/prisma';
import { generateMockObservations, getMockSpeciesCount } from '@/lib/inat/mock-data';
import { checkAndUnlockBadges } from '@/lib/gamification/badges/unlock';
import { updateAllQuestProgress } from '@/lib/gamification/quests/progress';
import { assignAvailableQuestsToUser } from '@/lib/gamification/quests/generation';
import { calculateLevel } from '@/lib/stats/user-stats';
import { Badge, Quest } from '@/types';

export interface CompletedQuest {
  quest: Quest;
  pointsEarned: number;
}

export interface MockSyncResult {
  newObservations: number;
  newBadges: Badge[];
  completedQuests: CompletedQuest[];
  leveledUp: boolean;
  newLevel?: number;
  levelTitle?: string;
  oldLevel?: number;
}

/**
 * Sync mock observations for a user
 */
export async function syncMockObservations(
  userId: string,
  _inatUsername: string
): Promise<MockSyncResult> {
  try {
    // Get current stats
    const currentStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    const oldObservationCount = currentStats?.totalObservations || 0;
    const oldLevel = currentStats?.level || 1;

    // Generate mock observations (50 observations with variety)
    const mockObservations = generateMockObservations(50);

    // Get total species count
    const totalSpecies = getMockSpeciesCount();

    // Calculate points
    let totalPoints = 0;
    for (const obs of mockObservations) {
      let obsPoints = 10; // Base points

      // New species bonus (simulate 70% being new for this user)
      if (Math.random() < 0.7) {
        obsPoints += 50;
      }

      // Rarity bonus
      if (obs.rarity === 'rare') {
        obsPoints += 100;
      } else if (obs.rarity === 'legendary') {
        obsPoints += 500;
        if (obs.isFirstGlobal) {
          obsPoints += 500; // Extra bonus for first global
        }
      }

      // Research grade bonus
      if (obs.qualityGrade === 'research') {
        obsPoints += 25;
      }

      // Photo bonus (max 3 photos)
      const photoBonus = Math.min(obs.photosCount, 3) * 5;
      obsPoints += photoBonus;

      obs.pointsAwarded = obsPoints;
      totalPoints += obsPoints;
    }

    // Calculate level
    const { level, pointsToNextLevel } = calculateLevel(totalPoints);
    const levelTitles = [
      'Novice Naturalist',
      'Amateur Naturalist',
      'Field Naturalist',
      'Expert Naturalist',
      'Master Naturalist',
      'Elite Naturalist',
      'Legendary Naturalist'
    ];
    const levelTitle = levelTitles[Math.min(Math.floor(level / 5), levelTitles.length - 1)];

    // Store observations in database
    for (const obs of mockObservations) {
      await prisma.observation.upsert({
        where: { id: obs.id },
        update: {
          ...obs,
          userId,
          updatedAt: new Date(),
        },
        create: {
          ...obs,
          userId,
        },
      });
    }

    // Count rarity observations
    const rareCount = mockObservations.filter(o => o.rarity === 'rare').length;
    const legendaryCount = mockObservations.filter(o => o.rarity === 'legendary').length;

    // Update stats
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalObservations: mockObservations.length,
        totalSpecies,
        totalPoints,
        level,
        pointsToNextLevel,
        rareObservations: rareCount,
        legendaryObservations: legendaryCount,
        updatedAt: new Date(),
      },
      create: {
        userId,
        totalObservations: mockObservations.length,
        totalSpecies,
        totalPoints,
        level,
        pointsToNextLevel,
        rareObservations: rareCount,
        legendaryObservations: legendaryCount,
      },
    });

    // Assign available quests to user
    await assignAvailableQuestsToUser(userId);

    // Update quest progress
    const questProgress = await updateAllQuestProgress(userId);
    const completedQuests: CompletedQuest[] = questProgress
      .filter(qp => qp.isNewlyCompleted)
      .map(qp => ({
        quest: qp.quest,
        pointsEarned: qp.quest.reward.points || 0,
      }));

    // Check for badge unlocks
    const badgeResults = await checkAndUnlockBadges(userId);
    const newBadges = badgeResults
      .filter(r => r.isNewlyUnlocked)
      .map(r => r.badge);

    // Check if leveled up
    const leveledUp = level > oldLevel;
    const newObservations = mockObservations.length - oldObservationCount;

    return {
      newObservations,
      newBadges,
      completedQuests,
      leveledUp,
      newLevel: leveledUp ? level : undefined,
      levelTitle: leveledUp ? levelTitle : undefined,
      oldLevel,
    };
  } catch (error) {
    console.error('Error syncing mock observations:', error);
    throw error;
  }
}

