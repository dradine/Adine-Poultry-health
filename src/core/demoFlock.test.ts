import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  listLocalFlocks: vi.fn(),
  saveLocalFlock: vi.fn(),
}))
vi.mock('./localFirstDb', () => db)

import { ADINE_DEMO_FLOCK_ID, createAdineDemoFlock } from './demoFlock'

describe('Adine demo flock identity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.listLocalFlocks.mockResolvedValue([])
    db.saveLocalFlock.mockResolvedValue(undefined)
  })

  it('uses the exact UUID already registered in Supabase', async () => {
    const profile = await createAdineDemoFlock()
    expect(profile.id).toBe('d0000000-0000-4000-8000-000000000056')
    expect(profile.id).toBe(ADINE_DEMO_FLOCK_ID)
    expect(db.saveLocalFlock).toHaveBeenCalledTimes(1)
    expect(db.saveLocalFlock.mock.calls[0][0].id).toBe(ADINE_DEMO_FLOCK_ID)
  })

  it('creates identity only and never fabricates serology, vaccine events or QC', async () => {
    await createAdineDemoFlock()
    const record = db.saveLocalFlock.mock.calls[0][0]
    const notes = JSON.parse(record.notes)
    expect(notes.demo).toBe(true)
    expect(notes.synthetic).toBe(false)
    expect(record.hatch_date).toBe('2026-11-26')
    expect(record.placement_date).toBe('2026-11-27')
    expect(record.bird_count).toBe(15000)
    expect(record.hatchery).toBeUndefined()
  })

  it('does not resurrect a previously deleted demo flock', async () => {
    db.listLocalFlocks.mockResolvedValue([{ id: ADINE_DEMO_FLOCK_ID, deleted: true }])
    await expect(createAdineDemoFlock()).rejects.toThrow('قبلاً حذف شده است')
    expect(db.saveLocalFlock).not.toHaveBeenCalled()
  })

  it('does not enqueue a duplicate when the cloud flock is already local', async () => {
    db.listLocalFlocks.mockResolvedValue([{ id: ADINE_DEMO_FLOCK_ID, deleted: false }])
    const profile = await createAdineDemoFlock()
    expect(profile.id).toBe(ADINE_DEMO_FLOCK_ID)
    expect(db.saveLocalFlock).not.toHaveBeenCalled()
  })
})
