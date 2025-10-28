'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ObservationFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get('filter') || 'all';

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'legendary', label: '✨ Legendary' },
    { id: 'rare', label: '💎 Rare' },
    { id: 'research', label: '✅ Research Grade' },
  ];

  const handleFilterChange = (filterId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filterId === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', filterId);
    }
    router.push(`/observations?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(filter => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange(filter.id)}
          className={activeFilter === filter.id ? 'bg-nature-600' : ''}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
