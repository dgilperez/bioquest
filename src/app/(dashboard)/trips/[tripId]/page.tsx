import { Suspense } from 'react';
import { TripDetailClient } from './page.client';
import { Loader2 } from 'lucide-react';

export default function TripDetailPage({
  params,
}: {
  params: { tripId: string };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-nature-600" />
          </div>
        }
      >
        <TripDetailClient tripId={params.tripId} />
      </Suspense>
    </div>
  );
}
