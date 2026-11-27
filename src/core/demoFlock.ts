import { calculateBioChekVI, summarizeSerology, type SerologyScale } from './serologyStats'
import {
  listLocalFlocks, listLocalModelRuns, listLocalReferenceRecords,
  saveLocalFlock, saveLocalModelRun, saveLocalReferenceRecord,
  type LocalFlock,
} from './localFirstDb'

export type DemoFlockProfile = {
  id: string; flockName: string; placementDate: string; hatchDate: string; savedAt: string
  flockType: string; flockSize: string; houseName: string; hatchery: string
  vaccinationHistory: string
}

const FLOCK_ID = 'demo-adine-flock-2026-11-27'
const BASE_DATE = '2026-11-27'
const SAMPLE_DAYS = [1, 7, 14, 21, 28, 35, 42, 56]
const SAMPLE_IDS = Array.from({ length: 23 }, (_, i) => 'ADN-' + String(i + 1).padStart(3, '0'))
const ELISA = [
  { disease: 'IBD', assayId: 'biochek-ck113-ibd', kit: 'BioChek FlockChek IBD ELISA', catalog: 'CK113', antigen: 'IBDV antibody; conventional ELISA', means: [6200, 4800, 3400, 2600, 4200, 6900, 7600, 7200] },
  { disease: 'ND', assayId: 'biochek-nd-ck116', kit: 'BioChek Newcastle antibody ELISA', catalog: 'CK116', antigen: 'NDV antibody ELISA', means: [3600, 2800, 2100, 2900, 4400, 5800, 6200, 5900] },
  { disease: 'IBV', assayId: 'biochek-ibv-ck119', kit: 'BioChek IBV antibody ELISA', catalog: 'CK119', antigen: 'IBV antibody ELISA; not strain-specific protection', means: [4200, 3300, 2500, 3500, 4900, 6300, 6100, 5700] },
  { disease: 'AIV', assayId: 'biochek-ai-ck121', kit: 'BioChek Avian Influenza type A antibody ELISA', catalog: 'CK121', antigen: 'Influenza A type antibody ELISA; not subtype-specific HI', means: [1700, 1400, 1000, 1300, 2200, 3200, 3900, 3700] },
] as const

function dateAtAge(age: number): string {
  const d = new Date(BASE_DATE + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + age - 1)
  return d.toISOString().slice(0, 10)
}
function valuesAround(mean: number, offset = 0): number[] {
  const factors = [0.72,0.78,0.82,0.86,0.89,0.92,0.94,0.96,0.98,0.99,1,1.01,1.03,1.05,1.07,1.10,1.13,1.16,1.19,1.22,1.25,1.28,1.32]
  return factors.map((factor, i) => Math.max(1, Math.round(mean * (factor + ((i + offset) % 3 - 1) * 0.006))))
}
function hiValues(meanLog2: number): number[] {
  const offsets = [-2,-2,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,2]
  return offsets.map(offset => Math.pow(2, Math.max(1, Math.min(10, Math.round(meanLog2 + offset)))))
}
function latestVaccine(disease: string, age: number, schedule: Array<Record<string, unknown>>) {
  return schedule.filter(x => x.disease_code === disease && Number(x.age_days) <= age).at(-1) || null
}

