import { useMemo, useState } from 'react'
import DatePicker from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import { calculateIbdWindow, normalizeDigits, parseTiters } from './core/ibd'

type SavedProfile = {
  id: string
  flockName: string
  placementDate: string
  savedAt: string
}

const STORAGE_KEY = 'adine-vaccine-timing-profiles-v1'

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

function readProfiles(): SavedProfile[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedProfile[]
  } catch {
    return []
  }
}

export default function App() {
  const [flockName, setFlockName] = useState('')
  const [placementDate, setPlacementDate] = useState('')
  const [samplingAge, setSamplingAge] = useState('14')
  const [btt, setBtt] = useState('')
  const [halfLife, setHalfLife] = useState('')
  const [susceptiblePercent, setSusceptiblePercent] = useState('75')
  const [titersText, setTitersText] = useState('')
  const [kitName, setKitName] = useState('')
  const [vaccineName, setVaccineName] = useState('')
  const [profiles, setProfiles] = useState<SavedProfile[]>(readProfiles)
  const [error, setError] = useState('')

  const titers = useMemo(() => parseTiters(titersText), [titersText])
  const result = useMemo(() => {
    if (!btt || !halfLife || titers.length === 0) return null
    try {
      return calculateIbdWindow({
        samplingAgeDays: Number(normalizeDigits(samplingAge)),
        breakthroughTiter: Number(normalizeDigits(btt)),
        halfLifeDays: Number(normalizeDigits(halfLife)),
        susceptiblePercent: Number(normalizeDigits(susceptiblePercent)),
        titers,
      })
    } catch {
      return null
    }
  }, [samplingAge, btt, halfLife, susceptiblePercent, titers])

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
    setProfiles(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setFlockName('')
    setPlacementDate('')
  }

  function removeProfile(id: string) {
    const next = profiles.filter((item) => item.id !== id)
    setProfiles(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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
          <span className="section-kicker">نسخه آزمایشی ۰.۱</span>
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
              onChange={(date) => setPlacementDate(date ? toIsoDate(date) : '')}
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
                <small>{profile.placementDate}</small>
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
          <label>درصد هدف پرندگان زیر آستانه (٪)
            <input inputMode="decimal" value={susceptiblePercent} onChange={(e) => setSusceptiblePercent(e.target.value)} />
          </label>
        </div>
        <label className="wide-label">تیترهای انفرادی ELISA
          <textarea value={titersText} onChange={(e) => setTitersText(e.target.value)} rows={4} placeholder="تیترها را با فاصله یا ویرگول وارد کنید؛ مثال: 3200، 2800، 4100، 1900 ..." />
          <small>فقط تیتر عددی معتبر از یک کیت و یک روش واحد. OD، S/P و تیترهای کیت‌های متفاوت را با هم مخلوط نکنید.</small>
        </label>
        <div className="data-summary">
          <span>تعداد تیترهای معتبر واردشده</span>
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
              <div><small>صدک تیتر انتخابی</small><b>{toPersianDigits(result.percentileTiter.toFixed(1))}</b></div>
              <div><small>مقدار log₂ صدک</small><b>{toPersianDigits(result.log2PercentileTiter.toFixed(2))}</b></div>
              <div><small>تعداد نمونه</small><b>{toPersianDigits(result.sampleCount)}</b></div>
            </div>
            <p>این عدد زمان قطعی واکسیناسیون نیست. کیفیت نمونه‌گیری، توزیع تیترها، اعتبار BTT، نیمه‌عمر، نوع واکسن و شواهد میدانی باید بررسی شوند.</p>
          </div>
        ) : (
          <div className="empty-result">برای محاسبه، تیترهای انفرادی، BTT و نیمه‌عمر معتبر را وارد کنید.</div>
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

      <footer>نسخه توسعه‌ای · ذخیره محلی اطلاعات · تاریخ‌های ورودی با تقویم شمسی</footer>
    </main>
  )
}