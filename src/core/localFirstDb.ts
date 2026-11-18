export type SyncState = 'pending' | 'synced' | 'conflict'
export type LocalFlock = {
  id: string; owner_id?: string; flock_name: string; species: string
  breed?: string | null; hatch_date?: string | null; placement_date: string
  bird_count?: number | null; location_label?: string | null; timezone: string
  notes?: string | null; created_at: string; updated_at: string
  syncState: SyncState; deleted?: boolean
}
export type LocalModelRun = {
  id: string; owner_id?: string; flock_id: string; disease_code: string
  model_version: string; model_family: string
  input_snapshot: Record<string, unknown>; output_snapshot: Record<string, unknown>
  confidence_level: 'insufficient' | 'low' | 'moderate' | 'high'
  decision_status: 'not_ready' | 'provisional' | 'review_required' | 'ready_for_vet_review'
  limitations: string[]; qc_summary?: Record<string, unknown>
  model_assumptions?: Record<string, unknown>; source_references?: unknown[]
  input_schema_version?: string | null; created_at: string
  syncState: SyncState; deleted?: boolean
}
export type OutboxItem = {
  id?: number; entity: 'flocks' | 'model_runs'; operation: 'upsert' | 'delete'
  recordId: string; payload?: Record<string, unknown>; createdAt: string
  attempts: number; lastError?: string
}
type StoreName = 'flocks' | 'modelRuns' | 'outbox' | 'meta'
const DB_NAME = 'adine-vaccine-timing-local'
const DB_VERSION = 1
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
function enqueueLatest(tx: IDBTransaction, item: OutboxItem): void {
  const store = tx.objectStore('outbox')
  const request = store.index('entity').getAll(item.entity)
  request.onsuccess = () => {
    for (const queued of request.result as OutboxItem[]) {
      if (queued.recordId === item.recordId && queued.id !== undefined) store.delete(queued.id)
    }
    store.add(item)
  }
}
export async function saveLocalFlock(flock: Omit<LocalFlock, 'syncState'> & { syncState?: SyncState }): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(['flocks', 'outbox'], 'readwrite')
  const done = transactionDone(tx)
  const record: LocalFlock = { ...flock, syncState: 'pending', deleted: false }
  tx.objectStore('flocks').put(record)
  enqueueLatest(tx, {
    entity: 'flocks', operation: 'upsert', recordId: record.id,
    payload: stripLocalFields(record as unknown as Record<string, unknown>),
    createdAt: new Date().toISOString(), attempts: 0,
  } satisfies OutboxItem)
  await done
}
export async function saveLocalModelRun(run: Omit<LocalModelRun, 'syncState'> & { syncState?: SyncState }): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(['modelRuns', 'outbox'], 'readwrite')
  const done = transactionDone(tx)
  const record: LocalModelRun = { ...run, syncState: 'pending', deleted: false }
  tx.objectStore('modelRuns').put(record)
  enqueueLatest(tx, {
    entity: 'model_runs', operation: 'upsert', recordId: record.id,
    payload: stripLocalFields(record as unknown as Record<string, unknown>),
    createdAt: new Date().toISOString(), attempts: 0,
  } satisfies OutboxItem)
  await done
}
export async function markLocalDeleted(entity: 'flocks' | 'model_runs', id: string): Promise<void> {
  const db = await openDb()
  const storeName = entity === 'flocks' ? 'flocks' : 'modelRuns'
  const tx = db.transaction([storeName, 'outbox'], 'readwrite')
  const done = transactionDone(tx)
  const store = tx.objectStore(storeName)
  const request = store.get(id)
  request.onsuccess = () => {
    const row = request.result as (LocalFlock | LocalModelRun | undefined)
    if (!row || row.deleted) return
    row.deleted = true
    row.syncState = 'pending'
    store.put(row)
    enqueueLatest(tx, {
      entity, operation: 'delete', recordId: id,
      payload: stripLocalFields(row as unknown as Record<string, unknown>),
      createdAt: new Date().toISOString(), attempts: 0,
    } satisfies OutboxItem)
  }
  await done
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
  tx.objectStore('outbox').put({ ...item, attempts: item.attempts + 1, lastError: error })
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
    if (row && !row.deleted) { row.syncState = 'synced'; store.put(row) }
  }
  await done
}
export async function removeLocalRecord(entity: 'flocks' | 'model_runs', id: string): Promise<void> {
  const db = await openDb()
  const storeName = entity === 'flocks' ? 'flocks' : 'modelRuns'
  const tx = db.transaction(storeName, 'readwrite')
  const done = transactionDone(tx)
  tx.objectStore(storeName).delete(id)
  await done
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
    if (local?.syncState === 'pending' || local?.deleted) return
    store.put({ ...value, syncState: 'synced', deleted: false })
  }
  await done
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
  for (const row of incomingFlocks) {
    const record: LocalFlock = { ...row, syncState: 'pending', deleted: false }
    tx.objectStore('flocks').put(record)
    enqueueLatest(tx, {
      entity: 'flocks', operation: 'upsert', recordId: record.id,
      payload: stripLocalFields(record as unknown as Record<string, unknown>),
      createdAt: new Date().toISOString(), attempts: 0,
    } satisfies OutboxItem)
  }
  for (const row of incomingRuns) {
    const record: LocalModelRun = { ...row, syncState: 'pending', deleted: false }
    tx.objectStore('modelRuns').put(record)
    enqueueLatest(tx, {
      entity: 'model_runs', operation: 'upsert', recordId: record.id,
      payload: stripLocalFields(record as unknown as Record<string, unknown>),
      createdAt: new Date().toISOString(), attempts: 0,
    } satisfies OutboxItem)
  }
  await done
  return { flocks: incomingFlocks.length, modelRuns: incomingRuns.length }
}
