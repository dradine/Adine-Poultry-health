import {describe,it,expect} from 'vitest'
import {evaluatePlateControls,mapReaderRows,normalizeReaderNumber,parseDelimitedTable,validateReaderScale} from './readerImport'
describe('reader export import',()=>{
 it('parses quoted CSV cells and commas inside quoted values',()=>{
  const t=parseDelimitedTable('Sample ID,Result,Note\r\nA1,1200,"batch, one"\r\nA2,1500,"batch two"')
  expect(t.headers).toEqual(['Sample ID','Result','Note']);expect(t.rows[0][2]).toBe('batch, one')
 })
 it('strips UTF-8 BOM from Excel CSV exports',()=>{expect(parseDelimitedTable(String.fromCharCode(0xFEFF)+'ID,Result'+String.fromCharCode(10)+'A1,1.5').headers[0]).toBe('ID')})
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
  const bad=parseDelimitedTable('ID,Result\nA1,100\nA2,not-a-number')
  expect(()=>mapReaderRows(bad,{resultColumn:1,sampleIdColumn:0,roleColumn:null,sampleRoleValue:''},'ELISA')).toThrow(/ردیف نمونه نامعتبر/)
  const dup=parseDelimitedTable('ID,Result\nA1,100\nA1,200')
  expect(()=>mapReaderRows(dup,{resultColumn:1,sampleIdColumn:0,roleColumn:null,sampleRoleValue:''},'ELISA')).toThrow(/تکراری/)
 })
 it('allows zero ELISA OD but rejects zero reciprocal HI titre',()=>{expect(normalizeReaderNumber('0','ELISA')).toBe(0);expect(()=>normalizeReaderNumber('0','HI')).toThrow()})
 it('preserves censored and missing sample results instead of converting them to numbers',()=>{
  const t=parseDelimitedTable('ID,Result\nA1,<LOD\nA2,>ULOQ\nA3,NA\nA4,120')
  const r=mapReaderRows(t,{resultColumn:1,sampleIdColumn:0,roleColumn:null,sampleRoleValue:''},'ELISA')
  expect(r.values).toEqual([120]); expect(r.censoredRows.map(x=>x.status)).toEqual(['below_lod','above_uloq','missing'])
 })
 it('recognizes common censored laboratory spellings without numeric substitution',()=>{
  const t=parseDelimitedTable('ID,Result\nA1,<10\nA2,>500\nA3,below LOD\nA4,above ULOQ\nA5,ND\nA6,1.2')
  const r=mapReaderRows(t,{resultColumn:1,sampleIdColumn:0,roleColumn:null,sampleRoleValue:''},'ELISA')
  expect(r.values).toEqual([1.2])
  expect(r.censoredRows.map(x=>[x.value,x.status])).toEqual([['<10','below_lod'],['>500','above_uloq'],['below LOD','below_lod'],['above ULOQ','above_uloq'],['ND','missing']])
 })
 it('stops when control-like rows exist without an explicit role mapping',()=>{
  const t=parseDelimitedTable('ID,Label,Result\nA1,Sample,1\nPC1,Positive Control 1,2\nA2,Sample,1.5')
  expect(()=>mapReaderRows(t,{resultColumn:2,sampleIdColumn:0,roleColumn:null,sampleRoleValue:''},'ELISA')).toThrow(/کنترل/)
  const negative=parseDelimitedTable('ID,Label,Result\nA1,Sample,1\nNC1,Negative Control 1,0.1')
  expect(()=>mapReaderRows(negative,{resultColumn:2,sampleIdColumn:0,roleColumn:null,sampleRoleValue:''},'ELISA')).toThrow(/کنترل/)
 })
 it('normalizes Persian digits and HI 1:16 notation',()=>{
  expect(normalizeReaderNumber('۱:۱۶','HI')).toBe(16)
  expect(normalizeReaderNumber('۰٫۲۵','ELISA')).toBe(0.25)
 })
})


