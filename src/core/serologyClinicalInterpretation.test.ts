import {describe,it,expect} from 'vitest'
import type {LocalModelRun} from './localFirstDb'
import {buildClinicalInterpretation} from './serologyClinicalInterpretation'
function run(disease:string,input:Record<string,unknown>):LocalModelRun{return {id:'r1',flock_id:'f1',disease_code:disease,model_version:'test',model_family:'serology-longitudinal-round',input_snapshot:input,output_snapshot:{},confidence_level:'low',decision_status:'provisional',limitations:[],created_at:'2026-11-18T00:00:00Z',syncState:'synced'}}
const base={titers:[8,16,16,32,64,8,4,16,32,64,8,16],method:'HI',scale:'hi-reciprocal',unit:'reciprocal',samplingDate:'2026-11-18',samplingAgeDays:30,vaccineDate:'2026-11-09',vaccine:'ND live vaccine',vaccinePlatform:'live-conventional',vaccineProgram:'live every 14 days',randomSamplingConfirmed:true,rawFileImported:true,readerImportMeta:{qcStatus:'pass'},qcStatus:'pass'}
describe('disease-specific clinical interpretation',()=>{
 it('creates a cautious Newcastle differential and does not label field infection from one round',()=>{
  const x=buildClinicalInterpretation(run('ND',base))
  expect(x.scenarios.some(s=>s.name.includes('مواجهه میدانی'))).toBe(true)
  expect(x.actions.length).toBeGreaterThan(0)
  expect(x.headline).toContain('نیوکاسل')
 })
 it('explains antigen matching and NP limits for avian influenza',()=>{
  const x=buildClinicalInterpretation(run('AIV',{...base,antigen:'NP',assayId:'np-elisa'}))
  expect(x.observations.some(o=>o.title.includes('هدف آزمون'))).toBe(true)
  expect(x.scenarios.some(s=>s.name.includes('عدم تطابق آنتی‌ژنی'))).toBe(true)
 })
 it('does not infer IBV strain or cross-protection from general ELISA',()=>{
  const x=buildClinicalInterpretation(run('IBV',{...base,method:'ELISA',scale:'kit-titer'}))
  expect(x.observations.some(o=>o.body.includes('ژنوتیپ/سروتیپ'))).toBe(true)
  expect(x.scenarios.length).toBeGreaterThanOrEqual(3)
 })
 it('keeps IBD maternal antibody and Deventer requirements explicit',()=>{
  const x=buildClinicalInterpretation(run('IBD',{...base,samplingAgeDays:8,samplingPurpose:'mda',hatchDate:'2026-11-10'}))
  expect(x.scenarios.some(s=>s.name.includes('آنتی‌بادی مادری'))).toBe(true)
  expect(x.actions.some(a=>a.task.includes('BTT'))).toBe(true)
 })
 it('does not issue clinical inference from demo data',()=>{
  const x=buildClinicalInterpretation(run('ND',{...base,demo:true,qcStatus:'demo'}))
  expect(x.confidence).toContain('غیرقابل')
  expect(x.observations.some(o=>o.level==='risk'&&o.title==='داده نمایشی')).toBe(true)
  expect(x.scenarios).toHaveLength(0)
  expect(x.actions).toHaveLength(0)
 })
})
