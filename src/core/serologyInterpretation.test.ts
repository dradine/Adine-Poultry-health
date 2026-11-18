import {describe,it,expect} from 'vitest'
import {interpretSerologyRound} from './serologyInterpretation'

const valid={titers:Array(23).fill(32),method:'ELISA',scale:'kit-titer',assayId:'biochek-ck113-ibd',assayVersion:'IFU 1',kitLot:'L1',readerModel:'R1',protocolVersion:'SOP1',randomSamplingConfirmed:true,samplingPurpose:'post-vaccination',vaccinePlatform:'live-conventional',vaccineDate:'2026-10-01',antigen:'IBDV',sampleMatrix:'serum',qcStatus:'pass',rawFileImported:true,readerImportMeta:{qcStatus:'pass'}}

describe('conservative serology interpretation',()=>{
 it('does not infer protection from a complete descriptive result',()=>{
  const x=interpretSerologyRound('IBD',valid)
  expect(x.summary).toContain('استنتاج حفاظت')
  expect(x.items.some(i=>i.level==='block')).toBe(false)
 })
 it('adds descriptive distribution metrics and only applies positivity when a sourced cutoff exists',()=>{
  const withCutoff=interpretSerologyRound('ND',{...valid,assayId:'manual',seropositivityCutoff:32,cutoffDirection:'above',cutoffSource:'IFU rev 2 p.6'})
  expect(withCutoff.items.some(i=>i.title==='خلاصه توزیع نمونه‌ها')).toBe(true)
  expect(withCutoff.items.some(i=>i.title.includes('طبقه‌بندی مثبت'))).toBe(true)
  const withoutCutoff=interpretSerologyRound('ND',{...valid,assayId:'manual',seropositivityCutoff:32,cutoffSource:''})
  expect(withoutCutoff.items.some(i=>i.title.includes('طبقه‌بندی مثبت'))).toBe(false)
 })
 it('keeps raw results descriptively reportable while flagging failed plate QC',()=>{
  const x=interpretSerologyRound('ND',{...valid,qcStatus:'pass',readerImportMeta:{qcStatus:'fail'}})
  expect(x.items.some(i=>i.level==='warning'&&i.title.includes('QC پلیت'))).toBe(true)
  expect(x.items.some(i=>i.title==='خلاصه توزیع نمونه‌ها')).toBe(true)
  expect(x.items.some(i=>i.level==='block')).toBe(false)
 })
 it('creates an initial descriptive report with only disease, method and numeric values',()=>{
  const x=interpretSerologyRound('ND',{titers:[16,32,16,64],method:'HI',scale:'hi-reciprocal',assayId:'manual',qcStatus:'pending'})
  expect(x.items.some(i=>i.title==='خلاصه توزیع نمونه‌ها')).toBe(true)
  expect(x.items.some(i=>i.title==='توزیع تیتر در مقیاس لگاریتمی')).toBe(true)
  expect(x.items.some(i=>i.level==='block')).toBe(false)
 })
 it('flags disagreement between entered age and hatch/sampling dates',()=>{
  const x=interpretSerologyRound('IBD',{...valid,hatchDate:'2026-10-01',samplingDate:'2026-10-20',samplingAgeDays:12})
  expect(x.items.some(i=>i.title.includes('سن واردشده با تاریخ هچ'))).toBe(true)
 })
 it('does not treat a catalog-only assay as IFU-validated',()=>{
  const x=interpretSerologyRound('AIV',{...valid,assayId:'idvet-aiv-flunps'})
  expect(x.items.some(i=>i.title.includes('کاتالوگ محصول موجود است'))).toBe(true)
 })
 it('keeps IBD VP2 and conventional assays distinct',()=>{
  const x=interpretSerologyRound('IBD',{...valid,assayId:'idvet-ibd-vp2',vaccinePlatform:'live-conventional'})
  expect(x.items.some(i=>i.title.includes('عدم تطابق')||i.title.includes('ابهام هدف'))).toBe(true)
 })
 it('does not claim DIVA from NP alone',()=>{
  const x=interpretSerologyRound('AIV',{...valid,assayId:'idvet-aiv-flunps',antigen:'NP'})
  expect(x.items.some(i=>i.detail.includes('DIVA را مشخص نمی‌کند'))).toBe(true)
 })
 it('does not treat non-random sampling as representative',()=>{
  const x=interpretSerologyRound('IBV',{...valid,randomSamplingConfirmed:false})
  expect(x.items.some(i=>i.title.includes('نمایندگی نمونه‌ها'))).toBe(true)
 })
 it('does not infer generic protective cutoffs for ND HI',()=>{
  const x=interpretSerologyRound('ND',{...valid,method:'HI',scale:'hi-reciprocal'})
  expect(x.items.some(i=>i.title.includes('تفسیر HI وابسته'))).toBe(true)
 })
})
