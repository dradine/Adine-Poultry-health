import {describe,it,expect} from 'vitest'
import {estimateMaternalAntibodyDecay,validateMdaParameterProvenance} from './maternalAntibody'
describe('maternal antibody early sampling estimator',()=>{
 it('accepts hatch/day 0 and reconstructs day-0 titre without date mismatch',()=>{
  const r=estimateMaternalAntibodyDecay({sampleAgeDays:0,sampleTiter:1000,halfLifeDays:3,thresholdTiter:100})
  expect(r.estimatedHatchTiter).toBe(1000)
  expect(r.estimatedThresholdAgeDays).toBeCloseTo(9.965,2)
  expect(r.predictedAtDays[0].titer).toBe(1000)
 })
 it('back-calculates day 2 sample to hatch titer',()=>{
  const r=estimateMaternalAntibodyDecay({sampleAgeDays:2,sampleTiter:1000,halfLifeDays:3,thresholdTiter:100})
  expect(r.estimatedHatchTiter).toBeCloseTo(1587.4,0)
  expect(r.predictedAtDays.find(p=>p.day===2)?.titer).toBeCloseTo(1000,6)
 })
 it('allows days 1 and 4 and rejects outside early-sampling window',()=>{
  expect(estimateMaternalAntibodyDecay({sampleAgeDays:1,sampleTiter:100,halfLifeDays:3,thresholdTiter:50}).estimatedHatchTiter).toBeGreaterThan(100)
  expect(estimateMaternalAntibodyDecay({sampleAgeDays:4,sampleTiter:100,halfLifeDays:3,thresholdTiter:50}).estimatedHatchTiter).toBeGreaterThan(100)
  expect(()=>estimateMaternalAntibodyDecay({sampleAgeDays:5,sampleTiter:100,halfLifeDays:3,thresholdTiter:50})).toThrow()
 })
 it('reports hatch threshold already below when estimated titer is low',()=>{
  const r=estimateMaternalAntibodyDecay({sampleAgeDays:1,sampleTiter:10,halfLifeDays:3,thresholdTiter:100})
  expect(r.alreadyBelowThresholdAtHatch).toBe(true)
  expect(r.estimatedThresholdAgeDays).toBeNull()
 })

 it('does not impose an undocumented universal upper bound on half-life',()=>{
  const r=estimateMaternalAntibodyDecay({sampleAgeDays:4,sampleTiter:1000,halfLifeDays:120,thresholdTiter:100})
  expect(r.estimatedHatchTiter).toBeGreaterThan(1000)
 })
 it('rejects a mathematically overflowing hatch reconstruction',()=>{
  expect(()=>estimateMaternalAntibodyDecay({sampleAgeDays:4,sampleTiter:1e9,halfLifeDays:1e-6,thresholdTiter:100})).toThrow(/محدوده عددی/)
 })
 it('rejects invalid inputs',()=>{
  expect(()=>estimateMaternalAntibodyDecay({sampleAgeDays:0,sampleTiter:0,halfLifeDays:3,thresholdTiter:100})).toThrow()
  expect(()=>estimateMaternalAntibodyDecay({sampleAgeDays:0,sampleTiter:100,halfLifeDays:0,thresholdTiter:10})).toThrow()
 })
})

describe('MDA provenance gate',()=>{
 const valid={assayIdentity:'BioChek CK113 IBD ELISA / VP2',measurementScale:'kit-specific ELISA titer',halfLifeSource:'Longitudinal same-flock study, methods p. 4',thresholdSource:'Product-specific IFU, section 8',sourceVersion:'IFU RevB 2025, p. 6',parameterOrigin:'manufacturer-ifu' as const}
 it('accepts complete provenance without claiming independent verification',()=>{
  expect(validateMdaParameterProvenance(valid)).toEqual([])
 })
 it('lists each missing parameter source and assay identity',()=>{
  const errors=validateMdaParameterProvenance({})
  expect(errors).toHaveLength(6)
 })
})
