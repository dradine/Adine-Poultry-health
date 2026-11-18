import {describe,it,expect} from 'vitest'
import {interpretNdHi,interpretIbvTrend} from './monitorInterpretation'
import {monitorNdHi} from './ndMonitor'
import {analyzeIbvTrend} from './ibvTrend'

describe('Persian monitor interpretations',()=>{
 it('explains ND responders and paired results without implying protection',()=>{
  const result=monitorNdHi({assayAntigen:'LaSota',vaccineProduct:'live ND',route:'eye drop',samplingDaysAfterDose:14,postHiLog2:[4,5,6],pairedObservations:[{birdId:'A',baselineHiLog2:2,postHiLog2:4},{birdId:'B',baselineHiLog2:3,postHiLog2:5},{birdId:'C',baselineHiLog2:4,postHiLog2:6}],responseThresholdLog2:5})
  const text=interpretNdHi(result).join(' ')
  expect(text).toContain('چهاربرابری')
  expect(text).toContain('حفاظت بالینی')
 })
 it('explains IBV trend as descriptive numeric change only',()=>{
  const result=analyzeIbvTrend({observations:[{day:14,value:2},{day:28,value:4}],assay:'HI antigen X',measurementScale:'log2 endpoint',unit:'HI-log2'})
  const text=interpretIbvTrend(result).join(' ')
  expect(text).toContain('افزایش')
  expect(text).toContain('fold افزایش آنتی‌بادی')
  expect(text).toContain('ایمنی مخاطی')
 })
})
