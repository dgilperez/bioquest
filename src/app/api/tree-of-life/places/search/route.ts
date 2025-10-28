import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getINatClient } from '@/lib/inat/client';
import {
  withAPIErrorHandler,
  createSuccessResponse,
  ValidationError,
  UnauthorizedError,
} from '@/lib/errors';

interface Place {
  id: number;
  name: string;
  displayName: string;
  placeType: number;
  latitude: number;
  longitude: number;
}

async function handleSearchPlaces(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError('You must be logged in to search places');
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }

  const client = getINatClient();

  // Search places on iNaturalist
  const response = await client.request<{
    results: Array<{
      id: number;
      name: string;
      display_name: string;
      place_type: number;
      latitude: number;
      longitude: number;
      bbox_area: number;
    }>;
  }>(`/places/autocomplete?q=${encodeURIComponent(query)}&per_page=20`);

  // Transform to our format
  const places: Place[] = response.results.map((place) => ({
    id: place.id,
    name: place.name,
    displayName: place.display_name,
    placeType: place.place_type,
    latitude: place.latitude,
    longitude: place.longitude,
  }));

  // Sort by place type (smaller/more specific first: county > state > country > continent)
  places.sort((a, b) => a.placeType - b.placeType);

  return createSuccessResponse(places);
}

export const GET = withAPIErrorHandler(handleSearchPlaces);
