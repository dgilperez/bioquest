import { prisma } from '@/lib/db/prisma';
import { BADGE_DEFINITIONS } from './definitions';
import { Badge, BadgeDefinition } from '@/types';

export interface BadgeUnlockResult {
  badge: Badge;
  isNewlyUnlocked: boolean;
}

/**
 * Check and unlock eligible badges for a user
 * Optimized to batch database operations instead of N+1 queries
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
      trips: true,
    },
  });

  if (!user || !user.stats) return results;

  // Get already unlocked badge codes
  const unlockedBadgeCodes = new Set(user.badges.map(ub => ub.badge.code));

  // OPTIMIZATION: Pre-ensure all badges exist in database (batch operation)
  await ensureAllBadgesExist();

  // OPTIMIZATION: Fetch all badges at once instead of per-definition
  const allBadges = await prisma.badge.findMany({
    where: {
      code: {
        in: BADGE_DEFINITIONS.map(d => d.code)
      }
    }
  });
  const badgesByCode = new Map(allBadges.map(b => [b.code, b as Badge]));

  // Check which badges to unlock
  const badgesToUnlock: Badge[] = [];

  for (const badgeDef of BADGE_DEFINITIONS) {
    // Skip if already unlocked
    if (unlockedBadgeCodes.has(badgeDef.code)) {
      continue;
    }

    // Check if criteria met
    if (await isBadgeCriteriaMet(badgeDef.criteria, user.stats, user.observations, user.trips)) {
      const badge = badgesByCode.get(badgeDef.code);
      if (badge) {
        badgesToUnlock.push(badge);
      }
    }
  }

  // OPTIMIZATION: Batch unlock all eligible badges at once
  if (badgesToUnlock.length > 0) {
    await prisma.userBadge.createMany({
      data: badgesToUnlock.map(badge => ({
        userId,
        badgeId: badge.id,
        progress: 100,
      })),
    });

    // Add to results
    for (const badge of badgesToUnlock) {
      results.push({
        badge,
        isNewlyUnlocked: true,
      });
    }
  }

  return results;
}

/**
 * Ensure all badge definitions exist in database (batch operation)
 * This is more efficient than checking one-by-one
 */
async function ensureAllBadgesExist(): Promise<void> {
  const existingBadges = await prisma.badge.findMany({
    select: { code: true }
  });
  const existingCodes = new Set(existingBadges.map(b => b.code));

  const missingBadges = BADGE_DEFINITIONS.filter(def => !existingCodes.has(def.code));

  if (missingBadges.length > 0) {
    await prisma.badge.createMany({
      data: missingBadges.map(def => ({
        code: def.code,
        name: def.name,
        description: def.description,
        category: def.category,
        tier: def.tier || null,
        iconUrl: def.iconUrl || null,
        criteria: def.criteria as any,
        isSecret: def.isSecret,
        sortOrder: 0,
      })),
    });
  }
}

/**
 * Check if badge criteria is met
 */
async function isBadgeCriteriaMet(
  criteria: Record<string, any>,
  stats: any,
  observations: any[],
  trips: any[]
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

  // Trip criteria
  if (criteria.minTripsCompleted !== undefined) {
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    if (completedTrips.length < criteria.minTripsCompleted) return false;
  }

  if (criteria.hasPerfectTrip !== undefined) {
    const perfectTrip = trips.some(trip => {
      if (trip.status !== 'completed') return false;
      if (!trip.completionScore) return false;
      return trip.completionScore >= 100;
    });
    if (!perfectTrip) return false;
  }

  return true;
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
