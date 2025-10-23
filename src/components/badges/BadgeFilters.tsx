'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function BadgeFilters() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Badges' },
    { id: 'milestone', label: 'Milestones' },
    { id: 'taxon', label: 'Taxon Explorers' },
    { id: 'rarity', label: 'Rarity' },
    { id: 'geography', label: 'Geography' },
    { id: 'time', label: 'Time & Seasons' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(filter => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter(filter.id)}
          className={activeFilter === filter.id ? 'bg-nature-600' : ''}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
