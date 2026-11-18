import {describe,it,expect} from 'vitest'
import {analyzePairedRounds,calculateSeropositivity,geometricMeanConfidenceInterval,meanConfidenceInterval,wilsonInterval} from './serologyAdvancedStats'
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