describe('reader column scale guard',()=>{
 it('rejects OD columns mislabeled as kit titres',()=>expect(()=>validateReaderScale('OD450','ELISA','kit-titer')).toThrow(/OD/))
 it('accepts OD only when OD scale is selected',()=>expect(()=>validateReaderScale('OD450','ELISA','od')).not.toThrow())
 it('requires reciprocal scale for HI',()=>expect(()=>validateReaderScale('HI Titre','HI','od')).toThrow(/HI reciprocal/))
 it('rejects S/P or S/N columns under another scale',()=>{
  expect(()=>validateReaderScale('S/P ratio','ELISA','od')).toThrow(/S\/P/)
  expect(()=>validateReaderScale('S/N ratio','ELISA','sp')).toThrow(/S\/N/)
 })
})
describe('plate control evaluation',()=>{
 const table=parseDelimitedTable('Well,Type,ID,Result\nA1,Sample,S1,1200\nA2,Positive,PC1,1.5\nA3,Positive,PC2,1.6\nA4,Negative,NC1,0.1\nA5,Negative,NC2,0.12')
 const criteria={roleColumn:1,resultColumn:3,positiveRole:'Positive',negativeRole:'Negative',positiveMin:1,positiveMax:2,negativeMax:.2,source:'IFU rev 3 p.8',maxReplicateCvPercent:20}
 it('passes only when both controls meet entered IFU limits and replicate precision',()=>{
  const q=evaluatePlateControls(table,criteria,'ELISA')
  expect(q.status).toBe('pass');expect(q.groups).toHaveLength(2);expect(q.groups[0].n).toBe(2)
 })
 it('fails when a control mean is outside its entered IFU range',()=>{
  const bad=parseDelimitedTable('Well,Type,ID,Result\nA1,Sample,S1,1200\nA2,Positive,PC1,0.5\nA3,Negative,NC1,0.1')
  expect(evaluatePlateControls(bad,criteria,'ELISA').status).toBe('fail')
 })
 it('applies a separately configured replicate range-to-mean percentage limit',()=>{
  const pass=evaluatePlateControls(table,{...criteria,maxReplicateCvPercent:null,maxReplicatePercentDifference:20},'ELISA')
  expect(pass.status).toBe('pass');expect(pass.groups[0].percentDifference).toBeGreaterThan(0)
  const wide=parseDelimitedTable('Well,Type,ID,Result\nA1,Sample,S1,1200\nA2,Positive,PC1,1.5\nA3,Positive,PC2,1.6\nA4,Negative,NC1,0.1\nA5,Negative,NC2,0.2')
  expect(evaluatePlateControls(wide,{...criteria,maxReplicateCvPercent:null,maxReplicatePercentDifference:20},'ELISA').status).toBe('fail')
 })
 it('does not claim QC pass when a reference control is selected without its limits',()=>{
  expect(evaluatePlateControls(table,{...criteria,referenceRole:'Reference'},'ELISA').status).toBe('pending')
 })
 it('rejects duplicated control roles even when case differs and rejects result-role column collision',()=>{
  expect(evaluatePlateControls(table,{...criteria,negativeRole:'positive'},'ELISA').status).toBe('pending')
  expect(evaluatePlateControls(table,{...criteria,resultColumn:1},'ELISA').status).toBe('pending')
 })
 it('rejects negative reference control limits',()=>{
  expect(evaluatePlateControls(table,{...criteria,referenceRole:'Reference',referenceMin:-1,referenceMax:1},'ELISA').status).toBe('pending')
 })
 it('does not claim QC pass when IFU source or role mapping is missing',()=>{
  expect(evaluatePlateControls(table,{...criteria,source:''},'ELISA').status).toBe('pending')
  expect(evaluatePlateControls(table,{...criteria,roleColumn:null},'ELISA').status).toBe('pending')
 })
})
