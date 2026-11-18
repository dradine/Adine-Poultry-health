import {describe,it,expect} from 'vitest'
import {mapReaderRows,normalizeReaderNumber,parseDelimitedTable} from './readerImport'
describe('reader export import',()=>{
 it('parses quoted CSV cells and commas inside quoted values',()=>{
  const t=parseDelimitedTable('Sample ID,Result,Note\r\nA1,1200,"batch, one"\r\nA2,1500,"batch two"')
  expect(t.headers).toEqual(['Sample ID','Result','Note']);expect(t.rows[0][2]).toBe('batch, one')
 })
 it('parses semicolon files with decimal commas',()=>{
  const t=parseDelimitedTable('Sample;OD\nA1;0,25\nA2;0,50')
  expect(mapReaderRows(t,{resultColumn:1,sampleIdColumn:0,roleColumn:null,sampleRoleValue:''},'ELISA').values).toEqual([.25,.5])
 })
 it('separates controls from samples when role column and exact sample value are mapped',()=>{
  const t=parseDelimitedTable('Well,Type,ID,Result\nA1,Sample,S1,1200\nA2,Positive control,PC,2400\nA3,Sample,S2,1800')
  const r=mapReaderRows(t,{resultColumn:3,sampleIdColumn:2,roleColumn:1,sampleRoleValue:'Sample'},'ELISA')
  expect(r.values).toEqual([1200,1800]);expect(r.controlRows).toHaveLength(1)
 })
 it('rejects malformed sample rows and duplicate IDs',()=>{
  const bad=parseDelimitedTable('ID,Result\nA1,100\nA2,NA')
  expect(()=>mapReaderRows(bad,{resultColumn:1,sampleIdColumn:0,roleColumn:null,sampleRoleValue:''},'ELISA')).toThrow(/ردیف نمونه نامعتبر/)
  const dup=parseDelimitedTable('ID,Result\nA1,100\nA1,200')
  expect(()=>mapReaderRows(dup,{resultColumn:1,sampleIdColumn:0,roleColumn:null,sampleRoleValue:''},'ELISA')).toThrow(/تکراری/)
 })
 it('normalizes Persian digits and HI 1:16 notation',()=>{
  expect(normalizeReaderNumber('۱:۱۶','HI')).toBe(16)
  expect(normalizeReaderNumber('۰٫۲۵','ELISA')).toBe(0.25)
 })
})
