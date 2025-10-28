import { Suspense } from 'react';
import { TripDetailClient } from './page.client';
import { Loader2 } from 'lucide-react';

export default function TripDetailPage({
  params,
}: {
  params: { tripId: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-nature-600" />
        </div>
      }
    >
      <TripDetailClient tripId={params.tripId} />
    </Suspense>
  );
}
