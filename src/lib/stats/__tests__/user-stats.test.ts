import { describe, it, expect } from 'vitest';
import { calculateLevel, getLevelTitle } from '../user-stats';

describe('User Stats', () => {
  describe('calculateLevel', () => {
    it('should start at level 1 with 0 points', () => {
      const result = calculateLevel(0);

      expect(result.level).toBe(1);
      expect(result.pointsToNextLevel).toBeGreaterThan(0);
    });

    it('should calculate level 1 correctly', () => {
      const result = calculateLevel(50);

      expect(result.level).toBe(1);
      // Level 2 requires 100 * (2 ^ 1.5) = 282 points
      expect(result.pointsToNextLevel).toBe(232); // 282 - 50
    });

    it('should advance to level 2 at 282 points', () => {
      const result = calculateLevel(282);

      expect(result.level).toBe(2);
    });

    it('should advance to level 3 at 519 points', () => {
      const result = calculateLevel(519);

      expect(result.level).toBe(3);
    });

    it('should handle exact level thresholds', () => {
      // Level 2 requires exactly 282 points
      const result = calculateLevel(282);

      expect(result.level).toBe(2);
      expect(result.pointsToNextLevel).toBeGreaterThan(0);
    });

    it('should calculate high levels correctly', () => {
      const result = calculateLevel(10000);

      expect(result.level).toBeGreaterThan(10);
      expect(result.pointsToNextLevel).toBeGreaterThan(0);
    });

    it('should have increasing point requirements', () => {
      const level5 = calculateLevel(1000);
      const level10 = calculateLevel(5000);

      expect(level10.level).toBeGreaterThan(level5.level);
    });

    it('should calculate points to next level correctly', () => {
      const result = calculateLevel(500);

      // Should be close to leveling up
      const nextLevelPoints = 500 + result.pointsToNextLevel;
      const nextLevel = calculateLevel(nextLevelPoints);

      expect(nextLevel.level).toBe(result.level + 1);
    });
  });

  describe('getLevelTitle', () => {
    it('should return Novice Naturalist for level 1', () => {
      expect(getLevelTitle(1)).toBe('Novice Naturalist');
    });

    it('should return Novice Naturalist for levels 1-4', () => {
      expect(getLevelTitle(2)).toBe('Novice Naturalist');
      expect(getLevelTitle(3)).toBe('Novice Naturalist');
      expect(getLevelTitle(4)).toBe('Novice Naturalist');
    });

    it('should return Amateur Naturalist for levels 5-9', () => {
      expect(getLevelTitle(5)).toBe('Amateur Naturalist');
      expect(getLevelTitle(7)).toBe('Amateur Naturalist');
      expect(getLevelTitle(9)).toBe('Amateur Naturalist');
    });

    it('should return Field Naturalist for levels 10-14', () => {
      expect(getLevelTitle(10)).toBe('Field Naturalist');
      expect(getLevelTitle(12)).toBe('Field Naturalist');
      expect(getLevelTitle(14)).toBe('Field Naturalist');
    });

    it('should return Expert Naturalist for levels 15-19', () => {
      expect(getLevelTitle(15)).toBe('Expert Naturalist');
      expect(getLevelTitle(17)).toBe('Expert Naturalist');
      expect(getLevelTitle(19)).toBe('Expert Naturalist');
    });

    it('should return Master Naturalist for levels 20-29', () => {
      expect(getLevelTitle(20)).toBe('Master Naturalist');
      expect(getLevelTitle(25)).toBe('Master Naturalist');
      expect(getLevelTitle(29)).toBe('Master Naturalist');
    });

    it('should return Elite Naturalist for levels 30-39', () => {
      expect(getLevelTitle(30)).toBe('Elite Naturalist');
      expect(getLevelTitle(35)).toBe('Elite Naturalist');
      expect(getLevelTitle(39)).toBe('Elite Naturalist');
    });

    it('should return Legendary Naturalist for level 40+', () => {
      expect(getLevelTitle(40)).toBe('Legendary Naturalist');
      expect(getLevelTitle(50)).toBe('Legendary Naturalist');
      expect(getLevelTitle(100)).toBe('Legendary Naturalist');
    });

    it('should handle edge cases', () => {
      expect(getLevelTitle(0)).toBe('Novice Naturalist'); // Invalid but handled
      expect(getLevelTitle(-1)).toBe('Novice Naturalist'); // Invalid but handled
    });
  });

  describe('Level progression', () => {
    it('should have exponential growth', () => {
      const levels = [1, 2, 3, 4, 5, 10, 20, 30];
      const pointsNeeded: number[] = [];

      for (const level of levels) {
        // Calculate points needed for this level
        let points = 0;
        while (calculateLevel(points).level < level) {
          points += 100;
        }
        pointsNeeded.push(points);
      }

      // Verify it's exponential (each level requires more than previous)
      for (let i = 1; i < pointsNeeded.length; i++) {
        expect(pointsNeeded[i]).toBeGreaterThan(pointsNeeded[i - 1]);
      }
    });

    it('should require significant effort for high levels', () => {
      // Level 20 should require many thousands of points
      let points = 0;
      while (calculateLevel(points).level < 20) {
        points += 100;
      }

      expect(points).toBeGreaterThan(8000);
    });
  });
});
