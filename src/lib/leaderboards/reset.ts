import { prisma } from '@/lib/db/prisma';

/**
 * Get the start of the current week (Monday 00:00:00)
 */
function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to Monday

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);

  return weekStart;
}

/**
 * Get the start of the current month (1st day 00:00:00)
 */
function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Check if a date is in the current period
 */
function isInCurrentPeriod(periodStart: Date | null, currentPeriodStart: Date): boolean {
  if (!periodStart) return false;
  return periodStart.getTime() === currentPeriodStart.getTime();
}

/**
 * Reset weekly leaderboard for all users if needed
 * This should be called periodically (e.g., via cron or on-demand)
 */
export async function resetWeeklyLeaderboard(): Promise<{ reset: boolean; count: number }> {
  const currentWeekStart = getWeekStart();

  // Find users whose weekStart is different from current week
  const usersToReset = await prisma.userStats.findMany({
    where: {
      OR: [
        { weekStart: null },
        { weekStart: { lt: currentWeekStart } }
      ]
    },
    select: { id: true, weekStart: true }
  });

  if (usersToReset.length === 0) {
    return { reset: false, count: 0 };
  }

  // Reset weekly points and update weekStart
  await prisma.userStats.updateMany({
    where: {
      id: {
        in: usersToReset.map(u => u.id)
      }
    },
    data: {
      weeklyPoints: 0,
      weekStart: currentWeekStart
    }
  });

  return { reset: true, count: usersToReset.length };
}

/**
 * Reset monthly leaderboard for all users if needed
 * This should be called periodically (e.g., via cron or on-demand)
 */
export async function resetMonthlyLeaderboard(): Promise<{ reset: boolean; count: number }> {
  const currentMonthStart = getMonthStart();

  // Find users whose monthStart is different from current month
  const usersToReset = await prisma.userStats.findMany({
    where: {
      OR: [
        { monthStart: null },
        { monthStart: { lt: currentMonthStart } }
      ]
    },
    select: { id: true, monthStart: true }
  });

  if (usersToReset.length === 0) {
    return { reset: false, count: 0 };
  }

  // Reset monthly points and update monthStart
  await prisma.userStats.updateMany({
    where: {
      id: {
        in: usersToReset.map(u => u.id)
      }
    },
    data: {
      monthlyPoints: 0,
      monthStart: currentMonthStart
    }
  });

  return { reset: true, count: usersToReset.length };
}

/**
 * Initialize period tracking for a user
 * Call this when creating a new UserStats record or when migrating existing users
 */
export async function initializeUserPeriods(userId: string): Promise<void> {
  const currentWeekStart = getWeekStart();
  const currentMonthStart = getMonthStart();

  await prisma.userStats.update({
    where: { userId },
    data: {
      weekStart: currentWeekStart,
      monthStart: currentMonthStart
    }
  });
}

/**
 * Check and reset both weekly and monthly leaderboards if needed
 * This is the main function to call periodically
 */
export async function checkAndResetLeaderboards(): Promise<{
  weekly: { reset: boolean; count: number };
  monthly: { reset: boolean; count: number };
}> {
  const [weekly, monthly] = await Promise.all([
    resetWeeklyLeaderboard(),
    resetMonthlyLeaderboard()
  ]);

  return { weekly, monthly };
}

/**
 * Award points to a user and update weekly/monthly totals
 * Call this whenever a user earns points (e.g., from observations)
 */
export async function awardPoints(
  userId: string,
  points: number
): Promise<void> {
  const currentWeekStart = getWeekStart();
  const currentMonthStart = getMonthStart();

  const userStats = await prisma.userStats.findUnique({
    where: { userId },
    select: {
      weekStart: true,
      monthStart: true,
      weeklyPoints: true,
      monthlyPoints: true
    }
  });

  if (!userStats) {
    throw new Error(`UserStats not found for user ${userId}`);
  }

  // Check if we need to reset periods for this user
  const shouldResetWeekly = !isInCurrentPeriod(userStats.weekStart, currentWeekStart);
  const shouldResetMonthly = !isInCurrentPeriod(userStats.monthStart, currentMonthStart);

  // Calculate new points
  const newWeeklyPoints = shouldResetWeekly ? points : userStats.weeklyPoints + points;
  const newMonthlyPoints = shouldResetMonthly ? points : userStats.monthlyPoints + points;

  // Update points and period markers
  await prisma.userStats.update({
    where: { userId },
    data: {
      totalPoints: {
        increment: points
      },
      weeklyPoints: newWeeklyPoints,
      monthlyPoints: newMonthlyPoints,
      weekStart: currentWeekStart,
      monthStart: currentMonthStart
    }
  });
}
