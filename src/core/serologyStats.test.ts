import {describe,it,expect} from 'vitest'
import {areComparableFlockRounds,areComparableSerologyRounds,calculateBioChekVI,comparePairedSerology,hasCompleteSerologyComparisonMetadata,parseSampleIds,parseSerologyValues,serologyComparisonKey,summarizeSerology} from './serologyStats'
describe('serology raw input validation',()=>{
 it('normalizes Persian and Arabic digits and parses HI reciprocal notation',()=>expect(parseSerologyValues('۱:۱۶، ۳۲; ٦٤','HI')).toEqual([16,32,64]))
 it('does not silently discard malformed or zero observations',()=>{expect(()=>parseSerologyValues('16, bad, 32','HI')).toThrow(/شماره 2/);expect(()=>parseSerologyValues('16, 0, 32','HI')).toThrow(/مثبت/ )})
 it('does not reinterpret fractions for ELISA',()=>expect(()=>parseSerologyValues('1:16, 32','ELISA')).toThrow())
 it('rejects duplicate sample IDs',()=>expect(()=>parseSampleIds('A1 A2 A1')).toThrow(/تکراری/))
})
describe('assay-scale-aware summaries',()=>{
 it('reproduces BioChek VI as arithmetic mean divided by raw CV percent',()=>expect(calculateBioChekVI(4057,48)).toBeCloseTo(84.52,2))
 it('does not calculate VI when CV is zero or unavailable',()=>expect(calculateBioChekVI(1000,0)).toBeNull())
 it('calculates arithmetic and geometric summaries without mixing the scales',()=>{
  const r=summarizeSerology([16,32,64,32],'hi-reciprocal')
  expect(r.n).toBe(4);expect(r.geometricMean).toBeCloseTo(32);expect(r.log2Mean).toBeCloseTo(5);expect(r.p25).toBe(16);expect(r.p75).toBe(32)
 })
 it('refuses to calculate until the exact ELISA scale is selected',()=>expect(()=>summarizeSerology([1,2],'unspecified')).toThrow(/مقیاس/))
 it('uses arithmetic mean for OD and does not create an ELISA titre GMT',()=>{
  const r=summarizeSerology([.1,.2,.3],'od');expect(r.arithmeticMean).toBeCloseTo(.2);expect(r.geometricMean).toBeNull();expect(r.trendScale).toBe('arithmetic')
 })
 it('pairs only exact persistent sample identifiers',()=>{
  expect(comparePairedSerology([16,32],['A','B'],[32,16],['A','B'],'hi-reciprocal')?.meanFoldChange).toBeCloseTo(1)
  expect(comparePairedSerology([16,32],['A','B'],[32,16],['A','C'],'hi-reciprocal')).toBeNull()
 })
})

describe('strict longitudinal assay compatibility',()=>{
 const base={population:'broiler',method:'ELISA',assayId:'biochek-ibd-ck113',kit:'BioChek IBD',catalog:'CK113',assayVersion:'IFU rev 1',antigen:'IBDV antibody',unit:'kit titre',scale:'kit-titer',sampleMatrix:'serum',laboratory:'Lab A',readerModel:'Reader X',protocolVersion:'SOP 2',kitLot:'LOT-001',qcStatus:'pass',qcEvidence:'positive control 1.2; negative 0.1',samplingPurpose:'post-vaccination',vaccinePlatform:'live-conventional',vaccine:'Vaccine A',vaccineStrain:'D78',vaccineProgram:'day 14 drinking water',vaccineDate:'2026-10-01',randomSamplingConfirmed:true}
 const round=(input:Record<string,unknown>,flockId='F1',diseaseCode='IBD')=>({flockId,diseaseCode,input})
 it('allows only identical complete ELISA assay context',()=>{
  const a=round({...base}),b=round({...base})
  expect(hasCompleteSerologyComparisonMetadata(a)).toBe(true)
  expect(areComparableSerologyRounds(a,b)).toBe(true)
  expect(serologyComparisonKey(a)).not.toBeNull()
 })
 it('blocks a changed lot, sample matrix, kit, population or QC',()=>{
  const a=round({...base})
  expect(areComparableSerologyRounds(a,round({...base,kitLot:'LOT-002'}))).toBe(false)
  expect(areComparableSerologyRounds(a,round({...base,sampleMatrix:'egg-yolk'}))).toBe(false)
  expect(areComparableSerologyRounds(a,round({...base,catalog:'CK116'}))).toBe(false)
  expect(areComparableSerologyRounds(a,round({...base,population:'layer'}))).toBe(false)
  expect(areComparableSerologyRounds(a,round({...base,qcStatus:'pending'}))).toBe(false)
 })
 it('blocks longitudinal comparison when sampling purpose or vaccine context changes',()=>{
  const a=round({...base})
  expect(areComparableSerologyRounds(a,round({...base,samplingPurpose:'routine'}))).toBe(false)
  expect(areComparableSerologyRounds(a,round({...base,vaccineDate:'2026-10-03'}))).toBe(false)
  expect(areComparableSerologyRounds(a,round({...base,randomSamplingConfirmed:false}))).toBe(false)
 })
 it('blocks raw-import rounds when computed plate QC is not pass, even if outer QC is pass',()=>{
  const failed=round({...base,rawFileImported:true,readerImportMeta:{qcStatus:'fail'}})
  const pending=round({...base,rawFileImported:true,readerImportMeta:{qcStatus:'pending'}})
  expect(hasCompleteSerologyComparisonMetadata(failed)).toBe(false)
  expect(hasCompleteSerologyComparisonMetadata(pending)).toBe(false)
  expect(areComparableSerologyRounds(failed,round({...base}))).toBe(false)
 })
 it('requires full HI-specific antigen, serum, dilution and RBC metadata',()=>{
  const hi={...base,method:'HI',scale:'hi-reciprocal',unit:'reciprocal HI titre',hiHAU:'4',antigenPretreatment:'none per SOP',serumPretreatment:'heat-inactivation',dilutionFactor:'twofold',rbcSource:'chicken RBC',rbcLot:'RBC-7',rbcConcentration:'1% v/v'}
  const a=round(hi,'F1','ND'),b=round({...hi},'F1','ND')
  expect(hasCompleteSerologyComparisonMetadata(a)).toBe(true)
  expect(areComparableSerologyRounds(a,b)).toBe(true)
  expect(areComparableSerologyRounds(a,round({...hi,hiHAU:'8'},'F1','ND'))).toBe(false)
  expect(hasCompleteSerologyComparisonMetadata(round({...hi,rbcLot:''},'F1','ND'))).toBe(false)
 })
 it('never treats unknown metadata as an exact comparison',()=>{
  const a=round({...base,assayVersion:'نامشخص'})
  expect(hasCompleteSerologyComparisonMetadata(a)).toBe(false)
  expect(serologyComparisonKey(a)).toBeNull()
 })
})

 it('allows explicitly labelled synthetic demo rounds for UI-only trend demonstration without claiming real QC',()=>{
  const demoBase={population:'broiler',method:'ELISA',assayId:'manual',kit:'Demo kit',catalog:'DEMO',assayVersion:'SIM-1',antigen:'demo antigen',unit:'synthetic titre',scale:'kit-titer',sampleMatrix:'serum',laboratory:'Demo lab',readerModel:'Demo reader',protocolVersion:'Demo SOP',kitLot:'DEMO-LOT',qcEvidence:'fictional demo only'}
  const demo={...demoBase,demo:true,qcStatus:'demo'}
  const roundDemo=(input:Record<string,unknown>)=>({flockId:'DEMO-FLOCK',diseaseCode:'ND',input})
  const a=roundDemo(demo),b=roundDemo({...demo})
  expect(hasCompleteSerologyComparisonMetadata(a)).toBe(true)
  expect(areComparableSerologyRounds(a,b)).toBe(true)
  expect(hasCompleteSerologyComparisonMetadata(roundDemo({...demoBase,demo:true,qcStatus:'pass'}))).toBe(false)
  expect(hasCompleteSerologyComparisonMetadata({...roundDemo({...demoBase,qcStatus:'demo'}),flockId:'FLOCK-REAL'})).toBe(false)
 })


