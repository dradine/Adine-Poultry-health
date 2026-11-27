export type FlockReferenceEntity = 'vaccination_event' | 'clinical_observation' | 'time_series'
export type TimeSeriesMetric = 'water' | 'feed' | 'weight' | 'egg_production' | 'mortality' | 'temperature' | 'humidity'

export type VaccinationEventRecord = {
  id: string
  flock_id: string
  event_date: string
  age_days: number | null
  disease_code: 'IBD' | 'ND' | 'IBV' | 'AIV' | string
  product_name: string
  product_id?: string | null
  platform: string
  strain?: string | null
  route: string
  dose?: string | null
  coverage_percent?: number | null
  administration_quality?: string | null
  batch_lot?: string | null
  source_reference?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type ClinicalObservationRecord = {
  id: string
  flock_id: string
  observed_at: string
  status: string
  signs?: string | null
  morbidity_percent?: number | null
  mortality_percent?: number | null
  mortality_trend?: string | null
  feed_intake?: string | null
  water_intake?: string | null
  production_change?: string | null
  necropsy?: string | null
  direct_tests?: string | null
  medications?: string | null
  exposure_risks?: string | null
  clinical_course?: string | null
  source_reference?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type FlockTimeSeriesRecord = {
  id: string
  flock_id: string
  observed_at: string
  metric: TimeSeriesMetric
  value: number
  unit: string
  source_reference?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

const datePattern = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/
const isValidDate = (value: string) => datePattern.test(value) && Number.isFinite(Date.parse(value.includes('T') ? value : value + 'T00:00:00Z'))
const nonEmpty = (value: unknown) => typeof value === 'string' && value.trim().length > 0

function validatePercent(value: number | null | undefined, label: string): string | null {
  if (value === null || value === undefined) return null
  if (!Number.isFinite(value) || value < 0 || value > 100) return `${label} باید بین صفر و صد باشد.`
  return null
}

export function validateVaccinationEvent(event: Partial<VaccinationEventRecord>): string[] {
  const errors: string[] = []
  if (!nonEmpty(event.flock_id)) errors.push('شناسه گله الزامی است.')
  if (!nonEmpty(event.event_date) || !isValidDate(String(event.event_date))) errors.push('تاریخ رویداد واکسن معتبر نیست.')
  if (event.age_days !== null && event.age_days !== undefined && (!Number.isInteger(event.age_days) || event.age_days < 0 || event.age_days > 500)) errors.push('سن رویداد واکسن باید عدد صحیح بین صفر و ۵۰۰ روز باشد.')
  if (!nonEmpty(event.disease_code)) errors.push('بیماری رویداد واکسن الزامی است.')
  if (!nonEmpty(event.product_name)) errors.push('نام محصول واکسن الزامی است.')
  if (!nonEmpty(event.platform)) errors.push('پلتفرم واکسن الزامی است.')
  if (!nonEmpty(event.route)) errors.push('مسیر تجویز واکسن الزامی است.')
  const coverageError = validatePercent(event.coverage_percent, 'پوشش واکسن')
  if (coverageError) errors.push(coverageError)
  return errors
}

export function validateClinicalObservation(observation: Partial<ClinicalObservationRecord>): string[] {
  const errors: string[] = []
  if (!nonEmpty(observation.flock_id)) errors.push('شناسه گله الزامی است.')
  if (!nonEmpty(observation.observed_at) || !isValidDate(String(observation.observed_at))) errors.push('تاریخ مشاهده بالینی معتبر نیست.')
  if (!nonEmpty(observation.status)) errors.push('وضعیت بالینی الزامی است.')
  const morbidityError = validatePercent(observation.morbidity_percent, 'درصد ابتلا')
  const mortalityError = validatePercent(observation.mortality_percent, 'درصد تلفات')
  if (morbidityError) errors.push(morbidityError)
  if (mortalityError) errors.push(mortalityError)
  return errors
}

export function validateFlockTimeSeries(record: Partial<FlockTimeSeriesRecord>): string[] {
  const errors: string[] = []
  if (!nonEmpty(record.flock_id)) errors.push('شناسه گله الزامی است.')
  if (!nonEmpty(record.observed_at) || !isValidDate(String(record.observed_at))) errors.push('تاریخ سری‌زمانی معتبر نیست.')
  if (!record.metric || !['water', 'feed', 'weight', 'egg_production', 'mortality', 'temperature', 'humidity'].includes(record.metric)) errors.push('نوع شاخص سری‌زمانی معتبر نیست.')
  if (!Number.isFinite(record.value)) errors.push('مقدار سری‌زمانی باید عددی و متناهی باشد.')
  if (!nonEmpty(record.unit)) errors.push('واحد سری‌زمانی الزامی است.')
  return errors
}

export function validateFlockReferenceRecord(entity: FlockReferenceEntity, record: Partial<VaccinationEventRecord | ClinicalObservationRecord | FlockTimeSeriesRecord>): string[] {
  if (entity === 'vaccination_event') return validateVaccinationEvent(record as Partial<VaccinationEventRecord>)
  if (entity === 'clinical_observation') return validateClinicalObservation(record as Partial<ClinicalObservationRecord>)
  return validateFlockTimeSeries(record as Partial<FlockTimeSeriesRecord>)
}
