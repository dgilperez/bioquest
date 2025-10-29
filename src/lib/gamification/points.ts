import { INatObservation, PointsCalculation } from '@/types';
import { POINTS_CONFIG } from './constants';

/**
 * Calculate points for an observation with all bonuses
 */
export function calculateObservationPoints(
  observation: INatObservation,
  isNewSpeciesForUser: boolean,
  rarityBonusPoints: number
): PointsCalculation {
  const basePoints = POINTS_CONFIG.BASE_OBSERVATION_POINTS;

  const bonuses = {
    newSpecies: isNewSpeciesForUser ? POINTS_CONFIG.NEW_SPECIES_BONUS : 0,
    rarity: rarityBonusPoints,
    researchGrade: observation.quality_grade === 'research' ? POINTS_CONFIG.RESEARCH_GRADE_BONUS : 0,
    photos: Math.min(observation.photos?.length || 0, POINTS_CONFIG.MAX_PHOTO_BONUS) * POINTS_CONFIG.PHOTO_POINTS,
  };

  const totalPoints = basePoints + Object.values(bonuses).reduce((sum, val) => sum + val, 0);

  return {
    basePoints,
    bonusPoints: bonuses,
    totalPoints,
  };
}

/**
 * Calculate total points for a batch of observations
 */
export function calculateTotalPoints(calculations: PointsCalculation[]): number {
  return calculations.reduce((sum, calc) => sum + calc.totalPoints, 0);
}

/**
 * Get points breakdown text
 */
export function getPointsBreakdown(calculation: PointsCalculation): string[] {
  const breakdown: string[] = [`Base: ${calculation.basePoints} pts`];

  if (calculation.bonusPoints.newSpecies) {
    breakdown.push(`New Species: +${calculation.bonusPoints.newSpecies} pts`);
  }
  if (calculation.bonusPoints.rarity) {
    breakdown.push(`Rarity: +${calculation.bonusPoints.rarity} pts`);
  }
  if (calculation.bonusPoints.researchGrade) {
    breakdown.push(`Research Grade: +${calculation.bonusPoints.researchGrade} pts`);
  }
  if (calculation.bonusPoints.photos) {
    breakdown.push(`Photos: +${calculation.bonusPoints.photos} pts`);
  }

  return breakdown;
}
