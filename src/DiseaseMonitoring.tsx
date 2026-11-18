import { useEffect, useState } from 'react'
import { monitorNdHi } from './core/ndMonitor'
import { analyzeIbvTrend } from './core/ibvTrend'
import { assessAivEvidence } from './core/aivEvidence'
import { listLocalModelRuns, notifyLocalDataChanged, type LocalModelRun } from './core/localFirstDb'
import { saveMonitorRunToLocal } from './core/syncService'

type Mode = 'ND' | 'IBV' | 'AIV'
type FlockOption = { id: string; flockName: string; placementDate: string; savedAt?: string }
type AivInput = {
  vaccinationStatus: 'vaccinated' | 'unvaccinated' | 'unknown'
  vaccinePlatform: 'inactivated' | 'vector' | 'other' | 'unknown'
  subtype: string
  antigenMatch: 'documented' | 'uncertain' | 'not-assessed'
  serologyResult: 'positive' | 'negative' | 'inconclusive' | 'not-tested'
  divaValidated: boolean
  rtPcrResult: 'positive' | 'negative' | 'not-tested'
  clinicalSigns: boolean
  mortalityIncrease: boolean
  officialProgramConfirmed: boolean
}
type Props = { profiles: FlockOption[] }

export default function DiseaseMonitoring({ profiles }: Props) {
  const [mode, setMode] = useState<Mode>('ND')
  const [flockId, setFlockId] = useState('')
  const [baseline, setBaseline] = useState('')
  const [post, setPost] = useState('')
  const [threshold, setThreshold] = useState('')
  const [assay, setAssay] = useState('')
  const [product, setProduct] = useState('')
  const [route, setRoute] = useState('')
  const [days, setDays] = useState('14')
  const [ibData, setIbData] = useState('')
  const [ibAssay, setIbAssay] = useState('')
  const [unit, setUnit] = useState<'ELISA' | 'HI-log2' | 'VN'>('ELISA')
  const [aiv, setAiv] = useState<AivInput>({
    vaccinationStatus: 'unknown', vaccinePlatform: 'unknown', subtype: '',
    antigenMatch: 'uncertain', serologyResult: 'not-tested', divaValidated: false,
    rtPcrResult: 'not-tested', clinicalSigns: false, mortalityIncrease: false,
    officialProgramConfirmed: false,
  })
  const [out, setOut] = useState<unknown>(null)
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null)
  const [err, setErr] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<LocalModelRun[]>([])
  const [sampleCountOverride, setSampleCountOverride] = useState('')

  useEffect(() => {
    setFlockId(current => profiles.some(profile => profile.id === current) ? current : profiles[0]?.id || '')
  }, [profiles])

  useEffect(() => {
    let active = true
    const refresh = async () => {
      const runs = await listLocalModelRuns()
      if (active) setHistory(runs.filter(run => run.disease_code !== 'IBD'))
    }
    void refresh().catch(cause => { if (active) setErr(cause instanceof Error ? cause.message : 'خواندن سوابق پایش ناموفق بود.') })
    const onChanged = () => { void refresh().catch(() => undefined) }
    window.addEventListener('adine-local-data-changed', onChanged)
    window.addEventListener('adine-cloud-data-updated', onChanged)
    return () => {
      active = false
      window.removeEventListener('adine-local-data-changed', onChanged)
      window.removeEventListener('adine-cloud-data-updated', onChanged)
    }
  }, [])

  const numbers = (value: string) => value.split(/[،,;\s]+/).filter(Boolean)
    .map(item => Number(item.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))))

  function run() {
    setErr('')
    setSavedMessage('')
    setOut(null)
    setLastInput(null)
    try {
      if (mode === 'ND') {
        const input = {
          baselineHiLog2: baseline.trim() ? numbers(baseline) : undefined,
          postHiLog2: numbers(post),
          assayAntigen: assay,
          vaccineProduct: product,
          route,
          samplingDaysAfterDose: Number(days),
          responseThresholdLog2: threshold === '' ? undefined : Number(threshold),
        }
        const result = monitorNdHi(input)
        setLastInput(input as unknown as Record<string, unknown>)
        setOut(result)
      } else if (mode === 'IBV') {
        const observations = ibData.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
          const [day, value] = line.split(/[:;,]/)
          return { day: Number(day), value: Number(value) }
        })
        const input = { observations, assay: ibAssay, unit }
        const result = analyzeIbvTrend(input)
        setLastInput(input as unknown as Record<string, unknown>)
        setOut(result)
      } else {
        const result = assessAivEvidence(aiv)
        setLastInput(aiv as unknown as Record<string, unknown>)
        setOut(result)
      }
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : 'خطا در ورودی')
    }
  }

  async function saveRun() {
    const flock = profiles.find(profile => profile.id === flockId)
    if (!flock || out === null || !lastInput) {
      setErr('ابتدا یک گله ذخیره‌شده را انتخاب و موتور پایش را اجرا کنید.')
      return
    }
    setSaving(true)
    setErr('')
    setSavedMessage('')
    try {
      await saveMonitorRunToLocal({ flock, diseaseCode: mode, input: lastInput, output: out })
      setSavedMessage('نتیجه در سوابق همین گله ذخیره شد؛ در صورت ورود به حساب، برای همگام‌سازی در صف قرار گرفت.')
      notifyLocalDataChanged()
      const runs = await listLocalModelRuns()
      setHistory(runs.filter(run => run.disease_code !== 'IBD'))
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : 'ذخیره نتیجه پایش انجام نشد.')
    } finally {
      setSaving(false)
    }
  }

  const flockName = (id: string) => profiles.find(profile => profile.id === id)?.flockName || 'گله'
  const diseaseName = (code: string) => code === 'ND' ? 'نیوکاسل' : code === 'IBV' ? 'برونشیت' : 'آنفلوانزا'
  const autoSampleCount = mode === 'ND' ? numbers(post).filter(Number.isFinite).length
    : mode === 'IBV' ? ibData.split('\n').map(line => line.trim()).filter(Boolean).length : 0
  const reportedSampleCount = sampleCountOverride.trim() ? Number(sampleCountOverride) : autoSampleCount
  const sampleCountWarning = reportedSampleCount > 0 && reportedSampleCount < 10
    ? 'نمونه بسیار کم (کمتر از ۱۰): نتایج بسیار ناپایدارند؛ از تعمیم به کل گله یا تصمیم قطعی خودداری کنید.'
    : reportedSampleCount >= 10 && reportedSampleCount < 20
      ? 'حجم نمونه محدود (۱۰ تا ۱۹): این تعداد به‌تنهایی نمایندگی گله یا اعتبار نتیجه را تضمین نمی‌کند.'
      : reportedSampleCount >= 20 && reportedSampleCount < 30
        ? 'تعداد نمونه را با هدف پایش، پراکندگی سالن و طراحی نمونه‌گیری بررسی کنید؛ حداقل جهانی ثابتی وجود ندارد.'
        : reportedSampleCount >= 30
          ? 'تعداد نمونه به‌تنهایی کافی بودن نمونه‌گیری را ثابت نمی‌کند؛ نمایندگی و کیفیت آزمون نیز مهم است.'
          : 'تعداد نمونه را وارد کنید یا داده‌های آزمون را تکمیل کنید.';


  return (
    <section className="panel">
      <div className="panel-heading">
        <div><span className="step">۴</span><h3>موتورهای مستقل پایش بیماری</h3></div>
        <span className="tag">Research / Monitor</span>
      </div>
      <div className="form-grid">
        <label>تعداد نمونه (برای AIV دستی؛ برای ND/IBV شمارش خودکار قابل اصلاح)
          <input inputMode="numeric" value={sampleCountOverride} onChange={event => setSampleCountOverride(event.target.value)} placeholder={autoSampleCount ? String(autoSampleCount) + ' نمونه شمارش‌شده' : 'تعداد نمونه'} />
        </label>
        <label>گله مربوط به این پایش
          <select value={flockId} onChange={event => setFlockId(event.target.value)}>
            <option value="">انتخاب گله ذخیره‌شده…</option>
            {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.flockName} · {profile.placementDate}</option>)}
          </select>
        </label>
        <label>انتخاب موتور
          <select value={mode} onChange={event => { setMode(event.target.value as Mode); setOut(null); setLastInput(null); setErr(''); setSavedMessage('') }}>
            <option value="ND">نیوکاسل · HI monitor</option>
            <option value="IBV">برونشیت · Serology trend</option>
            <option value="AIV">آنفلوانزا · Evidence gate</option>
          </select>
        </label>
      </div>

      {mode === 'ND' && <>
        <p>ورودی HI بر حسب log2 endpoint (رقت ۱:۲ = ۱، ۱:۴ = ۲ و ...). فقط تحلیل پاسخ سرولوژیک، نه protection. اگر نمونه‌های baseline و post متعلق به همان پرندگان و همان ترتیب نیستند، baseline را وارد نکنید.</p>
        <div className="form-grid">
          <label>Baseline paired (همان پرندگان و همان ترتیب؛ اختیاری)<input value={baseline} onChange={event => setBaseline(event.target.value)} /></label>
          <label>HI پس از واکسن<input value={post} onChange={event => setPost(event.target.value)} /></label>
          <label>آنتی‌ژن/سویه آزمون<input value={assay} onChange={event => setAssay(event.target.value)} /></label>
          <label>محصول واکسن<input value={product} onChange={event => setProduct(event.target.value)} /></label>
          <label>مسیر تجویز<input value={route} onChange={event => setRoute(event.target.value)} /></label>
          <label>روز پس از واکسن<input value={days} onChange={event => setDays(event.target.value)} /></label>
          <label>آستانه responder (اختیاری؛ فقط طبق پروتکل مستند، log2)<input value={threshold} onChange={event => setThreshold(event.target.value)} /></label>
        </div>
      </>}

      {mode === 'IBV' && <>
        <p>هر خط: روز:مقدار. فقط مقادیر یک assay و واحد یکسان وارد شود؛ برای HI-log2، مقدار log2 رقت را وارد کنید.</p>
        <div className="form-grid">
          <label>نام آزمون/کیت<input value={ibAssay} onChange={event => setIbAssay(event.target.value)} /></label>
          <label>واحد
            <select value={unit} onChange={event => setUnit(event.target.value as typeof unit)}>
              <option value="ELISA">ELISA</option><option value="HI-log2">HI log2</option><option value="VN">VN</option>
            </select>
          </label>
          <label>مشاهدات (day:value)<textarea rows={4} value={ibData} onChange={event => setIbData(event.target.value)} /></label>
        </div>
      </>}

      {mode === 'AIV' && <div className="form-grid">
        <label>وضع واکسیناسیون
          <select value={aiv.vaccinationStatus} onChange={event => setAiv({ ...aiv, vaccinationStatus: event.target.value as AivInput['vaccinationStatus'] })}>
            <option value="unknown">نامعلوم</option><option value="vaccinated">واکسینه</option><option value="unvaccinated">غیرواکسینه</option>
          </select>
        </label>
        <label>پلتفرم واکسن
          <select value={aiv.vaccinePlatform} onChange={event => setAiv({ ...aiv, vaccinePlatform: event.target.value as AivInput['vaccinePlatform'] })}>
            <option value="unknown">نامعلوم</option><option value="inactivated">غیرفعال</option><option value="vector">وکتور</option><option value="other">سایر</option>
          </select>
        </label>
        <label>زیرتیپ/آنتی‌ژن<input value={aiv.subtype} onChange={event => setAiv({ ...aiv, subtype: event.target.value })} /></label>
        <label>تطابق آنتی‌ژنی
          <select value={aiv.antigenMatch} onChange={event => setAiv({ ...aiv, antigenMatch: event.target.value as AivInput['antigenMatch'] })}>
            <option value="uncertain">نامشخص</option><option value="documented">مستند</option><option value="not-assessed">ارزیابی نشده</option>
          </select>
        </label>
        <label>سرولوژی
          <select value={aiv.serologyResult} onChange={event => setAiv({ ...aiv, serologyResult: event.target.value as AivInput['serologyResult'] })}>
            <option value="not-tested">انجام نشده</option><option value="positive">مثبت</option><option value="negative">منفی</option><option value="inconclusive">نامشخص</option>
          </select>
        </label>
        <label>RT-PCR
          <select value={aiv.rtPcrResult} onChange={event => setAiv({ ...aiv, rtPcrResult: event.target.value as AivInput['rtPcrResult'] })}>
            <option value="not-tested">انجام نشده</option><option value="positive">مثبت</option><option value="negative">منفی</option>
          </select>
        </label>
        <label><input type="checkbox" checked={aiv.clinicalSigns} onChange={event => setAiv({ ...aiv, clinicalSigns: event.target.checked })} /> علائم بالینی</label>
        <label><input type="checkbox" checked={aiv.mortalityIncrease} onChange={event => setAiv({ ...aiv, mortalityIncrease: event.target.checked })} /> افزایش تلفات</label>
        <label><input type="checkbox" checked={aiv.divaValidated} onChange={event => setAiv({ ...aiv, divaValidated: event.target.checked })} /> روش DIVA معتبر شده</label>
        <label><input type="checkbox" checked={aiv.officialProgramConfirmed} onChange={event => setAiv({ ...aiv, officialProgramConfirmed: event.target.checked })} /> برنامه رسمی تأیید شده</label>
      </div>}

      <div className="sample-count-note" role="status"><strong>کنترل حجم نمونه · n = {reportedSampleCount || '—'}</strong><p>{sampleCountWarning}</p><small>این هشدار جایگزین تعیین حجم نمونه بر اساس هدف، شیوع مورد انتظار، دقت، سطح اطمینان، طراحی خوشه‌ای و دستورالعمل کیت نیست.</small></div>
      <button className="button primary" onClick={run}>اجرای موتور پایش</button>
      {err && <p className="error">{err}</p>}
      {savedMessage && <p className="cloud-message" role="status">{savedMessage}</p>}
      {out !== null && <>
        <pre className="monitor-output">{JSON.stringify(out, null, 2)}</pre>
        <button className="button secondary" disabled={saving || !flockId} onClick={() => void saveRun()}>
          {saving ? 'در حال ذخیره…' : 'ثبت نتیجه در سوابق گله'}
        </button>
        {!flockId && <p className="muted">برای ثبت نتیجه، ابتدا اطلاعات یک گله را در بخش اطلاعات گله ذخیره کنید.</p>}
      </>}

      <div className="saved-list">
        <div className="saved-title">سوابق پایش ذخیره‌شده</div>
        {history.length === 0 ? <p className="muted">هنوز سابقه‌ای برای ND، IBV یا AIV ذخیره نشده است.</p> : history.slice(0, 12).map(run => (
          <details className="monitor-history-row" key={run.id}>
            <summary>
              <b>{diseaseName(run.disease_code)}</b>
              <span>{flockName(run.flock_id)}</span>
              <small>{new Date(run.created_at).toLocaleDateString('fa-IR')}</small>
            </summary>
            <pre className="monitor-output">{JSON.stringify(run.output_snapshot, null, 2)}</pre>
          </details>
        ))}
      </div>
    </section>
  )
}
