import {describe,it,expect} from 'vitest'
import {analyzePairedRounds,bootstrapGeometricMeanConfidenceInterval,bootstrapMeanConfidenceInterval,calculateSeropositivity,compareIndependentRounds,geometricMeanConfidenceInterval,meanConfidenceInterval,wilsonInterval} from './serologyAdvancedStats'
describe('advanced serology inference',()=>{
 it('returns a t-based 95% interval for the arithmetic mean',()=>{
  const x=meanConfidenceInterval([10,10,10,10])
  expect(x?.lower).toBe(10);expect(x?.upper).toBe(10)
 })
 it('returns a back-transformed log2 interval for titre GMT',()=>{
  const x=geometricMeanConfidenceInterval([16,32,64,32])
  expect(x?.mean).toBeCloseTo(32);expect(x?.lower).toBeLessThan(32);expect(x?.upper).toBeGreaterThan(32)
 })
 it('pairs only persistent unique IDs and reports matched coverage',()=>{
  const x=analyzePairedRounds([16,32,64],['A','B','C'],[64,32,16],['A','B','D'],'titre')
  expect(x?.n).toBe(2);expect(x?.unmatchedPrevious).toBe(1);expect(x?.unmatchedCurrent).toBe(1)
  expect(x?.fourFoldOrGreater).toBe(1);expect(x?.quarterOrLess).toBe(0)
 })
 it('does not pair duplicate or missing IDs',()=>{
  expect(analyzePairedRounds([1,2],['A','A'],[2,4],['A','B'],'titre')).toBeNull()
  expect(analyzePairedRounds([1,2],[],[2,4],['A','B'],'titre')).toBeNull()
 })
 it('allows zero OD values in paired continuous analysis',()=>{expect(analyzePairedRounds([0,.2],['A','B'],[.1,.3],['A','B'],'continuous')?.meanDifference).toBeCloseTo(.1)})
 it('retains geometric fold change but suppresses fourfold classification without assay-specific validation',()=>{
  const x=analyzePairedRounds([16,32],['A','B'],[64,16],['A','B'],'titre',false)
  expect(x?.geometricMeanFoldChange).toBeCloseTo(Math.sqrt(4*.5))
  expect(x?.fourFoldOrGreater).toBeNull();expect(x?.quarterOrLess).toBeNull()
 })
 it('does not call a 4-fold response for continuous ELISA scales',()=>{
  const x=analyzePairedRounds([.1,.2],['A','B'],[.2,.4],['A','B'],'continuous')
  expect(x?.meanDifference).toBeCloseTo(.15);expect(x?.fourFoldOrGreater).toBeNull()
 })
 it('calculates Wilson interval only with valid denominators',()=>{
  expect(wilsonInterval(0,0)).toBeNull()
  expect(calculateSeropositivity([1,2,3],2,'above','IFU section 8')?.positive).toBe(2)
  expect(calculateSeropositivity([1,2,3],2,'above','') ).toBeNull()
 })
})


describe('independent round comparison',()=>{
 it('compares independent titre rounds on log2 scale and back-transforms the ratio CI',()=>{
  const x=compareIndependentRounds([16,32,32,64],[32,64,64,128],'titre')
  expect(x?.nPrevious).toBe(4);expect(x?.nCurrent).toBe(4)
  expect(x?.geometricMeanFoldChange).toBeCloseTo(2)
  expect(x?.foldChangeLower).toBeLessThan(2);expect(x?.foldChangeUpper).toBeGreaterThan(2)
 })
 it('does not compare undersized or invalid independent samples',()=>{
  expect(compareIndependentRounds([1],[2,3],'continuous')).toBeNull()
  expect(compareIndependentRounds([0,2],[4,8],'titre')).toBeNull()
 })
 it('compares continuous independent samples in the original scale',()=>{
  const x=compareIndependentRounds([1,2,3],[3,4,5],'continuous')
  expect(x?.meanDifference).toBeCloseTo(2)
  expect(x?.lower).toBeLessThan(2);expect(x?.upper).toBeGreaterThan(2)
 })
})


describe('deterministic percentile bootstrap',()=>{
 it('returns reproducible intervals for a stable seed',()=>{
  const a=bootstrapMeanConfidenceInterval([1,2,3,4,5],'run-123',500)
  const b=bootstrapMeanConfidenceInterval([1,2,3,4,5],'run-123',500)
  expect(a).toEqual(b);expect(a?.lower).toBeLessThanOrEqual(a?.mean||0);expect(a?.upper).toBeGreaterThanOrEqual(a?.mean||0)
 })
 it('back-transforms bootstrap titre intervals from log2 scale',()=>{
  const x=bootstrapGeometricMeanConfidenceInterval([16,32,64,32],'titre-run',500)
  expect(x?.mean).toBeCloseTo(32);expect(x?.lower).toBeGreaterThan(0);expect(x?.upper).toBeGreaterThan(x?.lower||0)
 })
 it('rejects invalid titre values and insufficient samples',()=>{
  expect(bootstrapGeometricMeanConfidenceInterval([0,2],'bad')).toBeNull()
  expect(bootstrapMeanConfidenceInterval([1],'one',500)).toBeNull()
 })
})
