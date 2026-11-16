import { supabase } from './supabase'
import {
  listOutbox, removeOutboxItem, recordOutboxFailure, markLocalSynced,
  removeLocalRecord, listLocalFlocks, listLocalModelRuns, upsertLocalFromCloud,
  setSyncMeta, getSyncMeta, saveLocalFlock, saveLocalModelRun,
  type LocalFlock, type LocalModelRun, type OutboxItem,
} from './localFirstDb'

const PROFILE_KEY = 'adine-vaccine-timing-profiles-v1'
const ANALYSIS_KEY = 'adine-vaccine-timing-analyses-v1'
type LegacyProfile = { id: string; flockName: string; placementDate: string; savedAt: string }
type LegacyAnalysis = {
  id: string; flockName: string; placementDate: string; samplingAge: string
  kitName: string; vaccineName: string; bttSource: string; halfLifeSource: string
  correctionSource: string; btt: string; halfLife: string; correctionDays: string
  minimumSampleCount: string; susceptiblePercent: string; titersText: string
  estimatedVaccinationAgeDays: number | null; percentileTiter: number; percentileRank: number
  sampleCount: number; plateQcAccepted: boolean; randomSamplingConfirmed: boolean
  pairingVerified: boolean; savedAt: string
}
function parseArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value as T[] : []
  } catch { return [] }
}
function dateOnly(value: string): string { return value.slice(0, 10) }
function modelRunFromLegacy(item: LegacyAnalysis, flockId: string): Omit<LocalModelRun, 'syncState'> {
  return {
    id: item.id, flock_id: flockId, disease_code: 'IBD',
    model_version: 'ibd-deventer-mvp-0.2.0', model_family: 'deventer-live-conventional',
    input_snapshot: { ...item },
    output_snapshot: {
      estimatedVaccinationAgeDays: item.estimatedVaccinationAgeDays,
      percentileTiter: item.percentileTiter, percentileRank: item.percentileRank,
      sampleCount: item.sampleCount,
    },
    confidence_level: 'low', decision_status: 'review_required',
    limitations: [
      'MVP experimental model; not prospectively validated in Iranian commercial flocks.',
      'Only conventional live IBD vaccines; not immune-complex or HVT-VP2.',
      'MDA reaching BTT is not vaccine take, serological response, protection or transmission prevention.',
    ],
    qc_summary: {
      plateQcAccepted: item.plateQcAccepted,
      randomSamplingConfirmed: item.randomSamplingConfirmed,
      pairingVerified: item.pairingVerified,
    },
    model_assumptions: {
      samplingAge: item.samplingAge, btt: item.btt, halfLife: item.halfLife,
      correctionDays: item.correctionDays, susceptiblePercent: item.susceptiblePercent,
      minimumSampleCount: item.minimumSampleCount,
    },
    source_references: [], input_schema_version: 'legacy-local-v1',
    created_at: item.savedAt,
  }
}
let legacyMigration: Promise<{ flocks: number; analyses: number }> | null = null
export function migrateLegacyLocalData(): Promise<{ flocks: number; analyses: number }> {
  if (!legacyMigration) {
    legacyMigration = migrateLegacyLocalDataOnce().finally(() => { legacyMigration = null })
  }
  return legacyMigration
}
async function migrateLegacyLocalDataOnce(): Promise<{ flocks: number; analyses: number }> {
  const profiles = parseArray<LegacyProfile>(PROFILE_KEY)
  const analyses = parseArray<LegacyAnalysis>(ANALYSIS_KEY)
  const existingFlocks = await listLocalFlocks(true)
  const byId = new Map(existingFlocks.map(row => [row.id, row]))
  const byNameDate = new Map(existingFlocks.map(row => [row.flock_name + '|' + row.placement_date, row]))
  let addedFlocks = 0, addedAnalyses = 0
  for (const profile of profiles) {
    if (!profile.id || !profile.flockName || !profile.placementDate || byId.has(profile.id)) continue
    const row: Omit<LocalFlock, 'syncState'> = {
      id: profile.id, flock_name: profile.flockName, species: 'broiler',
      placement_date: dateOnly(profile.placementDate), timezone: 'Asia/Tehran',
      created_at: profile.savedAt || new Date().toISOString(),
      updated_at: profile.savedAt || new Date().toISOString(),
    }
    await saveLocalFlock(row)
    byId.set(row.id, { ...row, syncState: 'pending' })
    byNameDate.set(row.flock_name + '|' + row.placement_date, { ...row, syncState: 'pending' })
    addedFlocks++
  }
  const knownRuns = new Set((await listLocalModelRuns(true)).map(row => row.id))
  for (const item of analyses) {
    if (!item.id || knownRuns.has(item.id)) continue
    const key = item.flockName + '|' + dateOnly(item.placementDate)
    let flock = byNameDate.get(key)
    if (!flock) {
      const id = crypto.randomUUID()
      const row: Omit<LocalFlock, 'syncState'> = {
        id, flock_name: item.flockName, species: 'broiler',
        placement_date: dateOnly(item.placementDate), timezone: 'Asia/Tehran',
        created_at: item.savedAt || new Date().toISOString(),
        updated_at: item.savedAt || new Date().toISOString(),
      }
      await saveLocalFlock(row)
      flock = { ...row, syncState: 'pending' }
      byId.set(id, flock)
      byNameDate.set(key, flock)
      addedFlocks++
    }
    await saveLocalModelRun(modelRunFromLegacy(item, flock.id))
    addedAnalyses++
  }
  return { flocks: addedFlocks, analyses: addedAnalyses }
}
export async function saveProfileToLocal(profile: LegacyProfile): Promise<void> {
  const row: Omit<LocalFlock, 'syncState'> = {
    id: profile.id, flock_name: profile.flockName, species: 'broiler',
    placement_date: dateOnly(profile.placementDate), timezone: 'Asia/Tehran',
    created_at: profile.savedAt, updated_at: profile.savedAt,
  }
  await saveLocalFlock(row)
}
export async function saveAnalysisToLocal(item: LegacyAnalysis, profileId?: string): Promise<void> {
  let flock = profileId ? (await listLocalFlocks(true)).find(row => row.id === profileId) : undefined
  if (!flock) flock = (await listLocalFlocks(true)).find(row =>
    row.flock_name === item.flockName && row.placement_date === dateOnly(item.placementDate) && !row.deleted
  )
  if (!flock) {
    const row: Omit<LocalFlock, 'syncState'> = {
      id: crypto.randomUUID(), flock_name: item.flockName, species: 'broiler',
      placement_date: dateOnly(item.placementDate), timezone: 'Asia/Tehran',
      created_at: item.savedAt, updated_at: item.savedAt,
    }
    await saveLocalFlock(row)
    flock = { ...row, syncState: 'pending' }
  }
  await saveLocalModelRun(modelRunFromLegacy(item, flock.id))
}
function legacyFromCloud(flocks: LocalFlock[], runs: LocalModelRun[]) {
  const profiles = flocks.filter(row => !row.deleted).map(row => ({
    id: row.id, flockName: row.flock_name, placementDate: row.placement_date,
    savedAt: row.updated_at || row.created_at,
  }))
  const flockById = new Map(flocks.map(row => [row.id, row]))
  const analyses = runs.filter(row => !row.deleted && row.disease_code === 'IBD').map(row => {
    const input = row.input_snapshot as unknown as LegacyAnalysis
    const output = row.output_snapshot || {}
    const flock = flockById.get(row.flock_id)
    return {
      ...input, id: row.id,
      flockName: input.flockName || flock?.flock_name || '',
      placementDate: input.placementDate || flock?.placement_date || '',
      estimatedVaccinationAgeDays: (output.estimatedVaccinationAgeDays as number | null) ?? input.estimatedVaccinationAgeDays ?? null,
      percentileTiter: Number(output.percentileTiter ?? input.percentileTiter ?? 0),
      percentileRank: Number(output.percentileRank ?? input.percentileRank ?? 0),
      sampleCount: Number(output.sampleCount ?? input.sampleCount ?? 0),
      savedAt: row.created_at,
    }
  })
  return { profiles, analyses }
}
export async function refreshLegacyCacheFromLocal(): Promise<void> {
  const [flocks, runs] = await Promise.all([listLocalFlocks(), listLocalModelRuns()])
  const legacy = legacyFromCloud(flocks, runs)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(legacy.profiles))
  localStorage.setItem(ANALYSIS_KEY, JSON.stringify(legacy.analyses.slice(0, 1000)))
}
async function applyOutbox(item: OutboxItem, userId: string): Promise<void> {
  const table = item.entity
  if (item.operation === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', item.recordId)
    if (error) throw error
    await removeLocalRecord(item.entity, item.recordId)
  } else {
    const payload = { ...(item.payload || {}), owner_id: userId }
    if (item.entity === 'flocks') {
      const { data: remote, error: readError } = await supabase
        .from('flocks').select('updated_at').eq('id', item.recordId).maybeSingle()
      if (readError) throw readError
      const localTime = Date.parse(String(payload.updated_at || ''))
      const remoteTime = remote?.updated_at ? Date.parse(remote.updated_at) : 0
      if (remoteTime && localTime && remoteTime > localTime + 1000) {
        throw new Error('تعارض ویرایش گله: نسخه ابری جدیدتر از نسخه این دستگاه است. تغییر محلی در صف باقی ماند و برای جلوگیری از بازنویسی اطلاعات دستگاه دیگر، ارسال متوقف شد.')
      }
      const { error } = await supabase.from('flocks').upsert(payload, { onConflict: 'id' })
      if (error) throw error
    } else {
      const { data: existing, error: readError } = await supabase
        .from('model_runs').select('id').eq('id', item.recordId).maybeSingle()
      if (readError) throw readError
      if (!existing) {
        const { error } = await supabase.from('model_runs').insert(payload)
        if (error) throw error
      }
    }
    await markLocalSynced(item.entity, item.recordId)
  }
  await removeOutboxItem(item)
}
export type SyncResult = { pushed: number; pulledFlocks: number; pulledRuns: number; pending: number; lastSyncAt: string }
export async function syncLocalData(userId: string): Promise<SyncResult> {
  if (!navigator.onLine) throw new Error('اتصال اینترنت برقرار نیست؛ اطلاعات همچنان روی همین دستگاه ذخیره می‌شوند.')
  const boundAccount = await getSyncMeta('bound-account')
  if (boundAccount && boundAccount !== userId) {
    throw new Error('این دستگاه قبلاً به حساب دیگری متصل شده است. برای جلوگیری از انتقال داده‌های یک حساب به حساب دیگر، همگام‌سازی با حساب متفاوت مسدود شد.')
  }
  if (!boundAccount) await setSyncMeta('bound-account', userId)
  const queue = await listOutbox()
  let pushed = 0
  for (const item of queue) {
    try {
      await applyOutbox(item, userId)
      pushed++
    } catch (error) {
      const message = error instanceof Error ? error.message : 'خطای نامشخص همگام‌سازی'
      await recordOutboxFailure(item, message)
      throw new Error('همگام‌سازی متوقف شد تا اطلاعات از بین نروند: ' + message)
    }
  }
  const [flocksResponse, runsResponse] = await Promise.all([
    supabase.from('flocks').select('*').eq('owner_id', userId),
    supabase.from('model_runs').select('*').eq('owner_id', userId),
  ])
  if (flocksResponse.error) throw flocksResponse.error
  if (runsResponse.error) throw runsResponse.error
  for (const row of (flocksResponse.data || []) as unknown as Record<string, unknown>[]) await upsertLocalFromCloud('flocks', row)
  for (const row of (runsResponse.data || []) as unknown as Record<string, unknown>[]) await upsertLocalFromCloud('model_runs', row)
  const lastSyncAt = new Date().toISOString()
  await setSyncMeta('last-sync:' + userId, lastSyncAt)
  await refreshLegacyCacheFromLocal()
  return {
    pushed, pulledFlocks: flocksResponse.data?.length || 0,
    pulledRuns: runsResponse.data?.length || 0,
    pending: (await listOutbox()).length, lastSyncAt,
  }
}
export async function getLastSync(userId: string): Promise<string | null> {
  return getSyncMeta('last-sync:' + userId)
}
