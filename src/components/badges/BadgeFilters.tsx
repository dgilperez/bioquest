'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function BadgeFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get('category') || 'all';

  const filters = [
    { id: 'all', label: 'All Badges' },
    { id: 'milestone', label: 'Milestones' },
    { id: 'taxon', label: 'Taxon Explorers' },
    { id: 'rarity', label: 'Rarity' },
    { id: 'geography', label: 'Geography' },
    { id: 'time', label: 'Time & Seasons' },
  ];

  const handleFilterChange = (filterId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filterId === 'all') {
      params.delete('category');
    } else {
      params.set('category', filterId);
    }
    router.push(`/badges?${params.toString()}`);
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
