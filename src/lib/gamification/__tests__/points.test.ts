import { describe, it, expect } from 'vitest';
import { calculateObservationPoints, getPointsBreakdown } from '../points';
import { INatObservation } from '@/types';

describe('Points Calculation', () => {
  const baseObservation: INatObservation = {
    id: 1,
    species_guess: 'Test Species',
    observed_on: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    quality_grade: 'needs_id',
    user: {
      id: 1,
      login: 'testuser',
    },
  };

  describe('calculateObservationPoints', () => {
    it('should calculate base points correctly', () => {
      const result = calculateObservationPoints(baseObservation, false, 0);

      expect(result.basePoints).toBe(10);
      expect(result.totalPoints).toBe(10);
    });

    it('should add new species bonus', () => {
      const result = calculateObservationPoints(baseObservation, true, 0);

      expect(result.bonusPoints.newSpecies).toBe(50);
      expect(result.totalPoints).toBe(60);
    });

    it('should add rarity bonus', () => {
      const result = calculateObservationPoints(baseObservation, false, 100);

      expect(result.bonusPoints.rarity).toBe(100);
      expect(result.totalPoints).toBe(110);
    });

    it('should add research grade bonus', () => {
      const researchObservation = {
        ...baseObservation,
        quality_grade: 'research' as const,
      };

      const result = calculateObservationPoints(researchObservation, false, 0);

      expect(result.bonusPoints.researchGrade).toBe(25);
      expect(result.totalPoints).toBe(35);
    });

    it('should add photo bonus (1 photo)', () => {
      const obsWithPhotos = {
        ...baseObservation,
        photos: [{ id: 1, url: 'test.jpg' }],
      };

      const result = calculateObservationPoints(obsWithPhotos, false, 0);

      expect(result.bonusPoints.photos).toBe(5);
      expect(result.totalPoints).toBe(15);
    });

    it('should add photo bonus (3 photos)', () => {
      const obsWithPhotos = {
        ...baseObservation,
        photos: [
          { id: 1, url: 'test1.jpg' },
          { id: 2, url: 'test2.jpg' },
          { id: 3, url: 'test3.jpg' },
        ],
      };

      const result = calculateObservationPoints(obsWithPhotos, false, 0);

      expect(result.bonusPoints.photos).toBe(15);
      expect(result.totalPoints).toBe(25);
    });

    it('should cap photo bonus at 3 photos', () => {
      const obsWithPhotos = {
        ...baseObservation,
        photos: [
          { id: 1, url: 'test1.jpg' },
          { id: 2, url: 'test2.jpg' },
          { id: 3, url: 'test3.jpg' },
          { id: 4, url: 'test4.jpg' },
          { id: 5, url: 'test5.jpg' },
        ],
      };

      const result = calculateObservationPoints(obsWithPhotos, false, 0);

      expect(result.bonusPoints.photos).toBe(15); // Max 3 * 5
      expect(result.totalPoints).toBe(25);
    });

    it('should calculate all bonuses combined', () => {
      const premiumObservation = {
        ...baseObservation,
        quality_grade: 'research' as const,
        photos: [
          { id: 1, url: 'test1.jpg' },
          { id: 2, url: 'test2.jpg' },
        ],
      };

      const result = calculateObservationPoints(premiumObservation, true, 500);

      expect(result.basePoints).toBe(10);
      expect(result.bonusPoints.newSpecies).toBe(50);
      expect(result.bonusPoints.rarity).toBe(500);
      expect(result.bonusPoints.researchGrade).toBe(25);
      expect(result.bonusPoints.photos).toBe(10);
      expect(result.totalPoints).toBe(595);
    });

    it('should handle legendary first-ever find', () => {
      const legendaryObservation = {
        ...baseObservation,
        quality_grade: 'research' as const,
        photos: [
          { id: 1, url: 'test1.jpg' },
          { id: 2, url: 'test2.jpg' },
          { id: 3, url: 'test3.jpg' },
        ],
      };

      const result = calculateObservationPoints(legendaryObservation, true, 1000);

      // Base 10 + New Species 50 + Rarity 1000 + Research 25 + Photos 15 = 1100
      expect(result.totalPoints).toBe(1100);
    });
  });

  describe('getPointsBreakdown', () => {
    it('should return breakdown with base points only', () => {
      const calculation = calculateObservationPoints(baseObservation, false, 0);
      const breakdown = getPointsBreakdown(calculation);

      expect(breakdown).toEqual(['Base: 10 pts']);
    });

    it('should include all applicable bonuses', () => {
      const premiumObservation = {
        ...baseObservation,
        quality_grade: 'research' as const,
        photos: [{ id: 1, url: 'test.jpg' }],
      };

      const calculation = calculateObservationPoints(premiumObservation, true, 100);
      const breakdown = getPointsBreakdown(calculation);

      expect(breakdown).toContain('Base: 10 pts');
      expect(breakdown).toContain('New Species: +50 pts');
      expect(breakdown).toContain('Rarity: +100 pts');
      expect(breakdown).toContain('Research Grade: +25 pts');
      expect(breakdown).toContain('Photos: +5 pts');
    });

    it('should not include zero bonuses', () => {
      const calculation = calculateObservationPoints(baseObservation, false, 0);
      const breakdown = getPointsBreakdown(calculation);

      expect(breakdown).not.toContain('New Species');
      expect(breakdown).not.toContain('Rarity');
      expect(breakdown).not.toContain('Research Grade');
      expect(breakdown).not.toContain('Photos');
    });
  });
});
