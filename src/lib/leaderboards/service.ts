import { prisma } from '@/lib/db/prisma';

export type LeaderboardPeriod = 'all_time' | 'monthly' | 'weekly';
export type LeaderboardType = 'global' | 'regional' | 'taxon' | 'friends';

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    inatUsername: string;
    name: string | null;
    icon: string | null;
    location: string | null;
  };
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  totalObservations: number;
  totalSpecies: number;
  level: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  userEntry: LeaderboardEntry | null;
  total: number;
}

/**
 * Get global leaderboard
 */
export async function getGlobalLeaderboard(
  period: LeaderboardPeriod,
  limit: number = 100,
  currentUserId?: string
): Promise<LeaderboardResult> {
  // Determine which field to sort by
  const sortField = period === 'weekly' ? 'weeklyPoints' : period === 'monthly' ? 'monthlyPoints' : 'totalPoints';

  // Get top entries
  const topStats = await prisma.userStats.findMany({
    where: {
      [sortField]: {
        gt: 0
      }
    },
    include: {
      user: {
        select: {
          id: true,
          inatUsername: true,
          name: true,
          icon: true,
          location: true,
        }
      }
    },
    orderBy: {
      [sortField]: 'desc'
    },
    take: limit,
  });

  const entries: LeaderboardEntry[] = topStats.map((stats, index) => ({
    rank: index + 1,
    user: stats.user,
    totalPoints: stats.totalPoints,
    weeklyPoints: stats.weeklyPoints,
    monthlyPoints: stats.monthlyPoints,
    totalObservations: stats.totalObservations,
    totalSpecies: stats.totalSpecies,
    level: stats.level,
  }));

  // Get current user's entry if not in top
  let userEntry: LeaderboardEntry | null = null;
  if (currentUserId) {
    const userInTop = entries.find(e => e.user.id === currentUserId);
    if (!userInTop) {
      const userStats = await prisma.userStats.findUnique({
        where: { userId: currentUserId },
        include: {
          user: {
            select: {
              id: true,
              inatUsername: true,
              name: true,
              icon: true,
              location: true,
              region: true,
            }
          }
        }
      });

      if (userStats) {
        // Calculate user's rank
        const count = await prisma.userStats.count({
          where: {
            [sortField]: {
              gt: userStats[sortField as keyof typeof userStats] as number
            }
          }
        });

        userEntry = {
          rank: count + 1,
          user: userStats.user,
          totalPoints: userStats.totalPoints,
          weeklyPoints: userStats.weeklyPoints,
          monthlyPoints: userStats.monthlyPoints,
          totalObservations: userStats.totalObservations,
          totalSpecies: userStats.totalSpecies,
          level: userStats.level,
        };
      }
    } else {
      userEntry = userInTop;
    }
  }

  const total = await prisma.userStats.count({
    where: {
      [sortField]: {
        gt: 0
      }
    }
  });

  return {
    entries,
    userEntry,
    total,
  };
}

/**
 * Get regional leaderboard (users in same region)
 */
export async function getRegionalLeaderboard(
  region: string,
  period: LeaderboardPeriod,
  limit: number = 100,
  currentUserId?: string
): Promise<LeaderboardResult> {
  const sortField = period === 'weekly' ? 'weeklyPoints' : period === 'monthly' ? 'monthlyPoints' : 'totalPoints';

  const topStats = await prisma.userStats.findMany({
    where: {
      user: {
        region: region
      },
      [sortField]: {
        gt: 0
      }
    },
    include: {
      user: {
        select: {
          id: true,
          inatUsername: true,
          name: true,
          icon: true,
          location: true,
        }
      }
    },
    orderBy: {
      [sortField]: 'desc'
    },
    take: limit,
  });

  const entries: LeaderboardEntry[] = topStats.map((stats, index) => ({
    rank: index + 1,
    user: stats.user,
    totalPoints: stats.totalPoints,
    weeklyPoints: stats.weeklyPoints,
    monthlyPoints: stats.monthlyPoints,
    totalObservations: stats.totalObservations,
    totalSpecies: stats.totalSpecies,
    level: stats.level,
  }));

  let userEntry: LeaderboardEntry | null = null;
  if (currentUserId) {
    const userInTop = entries.find(e => e.user.id === currentUserId);
    if (!userInTop) {
      const userStats = await prisma.userStats.findUnique({
        where: { userId: currentUserId },
        include: {
          user: {
            select: {
              id: true,
              inatUsername: true,
              name: true,
              icon: true,
              location: true,
              region: true,
            }
          }
        }
      });

      if (userStats && userStats.user.region === region) {
        const count = await prisma.userStats.count({
          where: {
            user: {
              region: region
            },
            [sortField]: {
              gt: userStats[sortField as keyof typeof userStats] as number
            }
          }
        });

        userEntry = {
          rank: count + 1,
          user: userStats.user,
          totalPoints: userStats.totalPoints,
          weeklyPoints: userStats.weeklyPoints,
          monthlyPoints: userStats.monthlyPoints,
          totalObservations: userStats.totalObservations,
          totalSpecies: userStats.totalSpecies,
          level: userStats.level,
        };
      }
    } else {
      userEntry = userInTop;
    }
  }

  const total = await prisma.userStats.count({
    where: {
      user: {
        region: region
      },
      [sortField]: {
        gt: 0
      }
    }
  });

  return {
    entries,
    userEntry,
    total,
  };
}

