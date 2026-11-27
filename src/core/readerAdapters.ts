import { mapReaderRows, parseDelimitedTable, validateReaderScale, type ReaderImport, type ReaderMapping, type ReaderTable } from './readerImport'

export type ReaderFamily = 'biochek-ii' | 'idexx-xchekplus' | 'idvet-idsoft' | 'manual-hi' | 'generic-delimited'
export type AdapterFormat = 'csv' | 'tsv' | 'excel' | 'xml' | 'sdf' | 'proprietary'
export type ReaderAdapterProfile = {
  id: string
  family: ReaderFamily
  displayName: string
  formats: AdapterFormat[]
  resultAliases: RegExp[]
  sampleIdAliases: RegExp[]
  roleAliases: RegExp[]
  supportedScales: string[]
  status: 'ready-delimited' | 'schema-required' | 'proprietary-unsupported'
  source: string
  limitations: string[]
}

export const READER_ADAPTER_PROFILES: ReaderAdapterProfile[] = [
  {
    id: 'biochek-ii-csv', family: 'biochek-ii', displayName: 'BioChek II — CSV export', formats: ['csv', 'tsv'],
    resultAliases: [/titer|titre|result|od|s\/p|s\/n|value/i], sampleIdAliases: [/sample.?id|barcode|specimen|bird.?id|sample.?code/i], roleAliases: [/type|role|well.?type|control/i],
    supportedScales: ['od', 'sp', 'sn', 'kit-titer'], status: 'ready-delimited', source: 'https://www.biochek.com/software/',
    limitations: ['فقط خروجی متنی مستند و ناشناس‌شده را می‌پذیرد؛ فایل BXP یا پایگاه آنلاین را مستقیماً تفسیر نمی‌کند.', 'نام ستون‌ها و مقدارهای کنترل باید با export واقعی تطبیق داده شوند.'],
  },
  {
    id: 'idexx-xchekplus-delimited', family: 'idexx-xchekplus', displayName: 'IDEXX xChekPlus — delimited export', formats: ['csv', 'tsv'],
    resultAliases: [/result|od|s\/p|s\/n|titer|titre|value/i], sampleIdAliases: [/sample|case|specimen|animal|bird|id/i], roleAliases: [/type|control|role|well/i],
    supportedScales: ['od', 'sp', 'sn', 'kit-titer'], status: 'schema-required', source: 'https://www.idexx.com/en/livestock/xchekplus-software/xchek-software-resources/',
    limitations: ['xChekPlus database export may be SDF and assay/reader files may be XML. Exact schema and version are required before automatic parsing.', 'Do not overwrite or append a database export without a verified backup and case identity mapping.'],
  },
  {
    id: 'idvet-idsoft-delimited', family: 'idvet-idsoft', displayName: 'IDsoft — Excel/CSV export', formats: ['csv', 'tsv', 'excel'],
    resultAliases: [/od|s\/p|s\/n|titre|titer|result|value/i], sampleIdAliases: [/sample|specimen|barcode|id/i], roleAliases: [/type|control|role|well/i],
    supportedScales: ['od', 'sp', 'sn', 'kit-titer'], status: 'schema-required', source: 'https://chakmartin.net/wp-content/uploads/2024/10/IDvet-Product-list_SWINE_PCR-AND-ELISA_EN_09-AUG-24_Lr01.pdf',
    limitations: ['IDsoft supports reader, Excel and manual workflows, but the exact export columns depend on version and assay template.', 'VP2, conventional IBD, ND and IBV assay families must remain separate.'],
  },
  {
    id: 'manual-hi-csv', family: 'manual-hi', displayName: 'Manual HI — CSV/TSV', formats: ['csv', 'tsv'],
    resultAliases: [/hi|titre|titer|endpoint|reciprocal|result/i], sampleIdAliases: [/sample|bird|specimen|id/i], roleAliases: [/type|control|role/i],
    supportedScales: ['hi-reciprocal'], status: 'ready-delimited', source: 'WOAH Terrestrial Manual, Newcastle disease chapter',
    limitations: ['HAU, RBC, antigen strain, SOP and endpoint convention must be captured separately.', 'No universal protective HI cutoff is applied.'],
  },
  {
    id: 'generic-delimited', family: 'generic-delimited', displayName: 'Generic CSV/TSV', formats: ['csv', 'tsv'],
    resultAliases: [/result|value|od|s\/p|s\/n|titer|titre/i], sampleIdAliases: [/sample|specimen|bird|animal|id/i], roleAliases: [/type|role|control|well/i],
    supportedScales: ['od', 'sp', 'sn', 'kit-titer', 'hi-reciprocal'], status: 'ready-delimited', source: 'Project import contract',
    limitations: ['روش assay، کیت، lot، IFU و QC باید جداگانه توسط کاربر ثبت شود.'],
  },
]

export type AdapterPreview = { profile: ReaderAdapterProfile; table: ReaderTable; mapping: ReaderMapping; resultColumn: number; sampleIdColumn: number | null; roleColumn: number | null }
const firstMatch = (headers: string[], aliases: RegExp[]) => headers.findIndex(header => aliases.some(alias => alias.test(header)))

export function getReaderAdapterProfile(id: string): ReaderAdapterProfile {
  const profile = READER_ADAPTER_PROFILES.find(item => item.id === id)
  if (!profile) throw new Error('پروفایل adapter ناشناخته است.')
  return profile
}

export function prepareReaderAdapterPreview(profileId: string, source: string, method: 'ELISA' | 'HI', scale: string): AdapterPreview {
  const profile = getReaderAdapterProfile(profileId)
  if (profile.status === 'proprietary-unsupported') throw new Error('این قالب proprietary هنوز parser معتبر ندارد.')
  if (!profile.supportedScales.includes(scale)) throw new Error('مقیاس انتخاب‌شده با پروفایل adapter سازگار نیست.')
  const table = parseDelimitedTable(source)
  const resultColumn = firstMatch(table.headers, profile.resultAliases)
  if (resultColumn < 0) throw new Error('ستون نتیجه در این فایل پیدا نشد؛ mapping دستی لازم است.')
  validateReaderScale(table.headers[resultColumn], method, scale)
  const sampleId = firstMatch(table.headers, profile.sampleIdAliases)
  const role = firstMatch(table.headers, profile.roleAliases)
  return { profile, table, mapping: { resultColumn, sampleIdColumn: sampleId < 0 ? null : sampleId, roleColumn: role < 0 ? null : role, sampleRoleValue: 'Sample' }, resultColumn, sampleIdColumn: sampleId < 0 ? null : sampleId, roleColumn: role < 0 ? null : role }
}

export function importWithReaderAdapter(preview: AdapterPreview, method: 'ELISA' | 'HI'): ReaderImport {
  return mapReaderRows(preview.table, preview.mapping, method)
}
