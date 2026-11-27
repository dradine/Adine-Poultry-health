import { describe, expect, it } from 'vitest'
import { calculateIbdWindow as calculateIbdWindowCore, calculateIbdSensitivity, calculateVaccinationTiming, parseTiters, validateIbdRunGate, validateIbdDeventerProductGate } from './ibd'
const calculateIbdWindow = (input: Parameters<typeof calculateIbdWindowCore>[0]) => calculateIbdWindowCore({ assayMethod: 'ELISA', measurementScale: 'elisa-titer', minimumVaccinationAgeDays: 10, ...input })
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
    expect(r.warnings.some(w=>w.includes('مشاهده از انتهای پایین'))).toBe(true)
  })
  it('allows undersized samples for exploratory calculations and emits strong warnings', () => {
    const r=calculateIbdWindow({samplingAgeDays:10,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:75,titers:[64,128,256]})
    expect(r.sampleCount).toBe(3)
    expect(r.warnings.join(' ')).toContain('صرفاً اکتشافی')
    expect(r.warnings.join(' ')).toContain('n<10')
  })
  it('flags a threshold already reached at sampling', () => {
    const r=calculateIbdWindow({samplingAgeDays:14,breakthroughTiter:4096,halfLifeDays:3,susceptiblePercent:75,titers:sample23})
    expect(r.thresholdAlreadyReachedAtSampling).toBe(true); expect(r.estimatedVaccinationAgeDays).toBeNull()
  })
  it('accepts Persian digits',()=>expect(parseTiters('۱۲۸، ۲۵۶')).toEqual([128,256]))
  it('applies the product label minimum age as a hard floor', () => {
    const rawBeforeLabel = calculateIbdWindow({ samplingAgeDays: 2, breakthroughTiter: 500, halfLifeDays: 5, susceptiblePercent: 5, titers: Array(20).fill(1000), minimumVaccinationAgeDays: 10 })
    expect(rawBeforeLabel.estimatedVaccinationAgeDays).toBe(7)
    expect(rawBeforeLabel.labelConstrainedVaccinationAgeDays).toBe(10)
    expect(rawBeforeLabel.labelMinimumApplied).toBe(true)
    const rawAfterLabel = calculateIbdWindow({ samplingAgeDays: 2, breakthroughTiter: 500, halfLifeDays: 5, susceptiblePercent: 5, titers: Array(20).fill(2000), minimumVaccinationAgeDays: 10 })
    expect(rawAfterLabel.labelConstrainedVaccinationAgeDays).toBe(12)
    expect(rawAfterLabel.labelMinimumApplied).toBe(false)
  })
  it('keeps the label minimum even when BTT is already reached at sampling', () => {
    const result = calculateIbdWindow({ samplingAgeDays: 2, breakthroughTiter: 500, halfLifeDays: 5, susceptiblePercent: 5, titers: Array(20).fill(500), minimumVaccinationAgeDays: 10 })
    expect(result.estimatedVaccinationAgeDays).toBeNull()
    expect(result.labelConstrainedVaccinationAgeDays).toBe(10)
    expect(result.labelMinimumApplied).toBe(true)
  })
  it('uses the later of the model threshold and the product minimum age in calendar timing', () => {
    const floor = calculateVaccinationTiming({ currentTiter: 1000, breakthroughTiter: 500, halfLifeDays: 5, sampledAt: '2026-11-27T08:00:00Z', samplingAgeDays: 2, minimumVaccinationAgeDays: 10 })
    expect(floor.status).toBe('label-minimum-floor')
    expect(floor.hoursUntilThreshold).toBe(192)
    expect(floor.targetAt).toBe('2026-12-05T08:00:00.000Z')
    const modelLater = calculateVaccinationTiming({ currentTiter: 2000, breakthroughTiter: 500, halfLifeDays: 5, sampledAt: '2026-11-27T08:00:00Z', samplingAgeDays: 2, minimumVaccinationAgeDays: 10 })
    expect(modelLater.status).toBe('future-window')
    expect(modelLater.hoursUntilThreshold).toBe(240)
    const alreadyEligible = calculateVaccinationTiming({ currentTiter: 500, breakthroughTiter: 500, halfLifeDays: 5, sampledAt: '2026-11-27T08:00:00Z', samplingAgeDays: 14, minimumVaccinationAgeDays: 10 })
    expect(alreadyEligible.status).toBe('threshold-already-reached')
    expect(alreadyEligible.targetAt).toBeNull()
  })
  it('rejects invalid or zero titres',()=>expect(()=>calculateIbdWindow({samplingAgeDays:10,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:75,titers:[...sample23.slice(0,22),0]})).toThrow())
  it('rejects non-ELISA methods and non-standardized titre scales', () => {
    const input = { samplingAgeDays: 10, breakthroughTiter: 128, halfLifeDays: 3, susceptiblePercent: 75, titers: sample23 }
    expect(() => calculateIbdWindow({ ...input, assayMethod: 'HI' })).toThrow(/ELISA/)
    expect(() => calculateIbdWindow({ ...input, measurementScale: 's-p' })).toThrow(/OD/)
  })
  it('rejects correction outside the 0-4 day sampling window',()=>expect(()=>calculateIbdWindow({samplingAgeDays:10,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:75,titers:sample23,correctionDays:1})).toThrow(/فقط برای نمونه‌گیری/))
  it('accepts a documented correction for day-old sampling',()=>expect(calculateIbdWindow({samplingAgeDays:2,breakthroughTiter:128,halfLifeDays:3,susceptiblePercent:75,titers:sample23,correctionDays:2}).estimatedVaccinationAgeDays).toBeGreaterThan(2))
  it('keeps an already-crossed BTT status even when positive age correction shifts the raw formula forward',()=>{const r=calculateIbdWindow({samplingAgeDays:2,breakthroughTiter:100,halfLifeDays:3,susceptiblePercent:50,titers:[80,90,95],correctionDays:2});expect(r.rawCalculatedAgeDays).toBeGreaterThan(2);expect(r.thresholdAlreadyReachedAtSampling).toBe(true);expect(r.estimatedVaccinationAgeDays).toBeNull();expect(r.warnings.join(' ')).toContain('اصلاح سن نمی‌تواند')})
})

