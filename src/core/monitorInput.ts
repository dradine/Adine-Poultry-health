import { normalizeDigits } from './ibd'

export function parseMonitorNumbers(value: string): number[] {
  return value.split(/[،,؛;\s]+/).filter(Boolean).map(item => Number(normalizeDigits(item)))
}

export function parsePairedHiRows(value: string): Array<{birdId:string;baselineHiLog2:number;postHiLog2:number}> {
  return value.split('\n').map(line => line.trim()).filter(Boolean).map((line,index) => {
    const parts = line.split(/[,:;،\t]/).map(part => part.trim())
    if (parts.length !== 3 || !parts[0]) throw new Error(`ردیف ${index+1}: سه ستون شناسه پرنده، HI قبل و HI بعد لازم است.`)
    return { birdId:parts[0], baselineHiLog2:Number(normalizeDigits(parts[1])), postHiLog2:Number(normalizeDigits(parts[2])) }
  })
}

export function parseDayValueRows(value: string): Array<{day:number;value:number}> {
  return value.split('\n').map(line => line.trim()).filter(Boolean).map((line,index) => {
    const parts = line.split(/[:;,،]/)
    if (parts.length !== 2) throw new Error(`ردیف ${index+1}: قالب روز:مقدار لازم است.`)
    return { day:Number(normalizeDigits(parts[0].trim())), value:Number(normalizeDigits(parts[1].trim())) }
  })
}
