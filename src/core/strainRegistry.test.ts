import {describe,it,expect} from 'vitest'
import {STRAIN_BANK,strainsForDisease} from './strainRegistry'
describe('strain registry',()=>{
 it('has vaccine, assay antigen and field isolate roles separately',()=>{
  expect(strainsForDisease('IBV','vaccine').length).toBeGreaterThan(0)
  expect(strainsForDisease('IBV','assay-antigen').length).toBeGreaterThan(0)
  expect(strainsForDisease('IBV','field-reference').length).toBeGreaterThan(0)
 })
 it('includes requested variants and common reference strains without treating them as equivalent',()=>{
  const names=STRAIN_BANK.map(x=>x.name.toLowerCase())
  expect(names.some(n=>n.includes('qx'))).toBe(true)
  expect(names.some(n=>n.includes('variant 2'))).toBe(true)
  expect(names.some(n=>n.includes('793'))).toBe(true)
  expect(names.some(n=>n.includes('h5'))).toBe(true)
  expect(names.some(n=>n.includes('h9'))).toBe(true)
  expect(names.some(n=>n.includes('lasota'))).toBe(true)
  expect(names.some(n=>n.includes('d78'))).toBe(true)
  expect(names.some(n=>n.includes('genogroup g2'))).toBe(true)
  expect(names.some(n=>n.includes('genogroup g3'))).toBe(true)
  expect(names.some(n=>n.includes('genogroup g7'))).toBe(true)
 })
 it('provides user-added/custom placeholders for each disease',()=>{
  for(const disease of ['IBD','ND','IBV','AIV'] as const)expect(strainsForDisease(disease).some(s=>s.evidence==='user-added')).toBe(true)
 })
 it('does not use subtype names as confirmed isolates',()=>{
  expect(STRAIN_BANK.find(s=>s.id==='aiv-h5')?.caution).toContain('clade')
  expect(STRAIN_BANK.find(s=>s.id==='ibv-qx')?.caution).toContain('not')
 })
})
