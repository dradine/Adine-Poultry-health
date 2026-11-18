import {describe,it,expect} from 'vitest'
import {emptyClinicalContext,resolveVaccinationEvents,validateClinicalContext,type VaccinationEvent} from './serologyClinicalContext'
const event:VaccinationEvent={id:'v1',date:'',ageDays:21,disease:'ND',product:'LaSota',platform:'live-conventional',strain:'LaSota',route:'drinking-water',dose:'full',coveragePercent:95,administrationQuality:'good',batch:'B01',notes:''}
describe('flock clinical and vaccination context',()=>{
 it('validates optional clinical fields and percentage ranges',()=>{
  expect(validateClinicalContext(emptyClinicalContext())).toBeNull()
  expect(validateClinicalContext({...emptyClinicalContext(),mortalityPercent:'۱۰۱'})).not.toBeNull()
  expect(validateClinicalContext({...emptyClinicalContext(),morbidityPercent:'8'})).toBeNull()
 })
 it('derives vaccination date from hatch date and age',()=>{
  const x=resolveVaccinationEvents([event],'2026-10-20','2026-11-18',30)
  expect(x[0].date).toBe('2026-11-10');expect(x[0].ageDays).toBe(21)
 })
 it('derives vaccination date from sampling date and sampling age when hatch date is unavailable',()=>{
  const x=resolveVaccinationEvents([event],'','2026-11-18',30)
  expect(x[0].date).toBe('2026-11-09')
 })
 it('derives age from date and hatch date',()=>{
  const x=resolveVaccinationEvents([{...event,date:'2026-11-10',ageDays:null}],'2026-10-20','2026-11-18',30)
  expect(x[0].ageDays).toBe(21)
 })
 it('rejects vaccine events after sampling and incomplete entries',()=>{
  expect(()=>resolveVaccinationEvents([{...event,date:'2026-11-19'}],'','2026-11-18',30)).toThrow()
  expect(()=>resolveVaccinationEvents([{...event,product:''}],'','2026-11-18',30)).toThrow()
 })
 it('rejects inconsistent event date and age',()=>{
  expect(()=>resolveVaccinationEvents([{...event,date:'2026-11-10',ageDays:28}],'2026-10-20','2026-11-18',30)).toThrow(/سازگار/)
 })
 it('ignores untouched blank event cards',()=>{
  const blank={...event,date:'',ageDays:null,product:'',strain:'',route:''}
  expect(resolveVaccinationEvents([blank],'','2026-11-18',30)).toHaveLength(0)
 })
})
