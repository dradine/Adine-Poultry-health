import { describe, expect, it } from 'vitest'
import { matchAssay } from './assayMatcher'

describe('assay catalog matching', () => {
  it('matches only exact manufacturer + catalog code (case/spacing tolerant)', () => {
    const result = matchAssay({ manufacturer: 'biochek', catalog: ' ck-113 ' })
    expect(result.exact?.id).toBe('biochek-ck113-ibd')
    expect(result.calculationAllowed).toBe(false)
  })

  it('does not exact-match by name alone', () => {
    const result = matchAssay({ manufacturer: 'BioChek', name: 'FlockChek IBD ELISA' })
    expect(result.exact).toBeNull()
    expect(result.suggestions.length).toBeGreaterThan(0)
    expect(result.calculationAllowed).toBe(false)
  })

  it('does not match a catalog code under a different manufacturer', () => {
    const result = matchAssay({ manufacturer: 'Other', catalog: 'CK113' })
    expect(result.exact).toBeNull()
    expect(result.calculationAllowed).toBe(false)
  })
})
