import { describe, it, expect } from '@jest/globals';
import { rankLevel } from '../../../src/lib/oncokb/client';

describe('OncoKB Client', () => {
  describe('rankLevel', () => {
    it('should rank levels correctly', () => {
      expect(rankLevel('1')).toBeGreaterThan(rankLevel('2'));
      expect(rankLevel('2')).toBeGreaterThan(rankLevel('3'));
      expect(rankLevel('3')).toBeGreaterThan(rankLevel('4'));
      expect(rankLevel('4')).toBeGreaterThan(rankLevel('R1'));
      expect(rankLevel('R1')).toBeGreaterThan(rankLevel('R2'));
      expect(rankLevel('R2')).toBeGreaterThan(rankLevel('Dx1'));
      expect(rankLevel('Dx1')).toBeGreaterThan(rankLevel('Px1'));
      expect(rankLevel(null)).toBe(0);
      expect(rankLevel('Unknown')).toBe(0);
    });
  });
});
