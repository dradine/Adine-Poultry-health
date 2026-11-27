export type SyncState = 'pending' | 'synced' | 'conflict'
export type LocalFlock = {
  id: string; owner_id?: string; flock_name: string; species: string
  breed?: string | null; hatch_date?: string | null; placement_date: string
  bird_count?: number | null; location_label?: string | null; timezone: string
  notes?: string | null; created_at: string; updated_at: string
  syncState: SyncState; deleted?: boolean; revision?: string; deleted_at?: string | null
}
export type LocalModelRun = {
  id: string; owner_id?: string; flock_id: string; disease_code: string
  model_version: string; model_family: string
  input_snapshot: Record<string, unknown>; output_snapshot: Record<string, unknown>
  confidence_level: 'insufficient' | 'low' | 'moderate' | 'high'
  decision_status: 'not_ready' | 'provisional' | 'review_required' | 'ready_for_vet_review'
  limitations: string[]; qc_summary?: Record<string, unknown>
  model_assumptions?: Record<string, unknown>; source_references?: unknown[]
  input_schema_version?: string | null; created_at: string; updated_at?: string
  syncState: SyncState; deleted?: boolean; revision?: string; deleted_at?: string | null
}
import { validateFlockReferenceRecord, type ClinicalObservationRecord, type FlockTimeSeriesRecord, type VaccinationEventRecord } from './flockReference'

