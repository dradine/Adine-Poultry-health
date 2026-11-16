import { describe, expect, it } from 'vitest'
import { monitorNdHi } from './ndMonitor'

const base = {
  assayAntigen: 'LaSota',
  vaccineProduct: 'live ND',
  route: 'eye drop',
  samplingDaysAfterDose: 14,
}

describe('ND HI monitor', () => {
  it('computes paired log2 rise and response fraction', () => {
    const result = monitorNdHi({
      ...base,
      baselineHiLog2: [2, 3, 4],
      postHiLog2: [4, 5, 6],
      responseThresholdLog2: 5,
    })
    expect(result.geometricMeanLog2).toBe(5)
    expect(result.meanLog2Rise).toBe(2)
    expect(result.fourfoldRisePercent).toBe(100)
    expect(result.responderPercent).toBeCloseTo(66.666)
  })
  it('rejects unpaired array sizes', () => {
    expect(() => monitorNdHi({ ...base, baselineHiLog2: [2], postHiLog2: [2, 3] })).toThrow()
  })
  it('does not report zero responders when no threshold is supplied', () => {
    const result = monitorNdHi({ ...base, postHiLog2: [2, 3] })
    expect(result.responders).toBeNull()
    expect(result.responderPercent).toBeNull()
    expect(result.warnings.join()).toContain('محاسبه نشده')
  })
})
