import {describe,it,expect} from 'vitest'
import {parseVaccinationTimeline,validateClinicalContext,emptyClinicalContext} from './serologyClinicalContext'
describe('structured flock context',()=>{
 it('parses vaccination ages and derives dates from hatch date',()=>{
  const x=parseVaccinationTimeline('1 |  | ND | LaSota | live | spray | 98 | full dose | LaSota | hatchery','2026-10-20')
  expect(x[0].date).toBe('2026-10-21');expect(x[0].ageDays).toBe(1);expect(x[0].coveragePercent).toBe(98)
 })
 it('parses explicit date and derives age from hatch date',()=>{
  const x=parseVaccinationTimeline(' | 2026-11-10 | IBD | vaccine X | immune-complex | in-ovo | 100','2026-10-20')
  expect(x[0].ageDays).toBe(21)
 })
 it('rejects malformed or incomplete vaccine events',()=>{
  expect(()=>parseVaccinationTimeline('1 | ND | LaSota')).toThrow()
  expect(()=>parseVaccinationTimeline('1 | 2026-10-21 | ND | LaSota | live | spray | 120')).toThrow()
 })
 it('validates clinical mortality percentage and allows optional clinical data',()=>{
  const c=emptyClinicalContext();expect(validateClinicalContext(c)).toBeNull()
  expect(validateClinicalContext({...c,mortalityPercent:'101'})).not.toBeNull()
 })
})