export type LocalVaccinationEvent = VaccinationEventRecord & { syncState: SyncState; deleted?: boolean; revision?: string; deleted_at?: string | null }
export type LocalClinicalObservation = ClinicalObservationRecord & { syncState: SyncState; deleted?: boolean; revision?: string; deleted_at?: string | null }
export type LocalFlockTimeSeries = FlockTimeSeriesRecord & { syncState: SyncState; deleted?: boolean; revision?: string; deleted_at?: string | null }
export type LocalAuditEvent = { id: string; owner_id?: string; flock_id: string; entity_type: 'flock'|'model_run'|'vaccination_event'|'clinical_observation'|'time_series'|'serology_round'; entity_id: string; action: 'create'|'update'|'delete'|'restore'|'conflict'; reason?: string | null; before_snapshot?: Record<string, unknown> | null; after_snapshot?: Record<string, unknown> | null; created_at: string; syncState: SyncState }
export type RawImportRecord = { id: string; file_name: string; mime_type: string; byte_size: number; sha256: string; imported_at: string; parser_version: string; mapping: Record<string, unknown>; metadata: Record<string, unknown>; bytes: ArrayBuffer }
export type OutboxEntity = 'flocks' | 'model_runs' | 'flock_vaccination_events' | 'flock_clinical_observations' | 'flock_time_series'
type ReferenceEntity = 'flock_vaccination_events' | 'flock_clinical_observations' | 'flock_time_series'
export type OutboxItem = {
  id?: number; entity: OutboxEntity; operation: 'upsert' | 'delete' | 'restore'; mutation?: string; base?: string | null
  recordId: string; payload?: Record<string, unknown>; createdAt: string
  attempts: number; lastError?: string
}
type StoreName = 'flocks' | 'modelRuns' | 'vaccinationEvents' | 'clinicalObservations' | 'flockTimeSeries' | 'auditEvents' | 'rawImports' | 'outbox' | 'meta'
const DB_NAME = 'adine-vaccine-timing-local'
const DB_VERSION = 4
let dbPromise: Promise<IDBDatabase> | undefined

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('ذخیره‌سازی IndexedDB در این مرورگر در دسترس نیست.'))
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('flocks')) {
          const store = db.createObjectStore('flocks', { keyPath: 'id' })
          store.createIndex('syncState', 'syncState')
          store.createIndex('updated_at', 'updated_at')
        }
        if (!db.objectStoreNames.contains('modelRuns')) {
          const store = db.createObjectStore('modelRuns', { keyPath: 'id' })
          store.createIndex('flock_id', 'flock_id')
          store.createIndex('syncState', 'syncState')
        }
        if (!db.objectStoreNames.contains('vaccinationEvents')) {
          const store = db.createObjectStore('vaccinationEvents', { keyPath: 'id' })
          store.createIndex('flock_id', 'flock_id')
          store.createIndex('syncState', 'syncState')
        }
        if (!db.objectStoreNames.contains('clinicalObservations')) {
          const store = db.createObjectStore('clinicalObservations', { keyPath: 'id' })
          store.createIndex('flock_id', 'flock_id')
          store.createIndex('syncState', 'syncState')
        }
        if (!db.objectStoreNames.contains('flockTimeSeries')) {
          const store = db.createObjectStore('flockTimeSeries', { keyPath: 'id' })
          store.createIndex('flock_id', 'flock_id')
          store.createIndex('syncState', 'syncState')
        }
        if (!db.objectStoreNames.contains('auditEvents')) {
          const store = db.createObjectStore('auditEvents', { keyPath: 'id' })
          store.createIndex('flock_id', 'flock_id')
          store.createIndex('created_at', 'created_at')
        }
        if (!db.objectStoreNames.contains('rawImports')) {
          const store = db.createObjectStore('rawImports', { keyPath: 'id' })
          store.createIndex('sha256', 'sha256')
          store.createIndex('imported_at', 'imported_at')
        }
        if (!db.objectStoreNames.contains('outbox')) {
          const store = db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true })
          store.createIndex('createdAt', 'createdAt')
          store.createIndex('entity', 'entity')
        }
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
      }
      request.onsuccess = () => {
        const db = request.result
        db.onversionchange = () => { db.close(); dbPromise = undefined }
        resolve(db)
      }
      request.onerror = () => reject(request.error || new Error('باز کردن پایگاه داده محلی ناموفق بود.'))
      request.onblocked = () => reject(new Error('به‌روزرسانی پایگاه داده محلی مسدود شده است؛ تب‌های قدیمی برنامه را ببندید.'))
    }).catch(error => { dbPromise = undefined; throw error })
  }
  return dbPromise!
}
function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('تراکنش محلی ناموفق بود.'))
    tx.onabort = () => reject(tx.error || new Error('تراکنش محلی لغو شد.'))
  })
}
async function readAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb()
  const tx = db.transaction(storeName, 'readonly')
  const done = transactionDone(tx)
  const request = tx.objectStore(storeName).getAll()
  const result = await new Promise<T[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
  await done
  return result
}
function stripLocalFields(value: Record<string, unknown>): Record<string, unknown> {
  const { syncState: _syncState, deleted: _deleted, ...payload } = value
  return payload
}
function recordStore(entity: OutboxEntity): StoreName {
  if (entity === 'flocks') return 'flocks'
  if (entity === 'model_runs') return 'modelRuns'
  return referenceStore(entity)
}
function queueMutation(tx: IDBTransaction, entity: OutboxEntity, record: Record<string, unknown>, operation: OutboxItem['operation'], previous?: Record<string, unknown>) {
  const mutation = crypto.randomUUID()
  const base = typeof previous?.revision === 'string' ? previous.revision : null
  const payload = stripLocalFields(record)
  const deleted = operation === 'delete'
  const now = new Date().toISOString()
  tx.objectStore(recordStore(entity)).put({ ...record, deleted, deleted_at: deleted ? now : null, revision: mutation, syncState: 'pending' })
  const outbox = tx.objectStore('outbox')
  const request = outbox.index('entity').getAll(entity)
  request.onsuccess = () => {
    for (const old of request.result as OutboxItem[]) {
      if (old.recordId === String(record.id) && old.id !== undefined) outbox.delete(old.id)
    }
    outbox.add({ entity, operation, recordId: String(record.id), mutation, base, payload, createdAt: now, attempts: 0 } satisfies OutboxItem)
  }
}
async function saveRecord(entity: OutboxEntity, record: Record<string, unknown>) {
  const db = await openDb()
  const store = recordStore(entity)
  const tx = db.transaction([store,'outbox'], 'readwrite')
  const done = transactionDone(tx)
  const request = tx.objectStore(store).get(String(record.id))
  request.onsuccess = () => {
    if (request.result?.deleted || request.result?.syncState === 'conflict') { tx.abort(); return }
    queueMutation(tx, entity, record, 'upsert', request.result)
  }
  await done
}
export function saveLocalFlock(record: Omit<LocalFlock,'syncState'>) { return saveRecord('flocks',record) }
export function saveLocalModelRun(record: Omit<LocalModelRun,'syncState'>) { return saveRecord('model_runs',record) }
type LocalReferenceRecord = LocalVaccinationEvent | LocalClinicalObservation | LocalFlockTimeSeries
type ReferenceInput =
  | (Omit<LocalVaccinationEvent, 'syncState'> & { syncState?: SyncState })
  | (Omit<LocalClinicalObservation, 'syncState'> & { syncState?: SyncState })
  | (Omit<LocalFlockTimeSeries, 'syncState'> & { syncState?: SyncState })
