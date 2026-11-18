import {describe,it,expect} from 'vitest'
import {assessIbdBaseline,assessIbvBaseline,assessNdBaseline,assessAivBaseline,type BaselineContext} from './baselineEngine'
const c:BaselineContext={disease:'IBD',vendor:'BioChek',assayOrKit:'BioChek IBD ELISA family; exact kit calibration must match current IFU',method:'ELISA',unit:'BioChek kit-specific titre',population:'Broiler flocks classified N (normal/healthy), database sample code N',ageWindow:'35–45 days at sampling',vaccineProgram:'Worked example: vaccination program 123 Broilers'}
describe('strict disease-specific baseline gates',()=>{
 it('keeps worked examples reference-only when exact assay metadata is absent',()=>{const r=assessIbdBaseline(c);expect(r.usableForNumericComparison).toBe(false);expect(r.status).toBe('reference-only');expect(r.numericRange).toBeNull();expect(r.sourceUrl).toContain('biochek.com')})
 it('does not treat missing context as wildcard',()=>{const r=assessIbdBaseline({...c,unit:''});expect(r.usableForNumericComparison).toBe(false);expect(r.explanationFa).toContain('اطلاعات لازم')})
 it('requires exact catalog and IFU version when supplied',()=>{expect(assessIbdBaseline({...c,catalog:'CK113'}).usableForNumericComparison).toBe(false);expect(assessIbdBaseline({...c,assayVersion:'RevB 2025'}).usableForNumericComparison).toBe(false)})
 it('never borrows IBD numeric baseline for other diseases',()=>{for(const r of [assessIbvBaseline({...c,disease:'IBV'}),assessNdBaseline({...c,disease:'ND'}),assessAivBaseline({...c,disease:'AIV'})]){expect(r.usableForNumericComparison).toBe(false);expect(r.status).toBe('reference-only');expect(r.baselineId).toBeNull();expect(r.numericRange).toBeNull()}})
 it('never enables a baseline without a fully documented, valid numeric range',()=>{
  const r=assessIbdBaseline(c)
  expect(r.usableForNumericComparison).toBe(false)
  expect(r.numericRange).toBeNull()
  expect(r.reasonsFa.join(' ')).toContain('numericComparisonEligible')
 })
})
