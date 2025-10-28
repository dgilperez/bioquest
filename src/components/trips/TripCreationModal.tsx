'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, MapPin, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationRecommendation } from '@/lib/explore/recommendations-optimized';
import { toast } from 'sonner';

interface TripCreationModalProps {
  location: LocationRecommendation;
  isOpen: boolean;
  onClose: () => void;
}

export function TripCreationModal({ location, isOpen, onClose }: TripCreationModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: `Trip to ${location.placeName}`,
    description: '',
    plannedDate: '',
    plannedTime: '08:00',
  });

  // Initialize target species from location's top targets
  const [selectedTargets, setSelectedTargets] = useState<Set<number>>(
    new Set(location.topTargets.map(t => t.taxonId))
  );

  const [targetPriorities, setTargetPriorities] = useState<Record<number, number>>(
    location.topTargets.reduce((acc, t) => ({ ...acc, [t.taxonId]: 3 }), {})
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time
      const plannedDateTime = formData.plannedDate && formData.plannedTime
        ? new Date(`${formData.plannedDate}T${formData.plannedTime}`)
        : null;

      // Prepare target species data
      const targetSpecies = location.topTargets
        .filter(t => selectedTargets.has(t.taxonId))
        .map(t => ({
          taxonId: t.taxonId,
          taxonName: t.taxonName,
          commonName: t.commonName,
          iconicTaxon: t.iconicTaxon,
          priority: targetPriorities[t.taxonId] || 3,
        }));

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: location.placeId,
          title: formData.title,
          description: formData.description || undefined,
          plannedDate: plannedDateTime?.toISOString(),
          targetSpecies,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create trip');
      }

      const { trip } = await response.json();
      toast.success('Trip created! 🎉');
      onClose();
      router.push(`/trips/${trip.id}`);
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTarget = (taxonId: number) => {
    const newSelected = new Set(selectedTargets);
    if (newSelected.has(taxonId)) {
      newSelected.delete(taxonId);
    } else {
      newSelected.add(taxonId);
    }
    setSelectedTargets(newSelected);
  };

  const setPriority = (taxonId: number, priority: number) => {
    setTargetPriorities(prev => ({ ...prev, [taxonId]: priority }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white dark:bg-gray-800 p-6">
          <h2 className="text-2xl font-display font-bold">Plan Trip</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Location Info */}
          <div className="p-4 rounded-lg bg-nature-50 dark:bg-nature-900/20 border border-nature-200 dark:border-nature-700">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-nature-600 mt-0.5" />
              <div>
                <h3 className="font-semibold">{location.placeName}</h3>
                <p className="text-sm text-muted-foreground">{location.displayName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {location.distance} miles away · {location.newSpeciesPossible} new species possible
                </p>
              </div>
            </div>
          </div>

          {/* Trip Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Trip Name</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-nature-500"
              required
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Planned Date
              </label>
              <input
                type="date"
                value={formData.plannedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, plannedDate: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-nature-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time (optional)</label>
              <input
                type="time"
                value={formData.plannedTime}
                onChange={(e) => setFormData(prev => ({ ...prev, plannedTime: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-nature-500"
              />
            </div>
          </div>

          {/* Trip Goals */}
          <div>
            <label className="block text-sm font-medium mb-2">Trip Goals (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="What do you hope to find or observe on this trip?"
              className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 focus:ring-2 focus:ring-nature-500 resize-none"
            />
          </div>

          {/* Target Species */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-nature-600" />
              <label className="text-sm font-medium">Target Species</label>
              <span className="text-xs text-muted-foreground">
                ({selectedTargets.size} selected)
              </span>
            </div>

            <div className="space-y-2">
              {location.topTargets.map((target) => {
                const isSelected = selectedTargets.has(target.taxonId);
                const priority = targetPriorities[target.taxonId] || 3;

                return (
                  <div
                    key={target.taxonId}
                    className={`p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-nature-500 bg-nature-50 dark:bg-nature-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTarget(target.taxonId)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {target.commonName || target.taxonName}
                        </div>
                        {target.commonName && (
                          <div className="text-xs italic text-muted-foreground">
                            {target.taxonName}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {target.observationCount} observations at this location
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setPriority(target.taxonId, star)}
                              className={`text-lg ${
                                star <= priority ? 'text-yellow-500' : 'text-gray-300'
                              }`}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          {location.bestSeasons && location.bestSeasons[0] && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
              <h4 className="text-sm font-semibold mb-2">💡 Tips for this location:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Best season: {location.bestSeasons[0].season} ({location.bestSeasons[0].months})</li>
                <li>• Recent activity: {location.recentActivity} ({location.recentObservationCount} obs. in 30 days)</li>
                {location.rareSpeciesCounts.legendary > 0 && (
                  <li>• {location.rareSpeciesCounts.legendary} legendary species possible!</li>
                )}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Trip & View Details'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
