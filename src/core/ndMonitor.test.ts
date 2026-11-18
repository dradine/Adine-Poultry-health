import { describe, expect, it } from 'vitest'
import { monitorNdHi } from './ndMonitor'

const base = {assayAntigen:'LaSota',vaccineProduct:'live ND',route:'eye drop',samplingDaysAfterDose:14}

describe('ND HI monitor',()=>{
 it('computes paired rise only from explicit matched bird IDs and response threshold',()=>{
  const result=monitorNdHi({...base,postHiLog2:[4,5,6],pairedObservations:[{birdId:'A',baselineHiLog2:2,postHiLog2:4},{birdId:'B',baselineHiLog2:3,postHiLog2:5},{birdId:'C',baselineHiLog2:4,postHiLog2:6}],responseThresholdLog2:5})
  expect(result.meanHiLog2).toBe(5)
  expect(result.meanLog2Rise).toBe(2)
  expect(result.fourfoldRisePercent).toBe(100)
  expect(result.responderPercent).toBeCloseTo(66.666)
  expect(result.pairedN).toBe(3)
 })
 it('uses sample SD for individual birds and leaves it undefined for n=1',()=>{
  const r=monitorNdHi({...base,postHiLog2:[2,4]})
  expect(r.meanHiLog2).toBe(3)
  expect(r.sdLog2).toBeCloseTo(Math.sqrt(2),8)
  expect(r.cvReciprocalPercent).toBeCloseTo(84.8528,3)
  const one=monitorNdHi({...base,postHiLog2:[3]})
  expect(one.sdLog2).toBeNull()
  expect(one.cvReciprocalPercent).toBeNull()
 })
 it('rejects fractional individual HI endpoints',()=>{
  expect(()=>monitorNdHi({...base,postHiLog2:[2,3.5]})).toThrow(/endpoint صحیح/)
 })
 it('requires paired post-values to belong to the post-vaccination cohort',()=>{
  expect(()=>monitorNdHi({...base,postHiLog2:[4,5],pairedObservations:[{birdId:'A',baselineHiLog2:2,postHiLog2:6}]})).toThrow(/در مجموعه نتایج/)
 })
 it('rejects duplicate paired bird identifiers',()=>{
  expect(()=>monitorNdHi({...base,postHiLog2:[2,3],pairedObservations:[{birdId:'A',baselineHiLog2:1,postHiLog2:2},{birdId:'A',baselineHiLog2:2,postHiLog2:3}]})).toThrow()
 })
 it('does not treat unpaired baseline arrays as paired measurements',()=>{
  const result=monitorNdHi({...base,baselineHiLog2:[2,3],postHiLog2:[4,5]})
  expect(result.baselineN).toBe(2)
  expect(result.meanLog2Rise).toBeNull()
  expect(result.fourfoldRisePercent).toBeNull()
  expect(result.pairedN).toBe(0)
  expect(result.warnings.join()).toContain('شناسه')
 })
 it('does not report zero responders when no threshold is supplied',()=>{
  const result=monitorNdHi({...base,postHiLog2:[2,3]})
  expect(result.responders).toBeNull()
  expect(result.responderPercent).toBeNull()
  expect(result.warnings.join()).toContain('محاسبه نشده')
 })
})