describe('future vaccination timing window', () => {
  it('returns an exact hour/minute window and an ISO target timestamp', () => {
    const r = calculateVaccinationTiming({ currentTiter: 800, breakthroughTiter: 100, halfLifeDays: 3, sampledAt: '2026-11-27T08:00Z' })
    expect(r.status).toBe('future-window')
    expect(r.hoursUntilThreshold).toBe(216)
    expect(r.wholeHours).toBe(216)
    expect(r.remainingMinutes).toBe(0)
    expect(r.targetAt).toBe('2026-12-06T08:00:00.000Z')
  })
  it('keeps fractional hours as minutes and includes a documented correction', () => {
    const r = calculateVaccinationTiming({ currentTiter: 500, breakthroughTiter: 100, halfLifeDays: 3.8, correctionHours: 0.5, sampledAt: '2026-11-27T08:00Z' })
    expect(r.wholeHours).toBe(212)
    expect(r.remainingMinutes).toBe(16)
    expect(r.daysUntilThreshold).toBeCloseTo(8.844, 3)
  })
  it('does not create a future appointment when BTT is already reached', () => {
    const r = calculateVaccinationTiming({ currentTiter: 100, breakthroughTiter: 100, halfLifeDays: 3, sampledAt: '2026-11-27T08:00Z' })
    expect(r.status).toBe('threshold-already-reached')
    expect(r.targetAt).toBeNull()
  })
  it('rejects missing timestamps and non-positive inputs', () => {
    expect(() => calculateVaccinationTiming({ currentTiter: 100, breakthroughTiter: 10, halfLifeDays: 3, sampledAt: '' })).toThrow()
    expect(() => calculateVaccinationTiming({ currentTiter: 0, breakthroughTiter: 10, halfLifeDays: 3, sampledAt: '2026-11-27T08:00Z' })).toThrow()
  })
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
    const r=calculateIbdSensitivity({samplingAgeDays:2,breakthroughTiter:125,halfLifeDays:3,titers:[1224,1456,1556,1890,1985,2268,2397,2439,2648,2890,3025,3066,3288,3566,4027,4582,4899,5212,5557,6209],susceptiblePercent:5,correctionDays:2,minimumSampleCount:18,assayMethod:'ELISA',measurementScale:'elisa-titer',minimumVaccinationAgeDays:10})
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

describe('product-specific sample-size provenance', () => {
  it('does not silently assume a universal minimum sample count when product guidance is absent', () => {
    const r = calculateIbdWindow({
      samplingAgeDays: 10, breakthroughTiter: 128, halfLifeDays: 3,
      susceptiblePercent: 75, titers: sample23,
    })
    expect(r.sampleCount).toBe(23)
    expect(r.warnings.join(' ')).toContain('هیچ مقدار عمومی جایگزین نشده')
  })

  it('does not apply the BioChek 23-sample guidance to a product label specifying 18 chicks', () => {
    const source = 'UK VMD product information revised June 2026; AN 00716/2026 section 8'
    const r = calculateIbdWindow({
      samplingAgeDays: 2, breakthroughTiter: 500, halfLifeDays: 3.8,
      susceptiblePercent: 75, titers: Array.from({ length: 18 }, (_, i) => 100 + i * 10),
      minimumSampleCount: 18, minimumSampleCountSource: source,
    })
    expect(r.sampleCount).toBe(18)
    expect(r.warnings.join(' ')).toContain(source)
    expect(r.warnings.join(' ')).not.toContain('BioChek')
  })
  it('warns when a numeric sample-size threshold has no source', () => {
    const r = calculateIbdWindow({
      samplingAgeDays: 10, breakthroughTiter: 128, halfLifeDays: 3,
      susceptiblePercent: 75, titers: sample23, minimumSampleCount: 23,
    })
    expect(r.warnings.join(' ')).toContain('منبع حداقل تعداد نمونه ثبت نشده')
  })
})


describe('IBD Deventer product platform gate', () => {
  const valid = { diseaseCode:'IBD', platform:'live', modelFamily:'deventer_live', validationStatus:'documented', bttAssayKitId:'idexx-ibd', selectedAssayKitId:'idexx-ibd' }
  it('accepts only documented conventional live IBD with its exact BTT assay', () => {
    expect(validateIbdDeventerProductGate(valid)).toEqual([])
  })
  it.each([
    [{...valid, platform:'immune_complex'}, 'immune-complex'],
    [{...valid, platform:'vector_hvt', modelFamily:'hvt_vp2'}, 'HVT-VP2'],
    [{...valid, validationStatus:'unverified'}, 'مستند'],
    [{...valid, selectedAssayKitId:'biochek-ck113'}, 'کیت دقیق'],
    [{...valid, diseaseCode:'IBV'}, 'IBD'],
  ])('blocks unsupported product/assay pairing', (input) => {
    expect(validateIbdDeventerProductGate(input).length).toBeGreaterThan(0)
  })
})
