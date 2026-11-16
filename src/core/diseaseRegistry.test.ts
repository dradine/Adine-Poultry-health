import { describe, expect, it } from 'vitest'
import { DISEASE_MODELS, getDiseaseModel } from './diseaseRegistry'

describe('disease model registry', () => {
  it('exposes only IBD as an available experimental calculator', () => {
    expect(DISEASE_MODELS.filter(m => m.status === 'experimental-available').map(m => m.id)).toEqual(['IBD'])
  })
  it('does not pretend ND, IB or AIV have calculators', () => {
    expect(getDiseaseModel('ND').status).toBe('research-only')
    expect(getDiseaseModel('IB').status).toBe('research-only')
    expect(getDiseaseModel('AIV').status).toBe('not-implemented')
  })
  it('states the scope and limitation of IBD', () => {
    const ibd = getDiseaseModel('IBD')
    expect(ibd.method).toBe('Deventer-style')
    expect(ibd.reason).toContain('اعتبارسنجی')
  })
})
