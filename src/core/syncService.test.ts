import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { listLocalFlocks, listLocalModelRuns, listOutbox } from './localFirstDb'
import { saveMonitorRunToLocal, saveMdaRunToLocal, saveProfileToLocal } from './syncService'

describe('full flock metadata persistence', () => {
  it('stores flock type, bird count, house, hatchery, sample date and vaccination history', async () => {
    const profile = { id:crypto.randomUUID(), flockName:'Metadata flock', placementDate:'2026-11-16', hatchDate:'2026-11-14', savedAt:'2026-11-16T10:00:00.000Z', flockType:'layer', flockSize:'۱۵٬۰۰۰', houseName:'سالن ۲', hatchery:'هچری الف', sampleDate:'2026-11-18', vaccinationHistory:'ND day 1; IB day 7' }
    await saveProfileToLocal(profile)
    const saved = (await listLocalFlocks()).find(row=>row.id===profile.id)
    expect(saved?.species).toBe('layer')
    expect(saved?.bird_count).toBe(15000)
    expect(saved?.location_label).toBe('سالن ۲')
    expect(JSON.parse(saved?.notes || '{}')).toEqual({hatchery:'هچری الف',sampleDate:'2026-11-18',vaccinationHistory:'ND day 1; IB day 7'})
  })
})

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

  it('preserves hatch date when an MDA run creates its missing local flock record', async () => {
    const flock = { id:crypto.randomUUID(), flockName:'Farm MDA test', placementDate:'2026-11-16', hatchDate:'2026-11-14', savedAt:'2026-11-16T10:00:00.000Z' }
    const id = await saveMdaRunToLocal({ flock, diseaseCode:'IBD', input:{sampleAgeDays:2,sampleTiters:[1000],unit:'kit titre'}, output:{estimatedHatchTiter:1587} })
    const savedFlock = (await listLocalFlocks()).find(item=>item.id===flock.id)
    const run = (await listLocalModelRuns()).find(item=>item.id===id)
    expect(savedFlock?.hatch_date).toBe('2026-11-14')
    expect(run?.model_family).toBe('maternal-antibody-decay-exploratory')
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
