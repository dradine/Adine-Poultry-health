import { describe, expect, it } from 'vitest'
import { findBttAssayForProduct, mapPublicAssayToEntry, type PublicAssayRecord, type PublicVaccineRecord } from './publicCatalog'

describe('public assay catalog mapping', () => {
  it('maps database assay provenance into the disease registry shape', () => {
    const row: PublicAssayRecord = {
      id: 'kit-id', disease_code: 'IB', manufacturer: 'BioChek BV',
      kit_name: 'FlockChek IBV ELISA', catalog_number: 'CK119',
      assay_type: 'ELISA', protocol_version: 'IFU Rev 2025',
      source_document: 'Official IFU', source_version: 'RevB 2025',
      validation_status: 'documented', minimum_sample_count: 23,
      reference_url: 'https://example.org/ifu',
      formula_spec: { cross_kit_conversion: 'No cross-kit conversion.' },
    }
    const result = mapPublicAssayToEntry(row)
    expect(result.disease).toBe('IBV')
    expect(result.id).toBe('kit-id')
    expect(result.status).toBe('documented')
    expect(result.note).toContain('23')
    expect(result.note).toContain('No cross-kit conversion.')
  })

  it('downgrades unknown validation status instead of treating it as documented', () => {
    const row: PublicAssayRecord = {
      id: 'x', disease_code: 'IBD', manufacturer: 'Unknown', kit_name: 'Unknown kit',
      catalog_number: null, assay_type: 'OTHER', protocol_version: 'Unknown',
      source_document: null, source_version: null, validation_status: 'unreviewed',
      minimum_sample_count: null, reference_url: null, formula_spec: null,
    }
    expect(mapPublicAssayToEntry(row).status).toBe('local-validation-required')
    expect(mapPublicAssayToEntry(row).method).toBe('ELISA')
  })
})

describe('vaccine BTT assay relationship', () => {
  it('selects only the exact assay-kit id referenced by the vaccine product', () => {
    const assays = [
      mapPublicAssayToEntry({
        id: 'biochek-id', disease_code: 'IBD', manufacturer: 'BioChek',
        kit_name: 'FlockChek IBD', catalog_number: 'CK113', assay_type: 'ELISA',
        protocol_version: 'RevB 2025', source_document: 'IFU', source_version: '2025',
        validation_status: 'documented', minimum_sample_count: 23,
        reference_url: null, formula_spec: {},
      }),
      mapPublicAssayToEntry({
        id: 'idexx-id', disease_code: 'IBD', manufacturer: 'IDEXX',
        kit_name: 'IDEXX IBD Ab Test', catalog_number: '99-09260', assay_type: 'ELISA',
        protocol_version: 'Insert 06-01129-18', source_document: 'IFU', source_version: '2026',
        validation_status: 'documented', minimum_sample_count: null,
        reference_url: null, formula_spec: {},
      }),
    ]
    const product = { btt_assay_kit_id: 'idexx-id' } as PublicVaccineRecord
    expect(findBttAssayForProduct(product, assays)?.id).toBe('idexx-id')
  })
  it('does not guess an assay when the product link is missing', () => {
    const product = { btt_assay_kit_id: null } as PublicVaccineRecord
    expect(findBttAssayForProduct(product, [])).toBeUndefined()
  })
})
