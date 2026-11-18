import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  countPendingChanges, importLocalFirstBackup, listLocalFlocks, listLocalModelRuns, listOutbox,
  markLocalDeleted, markLocalSynced, saveLocalFlock, saveLocalModelRun,
  upsertLocalFromCloud, reconcileLocalWithCloud,
} from './localFirstDb'

const makeFlock = (id: string) => ({
  id, flock_name: 'آزمایش فارم', species: 'broiler', placement_date: '2026-11-16',
  timezone: 'Asia/Tehran', created_at: '2026-11-16T10:00:00.000Z',
  updated_at: '2026-11-16T10:00:00.000Z',
})

describe('IndexedDB local-first persistence', () => {
  it('persists a flock and atomically creates an outbox operation', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock(makeFlock(id))
    const row = (await listLocalFlocks()).find(item => item.id === id)
    expect(row?.flock_name).toBe('آزمایش فارم')
    expect(row?.syncState).toBe('pending')
    const queue = (await listOutbox()).filter(item => item.recordId === id)
    expect(queue).toHaveLength(1)
    expect(queue[0].operation).toBe('upsert')
  })

  it('keeps only the newest queued upsert when a flock is edited repeatedly', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock({ ...makeFlock(id), flock_name: 'نسخه اول' })
    await saveLocalFlock({ ...makeFlock(id), flock_name: 'نسخه دوم', updated_at: '2026-11-16T11:00:00.000Z' })
    const queue = (await listOutbox()).filter(item => item.entity === 'flocks' && item.recordId === id)
    expect(queue).toHaveLength(1)
    expect(queue[0].operation).toBe('upsert')
    expect(queue[0].payload?.flock_name).toBe('نسخه دوم')
  })

  it('replaces a queued flock upsert with a delete tombstone', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock(makeFlock(id))
    await markLocalDeleted('flocks', id)
    const queue = (await listOutbox()).filter(item => item.entity === 'flocks' && item.recordId === id)
    expect(queue).toHaveLength(1)
    expect(queue[0].operation).toBe('delete')
    expect((await listLocalFlocks()).some(item => item.id === id)).toBe(false)
  })

  it('persists model runs as appendable local records', async () => {
    const flockId = crypto.randomUUID()
    const id = crypto.randomUUID()
    await saveLocalFlock(makeFlock(flockId))
    await saveLocalModelRun({
      id, flock_id: flockId, disease_code: 'IBD',
      model_version: 'test-1', model_family: 'deventer-live-conventional',
      input_snapshot: { titers: [100, 200] }, output_snapshot: { age: 21 },
      confidence_level: 'low', decision_status: 'review_required',
      limitations: ['test'], created_at: '2026-11-16T10:00:00.000Z',
    })
    const run = (await listLocalModelRuns()).find(item => item.id === id)
    expect(run?.output_snapshot.age).toBe(21)
    expect(run?.syncState).toBe('pending')
  })

  it('does not overwrite unsynced local changes with cloud rows', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock(makeFlock(id))
    await upsertLocalFromCloud('flocks', { ...makeFlock(id), flock_name: 'نسخه ابری' })
    const row = (await listLocalFlocks()).find(item => item.id === id)
    expect(row?.flock_name).toBe('آزمایش فارم')
    expect(row?.syncState).toBe('pending')
  })

  it('removes only synced rows deleted remotely and preserves pending local changes', async () => {
    const syncedId = crypto.randomUUID(), pendingId = crypto.randomUUID()
    await saveLocalFlock(makeFlock(syncedId))
    await markLocalSynced('flocks', syncedId)
    await saveLocalFlock(makeFlock(pendingId))
    const removed = await reconcileLocalWithCloud('flocks', [])
    expect(removed).toBe(1)
    const rows = await listLocalFlocks()
    expect(rows.some(row=>row.id===syncedId)).toBe(false)
    expect(rows.find(row=>row.id===pendingId)?.syncState).toBe('pending')
  })

  it('marks a local record as a tombstone and retains deletion provenance', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock(makeFlock(id))
    await markLocalDeleted('flocks', id)
    expect((await listLocalFlocks()).some(item => item.id === id)).toBe(false)
    const deletion = (await listOutbox()).find(item => item.recordId === id && item.operation === 'delete')
    expect(deletion?.payload?.updated_at).toBe('2026-11-16T10:00:00.000Z')
  })

  it('marks successful sync state without removing the local record', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock(makeFlock(id))
    await markLocalSynced('flocks', id)
    const row = (await listLocalFlocks()).find(item => item.id === id)
    expect(row?.syncState).toBe('synced')
    expect(await countPendingChanges()).toBeGreaterThan(0)
  })
})

describe('local-first backup restore', () => {
  it('imports unique flocks and model runs into the outbox for safe re-sync', async () => {
    const flockId = crypto.randomUUID()
    const runId = crypto.randomUUID()
    const result = await importLocalFirstBackup({
      flocks: [makeFlock(flockId)],
      modelRuns: [{
        id: runId, flock_id: flockId, disease_code: 'ND',
        model_version: 'nd-monitor-0.1.0', model_family: 'nd-hi-serology-response-monitor',
        input_snapshot: { postHiLog2: [3, 4] }, output_snapshot: { n: 2 },
        confidence_level: 'low', decision_status: 'review_required',
        limitations: ['monitor only'], created_at: '2026-11-16T10:00:00.000Z',
      }],
    })
    expect(result).toEqual({ flocks: 1, modelRuns: 1 })
    expect((await listLocalFlocks()).some(row => row.id === flockId)).toBe(true)
    expect((await listLocalModelRuns()).some(row => row.id === runId)).toBe(true)
    expect((await listOutbox()).filter(item => item.recordId === runId)).toHaveLength(1)
  })
})
