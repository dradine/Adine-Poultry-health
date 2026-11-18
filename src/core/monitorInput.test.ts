import {describe,it,expect} from 'vitest'
import {parseMonitorNumbers,parsePairedHiRows,parseDayValueRows} from './monitorInput'

describe('locale-safe monitoring input parsing',()=>{
 it('parses Persian and Arabic-Indic numerals and decimal separators',()=>{
  expect(parseMonitorNumbers('۴، ۵؛ ٦')).toEqual([4,5,6])
  expect(parseDayValueRows('۱۴:۰٫۸\n٢٨:١٫٢')).toEqual([{day:14,value:0.8},{day:28,value:1.2}])
 })
 it('parses paired HI rows with Persian separators',()=>{
  expect(parsePairedHiRows('پرنده-۱:۲:۴\nB002،۳،۵')).toEqual([
   {birdId:'پرنده-۱',baselineHiLog2:2,postHiLog2:4},
   {birdId:'B002',baselineHiLog2:3,postHiLog2:5},
  ])
 })
 it('rejects malformed paired and day-value rows instead of silently truncating columns',()=>{
  expect(()=>parsePairedHiRows('B001:2')).toThrow(/سه ستون/)
  expect(()=>parseDayValueRows('14:1:extra')).toThrow(/روز:مقدار/)
 })
 it('keeps invalid numeric tokens visible as NaN for downstream validation',()=>{
  expect(Number.isNaN(parseMonitorNumbers('۲،نامعتبر')[1])).toBe(true)
 })
})
