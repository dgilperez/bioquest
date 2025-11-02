import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLocationRecommendations, getUserCoordinates } from '@/lib/explore/recommendations-optimized';
import { recommendationsCache } from '@/lib/cache/recommendations-cache';

export async function GET(req: NextRequest) {
  console.log('==================== RECOMMENDATIONS API CALLED ====================');
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

    // Require coordinates
    if (!userCoordinates) {
      console.log('❌ No coordinates available for user:', userId);
      console.log('  - lat/lng params:', lat, lng);
      console.log('  - getUserCoordinates returned:', userCoordinates);

      return NextResponse.json(
        {
          success: false,
          error: 'Location required',
          message: 'Please provide coordinates or sync observations with location data',
          recommendations: [],
          count: 0,
        },
        { status: 200 } // Return 200 with empty results instead of 400 error
      );
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    // Check cache first
    const cachedRecommendations = recommendationsCache.get(userId, userCoordinates) as any[] | null;
    if (cachedRecommendations) {
      console.log(`✨ Returning cached recommendations: ${cachedRecommendations.length} results`);
      return NextResponse.json({
        success: true,
        userCoordinates,
        recommendations: cachedRecommendations,
        count: cachedRecommendations.length,
        cached: true,
      });
    }

    console.log('🆕 No cache hit, fetching fresh recommendations...');

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
