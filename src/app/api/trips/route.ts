import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/trips
 * List user's trips with optional filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const searchParams = req.nextUrl.searchParams;

    // Filters
    const status = searchParams.get('status'); // planned, in_progress, completed, cancelled
    const placeId = searchParams.get('placeId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = { userId };
    if (status) where.status = status;
    if (placeId) where.placeId = parseInt(placeId);

    // Get trips with relations
    const trips = await prisma.trip.findMany({
      where,
      include: {
        place: true,
        targetSpecies: true,
        observations: {
          include: {
            observation: true,
          },
        },
        achievements: true,
      },
      orderBy: {
        plannedDate: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.trip.count({ where });

    return NextResponse.json({
      trips,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trips
 * Create a new trip
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const {
      placeId,
      placeData,
      title,
      description,
      plannedDate,
      targetSpecies = [],
      customLocationName,
      customLatitude,
      customLongitude,
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!placeId && !customLocationName) {
      return NextResponse.json(
        { error: 'Either placeId or custom location is required' },
        { status: 400 }
      );
    }

    // Upsert place if placeData provided
    if (placeId && placeData) {
      await prisma.place.upsert({
        where: { id: parseInt(placeId) },
        update: {
          name: placeData.name,
          displayName: placeData.displayName,
          latitude: placeData.latitude,
          longitude: placeData.longitude,
        },
        create: {
          id: parseInt(placeId),
          name: placeData.name,
          displayName: placeData.displayName,
          latitude: placeData.latitude,
          longitude: placeData.longitude,
        },
      });
    }

    // Create trip with target species
    const trip = await prisma.trip.create({
      data: {
        userId,
        placeId: placeId ? parseInt(placeId) : null,
        title,
        description,
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        customLocationName,
        customLatitude,
        customLongitude,
        status: 'planned',
        targetSpecies: {
          create: targetSpecies.map((target: any) => ({
            taxonId: target.taxonId,
            taxonName: target.taxonName,
            commonName: target.commonName,
            iconicTaxon: target.iconicTaxon,
            priority: target.priority || 0,
          })),
        },
      },
      include: {
        place: true,
        targetSpecies: true,
      },
    });

    return NextResponse.json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
