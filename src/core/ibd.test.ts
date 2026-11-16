import { describe, expect, it } from 'vitest'
import { calculateIbdWindow, calculateIbdSensitivity, parseTiters, validateIbdRunGate } from './ibd'
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
    expect(r.thresholdAlreadyReachedAtSampling).toBe(true); expect(r.estimatedVaccinationAgeDays).toBeNull()
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

describe('Deventer sensitivity analysis', () => {
  it('shows distinct vaccination ages for different directly receptive flock fractions', () => {
    const r=calculateIbdSensitivity({samplingAgeDays:2,breakthroughTiter:125,halfLifeDays:3,titers:[1224,1456,1556,1890,1985,2268,2397,2439,2648,2890,3025,3066,3288,3566,4027,4582,4899,5212,5557,6209],susceptiblePercent:5,correctionDays:2,minimumSampleCount:18})
    expect(r.map(x=>x.susceptiblePercent)).toEqual([5,25,75,90])
    expect(r.every(x => x.vaccinationAgeDays !== null)).toBe(true)
    expect(r[0].vaccinationAgeDays!).toBeLessThan(r[1].vaccinationAgeDays!)
    expect(r[1].vaccinationAgeDays!).toBeLessThan(r[2].vaccinationAgeDays!)
    expect(r[2].vaccinationAgeDays!).toBeLessThan(r[3].vaccinationAgeDays!)
  })
})

describe('IBD numerical and boundary safety', () => {
  const valid = { samplingAgeDays: 14, breakthroughTiter: 500, halfLifeDays: 3.8, susceptiblePercent: 5, titers: sample23 }
  it.each([0, -1, 100, NaN, Infinity])('rejects invalid susceptible fraction %s', (p) => {
    expect(() => calculateIbdWindow({ ...valid, susceptiblePercent: p })).toThrow()
  })
  it.each([0, -1, NaN, Infinity])('rejects invalid BTT %s', (btt) => {
    expect(() => calculateIbdWindow({ ...valid, breakthroughTiter: btt })).toThrow()
  })
  it.each([0, -1, NaN, Infinity])('rejects invalid half-life %s', (halfLifeDays) => {
    expect(() => calculateIbdWindow({ ...valid, halfLifeDays })).toThrow()
  })
  it('rejects NaN and infinite titers instead of silently calculating', () => {
    expect(() => calculateIbdWindow({ ...valid, titers: [...sample23.slice(0,22), NaN] })).toThrow()
    expect(() => calculateIbdWindow({ ...valid, titers: [...sample23.slice(0,22), Infinity] })).toThrow()
  })
  it('handles tied titers deterministically and returns a valid observed rank', () => {
    const tied = Array(23).fill(256)
    const r = calculateIbdWindow({ ...valid, titers: tied, susceptiblePercent: 5 })
    expect(r.percentileTiter).toBe(256)
    expect(r.percentileRank).toBe(2)
    expect(r.minimumTiter).toBe(256)
    expect(r.maximumTiter).toBe(256)
    expect(r.log2StandardDeviation).toBe(0)
  })
  it('uses exact nearest-rank boundary at 100 percent exclusion', () => {
    const r = calculateIbdWindow({ ...valid, susceptiblePercent: 99.9 })
    expect(r.percentileRank).toBe(23)
    expect(r.percentileTiter).toBe(Math.max(...sample23))
  })
  it('rejects correction days outside supported range and fractional minimum count', () => {
    expect(() => calculateIbdWindow({ ...valid, correctionDays: 4.01 })).toThrow()
    expect(() => calculateIbdWindow({ ...valid, minimumSampleCount: 2.5 })).toThrow()
  })
  it('normalizes Arabic/Persian digits and decimal separators without changing signs', () => {
    expect(parseTiters('۱۲٫۵، ١٢٫٥')).toEqual([12.5, 12.5])
    expect(parseTiters('-۱۲')).toEqual([-12])
  })
  it('exposes malformed tokens as NaN so calculation gate can reject them', () => {
    expect(parseTiters('۱۲۸، xyz')).toEqual([128, NaN])
    expect(() => calculateIbdWindow({ ...valid, titers: parseTiters('128 xyz') })).toThrow()
  })
})

describe('IBD percentile and extreme input regression', () => {
  it('uses first observation for a percentile whose rank rounds to zero', () => {
    const r = calculateIbdWindow({samplingAgeDays:2,breakthroughTiter:100,halfLifeDays:3,susceptiblePercent:0.01,titers:sample23})
    expect(r.percentileRank).toBe(1)
    expect(r.percentileTiter).toBe(Math.min(...sample23))
  })
  it('rejects biologically implausible age and numeric overflow titers', () => {
    expect(() => calculateIbdWindow({samplingAgeDays:366,breakthroughTiter:100,halfLifeDays:3,susceptiblePercent:5,titers:sample23})).toThrow()
    expect(() => calculateIbdWindow({samplingAgeDays:2,breakthroughTiter:100,halfLifeDays:3,susceptiblePercent:5,titers:[...sample23.slice(0,22),1e100]})).toThrow()
  })
})
