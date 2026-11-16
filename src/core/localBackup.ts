export type LocalBackup = {
  schema: 'adine-vaccine-timing-backup'
  version: 1
  exportedAt: string
  profiles: unknown[]
  analyses: unknown[]
}

const PROFILE_KEY = 'adine-vaccine-timing-profiles-v1'
const ANALYSIS_KEY = 'adine-vaccine-timing-analyses-v1'

function readArray(storage: Storage, key: string): unknown[] {
  const raw = storage.getItem(key)
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error(`داده ذخیره‌شده ${key} ساختار معتبر ندارد.`)
  return parsed
}

export function createLocalBackup(storage: Storage = localStorage): LocalBackup {
  return {
    schema: 'adine-vaccine-timing-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: readArray(storage, PROFILE_KEY),
    analyses: readArray(storage, ANALYSIS_KEY),
  }
}

export function validateLocalBackup(value: unknown): LocalBackup {
  if (!value || typeof value !== 'object') throw new Error('فایل پشتیبان معتبر نیست.')
  const candidate = value as Partial<LocalBackup>
  if (candidate.schema !== 'adine-vaccine-timing-backup' || candidate.version !== 1) {
    throw new Error('نسخه یا قالب فایل پشتیبان با این برنامه سازگار نیست.')
  }
  if (typeof candidate.exportedAt !== 'string' || !Number.isFinite(Date.parse(candidate.exportedAt))) throw new Error('تاریخ خروجی پشتیبان معتبر نیست.')\n  if (!Array.isArray(candidate.profiles) || !Array.isArray(candidate.analyses)) {
    throw new Error('ساختار گله‌ها یا تحلیل‌های فایل پشتیبان معتبر نیست.')
  }
  return candidate as LocalBackup
}

/** Import is merge-only by record id and atomic: validate/serialize first, then write both keys. */
export function restoreLocalBackup(raw: unknown, storage: Storage = localStorage): { profiles: number; analyses: number } {
  const backup = validateLocalBackup(raw)
  const currentProfiles = readArray(storage, PROFILE_KEY)
  const currentAnalyses = readArray(storage, ANALYSIS_KEY)
  const merge = (current: unknown[], incoming: unknown[]) => {
    const idOf = (item: unknown) => item && typeof item === 'object' && 'id' in item ? String((item as {id:unknown}).id) : ''
    const ids = new Set(current.map(idOf).filter(Boolean))
    const additions: unknown[] = []
    for (const item of incoming) {
      const id = idOf(item)
      if (!id || !ids.has(id)) { additions.push(item); if (id) ids.add(id) }
    }
    return [...current, ...additions]
  }
  const profiles = merge(currentProfiles, backup.profiles)
  const analyses = merge(currentAnalyses, backup.analyses).slice(0, 1000)
  const p = JSON.stringify(profiles), a = JSON.stringify(analyses)
  // Snapshot prior values; rollback if either write fails.
  const oldP = storage.getItem(PROFILE_KEY), oldA = storage.getItem(ANALYSIS_KEY)
  try { storage.setItem(PROFILE_KEY,p); storage.setItem(ANALYSIS_KEY,a) }
  catch (error) {
    try { oldP === null ? storage.removeItem(PROFILE_KEY) : storage.setItem(PROFILE_KEY,oldP) } catch {}
    try { oldA === null ? storage.removeItem(ANALYSIS_KEY) : storage.setItem(ANALYSIS_KEY,oldA) } catch {}
    throw error
  }
  return { profiles: profiles.length, analyses: analyses.length }
}
