import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { listLocalFlocks, listLocalModelRuns, listOutbox } from './localFirstDb'
import { saveMonitorRunToLocal } from './syncService'

describe('persisted disease monitor runs', () => {
  it('stores ND output linked to a flock and queues both records for sync', async () => {
    const flock = {
      id: crypto.randomUUID(), flockName: 'Farm ND test',
      placementDate: '2026-11-16', savedAt: '2026-11-16T10:00:00.000Z',
    }
    const id = await saveMonitorRunToLocal({
      flock, diseaseCode: 'ND',
      input: { assayAntigen: 'LaSota', postHiLog2: [3, 4, 5] },
      output: { n: 3, meanLog2Rise: 2, warnings: ['monitor only'] },
    })
    const run = (await listLocalModelRuns()).find(item => item.id === id)
    expect(run?.disease_code).toBe('ND')
    expect(run?.flock_id).toBe(flock.id)
    expect(run?.decision_status).toBe('review_required')
    expect((await listLocalFlocks()).some(item => item.id === flock.id)).toBe(true)
    expect((await listOutbox()).filter(item => item.recordId === flock.id || item.recordId === id)).toHaveLength(2)
  })

  it('preserves IBV and AIV disease identifiers in local history', async () => {
    const flock = {
      id: crypto.randomUUID(), flockName: 'Farm monitor test',
      placementDate: '2026-11-16', savedAt: '2026-11-16T10:00:00.000Z',
    }
    const ibvId = await saveMonitorRunToLocal({ flock, diseaseCode: 'IBV', input: { assay: 'kit A' }, output: { direction: 'up' } })
    const aivId = await saveMonitorRunToLocal({ flock, diseaseCode: 'AIV', input: { rtPcrResult: 'positive' }, output: { urgency: 'urgent' } })
    const rows = await listLocalModelRuns()
    expect(rows.find(item => item.id === ibvId)?.disease_code).toBe('IBV')
    expect(rows.find(item => item.id === aivId)?.disease_code).toBe('AIV')
    expect(rows.find(item => item.id === aivId)?.confidence_level).toBe('insufficient')
  })
})
