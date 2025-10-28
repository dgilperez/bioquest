import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLocationRecommendations, getUserCoordinates } from '@/lib/explore/recommendations-optimized';
import { MOCK_RECOMMENDATIONS } from '@/lib/explore/mock-recommendations';
import { recommendationsCache } from '@/lib/cache/recommendations-cache';

// Check if we're in mock mode (no iNat OAuth configured)
const isMockMode = !process.env.INATURALIST_CLIENT_ID || process.env.INATURALIST_CLIENT_ID === 'your_client_id_here';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const accessToken = (session as any).accessToken;

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '100');
    const minNewSpecies = parseInt(searchParams.get('minNewSpecies') || '10');

    // Determine user coordinates
    let userCoordinates: { lat: number; lng: number } | null = null;

    if (lat && lng) {
      // Use provided coordinates
      userCoordinates = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      };
    } else {
      // Try to get from user's data
      userCoordinates = await getUserCoordinates(userId);
    }

    // Use mock data in development mode
    if (isMockMode) {
      console.log('🎭 Using mock location recommendations (iNaturalist OAuth not configured)');

      // Use default San Francisco coordinates if none provided
      if (!userCoordinates) {
        userCoordinates = { lat: 37.7749, lng: -122.4194 };
      }

      return NextResponse.json({
        success: true,
        mock: true,
        userCoordinates,
        recommendations: MOCK_RECOMMENDATIONS,
        count: MOCK_RECOMMENDATIONS.length,
      });
    }

    // Real mode - require coordinates
    if (!userCoordinates) {
      return NextResponse.json(
        {
          error: 'Location required',
          message: 'Please provide coordinates or sync observations with location data',
        },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    // Check cache first
    const cachedRecommendations = recommendationsCache.get(userId, userCoordinates) as any[] | null;
    if (cachedRecommendations) {
      console.log('✨ Returning cached recommendations');
      return NextResponse.json({
        success: true,
        userCoordinates,
        recommendations: cachedRecommendations,
        count: cachedRecommendations.length,
        cached: true,
      });
    }

    // Get real recommendations
    const recommendations = await getLocationRecommendations(
      userId,
      userCoordinates,
      accessToken,
      {
        maxDistance,
        minNewSpecies,
      }
    );

    // Cache the results (24-hour TTL)
    recommendationsCache.set(userId, userCoordinates, recommendations);

    return NextResponse.json({
      success: true,
      userCoordinates,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
