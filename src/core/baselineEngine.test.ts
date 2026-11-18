import {describe,it,expect} from 'vitest'
import {assessIbdBaseline,assessIbvBaseline,assessNdBaseline,assessAivBaseline,type BaselineContext} from './baselineEngine'
const c:BaselineContext={disease:'IBD',vendor:'BioChek',assayOrKit:'BioChek IBD ELISA family; exact kit calibration must match current IFU',method:'ELISA',unit:'BioChek kit-specific titre',population:'Broiler flocks classified N (normal/healthy), database sample code N',ageWindow:'35–45 days at sampling',vaccineProgram:'Worked example: vaccination program 123 Broilers'}
describe('strict disease-specific baseline gates',()=>{
 it('keeps worked examples reference-only when exact assay metadata is absent',()=>{const r=assessIbdBaseline(c);expect(r.usableForNumericComparison).toBe(false);expect(r.status).toBe('reference-only');expect(r.numericRange).toBeNull()})
 it('does not treat missing context as wildcard',()=>{const r=assessIbdBaseline({...c,unit:''});expect(r.usableForNumericComparison).toBe(false);expect(r.explanationFa).toContain('اطلاعات لازم')})
 it('never borrows IBD baseline for other diseases',()=>{expect(assessIbvBaseline({...c,disease:'IBV'}).usableForNumericComparison).toBe(false);expect(assessNdBaseline({...c,disease:'ND'}).usableForNumericComparison).toBe(false);expect(assessAivBaseline({...c,disease:'AIV'}).usableForNumericComparison).toBe(false)})
})
