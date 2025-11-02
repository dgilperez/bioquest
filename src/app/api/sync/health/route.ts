/**
 * Sync Health Check Endpoint
 *
 * Provides observability metrics for sync operations
 *
 * GET /api/sync/health
 * Returns: Sync system health status and metrics
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const now = Date.now();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // Get recent sync activity
    const recentSyncs = await prisma.userStats.findMany({
      where: {
        lastSyncedAt: {
          gte: oneHourAgo,
        },
      },
      select: {
        lastSyncedAt: true,
        totalObservations: true,
        totalPoints: true,
      },
      orderBy: {
        lastSyncedAt: 'desc',
      },
      take: 100,
    });

    // Get overall stats
    const totalUsers = await prisma.user.count();
    const usersWithObservations = await prisma.userStats.count({
      where: {
        totalObservations: {
          gt: 0,
        },
      },
    });

    // Calculate sync metrics
    const syncsLastHour = recentSyncs.filter(
      (s) => s.lastSyncedAt && s.lastSyncedAt >= oneHourAgo
    ).length;

    const syncsLastDay = await prisma.userStats.count({
      where: {
        lastSyncedAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Calculate average observations per user (for users who have synced)
    const avgObservationsPerUser = usersWithObservations > 0
      ? Math.round(
          (await prisma.userStats.aggregate({
            _avg: {
              totalObservations: true,
            },
            where: {
              totalObservations: {
                gt: 0,
              },
            },
          }))._avg.totalObservations || 0
        )
      : 0;

    // Health status determination
    const isHealthy = syncsLastHour >= 0; // System is healthy if endpoint is responding
    const status = isHealthy ? 'healthy' : 'degraded';

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      metrics: {
        sync: {
          lastHour: syncsLastHour,
          lastDay: syncsLastDay,
          recentActivity: recentSyncs.slice(0, 5).map((s) => ({
            lastSyncedAt: s.lastSyncedAt?.toISOString(),
            totalObservations: s.totalObservations,
            totalPoints: s.totalPoints,
          })),
        },
        users: {
          total: totalUsers,
          withObservations: usersWithObservations,
          avgObservationsPerUser,
        },
        database: {
          connected: true, // If we got here, database is connected
        },
      },
    });
  } catch (error) {
    // If we can't connect to database or other critical error
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          database: {
            connected: false,
          },
        },
      },
      { status: 503 } // Service Unavailable
    );
  }
}
