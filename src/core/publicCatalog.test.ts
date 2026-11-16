import { describe, expect, it } from 'vitest'
import { mapPublicAssayToEntry, type PublicAssayRecord } from './publicCatalog'

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
