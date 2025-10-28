import { Suspense } from 'react';
import { TripsListClient } from './page.client';
import { Loader2 } from 'lucide-react';

export default function TripsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-nature-600" />
        </div>
      }
    >
      <TripsListClient />
    </Suspense>
  );
}
