/**
 * Mock sync for development when iNaturalist OAuth is not yet approved
 */

import { prisma } from '@/lib/db/prisma';
import { generateMockObservations, getMockSpeciesCount } from '@/lib/inat/mock-data';
import { checkAndUnlockBadges } from '@/lib/gamification/badges/unlock';
import { updateAllQuestProgress } from '@/lib/gamification/quests/progress';
import { assignAvailableQuestsToUser } from '@/lib/gamification/quests/generation';
import { calculateLevel, SyncResult, QuestMilestone } from '@/lib/stats/user-stats';
import { updateStreaks } from '@/lib/gamification/streak-tracking';
import { Quest } from '@/types';

export interface CompletedQuest {
  quest: Quest;
  pointsEarned: number;
}

/**
 * Sync mock observations for a user
 */
export async function syncMockObservations(
  userId: string,
  _inatUsername: string
): Promise<SyncResult> {
  // Import progress tracking
  const { initProgress, updateProgress, completeProgress, errorProgress } = await import('@/lib/sync/progress');

  try {
    // Helper function to add realistic delays for demo purposes
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Initialize progress tracking
    const mockObsCount = 50;
    await initProgress(userId, mockObsCount);

    await updateProgress(userId, {
      phase: 'fetching',
      message: 'Generating mock observations...',
      observationsProcessed: 0,
      observationsTotal: mockObsCount,
    });

    // Add delay to make progress visible (1 second)
    await delay(1000);

    // Get current stats
    const currentStats = await prisma.userStats.findUnique({
      where: { userId },
    });

    const oldObservationCount = currentStats?.totalObservations || 0;
    const oldLevel = currentStats?.level || 1;

    await updateProgress(userId, {
      phase: 'enriching',
      message: 'Classifying mock observations...',
      observationsProcessed: 10,
    });

    // Add delay (2 seconds)
    await delay(2000);

    // Generate mock observations (50 observations with variety)
    const mockObservations = generateMockObservations(50);

    // Get total species count
    const totalSpecies = getMockSpeciesCount();

    await updateProgress(userId, {
      phase: 'storing',
      message: 'Saving mock observations...',
      observationsProcessed: 25,
    });

    // Add delay (2 seconds)
    await delay(2000);

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

    // Calculate rarity streaks
    let currentRarityStreak = currentStats?.currentRarityStreak || 0;
    let longestRarityStreak = currentStats?.longestRarityStreak || 0;
    let lastRareObservationDate = currentStats?.lastRareObservationDate || null;
    let lastObservationDate = currentStats?.lastObservationDate || null;

    // Sort observations by date ascending to track streaks chronologically
    const sortedObservations = [...mockObservations].sort((a, b) =>
      new Date(a.observedOn).getTime() - new Date(b.observedOn).getTime()
    );

    for (const obs of sortedObservations) {
      const streakUpdate = updateStreaks(
        {
          currentStreak: currentStats?.currentStreak || 0,
          longestStreak: currentStats?.longestStreak || 0,
          currentRarityStreak,
          longestRarityStreak,
          lastObservationDate,
          lastRareObservationDate,
        },
        new Date(obs.observedOn),
        obs.rarity
      );

      // Update values for next iteration
      currentRarityStreak = streakUpdate.currentRarityStreak;
      longestRarityStreak = streakUpdate.longestRarityStreak;
      lastRareObservationDate = streakUpdate.lastRareObservationDate;
      lastObservationDate = streakUpdate.lastObservationDate;
    }

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
        currentRarityStreak,
        longestRarityStreak,
        lastRareObservationDate,
        lastSyncedAt: new Date(), // Critical: Update sync timestamp
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
        currentRarityStreak,
        longestRarityStreak,
        lastRareObservationDate,
        lastSyncedAt: new Date(), // Critical: Set initial sync timestamp
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

    // Collect quest milestones (25%, 50%, 75%, 100%)
    const questMilestones: QuestMilestone[] = questProgress
      .filter(qp => qp.milestone !== undefined)
      .map(qp => ({
        quest: qp.quest,
        progress: qp.newProgress,
        milestone: qp.milestone!,
      }));

    await updateProgress(userId, {
      phase: 'calculating',
      message: 'Checking badges and quests...',
      observationsProcessed: 45,
    });

    // Add delay (2 seconds)
    await delay(2000);

    // Check for badge unlocks
    const badgeResults = await checkAndUnlockBadges(userId);
    const newBadges = badgeResults
      .filter(r => r.isNewlyUnlocked)
      .map(r => r.badge);

    // Check if leveled up
    const leveledUp = level > oldLevel;
    const newObservations = mockObservations.length - oldObservationCount;

    // Update to 100% before completing
    await updateProgress(userId, {
      observationsProcessed: mockObsCount,
      message: 'Finalizing...',
    });

    // Small delay before completion
    await delay(500);

    // Complete progress
    await completeProgress(userId);

    return {
      newObservations,
      totalSynced: totalObservations,
      newBadges,
      completedQuests,
      questMilestones,
      leveledUp,
      newLevel: leveledUp ? level : undefined,
      levelTitle: leveledUp ? levelTitle : undefined,
      oldLevel,
      streakMilestone: undefined,
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        streakAtRisk: false,
        hoursUntilBreak: 0,
      },
      rareFinds: [],
    };
  } catch (error) {
    console.error('Error syncing mock observations:', error);
    // Mark progress as error
    await errorProgress(userId, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

