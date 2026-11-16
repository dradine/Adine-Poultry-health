import { describe, expect, it } from 'vitest';
import { calculateIbdWindow, parseTiters } from './ibd';

describe('IBD preliminary calculator', () => {
  it('calculates a log2 percentile and preliminary age', () => {
    const result = calculateIbdWindow({
      samplingAgeDays: 10,
      breakthroughTiter: 128,
      halfLifeDays: 3,
      susceptiblePercent: 50,
      titers: [64, 128, 256, 512],
    });
    expect(result.log2PercentileTiter).toBe(7.5);
    expect(result.estimatedVaccinationAgeDays).toBe(11.5);
    expect(result.sampleCount).toBe(4);
  });

  it('accepts Persian digits in individual titre entry', () => {
    expect(parseTiters('۱۲۸، ۲۵۶')).toEqual([128, 256]);
  });

  it('does not silently accept invalid or zero titres', () => {
    const titers = parseTiters('128,نامعتبر,0');
    expect(() => calculateIbdWindow({
      samplingAgeDays: 10,
      breakthroughTiter: 128,
      halfLifeDays: 3,
      susceptiblePercent: 75,
      titers,
    })).toThrow();
  });
});