function referenceStore(entity: ReferenceEntity): StoreName {
  if (entity === 'flock_vaccination_events') return 'vaccinationEvents'
  if (entity === 'flock_clinical_observations') return 'clinicalObservations'
  return 'flockTimeSeries'
}
export async function saveLocalReferenceRecord(entity: ReferenceEntity, record: ReferenceInput): Promise<void> {
  const validationEntity = entity === 'flock_vaccination_events' ? 'vaccination_event' : entity === 'flock_clinical_observations' ? 'clinical_observation' : 'time_series'
  const errors = validateFlockReferenceRecord(validationEntity, record)
  if (errors.length) throw new Error('رکورد پرونده مرجع گله معتبر نیست: ' + errors.join(' '))
  await saveRecord(entity, record)
}
export function listLocalReferenceRecords(entity: 'flock_vaccination_events', flockId?: string, includeDeleted?: boolean): Promise<LocalVaccinationEvent[]>
export function listLocalReferenceRecords(entity: 'flock_clinical_observations', flockId?: string, includeDeleted?: boolean): Promise<LocalClinicalObservation[]>
export function listLocalReferenceRecords(entity: 'flock_time_series', flockId?: string, includeDeleted?: boolean): Promise<LocalFlockTimeSeries[]>
export async function listLocalReferenceRecords(entity: ReferenceEntity, flockId?: string, includeDeleted = false): Promise<LocalReferenceRecord[]> {
  const rows = await readAll<LocalReferenceRecord>(referenceStore(entity))
  return rows.filter(row => (includeDeleted || !row.deleted) && (!flockId || row.flock_id === flockId)).sort((a, b) => {
    const dateOf = (row: LocalReferenceRecord) => 'event_date' in row ? row.event_date : row.observed_at
    return String(dateOf(b)).localeCompare(String(dateOf(a)))
  })
}
export async function changeDeletion(entity: OutboxEntity, id: string, deleted: boolean) {
  const db = await openDb()
  const store = recordStore(entity)
  const tx = db.transaction([store, 'outbox'], 'readwrite')
  const done = transactionDone(tx)
  const request = tx.objectStore(store).get(id)
  request.onsuccess = () => {
    const row = request.result
    if (row && Boolean(row.deleted) !== deleted && row.syncState !== 'conflict')
      queueMutation(tx, entity, row, deleted ? 'delete' : 'restore', row)
  }
  await done
}
export function markLocalReferenceDeleted(entity: ReferenceEntity,id: string) { return changeDeletion(entity,id,true) }
export function markLocalDeleted(entity: 'flocks'|'model_runs',id: string) { return changeDeletion(entity,id,true) }
export async function upsertLocalReferenceFromCloud(entity: ReferenceEntity, value: Record<string, unknown>): Promise<void> {
  const db = await openDb()
  const storeName = referenceStore(entity)
  const tx = db.transaction(storeName, 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore(storeName)
  const request = store.get(String(value.id))
  request.onsuccess = () => {
    const local = request.result as LocalReferenceRecord | undefined
    if (local?.syncState === 'pending' || local?.syncState === 'conflict') return
    store.put({ ...value, syncState: 'synced', deleted: Boolean(value.deleted_at) })
  }
  await done
}
export async function reconcileLocalReferenceWithCloud(entity: ReferenceEntity, remoteIds: string[]): Promise<number> {
  const db = await openDb()
  const storeName = referenceStore(entity)
  const tx = db.transaction(storeName, 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore(storeName)
  const request = store.getAll()
  let removed = 0
  request.onsuccess = () => {
    const ids = new Set(remoteIds)
    for (const row of request.result as LocalReferenceRecord[]) {
      if (row.syncState === 'synced' && !row.deleted && !ids.has(row.id)) { store.delete(row.id); removed++ }
    }
  }
  await done
  return removed
}
export async function listLocalFlocks(includeDeleted = false): Promise<LocalFlock[]> {
  const rows = await readAll<LocalFlock>('flocks')
  return rows.filter(row => includeDeleted || !row.deleted).sort((a,b) => b.placement_date.localeCompare(a.placement_date))
}
export async function listLocalModelRuns(includeDeleted = false): Promise<LocalModelRun[]> {
  const rows = await readAll<LocalModelRun>('modelRuns')
  return rows.filter(row => includeDeleted || !row.deleted).sort((a,b) => b.created_at.localeCompare(a.created_at))
}
export async function listOutbox(): Promise<OutboxItem[]> {
  return (await readAll<OutboxItem>('outbox')).sort((a,b) => (a.id || 0) - (b.id || 0))
}
export async function listLocalAuditEvents(flockId?: string): Promise<LocalAuditEvent[]> {
  const rows = await readAll<LocalAuditEvent>('auditEvents')
  return rows.filter(row => !flockId || row.flock_id === flockId).sort((a, b) => b.created_at.localeCompare(a.created_at))
}
export async function saveRawImport(record: RawImportRecord): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('rawImports', 'readwrite')
  const done = transactionDone(tx)
  tx.objectStore('rawImports').add(record)
  await done
}
export async function getRawImport(id: string): Promise<RawImportRecord | null> {
  const db = await openDb()
  const tx = db.transaction('rawImports', 'readonly')
  const done = transactionDone(tx)
  const request = tx.objectStore('rawImports').get(id)
  const result = await new Promise<RawImportRecord | null>((resolve, reject) => { request.onsuccess = () => resolve((request.result as RawImportRecord | undefined) || null); request.onerror = () => reject(request.error) })
  await done
  return result
}
export async function markLocalAuditSynced(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('auditEvents', 'readwrite')
  const done = transactionDone(tx)
  const request = tx.objectStore('auditEvents').get(id)
  request.onsuccess = () => {
    const row = request.result as LocalAuditEvent | undefined
    if (row) { row.syncState = 'synced'; tx.objectStore('auditEvents').put(row) }
  }
  await done
}
export async function upsertLocalAuditFromCloud(value: Record<string, unknown>): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('auditEvents', 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore('auditEvents')
  const request = store.get(String(value.id))
  request.onsuccess = () => {
    const local = request.result as LocalAuditEvent | undefined
    if (local?.syncState === 'pending') return
    store.put({ ...value, syncState: 'synced' })
  }
  await done
}
export async function getSyncMeta(key: string): Promise<string | null> {
  const db = await openDb()
  const tx = db.transaction('meta', 'readonly')
  const done = transactionDone(tx)
  const req = tx.objectStore('meta').get(key)
  const value = await new Promise<string | null>((resolve,reject) => {
    req.onsuccess = () => resolve((req.result as {value?:string}|undefined)?.value ?? null)
    req.onerror = () => reject(req.error)
  })
  await done
  return value
}
export async function setSyncMeta(key: string, value: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('meta', 'readwrite')
  const done = transactionDone(tx)
  tx.objectStore('meta').put({ key, value })
  await done
}
export async function removeOutboxItem(item: OutboxItem): Promise<void> {
  if (item.id === undefined) return
  const db = await openDb()
  const tx = db.transaction('outbox', 'readwrite')
  const done = transactionDone(tx)
  tx.objectStore('outbox').delete(item.id)
  await done
}
export async function recordOutboxFailure(item: OutboxItem, error: string): Promise<void> {
  if (item.id === undefined) return
  const db = await openDb()
  const tx = db.transaction('outbox', 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore('outbox')
  const req = store.get(item.id)
  req.onsuccess = () => { if (req.result) store.put({ ...req.result, attempts: req.result.attempts + 1, lastError: error }) }
  await done
}
export async function acknowledge(item: OutboxItem, conflict: boolean) {
  const db = await openDb()
  const store = recordStore(item.entity)
  const tx = db.transaction([store,'outbox'], 'readwrite')
  const done = transactionDone(tx)
  const req = tx.objectStore(store).get(item.recordId)
  req.onsuccess = () => {
    if (req.result && (conflict || req.result.revision === item.mutation))
      tx.objectStore(store).put({...req.result, syncState: conflict ? 'conflict' : 'synced'})
    if (!conflict && item.id !== undefined) tx.objectStore('outbox').delete(item.id)
  }
  await done
}
export async function markLocalSynced(entity: 'flocks' | 'model_runs', id: string): Promise<void> {
  const db = await openDb()
  const storeName = entity === 'flocks' ? 'flocks' : 'modelRuns'
  const tx = db.transaction(storeName, 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore(storeName)
  const req = store.get(id)
  req.onsuccess = () => {
    const row = req.result as (LocalFlock | LocalModelRun | undefined)
    if (row) { row.syncState = 'synced'; store.put(row) }
  }
  await done
}
export async function removeLocalRecord(entity: 'flocks' | 'model_runs', id: string): Promise<void> {
  await markLocalDeleted(entity, id)
}
export async function upsertLocalFromCloud(entity: 'flocks' | 'model_runs', value: Record<string, unknown>): Promise<void> {
  const db = await openDb()
  const storeName = entity === 'flocks' ? 'flocks' : 'modelRuns'
  const tx = db.transaction(storeName, 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore(storeName)
  const req = store.get(String(value.id))
  req.onsuccess = () => {
    const local = req.result as (LocalFlock | LocalModelRun | undefined)
    if (local?.syncState === 'pending' || local?.syncState === 'conflict') return
    store.put({ ...value, syncState: 'synced', deleted: Boolean(value.deleted_at) })
  }
  await done
}
/** Remove only previously-synced local rows that are absent from the complete cloud snapshot. Pending/conflicted local edits are never discarded. */
export async function reconcileLocalWithCloud(entity: 'flocks' | 'model_runs', remoteIds: string[]): Promise<number> {
  const db = await openDb()
  const storeName = entity === 'flocks' ? 'flocks' : 'modelRuns'
  const tx = db.transaction(storeName, 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore(storeName)
  const request = store.getAll()
  let removed = 0
  request.onsuccess = () => {
    const ids = new Set(remoteIds)
    for (const row of request.result as Array<LocalFlock | LocalModelRun>) {
      if (row.syncState === 'synced' && !row.deleted && !ids.has(row.id)) {
        store.delete(row.id)
        removed++
      }
    }
  }
  await done
  return removed
}

export async function countPendingChanges(): Promise<number> {
  return (await listOutbox()).length
}
export function notifyLocalDataChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('adine-local-data-changed'))
}


export async function importLocalFirstBackup(snapshot: { flocks?: unknown[]; modelRuns?: unknown[] }): Promise<{ flocks: number; modelRuns: number }> {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const existingFlocks = await listLocalFlocks(true)
  const existingRuns = await listLocalModelRuns(true)
  const flockIds = new Set(existingFlocks.map(row => row.id))
  const runIds = new Set(existingRuns.map(row => row.id))
  const incomingFlocks: Omit<LocalFlock, 'syncState'>[] = []
  const incomingRuns: Omit<LocalModelRun, 'syncState'>[] = []

  for (const value of snapshot.flocks || []) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('رکورد گله در فایل پشتیبان معتبر نیست.')
    const row = value as LocalFlock
    if (!uuid.test(row.id) || !row.flock_name?.trim() || !row.species?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.placement_date) ||
      !row.created_at || !Number.isFinite(Date.parse(row.created_at)) ||
      !row.updated_at || !Number.isFinite(Date.parse(row.updated_at))) {
      throw new Error('اطلاعات پایه گله در فایل پشتیبان ناقص یا نامعتبر است.')
    }
    if (flockIds.has(row.id)) continue
    const { syncState: _syncState, deleted: _deleted, owner_id: _owner, ...record } = row
    incomingFlocks.push(record)
    flockIds.add(row.id)
  }

  for (const value of snapshot.modelRuns || []) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('رکورد تحلیل در فایل پشتیبان معتبر نیست.')
    const row = value as LocalModelRun
    if (!uuid.test(row.id) || !uuid.test(row.flock_id) ||
      !['IBD', 'ND', 'IBV', 'AIV'].includes(row.disease_code) ||
      !row.model_version?.trim() || !row.model_family?.trim() ||
      !row.input_snapshot || typeof row.input_snapshot !== 'object' || Array.isArray(row.input_snapshot) ||
      !row.output_snapshot || typeof row.output_snapshot !== 'object' || Array.isArray(row.output_snapshot) ||
      !['insufficient', 'low', 'moderate', 'high'].includes(row.confidence_level) ||
      !['not_ready', 'provisional', 'review_required', 'ready_for_vet_review'].includes(row.decision_status) ||
      !Array.isArray(row.limitations) || !row.limitations.every(item => typeof item === 'string') ||
      !row.created_at || !Number.isFinite(Date.parse(row.created_at))) {
      throw new Error('اطلاعات پایه تحلیل در فایل پشتیبان ناقص یا نامعتبر است.')
    }
    if (!flockIds.has(row.flock_id)) throw new Error('تحلیل به گله‌ای متصل است که در فایل پشتیبان وجود ندارد.')
    if (runIds.has(row.id)) continue
    const { syncState: _syncState, deleted: _deleted, owner_id: _owner, ...record } = row
    incomingRuns.push(record)
    runIds.add(row.id)
  }

  if (incomingFlocks.length === 0 && incomingRuns.length === 0) return { flocks: 0, modelRuns: 0 }
  const db = await openDb()
  const tx = db.transaction(['flocks', 'modelRuns', 'outbox'], 'readwrite')
  const done = transactionDone(tx)
  for (const row of incomingFlocks) queueMutation(tx,'flocks',row,'upsert')
  for (const row of incomingRuns) queueMutation(tx,'model_runs',row,'upsert')
  await done
  return { flocks: incomingFlocks.length, modelRuns: incomingRuns.length }
}
