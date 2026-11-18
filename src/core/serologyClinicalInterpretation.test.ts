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
 it('uses dated Newcastle vaccination events and clinical signs in interpretation',()=>{
  const x=buildClinicalInterpretation(run('ND',{...base,vaccinationEvents:[{date:'2026-11-10',ageDays:21,disease:'ND',product:'LaSota',strain:'LaSota',platform:'live-conventional',route:'drinking-water',coveragePercent:90}],clinicalContext:{signs:'سرفه و رال تنفسی',mortalityPercent:'2.1',waterIntake:'کاهش ۱۰ درصد',feedIntake:'طبیعی',productionChange:'افت وزن روزانه',necropsy:'تراشه پرخون',directTests:'PCR در انتظار',exposureRisks:'تردد خودرو مشترک',clinicalCourse:'شروع علائم روز ۲۸'}}))
  expect(x.observations.some(o=>o.title==='خط زمانی واکسیناسیون')).toBe(true)
  expect(x.observations.some(o=>o.title==='وضعیت بالینی ثبت‌شده')).toBe(true)
  expect(x.observations.some(o=>o.title==='تلفات ثبت‌شده')).toBe(true)
  expect(x.scenarios.some(s=>s.name.includes('اثر نوبت اخیر واکسن'))).toBe(true)
  expect(x.scenarios.some(s=>s.name.includes('مواجهه میدانی')&&s.for.some(v=>v.includes('سرفه')))).toBe(true)
 })
 it('incorporates vaccine execution and clinical status into observations',()=>{
  const x=buildClinicalInterpretation(run('ND',{...base,vaccinationEvents:[{id:'v1',date:'2026-11-01',disease:'ND',product:'ND live',platform:'live-conventional',strain:'LaSota',route:'water',administrationQuality:'poor'}],clinicalContext:{status:'clinical',signs:'respiratory signs',mortalityTrend:'increasing',mortalityPercent:'2.1'}}))
  expect(x.observations.some(o=>o.title.includes('خط زمانی واکسن'))).toBe(true)
  expect(x.observations.some(o=>o.title.includes('روند تلفات'))).toBe(true)
  expect(x.actions.some(a=>a.task.includes('وضعیت بالینی'))).toBe(true)
 })
 it('does not issue clinical inference from demo data',()=>{
  const x=buildClinicalInterpretation(run('ND',{...base,demo:true,qcStatus:'demo'}))
  expect(x.confidence).toContain('غیرقابل')
  expect(x.observations.some(o=>o.level==='risk'&&o.title==='داده نمایشی')).toBe(true)
  expect(x.scenarios).toHaveLength(0)
  expect(x.actions).toHaveLength(0)
 })
})
