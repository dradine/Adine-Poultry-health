import { useMemo, useState } from 'react'
import DatePicker from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import DateObject from 'react-date-object'
import { calculateIbdWindow, calculateIbdSensitivity, normalizeDigits, parseTiters, validateIbdRunGate } from './core/ibd'

type SavedProfile = {
  id: string
  flockName: string
  placementDate: string
  savedAt: string
}
type SavedAnalysis = {
  id: string
  flockName: string
  placementDate: string
  samplingAge: string
  kitName: string
  vaccineName: string
  btt: string
  halfLife: string
  correctionDays: string
  minimumSampleCount: string
  susceptiblePercent: string
  titersText: string
  estimatedVaccinationAgeDays: number
  percentileTiter: number
  percentileRank: number
  sampleCount: number
  plateQcAccepted: boolean
  randomSamplingConfirmed: boolean
  pairingVerified: boolean
  savedAt: string
}

const STORAGE_KEY = 'adine-vaccine-timing-profiles-v1'
const ANALYSIS_STORAGE_KEY = 'adine-vaccine-timing-analyses-v1'

function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])
}

function toIsoDate(value: { toDate: () => Date } | null): string {
  if (!value) return ''
  const date = value.toDate()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatJalaliDate(value: string): string {
  if (!value) return ''
  return new DateObject({ date: new Date(value + 'T12:00:00'), calendar: persian, locale: persian_fa }).format('YYYY/MM/DD')
}

function readProfiles(): SavedProfile[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedProfile[] } catch { return [] }
}
function readAnalyses(): SavedAnalysis[] {
  try { return JSON.parse(localStorage.getItem(ANALYSIS_STORAGE_KEY) || '[]') as SavedAnalysis[] } catch { return [] }
}
function writeLocalStorage(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

export default function App() {
  const [flockName, setFlockName] = useState('')
  const [placementDate, setPlacementDate] = useState('')
  const [samplingAge, setSamplingAge] = useState('14')
  const [btt, setBtt] = useState('')
  const [halfLife, setHalfLife] = useState('')
  const [correctionDays, setCorrectionDays] = useState('0')
  const [minimumSampleCount, setMinimumSampleCount] = useState('23')
  const [susceptiblePercent, setSusceptiblePercent] = useState('5')
  const [titersText, setTitersText] = useState('')
  const [kitName, setKitName] = useState('')
  const [vaccineName, setVaccineName] = useState('')
  const [plateQcAccepted, setPlateQcAccepted] = useState(false)
  const [randomSamplingConfirmed, setRandomSamplingConfirmed] = useState(false)
  const [pairingVerified, setPairingVerified] = useState(false)
  const [profiles, setProfiles] = useState<SavedProfile[]>(readProfiles)
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>(readAnalyses)
  const [error, setError] = useState('')

  const titers = useMemo(() => parseTiters(titersText), [titersText])
  const calculation = useMemo(() => {
    if (!kitName.trim() || !vaccineName.trim() || !btt || !halfLife || titers.length === 0) return { result: null, error: '' }
    const gateErrors = validateIbdRunGate({ plateControlsAccepted: plateQcAccepted, representativeRandomSampling: randomSamplingConfirmed, assayVaccinePairingVerified: pairingVerified })
    if (gateErrors.length) return { result: null, error: gateErrors.join(' ') }
    try {
      return {
        result: calculateIbdWindow({
          samplingAgeDays: Number(normalizeDigits(samplingAge)),
          breakthroughTiter: Number(normalizeDigits(btt)),
          halfLifeDays: Number(normalizeDigits(halfLife)),
          susceptiblePercent: Number(normalizeDigits(susceptiblePercent)),
          correctionDays: Number(normalizeDigits(correctionDays)),
          minimumSampleCount: Number(normalizeDigits(minimumSampleCount)),
          titers,
        }),
        error: '',
      }
    } catch (cause) {
      return { result: null, error: cause instanceof Error ? cause.message : 'ورودی‌ها معتبر نیستند.' }
    }
  }, [samplingAge, btt, halfLife, susceptiblePercent, correctionDays, minimumSampleCount, titers, kitName, vaccineName, plateQcAccepted, randomSamplingConfirmed, pairingVerified])
  const result = calculation.result
  const calculationError = calculation.error
  const sensitivity = useMemo(() => {
    if (!result) return []
    try {
      return calculateIbdSensitivity({
        samplingAgeDays: Number(normalizeDigits(samplingAge)),
        breakthroughTiter: Number(normalizeDigits(btt)),
        halfLifeDays: Number(normalizeDigits(halfLife)),
        correctionDays: Number(normalizeDigits(correctionDays)),
        minimumSampleCount: Number(normalizeDigits(minimumSampleCount)),
        titers,
        susceptiblePercent: Number(normalizeDigits(susceptiblePercent)),
      })
    } catch { return [] }
  }, [result, samplingAge, btt, halfLife, correctionDays, minimumSampleCount, titers, susceptiblePercent])

  function saveProfile() {
    setError('')
    if (!flockName.trim() || !placementDate) {
      setError('نام گله و تاریخ جوجه‌ریزی را وارد کنید.')
      return
    }
    const next = [{
      id: crypto.randomUUID(),
      flockName: flockName.trim(),
      placementDate,
      savedAt: new Date().toISOString(),
    }, ...profiles]
    if (!writeLocalStorage(STORAGE_KEY, next)) { setError('ذخیره‌سازی مرورگر در دسترس نیست یا فضای آن کافی نیست. ابتدا از اطلاعات نسخه پشتیبان تهیه کنید.'); return }
    setProfiles(next)
  }

  function saveAnalysis() {
    setError('')
    if (!flockName.trim() || !placementDate) {
      setError('برای ذخیره تحلیل، ابتدا نام گله و تاریخ جوجه‌ریزی را وارد کنید.')
      return
    }
    if (!result) {
      setError('تا زمانی که کنترل‌های ورودی موفق نشده‌اند، تحلیل قابل ذخیره نیست.')
      return
    }
    const record: SavedAnalysis = {
      id: crypto.randomUUID(),
      flockName: flockName.trim(),
      placementDate,
      samplingAge,
      kitName: kitName.trim(),
      vaccineName: vaccineName.trim(),
      btt,
      halfLife,
      correctionDays,
      minimumSampleCount,
      susceptiblePercent,
      titersText,
      estimatedVaccinationAgeDays: result.estimatedVaccinationAgeDays,
      percentileTiter: result.percentileTiter,
      percentileRank: result.percentileRank,
      sampleCount: result.sampleCount,
      plateQcAccepted,
      randomSamplingConfirmed,
      pairingVerified,
      savedAt: new Date().toISOString(),
    }
    const next = [record, ...analyses].slice(0, 100)
    if (!writeLocalStorage(ANALYSIS_STORAGE_KEY, next)) { setError('ذخیره تحلیل انجام نشد؛ فضای ذخیره‌سازی مرورگر کافی نیست.'); return }
    setAnalyses(next)
  }

  function restoreAnalysis(item: SavedAnalysis) {
    setFlockName(item.flockName)
    setPlacementDate(item.placementDate)
    setSamplingAge(item.samplingAge)
    setKitName(item.kitName)
    setVaccineName(item.vaccineName)
    setBtt(item.btt)
    setHalfLife(item.halfLife)
    setCorrectionDays(item.correctionDays)
    setMinimumSampleCount(item.minimumSampleCount)
    setSusceptiblePercent(item.susceptiblePercent)
    setTitersText(item.titersText)
    setPlateQcAccepted(item.plateQcAccepted)
    setRandomSamplingConfirmed(item.randomSamplingConfirmed)
    setPairingVerified(item.pairingVerified)
    setError('')
  }

  function removeAnalysis(id: string) {
    const next = analyses.filter((item) => item.id !== id)
    if (!writeLocalStorage(ANALYSIS_STORAGE_KEY, next)) { setError('حذف سابقه انجام نشد؛ ذخیره‌سازی مرورگر در دسترس نیست.'); return }
    setAnalyses(next)
  }

  function removeProfile(id: string) {
    const next = profiles.filter((item) => item.id !== id)
    if (!writeLocalStorage(STORAGE_KEY, next)) { setError('حذف گله انجام نشد؛ ذخیره‌سازی مرورگر در دسترس نیست.'); return }
    setProfiles(next)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">آ</div>
        <div>
          <div className="eyebrow">مرکز تخصصی سلامت طیور آدینه</div>
          <h1>تصمیم‌یار زمان‌بندی واکسیناسیون</h1>
        </div>
        <span className="offline-pill"><i /> آفلاین‌محور</span>
      </header>

      <section className="intro">
        <div>
          <span className="section-kicker">نسخه آزمایشی ۰.۲</span>
          <h2>تصمیم علمی، بر اساس داده واقعی گله</h2>
          <p>ثبت اطلاعات گله و بررسی اولیه زمان‌بندی واکسن گامبورو بر پایه تیتر آنتی‌بادی مادری.</p>
        </div>
        <div className="intro-symbol">IBD</div>
      </section>

      <div className="notice">
        <strong>توجه علمی:</strong> موتور گامبورو در این نسخه اولیه و در مرحله اعتبارسنجی است.
        خروجی فعلی صرفاً محاسبه مقدماتی Deventer-style است و تا زمان ثبت نسخه دقیق کیت،
        واکسن، BTT و تأیید پروتکل، نباید به‌عنوان برنامه قطعی واکسیناسیون استفاده شود.
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="step">۱</span><h3>اطلاعات گله</h3></div>
          <span className="muted">ذخیره روی همین دستگاه</span>
        </div>
        <div className="form-grid">
          <label>نام یا کد گله
            <input value={flockName} onChange={(e) => setFlockName(e.target.value)} placeholder="مثلاً فارم شماره ۱۲" />
          </label>
          <label>تاریخ جوجه‌ریزی
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              value={placementDate ? new Date(placementDate + 'T12:00:00') : ''}
              onChange={(date) => setPlacementDate(date && !Array.isArray(date) ? toIsoDate(date) : '')}
              format="YYYY/MM/DD"
              calendarPosition="bottom-right"
              placeholder="انتخاب تاریخ شمسی"
              inputClass="date-input"
            />
          </label>
        </div>
        <button className="button secondary" onClick={saveProfile}>ذخیره مشخصات گله</button>
        {error && <p className="error">{error}</p>}
        {profiles.length > 0 && (
          <div className="saved-list">
            <div className="saved-title">گله‌های ذخیره‌شده</div>
            {profiles.map((profile) => (
              <div className="saved-row" key={profile.id}>
                <span>{profile.flockName}</span>
                <small>{toPersianDigits(formatJalaliDate(profile.placementDate))}</small>
                <button className="link-button" onClick={() => { setFlockName(profile.flockName); setPlacementDate(profile.placementDate) }}>انتخاب</button>
                <button className="link-button" onClick={() => removeProfile(profile.id)}>حذف</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="step">۲</span><h3>محاسبه مقدماتی گامبورو</h3></div>
          <span className="tag">IBD · Deventer-style</span>
        </div>
        <div className="form-grid">
          <label>سن گله هنگام نمونه‌گیری (روز)
            <input inputMode="decimal" value={samplingAge} onChange={(e) => setSamplingAge(e.target.value)} placeholder="مثلاً ۱۴" />
          </label>
          <label>نام دقیق کیت و شماره کاتالوگ
            <input value={kitName} onChange={(e) => setKitName(e.target.value)} placeholder="سازنده، نام کیت، کد محصول و نسخه" />
          </label>
          <label>نام دقیق واکسن / محصول
            <input value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} placeholder="نام تجاری، سویه و نوع واکسن" />
          </label>
          <label>BTT محصول (تیتر)
            <input inputMode="decimal" value={btt} onChange={(e) => setBtt(e.target.value)} placeholder="فقط از بروشور همان محصول" />
          </label>
          <label>نیمه‌عمر آنتی‌بادی (روز)
            <input inputMode="decimal" value={halfLife} onChange={(e) => setHalfLife(e.target.value)} placeholder="بر اساس داده معتبر همین گله/جمعیت" />
          </label>
          <label>حداقل تعداد نمونه در این تحلیل
            <input inputMode="numeric" value={minimumSampleCount} onChange={(e) => setMinimumSampleCount(e.target.value)} />
          </label>
          <label>اصلاح سن نمونه‌گیری (روز؛ مطابق بروشور)
            <input inputMode="decimal" value={correctionDays} onChange={(e) => setCorrectionDays(e.target.value)} />
          </label>
          <label>درصد هدف پرندگان پاسخ‌پذیر در زمان واکسیناسیون (٪)
            <input inputMode="decimal" value={susceptiblePercent} onChange={(e) => setSusceptiblePercent(e.target.value)} />
            <small>پیش‌فرض ۵٪ در راهنمای Elanco برای حداقل سهم پرندگانِ پاسخ‌پذیر اولیه و با فرض انتشار افقی واکسن زنده مطرح شده است؛ مقدار ثابت جهانی نیست. در قفس، بستر، فشار بیماری و تصمیم واکسیناسیون چندمرحله‌ای باید جداگانه سناریوسازی شود.</small>
          </label>
        </div>
        <label className="wide-label">تیترهای انفرادی ELISA
          <textarea value={titersText} onChange={(e) => setTitersText(e.target.value)} rows={4} placeholder="تیترها را با فاصله یا ویرگول وارد کنید؛ مثال: 3200، 2800، 4100، 1900 ..." />
          <small>راهنمای BioChek 2025 برای پیش‌بینی زمان واکسن حداقل ۲۳ نمونه را توصیه می‌کند؛ راهنمای Elanco حداقل ۱۸ جوجه سالم را ذکر می‌کند. عدد ۲۳ الزام جهانی یا الزام اختصاصی IDEXX نیست؛ برای هر پروتکل، مبنای انتخاب را ثبت کنید. فقط تیتر عددی معتبر از یک کیت و یک روش واحد. OD، S/P و تیترهای کیت‌های متفاوت را مخلوط نکنید.</small>
        </label>

        <div className="qc-gate">
          <div className="saved-title">دروازه کنترل کیفیت پیش از محاسبه</div>
          <p>این تأییدها را برنامه به‌صورت خودکار از دستگاه آزمایش نمی‌خواند؛ فقط پس از کنترل گزارش معتبر آزمایشگاه آن‌ها را علامت بزنید.</p>
          <label><input type="checkbox" checked={plateQcAccepted} onChange={(e) => setPlateQcAccepted(e.target.checked)} /> کنترل‌های مثبت و منفی و کنترل مرجعِ قابل‌اعمال، طبق IFU همان کیت و SOP آزمایشگاه، در محدوده پذیرش بوده‌اند.</label>
          <label><input type="checkbox" checked={randomSamplingConfirmed} onChange={(e) => setRandomSamplingConfirmed(e.target.checked)} /> نمونه‌ها به‌صورت تصادفی و نماینده از نقاط مختلف سالن و از جوجه‌های سالم انتخاب شده‌اند.</label>
          <label><input type="checkbox" checked={pairingVerified} onChange={(e) => setPairingVerified(e.target.checked)} /> BTT دقیقاً با همان واکسن، همان کیت، همان نسخه آزمون و همان واحد تیتر تطبیق داده شده است.</label>
        </div>
        <div className="data-summary">
          <span>تعداد مقادیر واردشده</span>
          <strong>{toPersianDigits(titers.length)}</strong>
        </div>

        {result ? (
          <div className="result-card">
            <div className="result-heading">
              <span>خروجی محاسبه مقدماتی</span>
              <span className="tag warning">نیازمند بازبینی دامپزشک</span>
            </div>
            <div className="result-number">
              <strong>{toPersianDigits(result.estimatedVaccinationAgeDays.toFixed(1))}</strong>
              <span>روزگی تخمینی</span>
            </div>
            <div className="result-details">
              <div><small>تیتر صدک انتخابی</small><b>{toPersianDigits(result.percentileTiter.toFixed(1))}</b></div>
              <div><small>رتبه نمونه انتخابی</small><b>{toPersianDigits(result.percentileRank)}</b></div>
              <div><small>مقدار log₂ صدک</small><b>{toPersianDigits(result.log2PercentileTiter.toFixed(2))}</b></div>
              <div><small>تعداد نمونه</small><b>{toPersianDigits(result.sampleCount)}</b></div>
              <div><small>میانه تیتر</small><b>{toPersianDigits(result.medianTiter.toFixed(1))}</b></div>
              <div><small>میانگین هندسی (GMT)</small><b>{toPersianDigits(result.geometricMeanTiter.toFixed(1))}</b></div>
              <div><small>انحراف معیار log₂</small><b>{toPersianDigits(result.log2StandardDeviation.toFixed(2))}</b></div>
              <div><small>CV حسابی</small><b>{toPersianDigits(result.coefficientOfVariationPercent.toFixed(1))}٪</b></div>
              <div><small>دامنه تیتر</small><b>{toPersianDigits(result.minimumTiter)}–{toPersianDigits(result.maximumTiter)}</b></div>
            </div>
            <div className="sensitivity-panel">
              <b>تحلیل حساسیت درصد پاسخ‌پذیری</b>
              <p>تغییر سهم پرندگانی که باید مستقیماً به واکسن پاسخ‌پذیر باشند، می‌تواند زمان برآوردی را جابه‌جا کند. ۵٪ سناریوی پیش‌فرض راهنمای میدانی Elanco است؛ ۷۵٪ در برخی مطالعات میدانی استفاده شده است.</p>
              <div className="sensitivity-grid">
                {sensitivity.map((point) => <div key={point.susceptiblePercent}><small>{toPersianDigits(point.susceptiblePercent)}٪ پاسخ‌پذیر</small><strong>{toPersianDigits(point.vaccinationAgeDays.toFixed(1))} روز</strong><small>تیتر {toPersianDigits(point.selectedTiter)} · رتبه {toPersianDigits(point.selectedRank)}</small></div>)}
              </div>
            </div>
            {result.thresholdAlreadyReachedAtSampling && <p className="error">آستانه ممکن است در زمان نمونه‌گیری قبلاً حاصل شده باشد؛ این عدد را زمان آینده تلقی نکنید.</p>}
            <p>هشدارها: {result.warnings.join(' ')}</p>
            <p>این عدد زمان قطعی واکسیناسیون نیست. تا زمانی که نسخه دقیق کیت و محصول، BTT، مقیاس تیتر و نیمه‌عمر مستند و تأیید نشده‌اند، خروجی فقط محاسبه ریاضی مقدماتی است.</p>
          </div>
        ) : (
          <div className="empty-result">{calculationError || 'برای محاسبه، تیترهای انفرادی، BTT و نیمه‌عمر معتبر را وارد کنید.'}</div>
        )}
        {result && (
          <div className="save-analysis-row">
            <button className="button primary" onClick={saveAnalysis}>ذخیره این تحلیل روی دستگاه</button>
            <small>حداکثر ۱۰۰ تحلیل اخیر روی همین دستگاه نگهداری می‌شود.</small>
          </div>
        )}
        {analyses.length > 0 && (
          <div className="saved-list">
            <div className="saved-title">سوابق محاسبات ذخیره‌شده روی دستگاه</div>
            {analyses.slice(0, 10).map((item) => (
              <div className="saved-row analysis-row" key={item.id}>
                <span>{item.flockName} · {item.vaccineName}</span>
                <small>{toPersianDigits(formatJalaliDate(item.placementDate))} · {toPersianDigits(item.estimatedVaccinationAgeDays.toFixed(1))} روز · {toPersianDigits(item.sampleCount)} نمونه</small>
                <button className="link-button" onClick={() => restoreAnalysis(item)}>بارگذاری</button>
                <button className="link-button" onClick={() => removeAnalysis(item.id)}>حذف</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel roadmap">
        <div className="panel-heading"><div><span className="step">۳</span><h3>مسیر توسعه موتورهای بیماری</h3></div></div>
        <div className="disease-grid">
          <div className="disease active"><b>گامبورو (IBD)</b><small>نسخه اولیه در حال اعتبارسنجی</small></div>
          <div className="disease"><b>نیوکاسل (ND)</b><small>مدل اختصاصی بر اساس آزمون و پلتفرم</small></div>
          <div className="disease"><b>برونشیت (IBV)</b><small>مدل مستقل؛ بدون تعمیم Deventer</small></div>
          <div className="disease"><b>آنفلوانزا (AIV)</b><small>تفکیک آنتی‌ژن هدف و وکتور</small></div>
        </div>
      </section>

      <footer>نسخه توسعه‌ای · ذخیره محلی گله و تحلیل‌ها · تاریخ‌های ورودی با تقویم شمسی</footer>
    </main>
  )
}