describe('zero ELISA measurements',()=>{
 it('keeps zero OD in arithmetic summaries but does not calculate GMT',()=>{
  const x=summarizeSerology([0,.1,.2],'od')
  expect(x.arithmeticMean).toBeCloseTo(.1);expect(x.geometricMean).toBeNull();expect(x.log2Mean).toBeNull();expect(x.trendScale).toBe('arithmetic')
 })
 it('does not accept zero in reciprocal titre scales',()=>{
  expect(()=>summarizeSerology([0,16],'kit-titer')).toThrow(/تیترهای ratio-scale/)
 })
})
describe('strict cross-flock comparison gate',()=>{
 const base={population:'broiler',method:'ELISA',assayId:'biochek-ibd-ck113',kit:'BioChek IBD',catalog:'CK113',assayVersion:'IFU rev 1',antigen:'IBDV antibody',unit:'kit titre',scale:'kit-titer',sampleMatrix:'serum',laboratory:'Lab A',readerModel:'Reader X',protocolVersion:'SOP 2',kitLot:'LOT-001',qcStatus:'pass',qcEvidence:'positive and negative controls checked',samplingAgeDays:21,samplingPurpose:'post-vaccination',vaccinePlatform:'live-conventional',vaccine:'Vaccine A',vaccineStrain:'D78',vaccineProgram:'day 14 drinking water',vaccineDate:'2026-10-01',samplingDate:'2026-10-22',randomSamplingConfirmed:true}
 const round=(input:Record<string,unknown>,flockId:string)=>({flockId,diseaseCode:'IBD',input})
 it('allows only same assay, population, age and vaccine timing context',()=>{
  expect(areComparableFlockRounds(round({...base},'F1'),round({...base,samplingAgeDays:22,samplingDate:'2026-10-23'},'F2'))).toBe(true)
 })
 it('blocks lot, age, vaccine or post-vaccination timing mismatch',()=>{
  const a=round({...base},'F1')
  expect(areComparableFlockRounds(a,round({...base,kitLot:'LOT-002'},'F2'))).toBe(false)
  expect(areComparableFlockRounds(a,round({...base,samplingAgeDays:25},'F2'))).toBe(false)
  expect(areComparableFlockRounds(a,round({...base,vaccineStrain:'228E'},'F2'))).toBe(false)
  expect(areComparableFlockRounds(a,round({...base,samplingDate:'2026-11-01'},'F2'))).toBe(false)
 })
 it('blocks missing QC, demo data and unknown vaccine context',()=>{
  expect(areComparableFlockRounds(round({...base,qcStatus:'pending'},'F1'),round({...base},'F2'))).toBe(false)
  expect(areComparableFlockRounds(round({...base,demo:true},'F1'),round({...base},'F2'))).toBe(false)
  expect(areComparableFlockRounds(round({...base,vaccinePlatform:'unknown'},'F1'),round({...base,vaccinePlatform:'unknown'},'F2'))).toBe(false)
 })
})
