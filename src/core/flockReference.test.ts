import { describe, expect, it } from 'vitest'
import { validateClinicalObservation, validateFlockTimeSeries, validateVaccinationEvent } from './flockReference'

describe('flock reference records', () => {
  it('accepts a complete vaccination event without inventing optional values', () => {
    expect(validateVaccinationEvent({
      flock_id: 'flock-1', event_date: '2026-11-20', age_days: 14,
      disease_code: 'IBD', product_name: 'Product A', platform: 'live', route: 'drinking-water',
      coverage_percent: 95,
    })).toEqual([])
  })

  it('rejects invalid clinical percentages and incomplete required fields', () => {
    const errors = validateClinicalObservation({ flock_id: 'flock-1', observed_at: '2026-11-20', morbidity_percent: 101, mortality_percent: -1 })
    expect(errors).toContain('وضعیت بالینی الزامی است.')
    expect(errors).toContain('درصد ابتلا باید بین صفر و صد باشد.')
    expect(errors).toContain('درصد تلفات باید بین صفر و صد باشد.')
  })

  it('requires explicit unit and keeps negative values possible for metrics such as change', () => {
    expect(validateFlockTimeSeries({ flock_id: 'flock-1', observed_at: '2026-11-20', metric: 'production_change' as never, value: -4, unit: '%' })).toContain('نوع شاخص سری‌زمانی معتبر نیست.')
    expect(validateFlockTimeSeries({ flock_id: 'flock-1', observed_at: '2026-11-20', metric: 'egg_production', value: 100, unit: 'eggs/day' })).toEqual([])
    expect(validateFlockTimeSeries({ flock_id: 'flock-1', observed_at: '2026-11-20', metric: 'water', value: 100 })).toContain('واحد سری‌زمانی الزامی است.')
  })
})
