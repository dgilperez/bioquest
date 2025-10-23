'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ObservationFilters() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'legendary', label: '✨ Legendary' },
    { id: 'rare', label: '💎 Rare' },
    { id: 'research', label: '✅ Research Grade' },
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
