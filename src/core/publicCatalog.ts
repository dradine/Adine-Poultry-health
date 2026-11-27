import { supabase } from './supabase'
import type { AssayCatalogEntry } from './assayRegistry'

const CACHE_KEY = 'adine-public-reference-catalog-v1'

export type PublicAssayRecord = {
  id: string
  disease_code: string
  manufacturer: string
  kit_name: string
  catalog_number: string | null
  assay_type: string
  protocol_version: string
  source_document: string | null
  source_version: string | null
  validation_status: string
  minimum_sample_count: number | null
  reference_url: string | null
  formula_spec: Record<string, unknown> | null
}
export type PublicVaccineRecord = {
  id: string
  disease_code: string
  manufacturer: string
  product_name: string
  platform: string
  strain: string | null
  breakthrough_titer: string | null
  breakthrough_unit: string | null
  model_family: string | null
  validation_status: string
  deventer_minimum_sample_count: number | null
  deventer_sample_size_basis: string | null
  btt_assay_kit_id: string | null
  btt_definition: string | null
  btt_reference_url: string | null
  source_document: string | null
  source_version: string | null
  label_version: string | null
  market_code: string | null
  registration_number: string | null
  marketing_authorisation_holder: string | null
  vaccine_route: string | null
  vaccine_age_min_days: string | null
  vaccine_age_max_days: string | null
  onset_of_immunity_days: string | null
  duration_of_immunity_weeks: string | null
}
export type PublicReferenceCatalog = {
  assays: PublicAssayRecord[]
  vaccines: PublicVaccineRecord[]
  fetchedAt: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
export function readCachedPublicCatalog(): PublicReferenceCatalog | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!isObject(value) || !Array.isArray(value.assays) || !Array.isArray(value.vaccines)) return null
    return value as unknown as PublicReferenceCatalog
  } catch { return null }
}
export function mapPublicAssayToEntry(row: PublicAssayRecord): AssayCatalogEntry {
  const knownDiseases = ['IBD', 'ND', 'IBV', 'AIV', 'AE', 'ALV', 'MG', 'MS', 'REO']
  const disease = row.disease_code === 'IB' ? 'IBV' : knownDiseases.includes(row.disease_code) ? row.disease_code : 'UNKNOWN'
  const knownMethods = ['ELISA', 'HI', 'VN', 'AGID', 'PCR']
  const method = knownMethods.includes(row.assay_type) ? row.assay_type as AssayCatalogEntry['method'] : 'UNKNOWN'
  const rawScale = typeof row.formula_spec?.measurement_scale === 'string' ? row.formula_spec.measurement_scale.toLowerCase() : ''
  const normalizedManufacturer = row.manufacturer.trim().toLowerCase()
  const normalizedCatalog = (row.catalog_number || '').trim().toUpperCase().replace(/\\s+/g, ' ')
  const hasBioChekTiterEquation = normalizedManufacturer.includes('biochek')
    && /^CK113(?:\\s+IBD)?$/.test(normalizedCatalog)
    && typeof row.formula_spec?.titer_equation === 'string'
  const hasIdexxTiterFormula = normalizedManufacturer.includes('idexx')
    && normalizedCatalog === '99-09260'
    && typeof row.formula_spec?.log10_titer_formula === 'string'
  const measurementScale: AssayCatalogEntry['measurementScale'] = ['elisa-titer', 'od', 's-p', 'unknown'].includes(rawScale)
    ? rawScale as AssayCatalogEntry['measurementScale']
    : hasBioChekTiterEquation || hasIdexxTiterFormula
      ? 'elisa-titer'
      : typeof row.formula_spec?.s_p_formula === 'string' ? 's-p' : 'unknown'
  const knownStatus = ['documented', 'catalog-only', 'local-validation-required'].includes(row.validation_status)
  const status = knownStatus && method !== 'UNKNOWN' && disease !== 'UNKNOWN'
    ? row.validation_status as AssayCatalogEntry['status'] : 'local-validation-required'
  const notes = [
    row.protocol_version,
    method === 'UNKNOWN' ? 'نوع آزمون در بانک شناخته‌شده نیست؛ این رکورد نباید به ELISA/HI یا مدل محاسباتی دیگری تعبیر شود.' : '',
    disease === 'UNKNOWN' ? 'کد بیماری در بانک شناخته‌شده نیست؛ رکورد تا اصلاح کد بیماری غیرقابل استفاده است.' : '',
    row.source_version,
    row.minimum_sample_count ? 'راهنمای نمونه: حداقل ' + row.minimum_sample_count + ' نمونه برای این پروتکل ثبت شده است.' : '',
    typeof row.formula_spec?.cross_kit_conversion === 'string' ? row.formula_spec.cross_kit_conversion : '',
    typeof row.formula_spec?.interpretation_note === 'string' ? row.formula_spec.interpretation_note : '',
  ].filter(Boolean)
  return {
    id: row.id,
    disease: disease as AssayCatalogEntry['disease'],
    manufacturer: row.manufacturer,
    name: row.kit_name,
    catalog: row.catalog_number || undefined,
    method,
    measurementScale,
    status,
    source: row.reference_url || row.source_document || '',
    note: notes.join(' · '),
    minimumSampleCount: row.minimum_sample_count ?? undefined,
    minimumSampleCountSource: row.minimum_sample_count
      ? (typeof row.formula_spec?.minimum_sample_count_basis === 'string' ? row.formula_spec.minimum_sample_count_basis : row.source_version || row.protocol_version)
      : undefined,
  }
}
export async function fetchPublicReferenceCatalog(): Promise<PublicReferenceCatalog> {
  const [assaysResponse, vaccinesResponse] = await Promise.all([
    supabase.from('assay_kits').select(
      'id,disease_code,manufacturer,kit_name,catalog_number,assay_type,protocol_version,source_document,source_version,validation_status,minimum_sample_count,reference_url,formula_spec'
    ).order('manufacturer'),
    supabase.from('vaccine_products').select(
      'id,disease_code,manufacturer,product_name,platform,strain,breakthrough_titer,breakthrough_unit,model_family,validation_status,deventer_minimum_sample_count,deventer_sample_size_basis,btt_assay_kit_id,btt_definition,btt_reference_url,source_document,source_version,label_version,market_code,registration_number,marketing_authorisation_holder,vaccine_route,vaccine_age_min_days,vaccine_age_max_days,onset_of_immunity_days,duration_of_immunity_weeks'
    ).order('product_name'),
  ])
  if (assaysResponse.error) throw assaysResponse.error
  if (vaccinesResponse.error) throw vaccinesResponse.error
  const catalog: PublicReferenceCatalog = {
    assays: (assaysResponse.data || []) as unknown as PublicAssayRecord[],
    vaccines: (vaccinesResponse.data || []) as unknown as PublicVaccineRecord[],
    fetchedAt: new Date().toISOString(),
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(catalog))
  return catalog
}

export function findBttAssayForProduct(
  product: PublicVaccineRecord,
  assays: AssayCatalogEntry[],
): AssayCatalogEntry | undefined {
  if (!product.btt_assay_kit_id) return undefined
  return assays.find(assay => assay.id === product.btt_assay_kit_id)
}