export async function createAdineDemoFlock(): Promise<DemoFlockProfile> {
  const now = new Date().toISOString()
  const profile: DemoFlockProfile = {
    id: FLOCK_ID, flockName: 'آدینه', placementDate: BASE_DATE, hatchDate: '2026-11-26',
    savedAt: now, flockType: 'broiler', flockSize: '15000', houseName: 'سالن آزمایشی ۱',
    hatchery: 'هچری فرضی', vaccinationHistory: 'سناریوی کاملاً مصنوعی ۵۶ روزه؛ برای آزمون نرم‌افزار، نه نسخه واکسیناسیون.',
  }
  const existingFlocks = await listLocalFlocks(true)
  const existingFlock = existingFlocks.find(x => x.id === FLOCK_ID)
  if (existingFlock?.deleted) throw new Error('گله آزمایشی آدینه قبلاً حذف شده است؛ برای جلوگیری از احیای ناخواسته، Seed دوباره اجرا نشد.')
  if (!existingFlock) {
    await saveLocalFlock({
      id: FLOCK_ID, flock_name: 'آدینه', species: 'broiler', hatch_date: profile.hatchDate,
      placement_date: profile.placementDate, bird_count: 15000, location_label: profile.houseName,
      notes: JSON.stringify({ demo: true, demoSeedVersion: 'adine-four-disease-0.1.0', hatchery: profile.hatchery, vaccinationHistory: profile.vaccinationHistory }),
      timezone: 'Asia/Tehran', created_at: now, updated_at: now,
    } satisfies Omit<LocalFlock, 'syncState'>)
  }

  const vaccineSchedule = [
    { age_days: 1, disease_code: 'ND', product_name: 'HB1 زنده (سناریوی آموزشی)', platform: 'live-conventional', route: 'drinking-water', strain: 'HB1' },
    { age_days: 1, disease_code: 'IBV', product_name: 'H120 زنده (سناریوی آموزشی)', platform: 'live-conventional', route: 'spray', strain: 'H120' },
    { age_days: 10, disease_code: 'AIV', product_name: 'H9N2 غیرفعال (سناریوی آموزشی)', platform: 'inactivated', route: 'injection', strain: 'H9N2' },
    { age_days: 14, disease_code: 'ND', product_name: 'LaSota زنده (سناریوی آموزشی)', platform: 'live-conventional', route: 'drinking-water', strain: 'LaSota' },
    { age_days: 14, disease_code: 'IBV', product_name: '4/91 زنده (سناریوی آموزشی)', platform: 'live-conventional', route: 'spray', strain: '4/91' },
    { age_days: 14, disease_code: 'IBD', product_name: 'Intermediate زنده (سناریوی آموزشی)', platform: 'live-conventional', route: 'drinking-water', strain: 'Intermediate' },
    { age_days: 24, disease_code: 'IBD', product_name: 'Intermediate Plus زنده (سناریوی آموزشی)', platform: 'live-conventional', route: 'drinking-water', strain: 'Intermediate Plus' },
    { age_days: 28, disease_code: 'ND', product_name: 'LaSota زنده (یادآور آموزشی)', platform: 'live-conventional', route: 'drinking-water', strain: 'LaSota' },
    { age_days: 28, disease_code: 'IBV', product_name: 'QX زنده (سناریوی آموزشی)', platform: 'live-conventional', route: 'spray', strain: 'QX' },
    { age_days: 35, disease_code: 'AIV', product_name: 'H9N2 غیرفعال (یادآور آموزشی)', platform: 'inactivated', route: 'injection', strain: 'H9N2' },
  ]
  const existingVaccines = await listLocalReferenceRecords('flock_vaccination_events', FLOCK_ID, true)
  for (const [index, item] of vaccineSchedule.entries()) {
    const id = 'demo-adine-vax-' + String(index + 1).padStart(2, '0')
    if (existingVaccines.some(x => x.id === id)) continue
    const eventDate = dateAtAge(item.age_days)
    await saveLocalReferenceRecord('flock_vaccination_events', {
      id, flock_id: FLOCK_ID, event_date: eventDate, age_days: item.age_days,
      disease_code: item.disease_code, product_name: item.product_name, platform: item.platform,
      strain: item.strain, route: item.route, dose: null, coverage_percent: null,
      administration_quality: 'not-assessed-demo', batch_lot: 'SYNTHETIC-DEMO',
      source_reference: 'Synthetic demonstration scenario; no real product label attached.',
      notes: 'رویداد ساختگی برای آزمون Timeline؛ برنامه تجویز واقعی نیست.',
      created_at: now, updated_at: now,
    })
  }

  const existingRuns = await listLocalModelRuns(true)
  const runIds = new Set(existingRuns.map(x => x.id))
  const commonLimitations = [
    'تمام مقادیر این گله ساختگی و تولیدشده برای آزمون رابط و محاسبات هستند؛ هیچ نمونه واقعی آزمایشگاهی وجود ندارد.',
    'تیترهای ELISA فقط در مقیاس فرضی BioChek kit-titre وارد شده‌اند؛ مقادیر عددی بین CK113/CK116/CK119/CK121 یا با IDEXX/IDvet قابل انتقال نیستند.',
    'برای این چهار بیماری محدوده مرجع روز اول که مستقل از کیت، IFU، جمعیت مادر و برنامه واکسن باشد وجود ندارد؛ بنابراین برچسب normal/abnormal یا cutoff حفاظت ساخته نشده است.',
    'QC در وضعیت pending/not performed است؛ داده‌ها از Reader واقعی وارد نشده‌اند و نباید به‌عنوان QC-pass یا گزارش بالینی استفاده شوند.',
    'MDA در روز اول به‌صورت خط پایه توصیفی ثبت شده است؛ نیمه‌عمر و زمان افت تا آستانه فقط با منبع سازگار با همان assay و جمعیت قابل استنتاج است.',
    'ND/IBV/AIV در این نسخه موتور زمان‌بندی MDA یا پیش‌بینی حفاظت ندارند؛ IBV ELISA معادل ایمنی مخاطی یا cross-protection نیست و AIV ELISA نوع HI/زیرتیپ را تعیین نمی‌کند.',
  ]
  for (const item of ELISA) {
    for (let index = 0; index < SAMPLE_DAYS.length; index++) {
      const age = SAMPLE_DAYS[index]
      const id = 'demo-adine-' + item.disease.toLowerCase() + '-elisa-day-' + age
      if (runIds.has(id)) continue
      const vals = valuesAround(item.means[index], index)
      const stats = summarizeSerology(vals, 'kit-titer' as SerologyScale)
      const vaccine = latestVaccine(item.disease, age, vaccineSchedule)
      const input = {
        demo: true, demoSeedVersion: 'adine-four-disease-0.1.0', recordType: 'serology-longitudinal-round',
        roundLabel: 'آدینه · ' + item.disease + ' · ELISA · روز ' + age + ' · داده شبیه‌سازی‌شده',
        samplingDate: dateAtAge(age), samplingAgeDays: age, samplingPurpose: age === 1 ? 'maternal-antibody-baseline-demo' : 'post-vaccination-monitoring-demo',
        population: 'broiler', method: 'ELISA', assayId: item.assayId, kit: item.kit, catalog: item.catalog,
        assayVersion: 'Demo only; exact IFU version/lot not verified', antigen: item.antigen,
        unit: 'BioChek kit-titre (synthetic input; not transferable)', scale: 'kit-titer',
        kitLot: 'SYNTHETIC-DEMO', readerModel: 'Synthetic data generator', protocolVersion: 'DEMO-0.1',
        sampleMatrix: 'serum', laboratory: 'آزمایشگاه فرضی (داده ساختگی)', vaccine: vaccine?.product_name || '',
        vaccineDate: vaccine ? dateAtAge(Number(vaccine.age_days)) : null, vaccineStrain: vaccine?.strain || '',
        vaccinePlatform: vaccine?.platform || 'unknown', vaccineProgram: 'سناریوی ۵۶ روزه صرفاً برای آزمون نرم‌افزار',
        vaccinationEvents: vaccineSchedule.map(x => ({ date: dateAtAge(Number(x.age_days)), ageDays: x.age_days, disease: x.disease_code, product: x.product_name, strain: x.strain, platform: x.platform, route: x.route, dose: 'synthetic', coveragePercent: null, batch: 'SYNTHETIC-DEMO', administrationQuality: 'not-assessed-demo' })),
        clinicalContext: { status: 'not-assessed', notes: 'وضعیت بالینی واقعی وارد نشده است.' },
        sampleCount: 23, titers: vals, sampleIds: SAMPLE_IDS, randomSamplingConfirmed: false,
        qcStatus: 'pending', qcEvidence: '', rawFileImported: false, source: 'Synthetic demo generator; not a laboratory file',
        notes: 'خط پایه روز اول نماینده MDA مادری در داده ساختگی است. هیچ محدوده نرمال عمومی یا آستانه حفاظت برای این اعداد ادعا نمی‌شود.',
        comparisonRule: 'Demo-only; no clinical comparison eligibility',
      }
      const bioChekVI = item.disease === 'AIV' ? null : calculateBioChekVI(stats.arithmeticMean, stats.cvPercent)
      await saveLocalModelRun({
        id, flock_id: FLOCK_ID, disease_code: item.disease, model_version: 'serology-longitudinal-demo-0.1.0',
        model_family: 'serology-longitudinal-round', input_snapshot: input,
        output_snapshot: { ...stats, bioChekVI, interpretation: 'خلاصه آماری توصیفی داده ساختگی؛ بدون استنباط حفاظت یا تشخیص', qcStatus: 'pending', qcEvidenceRecorded: false, comparisonEligible: false, demo: true, limitations: commonLimitations },
        confidence_level: 'insufficient', decision_status: 'review_required', limitations: commonLimitations,
        qc_summary: { enteredByUser: false, rawLabFileImported: false, qcStatus: 'pending', independentlyVerified: false, synthetic: true },
        model_assumptions: { demoOnly: true, noProtectionInference: true, noNormalRangeClaim: true, maternalAntibodyBaselineAtDay1: age === 1 },
        source_references: [{ kind: 'assay-manufacturer-product-page', assayId: item.assayId, citation: item.disease === 'IBD' ? 'https://www.biochek.com/products/infectious-bursal-disease-virus-antibody-test-kit/' : item.disease === 'ND' ? 'https://www.biochek.com/products/newcastle-disease-virus-antibody-test-kit/' : item.disease === 'IBV' ? 'https://www.biochek.com/products/ibv-infectious-bronchitis-virus-antibody-test-kit/' : 'https://www.biochek.com/products/avian-influenza-antibody-test-kit/' }, { kind: 'synthetic-data-disclaimer', citation: 'Generated demo values; not normal reference intervals or clinical thresholds.' }],
        input_schema_version: 'serology-longitudinal-v3', created_at: now,
      })
    }
  }

  const hiPrograms = [
    { disease: 'ND', assayId: 'pasouk-nd-hi-antigen', kit: 'Pasoucastle ND HI antigen (demo)', catalog: 'Pasoucastle', antigen: 'NDV LaSota-like homologous antigen (synthetic)', means: [3, 4, 5, 5.5] },
    { disease: 'AIV', assayId: 'pasouk-aiv-hi-antigen', kit: 'Pasoflu H9N2 HI antigen (demo)', catalog: 'Pasoflu H9N2', antigen: 'AIV H9N2 homologous antigen (synthetic)', means: [2, 2.5, 3.5, 4] },
  ]
  const hiDays = [1, 28, 42, 56]
  for (const item of hiPrograms) {
    for (let index = 0; index < hiDays.length; index++) {
      const age = hiDays[index]
      const id = 'demo-adine-' + item.disease.toLowerCase() + '-hi-day-' + age
      if (runIds.has(id)) continue
      const vals = hiValues(item.means[index])
      const stats = summarizeSerology(vals, 'hi-reciprocal')
      const vaccine = latestVaccine(item.disease, age, vaccineSchedule)
      const input = {
        demo: true, demoSeedVersion: 'adine-four-disease-0.1.0', recordType: 'serology-longitudinal-round',
        roundLabel: 'آدینه · ' + item.disease + ' · HI · روز ' + age + ' · داده شبیه‌سازی‌شده',
        samplingDate: dateAtAge(age), samplingAgeDays: age, samplingPurpose: age === 1 ? 'maternal-antibody-baseline-demo' : 'post-vaccination-monitoring-demo',
        population: 'broiler', method: 'HI', assayId: item.assayId, kit: item.kit, catalog: item.catalog,
        assayVersion: 'Demo only; antigen/HAU/RBC/IFU not verified', antigen: item.antigen,
        unit: 'reciprocal HI titre', scale: 'hi-reciprocal', hiHAU: '4 (synthetic placeholder)',
        antigenPretreatment: 'not verified', serumPretreatment: 'not verified', dilutionFactor: 'two-fold (demo)',
        rbcSource: 'chicken RBC (demo)', rbcLot: 'SYNTHETIC-DEMO', rbcConcentration: '1% (demo)',
        kitLot: 'SYNTHETIC-DEMO', readerModel: 'manual HI synthetic values', protocolVersion: 'DEMO-0.1',
        sampleMatrix: 'serum', laboratory: 'آزمایشگاه فرضی (داده ساختگی)', vaccine: vaccine?.product_name || '',
        vaccineDate: vaccine ? dateAtAge(Number(vaccine.age_days)) : null, vaccineStrain: vaccine?.strain || '',
        vaccinePlatform: vaccine?.platform || 'unknown', vaccineProgram: 'سناریوی ۵۶ روزه صرفاً برای آزمون نرم‌افزار',
        vaccinationEvents: vaccineSchedule.map(x => ({ date: dateAtAge(Number(x.age_days)), ageDays: x.age_days, disease: x.disease_code, product: x.product_name, strain: x.strain, platform: x.platform, route: x.route, dose: 'synthetic', coveragePercent: null, batch: 'SYNTHETIC-DEMO', administrationQuality: 'not-assessed-demo' })),
        clinicalContext: { status: 'not-assessed', notes: 'وضعیت بالینی واقعی وارد نشده است.' },
        sampleCount: 23, titers: vals, sampleIds: SAMPLE_IDS, randomSamplingConfirmed: false,
        qcStatus: 'pending', qcEvidence: '', rawFileImported: false, source: 'Synthetic demo generator; not a laboratory file',
        notes: 'HI فقط با آنتی‌ژن، 4 HAU، RBC، تیمار و پروتکل استاندارد قابل تفسیر است؛ مقادیر این نوبت مصنوعی‌اند.',
        comparisonRule: 'Demo-only; no clinical comparison eligibility',
      }
      const limitations = [...commonLimitations, 'HI fixture با HAU/RBC و آنتی‌ژن واقعی استاندارد نشده؛ فقط مسیر نمایش HI را آزمایش می‌کند.']
      await saveLocalModelRun({
        id, flock_id: FLOCK_ID, disease_code: item.disease, model_version: 'serology-longitudinal-demo-0.1.0',
        model_family: 'serology-longitudinal-round', input_snapshot: input,
        output_snapshot: { ...stats, interpretation: 'خلاصه آماری توصیفی HI مصنوعی؛ بدون استنباط حفاظت', qcStatus: 'pending', qcEvidenceRecorded: false, comparisonEligible: false, demo: true, limitations },
        confidence_level: 'insufficient', decision_status: 'review_required', limitations,
        qc_summary: { enteredByUser: false, rawLabFileImported: false, qcStatus: 'pending', independentlyVerified: false, synthetic: true },
        model_assumptions: { demoOnly: true, noProtectionInference: true, noNormalRangeClaim: true, maternalAntibodyBaselineAtDay1: age === 1 },
        source_references: [{ kind: 'synthetic-hi-data-disclaimer', citation: 'Synthetic HI titres; no actual HAU/RBC or laboratory validation.' }],
        input_schema_version: 'serology-longitudinal-v3', created_at: now,
      })
    }
  }

  return profile
}
