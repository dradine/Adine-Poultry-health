import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  countPendingChanges, importLocalFirstBackup, listLocalFlocks, listLocalModelRuns, listOutbox,
  markLocalDeleted, markLocalSynced, saveLocalFlock, saveLocalModelRun, changeDeletion,
  upsertLocalFromCloud, reconcileLocalWithCloud, saveLocalReferenceRecord, listLocalReferenceRecords, markLocalReferenceDeleted,
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

  it('preserves ordered base revisions for repeated offline edits', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock({ ...makeFlock(id), flock_name: 'نسخه اول' })
    const first = (await listOutbox()).find(item => item.recordId === id)!
    await saveLocalFlock({ ...makeFlock(id), flock_name: 'نسخه دوم', updated_at: '2026-11-16T11:00:00.000Z' })
    const queue = (await listOutbox()).filter(item => item.entity === 'flocks' && item.recordId === id)
    expect(queue).toHaveLength(2)
    expect(queue.map(item => item.operation)).toEqual(['upsert', 'upsert'])
    expect(queue[0].base).toBeNull()
    expect(queue[1].base).toBe(first.mutation)
    expect(queue[1].payload?.flock_name).toBe('نسخه دوم')
  })

  it('queues deletion after an unsynced create so both operations apply in order', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock(makeFlock(id))
    const create = (await listOutbox()).find(item => item.recordId === id)!
    await markLocalDeleted('flocks', id)
    const queue = (await listOutbox()).filter(item => item.entity === 'flocks' && item.recordId === id)
    expect(queue).toHaveLength(2)
    expect(queue[0].operation).toBe('upsert')
    expect(queue[1].operation).toBe('delete')
    expect(queue[1].base).toBe(create.mutation)
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
    expect(deletion?.mutation).toMatch(/[0-9a-f-]{36}/)
    expect(deletion?.base).toMatch(/[0-9a-f-]{36}/)
  })
  it('keeps a tombstone until an explicit restore mutation is queued', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock(makeFlock(id))
    await markLocalDeleted('flocks', id)
    expect((await listLocalFlocks()).some(row => row.id === id)).toBe(false)
    await changeDeletion('flocks', id, false)
    expect((await listLocalFlocks()).some(row => row.id === id)).toBe(true)
    const items = (await listOutbox()).filter(row => row.recordId === id)
    expect(items).toHaveLength(3)
    expect(items[items.length - 1]?.operation).toBe('restore')
  })

  it('marks successful sync state without removing the local record', async () => {
    const id = crypto.randomUUID()
    await saveLocalFlock(makeFlock(id))
    await markLocalSynced('flocks', id)
    const row = (await listLocalFlocks()).find(item => item.id === id)
    expect(row?.syncState).toBe('synced')
    expect(await countPendingChanges()).toBeGreaterThan(0)
  })

  it('stores independent flock reference records and queues safe local operations', async () => {
    const flockId = crypto.randomUUID()
    const id = crypto.randomUUID()
    await saveLocalReferenceRecord('flock_vaccination_events', {
      id, flock_id: flockId, event_date: '2026-11-20', age_days: 14, disease_code: 'IBD',
      product_name: 'محصول آزمون', platform: 'live', route: 'water',
      created_at: '2026-11-20T10:00:00.000Z', updated_at: '2026-11-20T10:00:00.000Z',
    })
    const rows = await listLocalReferenceRecords('flock_vaccination_events', flockId)
    expect(rows).toHaveLength(1)
    expect(rows[0].product_name).toBe('محصول آزمون')
    expect((await listOutbox()).find(item => item.recordId === id)?.entity).toBe('flock_vaccination_events')
    await markLocalReferenceDeleted('flock_vaccination_events', id)
    expect(await listLocalReferenceRecords('flock_vaccination_events', flockId)).toHaveLength(0)
    expect((await listOutbox()).find(item => item.recordId === id)?.operation).toBe('delete')
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
