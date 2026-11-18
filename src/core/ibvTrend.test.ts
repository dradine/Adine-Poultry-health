import { describe, expect, it } from 'vitest'
import { analyzeIbvTrend } from './ibvTrend'

describe('IBV trend', () => {
  it('orders observations and calculates numeric ELISA ratio', () => {
    const result = analyzeIbvTrend({
      observations: [{ day: 28, value: 900 }, { day: 14, value: 300 }],
      assay: 'ELISA kit A',
      measurementScale: 'kit-derived titre',
      unit: 'ELISA',
    })
    expect(result.firstValue).toBe(300)
    expect(result.lastToFirstRatio).toBe(3)
    expect(result.direction).toBe('up')
  })
  it('converts HI-log2 difference to reciprocal fold change', () => {
    const result = analyzeIbvTrend({
      observations: [{ day: 14, value: 2 }, { day: 28, value: 4 }],
      assay: 'HI antigen X',
      measurementScale: 'log2 endpoint',
      unit: 'HI-log2',
    })
    expect(result.lastToFirstRatio).toBe(4)
  })
  it('allows zero HI-log2 endpoints', () => {
    const result = analyzeIbvTrend({
      observations: [{ day: 1, value: 0 }, { day: 2, value: 2 }],
      assay: 'HI antigen X',
      measurementScale: 'log2 endpoint',
      unit: 'HI-log2',
    })
    expect(result.lastToFirstRatio).toBe(4)
  })
  it('rejects duplicate days', () => {
    expect(() => analyzeIbvTrend({
      observations: [{ day: 1, value: 2 }, { day: 1, value: 3 }],
      assay: 'x',
      measurementScale: 'log2 endpoint',
      unit: 'HI-log2',
    })).toThrow()
  })
  it('requires an explicit ELISA scale instead of conflating OD, S/P and kit titre', () => {
    expect(() => analyzeIbvTrend({ observations:[{day:1,value:0.8},{day:14,value:1.2}], assay:'ELISA kit A', measurementScale:'', unit:'ELISA' })).toThrow(/مقیاس دقیق/)
  })
  it('labels variability across time points rather than assay precision or flock CV', () => {
    const result = analyzeIbvTrend({ observations:[{day:1,value:100},{day:14,value:200},{day:28,value:150}], assay:'ELISA kit A', measurementScale:'OD450', unit:'ELISA' })
    expect(result.warnings.join(' ')).toContain('نه CV تحلیلی کیت')
    expect(result.warnings.join(' ')).toContain('fold antibody')
    expect(result.temporalCvPercent).not.toBeNull()
  })
  it('does not use an arbitrary 5% change as a universal stability threshold', () => {
    const result = analyzeIbvTrend({ observations:[{day:1,value:1000},{day:14,value:1020}], assay:'ELISA kit A', measurementScale:'kit-derived titre', unit:'ELISA' })
    expect(result.direction).toBe('up')
    expect(result.warnings.join(' ')).toContain('عدم‌قطعیت تحلیلی')
  })

})
