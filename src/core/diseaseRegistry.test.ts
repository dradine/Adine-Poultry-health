import { describe, expect, it } from 'vitest'
import { DISEASE_MODELS, getDiseaseModel } from './diseaseRegistry'

describe('disease model registry', () => {
  it('exposes only IBD as an available experimental calculator', () => {
    expect(DISEASE_MODELS.filter(m => m.status === 'experimental-available').map(m => m.id)).toEqual(['IBD'])
  })
  it('separates monitoring from vaccine timing/protection calculators', () => {
    expect(getDiseaseModel('ND').status).toBe('monitor-available')
    expect(getDiseaseModel('ND').method).toContain('monitor')
    expect(getDiseaseModel('IBV').status).toBe('monitor-available')
    expect(getDiseaseModel('IBV').scope).toContain('بدون protection')
    expect(getDiseaseModel('AIV').status).toBe('monitor-available')
    expect(getDiseaseModel('AIV').scope).toContain('نه تشخیص')
  })
  it('states the scope and limitation of IBD', () => {
    const ibd = getDiseaseModel('IBD')
    expect(ibd.method).toBe('Deventer-style')
    expect(ibd.reason).toContain('اعتبارسنجی')
  })
})
