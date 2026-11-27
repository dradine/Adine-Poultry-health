import { describe, expect, it } from 'vitest'
import { calculateIbdWindow } from './ibd'
import { interpretIbdResult } from './ibdInterpretation'

const titers = Array.from({ length: 23 }, (_, i) => 100 * 2 ** (i % 5))
describe('educational IBD interpretation', () => {
  it('explains candidate day, formula, percentile, and limits in farmer and vet modes', () => {
    const input = { samplingAgeDays: 2, breakthroughTiter: 128, halfLifeDays: 3, susceptiblePercent: 75, correctionDays: 2, titers, assayMethod: 'ELISA', measurementScale: 'elisa-titer', minimumVaccinationAgeDays: 10 }
    const result = calculateIbdWindow(input)
    const x = interpretIbdResult(input, result, { assay: 'kit X', vaccine: 'live vaccine', bttSource: 'label p.2' })
    expect(x.status).toBe('label-minimum-floor')
    expect(x.farmer).toContain('تضمین‌کننده')
    expect(x.veterinarian.join(' ')).toContain('log₂')
    expect(x.veterinarian.join(' ')).toContain('رتبه مشاهده‌ای')
    expect(x.assumptions.join(' ')).toContain('HVT')
    expect(x.limitations.join(' ')).toContain('ایمنی سلولی')
    expect(x.nextActions.length).toBeGreaterThan(0)
  })
  it('does not present already-reached threshold as a future date', () => {
    const input = { samplingAgeDays: 14, breakthroughTiter: 4096, halfLifeDays: 3, susceptiblePercent: 75, titers, assayMethod: 'ELISA', measurementScale: 'elisa-titer', minimumVaccinationAgeDays: 10 }
    const result = calculateIbdWindow(input)
    const x = interpretIbdResult(input, result)
    expect(x.status).toBe('already-reached')
    expect(x.farmer).toContain('ممکن است رسیده')
    expect(x.nextActions.join(' ')).toContain('دستور واکسیناسیون فوری')
  })
})
