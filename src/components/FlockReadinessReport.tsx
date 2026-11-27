import { useEffect, useMemo, useState } from 'react'
import {
  listLocalFlocks, listLocalModelRuns, listLocalReferenceRecords,
  type LocalFlock, type LocalModelRun,
} from '../core/localFirstDb'

type Props = { flockId: string }
type Counts = {
  vaccineEvents: number
  syntheticVaccineEvents: number
  clinicalObservations: number
  timeSeries: number
  runs: LocalModelRun[]
}
const diseaseNames: Record<string,string> = {
  IBD: 'گامبورو (IBD)', ND: 'نیوکاسل (ND)', IBV: 'برونشیت عفونی (IBV)', AIV: 'آنفلوانزای طیور (AIV)',
}
const fa = (value: number) => value.toLocaleString('fa-IR')
function parseNotes(notes?: string | null): Record<string, unknown> {
  if (!notes) return {}
  try {
    const value: unknown = JSON.parse(notes)
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,unknown> : {}
  } catch { return {} }
}
function isSyntheticRun(run: LocalModelRun): boolean {
  return run.input_snapshot.demo === true || run.qc_summary?.synthetic === true
}
export default function FlockReadinessReport({ flockId }: Props) {
  const [flock, setFlock] = useState<LocalFlock | null>(null)
  const [counts, setCounts] = useState<Counts>({ vaccineEvents: 0, syntheticVaccineEvents: 0, clinicalObservations: 0, timeSeries: 0, runs: [] })
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    let active = true
    const refresh = async () => {
      if (!flockId) { setLoaded(true); return }
      try {
        const [flocks, runs, vaccines, clinical, series] = await Promise.all([
          listLocalFlocks(), listLocalModelRuns(),
          listLocalReferenceRecords('flock_vaccination_events', flockId),
          listLocalReferenceRecords('flock_clinical_observations', flockId),
          listLocalReferenceRecords('flock_time_series', flockId),
        ])
        if (!active) return
        setFlock(flocks.find(row => row.id === flockId) || null)
        setCounts({
          vaccineEvents: vaccines.filter(row => !row.batch_lot?.toUpperCase().includes('SYNTHETIC') && !row.source_reference?.toLowerCase().includes('synthetic')).length,
          syntheticVaccineEvents: vaccines.filter(row => row.batch_lot?.toUpperCase().includes('SYNTHETIC') || row.source_reference?.toLowerCase().includes('synthetic')).length,
          clinicalObservations: clinical.length,
          timeSeries: series.length,
          runs: runs.filter(row => row.flock_id === flockId && row.model_family === 'serology-longitudinal-round'),
        })
      } catch {
        if (active) setLoaded(true)
      }
      if (active) setLoaded(true)
    }
    void refresh()
    const onChange = () => { void refresh() }
    window.addEventListener('adine-cloud-data-updated', onChange)
    window.addEventListener('adine-local-data-changed', onChange)
    return () => {
      active = false
      window.removeEventListener('adine-cloud-data-updated', onChange)
      window.removeEventListener('adine-local-data-changed', onChange)
    }
  }, [flockId])
  const notes = useMemo(() => parseNotes(flock?.notes), [flock?.notes])
  const demo = notes.demo === true
  const realRuns = counts.runs.filter(run => !isSyntheticRun(run))
  const syntheticRuns = counts.runs.filter(isSyntheticRun)
  const qcPassedRuns = realRuns.filter(run => run.input_snapshot.qcStatus === 'pass' && Boolean(run.input_snapshot.qcEvidence))
  const diseases = ['IBD','ND','IBV','AIV'].map(code => ({
    code,
    count: realRuns.filter(run => run.disease_code === code).length,
    demoCount: syntheticRuns.filter(run => run.disease_code === code).length,
    qc: qcPassedRuns.filter(run => run.disease_code === code).length,
  }))
  const identityReady = Boolean(flock?.species && flock?.hatch_date && flock?.placement_date && flock?.bird_count)
  const missing: string[] = []
  if (!identityReady) missing.push('تکمیل تاریخ هچ، تاریخ جوجه‌ریزی، تعداد قطعه و نوع گله')
  if (!notes.hatchery) missing.push('نام هچری، سویه/لاین جوجه و شناسه گله مادر')
  if (!notes.parentFlockAge && !notes.breederAge) missing.push('سن گله مادر، منبع جوجه و وضعیت آنتی‌بادی مادری گله مادر')
  if (!counts.vaccineEvents) missing.push('سوابق واقعی واکسیناسیون: محصول، سویه، تاریخ/سن، مسیر، بچ و کیفیت اجرا')
  if (!realRuns.length) missing.push('گزارش واقعی سرولوژی با تیترهای انفرادی و مشخصات کامل کیت')
  if (!qcPassedRuns.length) missing.push('شواهد کنترل کیفیت معتبر طبق IFU و COA همان Lot')
  if (!counts.clinicalObservations) missing.push('ثبت علائم، تلفات، کالبدگشایی، داروها و نتایج آزمایش مستقیم')
  if (!counts.timeSeries) missing.push('سری زمانی وزن، خوراک، آب، تلفات و شرایط سالن')
  const sampleSizes = realRuns.map(run => Number(run.input_snapshot.sampleCount || 0)).filter(Number.isFinite)
  const largestSample = sampleSizes.length ? Math.max(...sampleSizes) : 0
  if (demo) missing.push('این پرونده آموزشی است؛ باید با اطلاعات گله واقعی جایگزین شود.')
  return <section className="flock-readiness" aria-label="ارزیابی آمادگی داده‌های گله">
    <header className="flock-readiness-head">
      <div><span className="tag">ارزیابی کامل بودن پرونده</span><h3>آمادگی داده‌ها برای تحلیل و پیشنهاد واکسیناسیون</h3></div>
      <strong className="readiness-status">هنوز آماده تصمیم بالینی نیست</strong>
    </header>
    {!loaded ? <p className="muted">در حال بررسی اطلاعات ذخیره‌شده…</p> : !flock ? <p className="muted">پرونده گله در حافظه محلی این دستگاه پیدا نشد. ابتدا همگام‌سازی ابری را اجرا کنید.</p> : <>
      {demo && <p className="readiness-warning">این پرونده با برچسب آموزشی ثبت شده است. هیچ‌یک از رویدادها یا مقادیر شبیه‌سازی‌شده به‌عنوان سابقه واقعی یا نتیجه آزمایش در این ارزیابی شمرده نمی‌شود.</p>}
      <div className="readiness-metrics">
        <article><small>اطلاعات پایه گله</small><b>{identityReady ? 'ثبت شده' : 'ناقص'}</b></article>
        <article><small>نوبت‌های سرولوژی واقعی</small><b>{fa(realRuns.length)}</b></article>
        <article><small>نوبت‌های سرولوژی شبیه‌سازی‌شده</small><b>{fa(syntheticRuns.length)}</b></article>
        <article><small>رویداد واکسن شبیه‌سازی‌شده</small><b>{fa(counts.syntheticVaccineEvents)}</b></article>
        <article><small>نوبت‌های QC تأییدشده</small><b>{fa(qcPassedRuns.length)}</b></article>
        <article><small>سوابق واکسن واقعی</small><b>{fa(counts.vaccineEvents)}</b></article>
        <article><small>مشاهدات بالینی</small><b>{fa(counts.clinicalObservations)}</b></article>
        <article><small>داده‌های تولید/سالن</small><b>{fa(counts.timeSeries)}</b></article>
      </div>
      <h4>وضعیت داده‌ها به تفکیک بیماری</h4>
      <div className="readiness-diseases">
        {diseases.map(item => <article key={item.code}>
          <b>{diseaseNames[item.code]}</b>
          <span>{fa(item.count)} نوبت واقعی · {fa(item.demoCount)} نوبت شبیه‌سازی‌شده · {fa(item.qc)} نوبت با QC ثبت‌شده</span>
          {item.code === 'IBD' && <small>برای محاسبه Deventer باید MDA واقعی، نمونه‌گیری تصادفی، کیت/مقیاس سازگار با BTT واکسن و نیمه‌عمر مستند همان جمعیت موجود باشد.</small>}
          {item.code === 'ND' && <small>برای تفسیر HI باید آنتی‌ژن همولوگ، HAU، تیمار سرم، RBC و پروتکل دقیق ثبت شود؛ ELISA و HI قابل ادغام عددی نیستند.</small>}
          {item.code === 'IBV' && <small>روند ELISA فقط در همان کیت/مقیاس قابل مقایسه است؛ از تیتر سرمی به‌تنهایی حفاظت مخاطی یا cross-protection استنباط نمی‌شود.</small>}
          {item.code === 'AIV' && <small>CK121 شناسایی آنتی‌بادی نوع A است و جای HI زیرتیپی H5/H9 یا پایش ویروس را نمی‌گیرد.</small>}
        </article>)}
      </div>
      <h4>مواردی که هنوز باید ثبت شوند</h4>
      {missing.length ? <ul className="readiness-missing">{missing.map(item => <li key={item}>{item}</li>)}</ul> : <p className="muted">اطلاعات پایه برای تحلیل اولیه ثبت شده است؛ تأیید دامپزشک و کنترل کیفیت همچنان الزامی است.</p>}
      <details className="readiness-graphs">
        <summary>نمودارها و تحلیل‌هایی که با ورود داده واقعی فعال می‌شوند</summary>
        <div className="readiness-graph-grid">
          <article><b>IBD</b><span>هیستوگرام MDA، توزیع صدکی P50/P75/P90، CV/GMT، پنجره Deventer با سناریوهای ۶۰/۷۵/۸۰٪، روند پس از واکسن و منحنی افت MDA در صورت وجود نمونه‌های سریالی.</span></article>
          <article><b>ND</b><span>توزیع تیتر HI در مقیاس log₂، GMT، CV، روند پس از واکسن، درصد پاسخ‌دهنده و افزایش چهاربرابری فقط در پرندگان دارای شناسه جفت‌شده و آنتی‌ژن یکسان.</span></article>
          <article><b>IBV</b><span>توزیع تیتر اختصاصی کیت، GMT/CV، روند زمانی با لایه رویدادهای واکسن و علائم تنفسی؛ بدون ادعای ایمنی مخاطی یا حفاظت ژنوتیپی.</span></article>
          <article><b>AIV</b><span>نمودار HI جداگانه برای هر زیرتیپ/آنتی‌ژن، روند ELISA نوع A به‌صورت مستقل، و خط زمانی PCR/پایش ویروس و واکسیناسیون.</span></article>
        </div>
      </details>
      <p className="readiness-foot">برای کیت‌های BioChek، راهنمای RevB 2025 حداقل ۱۸ نمونه برای برآورد کمی گله و ۲۳ نمونه را برای baseline و پیش‌بینی زمان واکسن توصیه می‌کند؛ ۱۵ نمونه فقط برای مشاهده روند پس از ایجاد baseline مناسب است. این توصیه را به کیت‌های دیگر تعمیم ندهید. {largestSample > 0 ? 'بیشترین تعداد نمونه ثبت‌شده در نوبت‌های واقعی: ' + fa(largestSample) + ' .' : 'هنوز تعداد نمونه واقعی ثبت نشده است.'} <a href="https://www.biochek.com/wp-content/uploads/2025/11/BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf" target="_blank" rel="noreferrer">راهنمای رسمی BioChek RevB 2025</a> · <a href="https://www.vmd.defra.gov.uk/productinformationdatabase/files/QRD_Documents/QRD-Auth_2715448.PDF" target="_blank" rel="noreferrer">برچسب رسمی Avishield IBD Plus (بریتانیا، ژوئن ۲۰۲۶)</a></p>
    </>}
  </section>
}
