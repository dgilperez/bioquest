import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/trips/[tripId]/observations
 * Add observations to a trip
 */
export async function POST(
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
    const { observationIds } = body; // Array of observation IDs to add

    if (!observationIds || !Array.isArray(observationIds)) {
      return NextResponse.json(
        { error: 'observationIds array is required' },
        { status: 400 }
      );
    }

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        targetSpecies: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get observations to verify ownership and check if they're targets
    const observations = await prisma.observation.findMany({
      where: {
        id: { in: observationIds },
        userId,
      },
    });

    if (observations.length !== observationIds.length) {
      return NextResponse.json(
        { error: 'Some observations not found or not owned by user' },
        { status: 400 }
      );
    }

    // Create TripObservation links and update target species if matched
    const links = [];
    const targetTaxonIds = new Set(trip.targetSpecies.map(t => t.taxonId));

    for (const obs of observations) {
      const isTargetSpecies = obs.taxonId ? targetTaxonIds.has(obs.taxonId) : false;

      // Create link
      const link = await prisma.tripObservation.create({
        data: {
          tripId,
          observationId: obs.id,
          isTargetSpecies,
        },
      });

      links.push(link);

      // If this observation matches a target, mark it as spotted
      if (isTargetSpecies && obs.taxonId) {
        await prisma.tripTarget.updateMany({
          where: {
            tripId,
            taxonId: obs.taxonId,
            spotted: false,
          },
          data: {
            spotted: true,
            spottedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      added: links.length,
      links,
    });
  } catch (error) {
    console.error('Error adding observations to trip:', error);
    return NextResponse.json(
      { error: 'Failed to add observations' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trips/[tripId]/observations
 * Remove observations from a trip
 */
export async function DELETE(
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
    const { observationIds } = body;

    if (!observationIds || !Array.isArray(observationIds)) {
      return NextResponse.json(
        { error: 'observationIds array is required' },
        { status: 400 }
      );
    }

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete links
    const result = await prisma.tripObservation.deleteMany({
      where: {
        tripId,
        observationId: { in: observationIds },
      },
    });

    return NextResponse.json({
      success: true,
      removed: result.count,
    });
  } catch (error) {
    console.error('Error removing observations from trip:', error);
    return NextResponse.json(
      { error: 'Failed to remove observations' },
      { status: 500 }
    );
  }
}
