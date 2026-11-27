import { listLocalFlocks, saveLocalFlock, type LocalFlock } from './localFirstDb'

export type DemoFlockProfile = {
  id: string
  flockName: string
  placementDate: string
  hatchDate: string
  savedAt: string
  flockType: string
  flockSize: string
  houseName: string
  hatchery: string
  vaccinationHistory: string
}

// This UUID is the same record already registered in the Adine-Vaccine-Timing Supabase project.
export const ADINE_DEMO_FLOCK_ID = 'd0000000-0000-4000-8000-000000000056'
const PLACEMENT_DATE = '2026-11-27'
const HATCH_DATE = '2026-11-26'
let seedInFlight: Promise<DemoFlockProfile> | null = null

/**
 * Creates only the educational flock identity.
 * No invented vaccination events, laboratory titres, QC results or clinical records are generated.
 * Actual data must be entered from the flock's records and original laboratory files.
 */
export function createAdineDemoFlock(): Promise<DemoFlockProfile> {
  if (!seedInFlight) seedInFlight = createAdineDemoFlockOnce().finally(() => { seedInFlight = null })
  return seedInFlight
}

async function createAdineDemoFlockOnce(): Promise<DemoFlockProfile> {
  const now = new Date().toISOString()
  const profile: DemoFlockProfile = {
    id: ADINE_DEMO_FLOCK_ID,
    flockName: 'آدینه',
    placementDate: PLACEMENT_DATE,
    hatchDate: HATCH_DATE,
    savedAt: now,
    flockType: 'broiler',
    flockSize: '15000',
    houseName: 'پرونده آموزشی / Demo',
    hatchery: '',
    vaccinationHistory: '',
  }
  const existingFlocks = await listLocalFlocks(true)
  const existingFlock = existingFlocks.find(row => row.id === ADINE_DEMO_FLOCK_ID)
  if (existingFlock?.deleted) {
    throw new Error('پرونده آموزشی آدینه قبلاً حذف شده است؛ برای جلوگیری از احیای ناخواسته، Seed دوباره اجرا نشد.')
  }
  if (!existingFlock) {
    await saveLocalFlock({
      id: ADINE_DEMO_FLOCK_ID,
      flock_name: profile.flockName,
      species: 'broiler',
      hatch_date: HATCH_DATE,
      placement_date: PLACEMENT_DATE,
      bird_count: 15000,
      location_label: profile.houseName,
      notes: JSON.stringify({
        demo: true,
        synthetic: false,
        demoSeedVersion: 'adine-flock-identity-0.2.0',
        dataStatus: 'identity-only-no-lab-data',
        disclaimer: 'پرونده آموزشی؛ هیچ نمونه واقعی، تیتر آزمایشگاهی، سابقه واکسن یا توصیه بالینی در آن وجود ندارد.',
      }),
      timezone: 'Asia/Tehran',
      created_at: now,
      updated_at: now,
    } satisfies Omit<LocalFlock, 'syncState'>)
  }
  return profile
}
