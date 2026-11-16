import { describe, expect, it } from 'vitest'
import { calculateIbdWindow, parseTiters } from './ibd'
const sample23 = Array.from({ length: 23 }, (_, i) => 100 * (2 ** (i % 5)))
describe('IBD Deventer-style mathematical estimator', () => {
  it('uses nearest-rank observed titre and applies correction days', () => {
    const r=calculateIbdWindow({samplingAgeDays:2,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:50,titers:sample23,correctionDays:2})
    expect(r.sampleCount).toBe(23); expect(r.percentileTiter).toBe(400)
    expect(r.estimatedVaccinationAgeDays).toBeGreaterThan(2); expect(r.coefficientOfVariationPercent).toBeGreaterThan(0)
  })
  it('uses the 5 percent nearest-rank and warns about an unstable lower tail', () => {
    const r=calculateIbdWindow({samplingAgeDays:10,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:5,titers:sample23})
    expect(r.percentileRank).toBe(2)
    expect(r.warnings.some(w=>w.includes('سه نمونه'))).toBe(true)
  })
  it('rejects undersized samples', () => {
    expect(()=>calculateIbdWindow({samplingAgeDays:10,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:75,titers:[64,128,256]})).toThrow(/حداقل 23 نمونه/)
  })
  it('flags a threshold already reached at sampling', () => {
    const r=calculateIbdWindow({samplingAgeDays:14,breakthroughTiter:4096,halfLifeDays:3,susceptiblePercent:75,titers:sample23})
    expect(r.thresholdAlreadyReachedAtSampling).toBe(true); expect(r.estimatedVaccinationAgeDays).toBe(14)
  })
  it('accepts Persian digits',()=>expect(parseTiters('۱۲۸، ۲۵۶')).toEqual([128,256]))
  it('rejects invalid or zero titres',()=>expect(()=>calculateIbdWindow({samplingAgeDays:10,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:75,titers:[...sample23.slice(0,22),0]})).toThrow())
  it('rejects correction outside the 0-4 day sampling window',()=>expect(()=>calculateIbdWindow({samplingAgeDays:10,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:75,titers:sample23,correctionDays:1})).toThrow(/فقط برای نمونه‌گیری/))
  it('accepts a documented correction for day-old sampling',()=>expect(calculateIbdWindow({samplingAgeDays:2,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:75,titers:sample23,correctionDays:2}).estimatedVaccinationAgeDays).toBeGreaterThan(2))
})
