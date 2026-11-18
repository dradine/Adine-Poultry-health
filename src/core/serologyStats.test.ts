import {describe,it,expect} from 'vitest'
import {comparePairedSerology,parseSampleIds,parseSerologyValues,summarizeSerology} from './serologyStats'
describe('serology raw input validation',()=>{
 it('normalizes Persian and Arabic digits and parses HI reciprocal notation',()=>expect(parseSerologyValues('۱:۱۶، ۳۲; ٦٤','HI')).toEqual([16,32,64]))
 it('does not silently discard malformed or zero observations',()=>{expect(()=>parseSerologyValues('16, bad, 32','HI')).toThrow(/شماره 2/);expect(()=>parseSerologyValues('16, 0, 32','HI')).toThrow(/مثبت/ )})
 it('does not reinterpret fractions for ELISA',()=>expect(()=>parseSerologyValues('1:16, 32','ELISA')).toThrow())
 it('rejects duplicate sample IDs',()=>expect(()=>parseSampleIds('A1 A2 A1')).toThrow(/تکراری/))
})
describe('assay-scale-aware summaries',()=>{
 it('calculates arithmetic and geometric summaries without mixing the scales',()=>{
  const r=summarizeSerology([16,32,64,32],'hi-reciprocal')
  expect(r.n).toBe(4);expect(r.geometricMean).toBeCloseTo(32);expect(r.log2Mean).toBeCloseTo(5);expect(r.p25).toBe(16);expect(r.p75).toBe(32)
 })
 it('uses arithmetic mean for OD and does not create an ELISA titre GMT',()=>{
  const r=summarizeSerology([.1,.2,.3],'od');expect(r.arithmeticMean).toBeCloseTo(.2);expect(r.geometricMean).toBeNull();expect(r.trendScale).toBe('arithmetic')
 })
 it('pairs only exact persistent sample identifiers',()=>{
  expect(comparePairedSerology([16,32],['A','B'],[32,16],['A','B'],'hi-reciprocal')?.meanFoldChange).toBeCloseTo(1)
  expect(comparePairedSerology([16,32],['A','B'],[32,16],['A','C'],'hi-reciprocal')).toBeNull()
 })
})
