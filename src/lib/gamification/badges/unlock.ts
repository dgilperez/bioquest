import { prisma } from '@/lib/db/prisma';
import { BADGE_DEFINITIONS } from './definitions';
import { Badge, BadgeDefinition } from '@/types';

export interface BadgeUnlockResult {
  badge: Badge;
  isNewlyUnlocked: boolean;
}

/**
 * Check and unlock eligible badges for a user
 */
export async function checkAndUnlockBadges(userId: string): Promise<BadgeUnlockResult[]> {
  const results: BadgeUnlockResult[] = [];

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      stats: true,
      badges: {
        include: { badge: true },
      },
      observations: true,
    },
  });

  if (!user || !user.stats) return results;

  // Get already unlocked badge codes
  const unlockedBadgeCodes = new Set(user.badges.map(ub => ub.badge.code));

  // Check each badge definition
  for (const badgeDef of BADGE_DEFINITIONS) {
    // Skip if already unlocked
    if (unlockedBadgeCodes.has(badgeDef.code)) {
      continue;
    }

    // Check if criteria met
    if (await isBadgeCriteriaMet(badgeDef.criteria, user.stats, user.observations)) {
      // Unlock the badge
      const badge = await ensureBadgeExists(badgeDef);
      await unlockBadgeForUser(userId, badge.id);

      results.push({
        badge,
        isNewlyUnlocked: true,
      });
    }
  }

  return results;
}

/**
 * Check if badge criteria is met
 */
async function isBadgeCriteriaMet(
  criteria: Record<string, any>,
  stats: any,
  observations: any[]
): Promise<boolean> {
  // Milestone criteria
  if (criteria.minObservations !== undefined) {
    if (stats.totalObservations < criteria.minObservations) return false;
  }

  // Rarity criteria
  if (criteria.minRareObservations !== undefined) {
    if (stats.rareObservations < criteria.minRareObservations) return false;
  }

  if (criteria.minLegendaryObservations !== undefined) {
    if (stats.legendaryObservations < criteria.minLegendaryObservations) return false;
  }

  if (criteria.hasFirstGlobalObservation !== undefined) {
    const hasFirst = observations.some(obs => obs.isFirstGlobal);
    if (!hasFirst) return false;
  }

  // Taxon criteria
  if (criteria.iconicTaxon && criteria.minSpecies) {
    const taxonSpecies = observations.filter(
      obs => obs.iconicTaxon === criteria.iconicTaxon
    );
    const uniqueSpecies = new Set(taxonSpecies.map(obs => obs.taxonId));
    if (uniqueSpecies.size < criteria.minSpecies) return false;
  }

  // Time/streak criteria
  if (criteria.minStreak !== undefined) {
    if (stats.longestStreak < criteria.minStreak) return false;
  }

  if (criteria.hasEarlyMorningObservation !== undefined) {
    const hasEarlyMorning = observations.some(obs => {
      const hour = new Date(obs.observedOn).getHours();
      return hour < 6;
    });
    if (!hasEarlyMorning) return false;
  }

  if (criteria.hasNightObservation !== undefined) {
    const hasNight = observations.some(obs => {
      const hour = new Date(obs.observedOn).getHours();
      return hour >= 22;
    });
    if (!hasNight) return false;
  }

  if (criteria.hasAllSeasons !== undefined) {
    const months = observations.map(obs => new Date(obs.observedOn).getMonth());
    const seasons = new Set([
      ...months.filter(m => [11, 0, 1].includes(m)).map(() => 'winter'),
      ...months.filter(m => [2, 3, 4].includes(m)).map(() => 'spring'),
      ...months.filter(m => [5, 6, 7].includes(m)).map(() => 'summer'),
      ...months.filter(m => [8, 9, 10].includes(m)).map(() => 'fall'),
    ]);
    if (seasons.size < 4) return false;
  }

  // Geography criteria
  if (criteria.minUniqueLocations !== undefined) {
    const uniqueLocations = new Set(observations.map(obs => obs.placeGuess).filter(Boolean));
    if (uniqueLocations.size < criteria.minUniqueLocations) return false;
  }

  // Quality criteria
  if (criteria.minResearchGradeObservations !== undefined) {
    const researchGrade = observations.filter(obs => obs.qualityGrade === 'research');
    if (researchGrade.length < criteria.minResearchGradeObservations) return false;
  }

  if (criteria.minPhotosInOneObservation !== undefined) {
    const hasEnoughPhotos = observations.some(
      obs => obs.photosCount >= criteria.minPhotosInOneObservation
    );
    if (!hasEnoughPhotos) return false;
  }

  return true;
}

/**
 * Ensure badge exists in database, create if not
 */
async function ensureBadgeExists(badgeDef: BadgeDefinition): Promise<Badge> {
  const existing = await prisma.badge.findUnique({
    where: { code: badgeDef.code },
  });

  if (existing) return existing as Badge;

  const created = await prisma.badge.create({
    data: {
      code: badgeDef.code,
      name: badgeDef.name,
      description: badgeDef.description,
      category: badgeDef.category,
      tier: badgeDef.tier || null,
      iconUrl: badgeDef.iconUrl || null,
      criteria: badgeDef.criteria as any, // Prisma Json type
      isSecret: badgeDef.isSecret,
      sortOrder: 0,
    },
  });

  return created as Badge;
}

/**
 * Unlock a badge for a user
 */
async function unlockBadgeForUser(userId: string, badgeId: string): Promise<void> {
  await prisma.userBadge.create({
    data: {
      userId,
      badgeId,
      progress: 100,
    },
  });
}

/**
 * Get all badges for a user (unlocked and locked)
 */
export async function getUserBadges(userId: string): Promise<{
  unlocked: Badge[];
  locked: BadgeDefinition[];
}> {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { unlockedAt: 'desc' },
  });

  const unlockedCodes = new Set(userBadges.map(ub => ub.badge.code));
  const unlocked = userBadges.map(ub => ub.badge as Badge);
  const locked = BADGE_DEFINITIONS.filter(b => !unlockedCodes.has(b.code) && !b.isSecret);

  return { unlocked, locked };
}
