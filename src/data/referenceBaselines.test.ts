import { describe, expect, it } from 'vitest'
import { BASELINE_INTERPRETATION_RULES, REFERENCE_BASELINES, UNPARSED_REFERENCE_DOCUMENTS } from './referenceBaselines'

describe('source-traceable baseline registry', () => {
  it('contains BioChek worked examples with their population and method restrictions', () => {
    const broad = REFERENCE_BASELINES.find(x => x.id === 'biochek-ibd-broiler-35-45d-program123-95ci')
    const narrow = REFERENCE_BASELINES.find(x => x.id === 'biochek-ibd-broiler-35-45d-program123-narrow-example')
    expect(broad?.numericRange).toMatchObject({ low: 7000, high: 14000 })
    expect(broad?.ageWindow).toBe('35–45 days at sampling')
    expect(broad?.population).toContain('normal/healthy')
    expect(broad?.limitations.join(' ')).toContain('not a universal')
    expect(narrow?.numericRange).toMatchObject({ low: 8500, high: 14000 })
    expect(narrow?.numericRange?.method).not.toBe(broad?.numericRange?.method)
  })

  it('does not invent IDvet numeric values when the listed source PDF has not been parsed', () => {
    const idvet = UNPARSED_REFERENCE_DOCUMENTS.find(x => x.id === 'idvet-poultry-general-baselines-march2026')
    expect(idvet?.status).toContain('NOT been transcribed')
    expect(idvet).not.toHaveProperty('numericRange')
  })

  it('requires contextual matching and prevents universal protection claims', () => {
    expect(BASELINE_INTERPRETATION_RULES.join(' ')).toContain('not proof of individual-bird protection')
    expect(BASELINE_INTERPRETATION_RULES.join(' ')).toContain('Never compare raw OD')
  })
})
