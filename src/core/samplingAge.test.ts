import { describe, expect, it } from 'vitest'
import { calculateSamplingAgeFromHatch } from './samplingAge'

describe('hatch-based sampling age', () => {
  it.each([
    ['2026-11-01', '2026-11-01', 0],
    ['2026-11-01', '2026-11-03', 2],
    ['2026-11-01', '2026-11-05', 4],
    ['2024-02-28', '2024-03-01', 2],
  ])('calculates calendar age from hatch (%s → %s)', (hatch, sample, expected) => {
    expect(calculateSamplingAgeFromHatch(hatch, sample)).toBe(expected)
  })
  it('rejects a sample date before hatch', () => {
    expect(() => calculateSamplingAgeFromHatch('2026-11-05', '2026-11-04')).toThrow(/قبل از تاریخ هچ/)
  })
  it('rejects impossible calendar dates', () => {
    expect(() => calculateSamplingAgeFromHatch('2026-02-30', '2026-03-02')).toThrow(/معتبر نیست/)
  })
})
