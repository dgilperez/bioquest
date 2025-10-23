import { Observation } from '@prisma/client';
import { getRarityEmoji, getRarityLabel, getRarityColor } from '@/lib/gamification/rarity';
import { formatRelativeTime } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface ObservationCardProps {
  observation: Observation;
}

export function ObservationCard({ observation }: ObservationCardProps) {
  const rarityColor = getRarityColor(observation.rarity);
  const rarityLabel = getRarityLabel(observation.rarity);
  const rarityEmoji = getRarityEmoji(observation.rarity);

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image placeholder or actual image */}
      <div className="h-48 bg-gradient-to-br from-nature-100 to-nature-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
        <span className="text-6xl">{observation.iconicTaxon ? '🌿' : '❓'}</span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Species Name */}
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">
            {observation.commonName || observation.taxonName || observation.speciesGuess || 'Unknown'}
          </h3>
          {observation.taxonName && observation.commonName && (
            <p className="text-sm text-muted-foreground italic line-clamp-1">
              {observation.taxonName}
            </p>
          )}
        </div>

        {/* Rarity Badge */}
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${rarityColor}`}>
            {rarityEmoji} {rarityLabel}
          </span>
          {observation.isFirstGlobal && (
            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 text-xs rounded-full font-semibold">
              First Ever!
            </span>
          )}
        </div>

        {/* Quality & Points */}
        <div className="flex items-center justify-between text-sm">
          <span className={`
            px-2 py-1 rounded text-xs font-medium
            ${observation.qualityGrade === 'research'
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
              : observation.qualityGrade === 'needs_id'
              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }
          `}>
            {observation.qualityGrade === 'research' ? 'Research Grade' :
             observation.qualityGrade === 'needs_id' ? 'Needs ID' : 'Casual'}
          </span>
          <span className="text-nature-600 font-semibold">
            +{observation.pointsAwarded} pts
          </span>
        </div>

        {/* Location & Date */}
        <div className="text-sm text-muted-foreground space-y-1">
          {observation.placeGuess && (
            <p className="line-clamp-1">📍 {observation.placeGuess}</p>
          )}
          <p>🕐 {formatRelativeTime(observation.observedOn)}</p>
        </div>

        {/* Link to iNaturalist */}
        <a
          href={`https://www.inaturalist.org/observations/${observation.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-nature-600 hover:text-nature-700 font-medium mt-2"
        >
          View on iNaturalist
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
