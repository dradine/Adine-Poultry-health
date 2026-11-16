import { describe, expect, it } from 'vitest'
import { analyzeIbvTrend } from './ibvTrend'

describe('IBV trend', () => {
  it('orders observations and calculates numeric ELISA ratio', () => {
    const result = analyzeIbvTrend({
      observations: [{ day: 28, value: 900 }, { day: 14, value: 300 }],
      assay: 'ELISA',
      unit: 'ELISA',
    })
    expect(result.firstValue).toBe(300)
    expect(result.foldChange).toBe(3)
    expect(result.direction).toBe('up')
  })
  it('converts HI-log2 difference to reciprocal fold change', () => {
    const result = analyzeIbvTrend({
      observations: [{ day: 14, value: 2 }, { day: 28, value: 4 }],
      assay: 'HI antigen X',
      unit: 'HI-log2',
    })
    expect(result.foldChange).toBe(4)
  })
  it('allows zero HI-log2 endpoints', () => {
    const result = analyzeIbvTrend({
      observations: [{ day: 1, value: 0 }, { day: 2, value: 2 }],
      assay: 'HI antigen X',
      unit: 'HI-log2',
    })
    expect(result.foldChange).toBe(4)
  })
  it('rejects duplicate days', () => {
    expect(() => analyzeIbvTrend({
      observations: [{ day: 1, value: 2 }, { day: 1, value: 3 }],
      assay: 'x',
      unit: 'HI-log2',
    })).toThrow()
  })
})
