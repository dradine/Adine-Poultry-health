import { describe, expect, it } from 'vitest'
import { calculateIbdWindow, parseTiters, validateIbdRunGate } from './ibd'
const sample23 = Array.from({ length: 23 }, (_, i) => 100 * (2 ** (i % 5)))
describe('IBD Deventer-style mathematical estimator', () => {
  it('uses nearest-rank observed titre and applies correction days', () => {
    const r=calculateIbdWindow({samplingAgeDays:2,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:50,titers:sample23,correctionDays:2})
    expect(r.sampleCount).toBe(23); expect(r.percentileTiter).toBe(400)
    expect(r.estimatedVaccinationAgeDays).toBeGreaterThan(2); expect(r.coefficientOfVariationPercent).toBeGreaterThan(0)
    expect(r.geometricMeanTiter).toBeGreaterThan(0)
    expect(r.medianTiter).toBeGreaterThan(0)
    expect(r.log2StandardDeviation).toBeGreaterThan(0)
    expect(r.minimumTiter).toBe(100)
    expect(r.maximumTiter).toBe(1600)
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

describe('IBD assay quality gate', () => {
  it('blocks calculation unless all three independent checks are confirmed', () => {
    expect(validateIbdRunGate({plateControlsAccepted:false,representativeRandomSampling:false,assayVaccinePairingVerified:false})).toHaveLength(3)
    expect(validateIbdRunGate({plateControlsAccepted:true,representativeRandomSampling:true,assayVaccinePairingVerified:true})).toEqual([])
  })
  it('identifies each missing QC prerequisite', () => {
    const errors=validateIbdRunGate({plateControlsAccepted:true,representativeRandomSampling:false,assayVaccinePairingVerified:false})
    expect(errors).toHaveLength(2)
    expect(errors.join(' ')).toContain('نمونه‌گیری تصادفی')
    expect(errors.join(' ')).toContain('تطابق دقیق BTT')
  })
})

describe('published Deventer reference example', () => {
  const elancoTiters = [1224,1456,1556,1890,1985,2268,2397,2439,2648,2890,3025,3066,3288,3566,4027,4582,4899,5212,5557,6209]
  it('reproduces the published 75% susceptible scenario for 2-day sampling', () => {
    const r=calculateIbdWindow({samplingAgeDays:2,breakthroughTiter:125,halfLifeDays:3,susceptiblePercent:75,titers:elancoTiters,correctionDays:2,minimumSampleCount:18})
    expect(r.percentileRank).toBe(15)
    expect(r.percentileTiter).toBe(4027)
    expect(r.estimatedVaccinationAgeDays).toBeCloseTo(19.03,1)
  })
  it('keeps Elanco 5% field-spread default distinct from a 75% susceptible scenario', () => {
    const r=calculateIbdWindow({samplingAgeDays:2,breakthroughTiter:125,halfLifeDays:3,susceptiblePercent:5,titers:elancoTiters,correctionDays:2,minimumSampleCount:18})
    expect(r.percentileRank).toBe(1)
    expect(r.percentileTiter).toBe(1224)
    expect(r.estimatedVaccinationAgeDays).toBeLessThan(19.03)
  })
})
