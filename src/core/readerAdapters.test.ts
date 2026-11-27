import { describe, expect, it } from 'vitest'
import { getReaderAdapterProfile, importWithReaderAdapter, prepareReaderAdapterPreview } from './readerAdapters'

const biochekFixture = 'Sample ID,Type,Result\nS-001,Sample,1200\nS-002,Sample,2400\nPC-01,Positive,1.5\nNC-01,Negative,0.1'

describe('reader adapter skeletons', () => {
  it('previews a synthetic BioChek delimited export without claiming proprietary compatibility', () => {
    const preview = prepareReaderAdapterPreview('biochek-ii-csv', biochekFixture, 'ELISA', 'kit-titer')
    expect(preview.resultColumn).toBe(2)
    expect(preview.sampleIdColumn).toBe(0)
    expect(preview.roleColumn).toBe(1)
    expect(importWithReaderAdapter(preview, 'ELISA').values).toEqual([1200, 2400])
  })

  it('keeps xChekPlus and IDsoft profiles schema-gated', () => {
    expect(getReaderAdapterProfile('idexx-xchekplus-delimited').status).toBe('schema-required')
    expect(getReaderAdapterProfile('idvet-idsoft-delimited').status).toBe('schema-required')
  })

  it('rejects scale mismatch before any values are imported', () => {
    expect(() => prepareReaderAdapterPreview('manual-hi-csv', 'ID,HI endpoint\nA1,16', 'HI', 'od')).toThrow(/مقیاس/)
  })
})
