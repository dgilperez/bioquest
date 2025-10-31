import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/trips/[tripId]
 * Get trip details
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { tripId } = params;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        place: true,
        targetSpecies: {
          orderBy: { priority: 'desc' },
        },
        observations: {
          include: {
            observation: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
        achievements: {
          orderBy: { earnedAt: 'desc' },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Verify ownership
    if (trip.userId !== userId && !trip.isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/trips/[tripId]
 * Update trip details, status, or add observations
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { tripId } = params;
    const body = await req.json();

    // Verify ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle different update types
    const { action } = body;

    if (action === 'start') {
      // Start trip
      const updated = await prisma.trip.update({
        where: { id: tripId },
        data: {
          status: 'in_progress',
          startedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, trip: updated });
    }

    if (action === 'complete') {
      // Complete trip - calculate stats
      const { notes, weather, conditions } = body;

      // Get all observations for this trip
      const tripWithObs = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          observations: {
            include: {
              observation: true,
            },
          },
          targetSpecies: true,
        },
      });

      if (!tripWithObs) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }

      // Calculate stats
      const observations = tripWithObs.observations.map(to => to.observation);
      const totalObservations = observations.length;
      const uniqueSpecies = new Set(observations.map(o => o.taxonId).filter(Boolean));
      const newSpeciesFound = uniqueSpecies.size; // Simplified - would need to check against user's life list

      // Calculate points
      const pointsEarned = observations.reduce((sum, obs) => sum + obs.pointsAwarded, 0);

      // Find rarest observation
      const rarities = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
      let rarityHighlight = 'common';
      for (const rarity of rarities) {
        if (observations.some(obs => obs.rarity === rarity)) {
          rarityHighlight = rarity;
          break;
        }
      }

      // Calculate completion score
      const targetsSpotted = tripWithObs.targetSpecies.filter(t => t.spotted).length;
      const totalTargets = tripWithObs.targetSpecies.length;
      const completionScore = totalTargets > 0 ? (targetsSpotted / totalTargets) * 100 : 0;

      // Update trip
      const updated = await prisma.trip.update({
        where: { id: tripId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          notes,
          weather,
          conditions,
          totalObservations,
          newSpeciesFound,
          pointsEarned,
          rarityHighlight: rarityHighlight as any,
          completionScore,
        },
      });

      // Check and unlock trip achievements
      const { checkAndUnlockBadges } = await import('@/lib/gamification/badges/unlock');
      const badgeResults = await checkAndUnlockBadges((session.user as any).id);
      const newBadges = badgeResults.filter(r => r.isNewlyUnlocked).map(r => r.badge);

      return NextResponse.json({
        success: true,
        trip: updated,
        newBadges: newBadges.length > 0 ? newBadges : undefined,
      });
    }

    if (action === 'cancel') {
      const updated = await prisma.trip.update({
        where: { id: tripId },
        data: {
          status: 'cancelled',
        },
      });

      return NextResponse.json({ success: true, trip: updated });
    }

    // Regular update (title, description, notes, etc.)
    const {
      title,
      description,
      plannedDate,
      weather,
      conditions,
      notes,
    } = body;

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(plannedDate && { plannedDate: new Date(plannedDate) }),
        ...(weather && { weather }),
        ...(conditions && { conditions }),
        ...(notes && { notes }),
      },
    });

    return NextResponse.json({ success: true, trip: updated });
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trips/[tripId]
 * Delete a trip
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { tripId } = params;

    // Verify ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete trip (cascades to targets, observations, achievements)
    await prisma.trip.delete({
      where: { id: tripId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}