/**
 * Get friends leaderboard
 */
export async function getFriendsLeaderboard(
  userId: string,
  period: LeaderboardPeriod,
  limit: number = 100
): Promise<LeaderboardResult> {
  const sortField = period === 'weekly' ? 'weeklyPoints' : period === 'monthly' ? 'monthlyPoints' : 'totalPoints';

  // Get accepted friends
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId: userId, status: 'ACCEPTED' },
        { friendId: userId, status: 'ACCEPTED' }
      ]
    },
    select: {
      userId: true,
      friendId: true,
    }
  });

  const friendIds = friendships.map(f => f.userId === userId ? f.friendId : f.userId);
  const allIds = [userId, ...friendIds];

  const topStats = await prisma.userStats.findMany({
    where: {
      userId: {
        in: allIds
      },
      [sortField]: {
        gt: 0
      }
    },
    include: {
      user: {
        select: {
          id: true,
          inatUsername: true,
          name: true,
          icon: true,
          location: true,
        }
      }
    },
    orderBy: {
      [sortField]: 'desc'
    },
    take: limit,
  });

  const entries: LeaderboardEntry[] = topStats.map((stats, index) => ({
    rank: index + 1,
    user: stats.user,
    totalPoints: stats.totalPoints,
    weeklyPoints: stats.weeklyPoints,
    monthlyPoints: stats.monthlyPoints,
    totalObservations: stats.totalObservations,
    totalSpecies: stats.totalSpecies,
    level: stats.level,
  }));

  const userEntry = entries.find(e => e.user.id === userId) || null;

  return {
    entries,
    userEntry,
    total: allIds.length,
  };
}

/**
 * Get taxon-specific leaderboard (top observers for a specific taxon)
 */
export async function getTaxonLeaderboard(
  taxonName: string,
  limit: number = 100,
  currentUserId?: string
): Promise<LeaderboardResult> {
  // This requires aggregating observations by taxon
  // For now, let's use iconicTaxon (Birds, Plants, Insects, etc.)

  // Get users with most observations in this taxon
  const obsGrouped = await prisma.observation.groupBy({
    by: ['userId'],
    where: {
      iconicTaxon: taxonName
    },
    _count: {
      id: true
    },
    _sum: {
      pointsAwarded: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: limit,
  });

  // Get user details and stats
  const userIds = obsGrouped.map(g => g.userId);
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    select: {
      id: true,
      inatUsername: true,
      name: true,
      icon: true,
      location: true,
      region: true,
      stats: true,
    }
  });

  const entries: LeaderboardEntry[] = obsGrouped.map((group, index) => {
    const user = users.find(u => u.id === group.userId);
    if (!user || !user.stats) return null;

    return {
      rank: index + 1,
      user: {
        id: user.id,
        inatUsername: user.inatUsername,
        name: user.name,
        icon: user.icon,
        location: user.location,
      },
      totalPoints: user.stats.totalPoints,
      weeklyPoints: user.stats.weeklyPoints,
      monthlyPoints: user.stats.monthlyPoints,
      totalObservations: group._count.id, // Taxon-specific count
      totalSpecies: user.stats.totalSpecies,
      level: user.stats.level,
    };
  }).filter((e): e is LeaderboardEntry => e !== null);

  let userEntry: LeaderboardEntry | null = null;
  if (currentUserId) {
    userEntry = entries.find(e => e.user.id === currentUserId) || null;
  }

  return {
    entries,
    userEntry,
    total: entries.length,
  };
}
