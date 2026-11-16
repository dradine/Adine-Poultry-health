import { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import DateObject from 'react-date-object'
import { ASSAY_CATALOG, type AssayCatalogEntry } from './core/assayRegistry'
import { fetchPublicReferenceCatalog, findBttAssayForProduct, mapPublicAssayToEntry, readCachedPublicCatalog, type PublicVaccineRecord } from './core/publicCatalog'
import { createLocalBackup, restoreLocalBackup } from './core/localBackup'
import { calculateIbdWindow, calculateIbdSensitivity, normalizeDigits, parseTiters, validateIbdRunGate } from './core/ibd'
import { interpretIbdResult } from './core/ibdInterpretation'
import DiseaseMonitoring from './DiseaseMonitoring'
import CloudSyncPanel from './components/CloudSyncPanel'
import { importLocalFirstBackup, listLocalFlocks, listLocalModelRuns, markLocalDeleted, notifyLocalDataChanged } from './core/localFirstDb'
import { migrateLegacyLocalData, saveAnalysisToLocal, saveProfileToLocal } from './core/syncService'

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
  bttSource: string
  halfLifeSource: string
  correctionSource: string
  btt: string
  halfLife: string
  correctionDays: string
  minimumSampleCount: string
  minimumSampleCountSource: string
  susceptiblePercent: string
  titersText: string
  estimatedVaccinationAgeDays: number | null
  percentileTiter: number
  percentileRank: number
  sampleCount: number
  warnings?: string[]
  plateQcAccepted: boolean
  randomSamplingConfirmed: boolean
  pairingVerified: boolean
  assayKitId?: string
  assaySource?: string
  assayStatus?: string
  assayNote?: string
  vaccineProductId?: string
  vaccineMarketCode?: string | null
  vaccineLabelVersion?: string | null
  bttAssayKitId?: string | null
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
  const [minimumSampleCountSource, setMinimumSampleCountSource] = useState('')
  const [susceptiblePercent, setSusceptiblePercent] = useState('5')
  const [titersText, setTitersText] = useState('')
  const [kitName, setKitName] = useState('')
  const [vaccineName, setVaccineName] = useState('')
  const [bttSource, setBttSource] = useState('')
  const [halfLifeSource, setHalfLifeSource] = useState('')
  const [correctionSource, setCorrectionSource] = useState('')
  const [plateQcAccepted, setPlateQcAccepted] = useState(false)
  const [randomSamplingConfirmed, setRandomSamplingConfirmed] = useState(false)
  const [pairingVerified, setPairingVerified] = useState(false)
  const [profiles, setProfiles] = useState<SavedProfile[]>(readProfiles)
  const [assayCatalog, setAssayCatalog] = useState<AssayCatalogEntry[]>(ASSAY_CATALOG)
  const [vaccineCatalog, setVaccineCatalog] = useState<PublicVaccineRecord[]>([])
  const [catalogNotice, setCatalogNotice] = useState('')
  const [selectedAssayId, setSelectedAssayId] = useState('')
  const [selectedVaccineProductId, setSelectedVaccineProductId] = useState('')
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>(readAnalyses)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const refreshFromLocalDb = () => {
      setProfiles(readProfiles())
      setAnalyses(readAnalyses())
    }
    const cached = readCachedPublicCatalog()
    if (cached) {
      setAssayCatalog(cached.assays.map(mapPublicAssayToEntry))
      setVaccineCatalog(cached.vaccines)
    }
    const refreshCatalog = async () => {
      if (!navigator.onLine) {
        if (!cached) setCatalogNotice('برای دریافت بانک کامل کیت و واکسن، یک بار با اینترنت برنامه را باز کنید؛ فهرست محلی محدود در دسترس است.')
        return
      }
      try {
        const catalog = await fetchPublicReferenceCatalog()
        if (!active) return
        setAssayCatalog(catalog.assays.map(mapPublicAssayToEntry))
        setVaccineCatalog(catalog.vaccines)
        setCatalogNotice('')
      } catch (cause) {
        if (active && !cached) setCatalogNotice(cause instanceof Error ? 'بانک آنلاین کیت/واکسن در دسترس نیست؛ فهرست محلی محدود استفاده می‌شود.' : 'بانک مرجع آنلاین در دسترس نیست.')
      }
    }
    const onOnline = () => { void refreshCatalog() }
    window.addEventListener('adine-cloud-data-updated', refreshFromLocalDb)
    window.addEventListener('online', onOnline)
    void migrateLegacyLocalData().catch((cause) => {
      setError(cause instanceof Error ? cause.message : 'انتقال داده‌های قدیمی به ذخیره‌سازی محلی انجام نشد.')
    })
    void refreshCatalog()
    return () => {
      active = false
      window.removeEventListener('adine-cloud-data-updated', refreshFromLocalDb)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  const selectedVaccineProduct = vaccineCatalog.find(product => product.id === selectedVaccineProductId)
  const selectedAssay = assayCatalog.find(kit => kit.id === selectedAssayId)

  useEffect(() => {
    if (!selectedAssayId || selectedAssay) return
    const previous = ASSAY_CATALOG.find(kit => kit.id === selectedAssayId)
    if (!previous?.catalog) return
    const normalizeCatalog = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
    const previousCode = normalizeCatalog(previous.catalog)
    const match = assayCatalog.find(kit => {
      if (!kit.catalog) return false
      const currentCode = normalizeCatalog(kit.catalog)
      return currentCode === previousCode || currentCode.startsWith(previousCode) || previousCode.startsWith(currentCode)
    })
    if (match) {
      setSelectedAssayId(match.id)
      setKitName(match.manufacturer + ' — ' + match.name + (match.catalog ? ' (' + match.catalog + ')' : ''))
    }
  }, [selectedAssayId, selectedAssay, assayCatalog])

  function applyVaccineProduct(id: string) {
    setSelectedVaccineProductId(id)
    if (!id) {
      setVaccineName('')
      setBtt('')
      setBttSource('')
      setSelectedAssayId('')
      setKitName('')
      setMinimumSampleCount('23')
      setMinimumSampleCountSource('')
      setError('')
      return
    }
    const product = vaccineCatalog.find(item => item.id === id)
    if (!product) { setError('محصول انتخاب‌شده در بانک مرجع پیدا نشد.'); return }
    setVaccineName('')
    setBtt('')
    setBttSource('')
    setSelectedAssayId('')
    setKitName('')
    setMinimumSampleCount(String(product.deventer_minimum_sample_count || 23))
    setMinimumSampleCountSource(product.deventer_sample_size_basis || '')
    const linkedAssay = findBttAssayForProduct(product, assayCatalog)
    if (!linkedAssay) {
      setError('کیت مرجع متصل به BTT این محصول در بانک کیت‌ها پیدا نشد؛ محاسبه را با تطبیق دستی انجام ندهید.')
      return
    }
    setVaccineName(product.product_name + (product.market_code ? ' (' + product.market_code + ')' : ''))
    setBtt(product.breakthrough_titer || '')
    setBttSource([
      product.source_document,
      product.source_version,
      product.btt_definition,
      product.btt_reference_url,
    ].filter(Boolean).join(' · '))
    setSelectedAssayId(linkedAssay.id)
    setKitName(linkedAssay.manufacturer + ' — ' + linkedAssay.name + (linkedAssay.catalog ? ' (' + linkedAssay.catalog + ')' : ''))
    setError('')
  }

  const titers = useMemo(() => parseTiters(titersText), [titersText])
  const calculation = useMemo(() => {
    if (!kitName.trim() || !vaccineName.trim() || !btt || !halfLife || titers.length === 0) return { result: null, error: '' }
    if (!bttSource.trim() || !halfLifeSource.trim() || !correctionSource.trim()) return { result: null, error: 'منبع دقیق BTT، نیمه‌عمر و اصلاح سن نمونه‌گیری باید ثبت شود؛ بدون provenance خروجی محاسبه نمی‌شود.' }
    if (!minimumSampleCountSource.trim()) return { result: null, error: 'منبع حداقل تعداد نمونه باید از IFU یا برچسب همان محصول/کیت ثبت شود.' }
    if (selectedAssayId && (!selectedAssay || selectedAssay.status !== 'documented')) {
      return { result: null, error: 'این کیت فقط در سطح کاتالوگ/مستندات ناقص ثبت شده و تا دریافت IFU معتبر، مدل محاسباتی آن باز نمی‌شود.' }
    }
    if (selectedVaccineProductId && (!selectedVaccineProduct || selectedVaccineProduct.validation_status !== 'documented')) {
      return { result: null, error: 'برچسب محصول واکسن مستند و قابل استفاده برای محاسبه نیست.' }
    }
    if (selectedVaccineProduct && selectedVaccineProduct.btt_assay_kit_id !== selectedAssayId) {
      return { result: null, error: 'کیت انتخاب‌شده با کیت مرجع BTT این محصول یکسان نیست.' }
    }
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
          minimumSampleCountSource,
          titers,
        }),
        error: '',
      }
    } catch (cause) {
      return { result: null, error: cause instanceof Error ? cause.message : 'ورودی‌ها معتبر نیستند.' }
    }
  }, [samplingAge, btt, halfLife, susceptiblePercent, correctionDays, minimumSampleCount, minimumSampleCountSource, titers, kitName, vaccineName, bttSource, halfLifeSource, correctionSource, plateQcAccepted, randomSamplingConfirmed, pairingVerified, selectedAssayId, selectedAssay, selectedVaccineProductId, selectedVaccineProduct, assayCatalog])
  const result = calculation.result
  const calculationError = calculation.error
  const interpretation = useMemo(() => result ? interpretIbdResult({
    samplingAgeDays: Number(normalizeDigits(samplingAge)),
    breakthroughTiter: Number(normalizeDigits(btt)),
    halfLifeDays: Number(normalizeDigits(halfLife)),
    susceptiblePercent: Number(normalizeDigits(susceptiblePercent)),
    correctionDays: Number(normalizeDigits(correctionDays)),
    titers,
  }, result, { assay: kitName, vaccine: vaccineName, bttSource, halfLifeSource, correctionSource }) : null,
  [result, samplingAge, btt, halfLife, susceptiblePercent, correctionDays, titers, kitName, vaccineName, bttSource, halfLifeSource, correctionSource])
  const sensitivity = useMemo(() => {
    if (!result) return []
    try {
      return calculateIbdSensitivity({
        samplingAgeDays: Number(normalizeDigits(samplingAge)),
        breakthroughTiter: Number(normalizeDigits(btt)),
        halfLifeDays: Number(normalizeDigits(halfLife)),
        correctionDays: Number(normalizeDigits(correctionDays)),
        minimumSampleCount: Number(normalizeDigits(minimumSampleCount)),
        minimumSampleCountSource,
        titers,
        susceptiblePercent: Number(normalizeDigits(susceptiblePercent)),
      })
    } catch { return [] }
  }, [result, samplingAge, btt, halfLife, correctionDays, minimumSampleCount, minimumSampleCountSource, titers, susceptiblePercent])

  async function exportBackup() {
    try {
      const [flocks, modelRuns] = await Promise.all([listLocalFlocks(), listLocalModelRuns()])
      const backup = { ...createLocalBackup(), localFirst: { flocks, modelRuns } }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `adine-vaccine-backup-${new Date().toISOString().slice(0,10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تهیه پشتیبان کامل انجام نشد؛ پایگاه محلی را بررسی کنید.') }
  }

  async function importBackup(file?: File) {
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      restoreLocalBackup(parsed)
      if (parsed && typeof parsed === 'object' && 'localFirst' in parsed) {
        await importLocalFirstBackup((parsed as { localFirst: { flocks?: unknown[]; modelRuns?: unknown[] } }).localFirst)
      }
      setProfiles(readProfiles())
      setAnalyses(readAnalyses())
      void migrateLegacyLocalData().then(() => notifyLocalDataChanged()).catch(cause => setError(cause instanceof Error ? cause.message : 'انتقال پشتیبان به پایگاه محلی انجام نشد.'))
      setError('پشتیبان با موفقیت ادغام شد؛ داده‌های موجود حذف نشدند.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'بازیابی پشتیبان انجام نشد.') }
  }

  function saveProfile() {
    setError('')
    if (!flockName.trim() || !placementDate) {
      setError('نام گله و تاریخ جوجه‌ریزی را وارد کنید.')
      return
    }
    const existing = profiles.find(item => item.flockName.trim() === flockName.trim() && item.placementDate === placementDate)
    const record: SavedProfile = {
      id: existing?.id || crypto.randomUUID(),
      flockName: flockName.trim(),
      placementDate,
      savedAt: new Date().toISOString(),
    }
    const next = existing
      ? profiles.map(item => item.id === existing.id ? record : item)
      : [record, ...profiles]
    if (!writeLocalStorage(STORAGE_KEY, next)) { setError('ذخیره‌سازی مرورگر در دسترس نیست یا فضای آن کافی نیست. ابتدا از اطلاعات نسخه پشتیبان تهیه کنید.'); return }
    setProfiles(next)
    void saveProfileToLocal(record)
      .then(() => { notifyLocalDataChanged(); setError('') })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'ذخیره محلی پایدار انجام نشد؛ از فایل پشتیبان استفاده کنید.'))
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
      bttSource: bttSource.trim(),
      halfLifeSource: halfLifeSource.trim(),
      correctionSource: correctionSource.trim(),
      btt,
      halfLife,
      correctionDays,
      minimumSampleCount,
      minimumSampleCountSource,
      susceptiblePercent,
      titersText,
      estimatedVaccinationAgeDays: result.estimatedVaccinationAgeDays,
      percentileTiter: result.percentileTiter,
      percentileRank: result.percentileRank,
      sampleCount: result.sampleCount,
      warnings: result.warnings,
      plateQcAccepted,
      randomSamplingConfirmed,
      pairingVerified,
      assayKitId: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedAssayId) ? selectedAssayId : undefined,
      assaySource: selectedAssay?.source,
      assayStatus: selectedAssay?.status,
      assayNote: selectedAssay?.note,
      vaccineProductId: selectedVaccineProductId || undefined,
      vaccineMarketCode: selectedVaccineProduct?.market_code,
      vaccineLabelVersion: selectedVaccineProduct?.label_version,
      bttAssayKitId: selectedVaccineProduct?.btt_assay_kit_id,
      savedAt: new Date().toISOString(),
    }
    const next = [record, ...analyses].slice(0, 100)
    if (!writeLocalStorage(ANALYSIS_STORAGE_KEY, next)) { setError('ذخیره تحلیل انجام نشد؛ فضای ذخیره‌سازی مرورگر کافی نیست.'); return }
    setAnalyses(next)
    const matchingProfile = profiles.find(item => item.flockName.trim() === record.flockName && item.placementDate === record.placementDate)
    void saveAnalysisToLocal(record, matchingProfile?.id)
      .then(() => { notifyLocalDataChanged(); setError('') })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'ذخیره پایدار تحلیل در صف محلی انجام نشد.'))
  }

  function restoreAnalysis(item: SavedAnalysis) {
    setFlockName(item.flockName)
    setPlacementDate(item.placementDate)
    setSamplingAge(item.samplingAge)
    setKitName(item.kitName)
    setVaccineName(item.vaccineName)
    setBttSource(item.bttSource || '')
    setHalfLifeSource(item.halfLifeSource || '')
    setCorrectionSource(item.correctionSource || '')
    setBtt(item.btt)
    setHalfLife(item.halfLife)
    setCorrectionDays(item.correctionDays)
    setMinimumSampleCount(item.minimumSampleCount)
    setMinimumSampleCountSource(item.minimumSampleCountSource || '')
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
    void markLocalDeleted('model_runs', id)
      .then(() => notifyLocalDataChanged())
      .catch(cause => setError(cause instanceof Error ? cause.message : 'ثبت حذف در صف همگام‌سازی انجام نشد.'))
  }

  function removeProfile(id: string) {
    const profile = profiles.find(item => item.id === id)
    if (!profile) return
    const related = analyses.filter(item => item.flockName === profile.flockName && item.placementDate === profile.placementDate)
    if (related.length && !window.confirm('تحلیل‌های وابسته به این گله نیز حذف شوند؟')) return
    const nextProfiles = profiles.filter(item => item.id !== id)
    const nextAnalyses = analyses.filter(item => !related.some(run => run.id === item.id))
    if (!writeLocalStorage(STORAGE_KEY, nextProfiles) || !writeLocalStorage(ANALYSIS_STORAGE_KEY, nextAnalyses)) {
      setError('حذف کامل انجام نشد؛ ذخیره‌سازی مرورگر در دسترس نیست.')
      return
    }
    setProfiles(nextProfiles)
    setAnalyses(nextAnalyses)
    void (async () => {
      for (const run of related) await markLocalDeleted('model_runs', run.id)
      await markLocalDeleted('flocks', id)
      notifyLocalDataChanged()
    })().catch(cause => setError(cause instanceof Error ? cause.message : 'ثبت حذف در صف همگام‌سازی انجام نشد.'))
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

      <CloudSyncPanel />

      <section className="intro">
        <div>
          <span className="section-kicker">نسخه آزمایشی ۰.۲</span>
          <h2>تصمیم علمی، بر اساس داده واقعی گله</h2>
          <p>ثبت اطلاعات گله و بررسی اولیه زمان‌بندی واکسن گامبورو بر پایه تیتر آنتی‌بادی مادری.</p>
        </div>
        <div className="intro-symbol">IBD</div>
        <div className="backup-actions">
          <button className="button secondary" onClick={exportBackup}>خروجی پشتیبان JSON</button>
          <label className="button secondary">بازیابی پشتیبان
            <input type="file" accept="application/json,.json" hidden onChange={(e) => { void importBackup(e.target.files?.[0]); e.currentTarget.value = '' }} />
          </label>
        </div>
      </section>

      <div className="notice">
        <strong>توجه علمی:</strong> موتور گامبورو در این نسخه اولیه و در مرحله اعتبارسنجی است.
        خروجی فعلی صرفاً محاسبه مقدماتی Deventer-style است و تا زمان ثبت نسخه دقیق کیت،
        واکسن، BTT و تأیید پروتکل، نباید به‌عنوان برنامه قطعی واکسیناسیون استفاده شود.
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="step">۱</span><h3>اطلاعات گله</h3></div>
          <span className="muted">ذخیره محلی؛ همگام‌سازی پس از ورود</span>
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
          {catalogNotice && <p className="muted">{catalogNotice}</p>}
          <label>انتخاب محصول واکسن از بانک مرجع
            <select value={selectedVaccineProductId} onChange={(e) => applyVaccineProduct(e.target.value)}>
              <option value="">ورود دستی / محصول دیگر…</option>
              {vaccineCatalog.filter(product => product.disease_code === 'IBD').map(product => (
                <option key={product.id} value={product.id} disabled={product.validation_status !== 'documented'}>
                  {product.product_name} · {product.market_code || 'بازار نامشخص'} · {product.label_version || 'نسخه نامشخص'}{product.validation_status !== 'documented' ? ' · مستندات ناکامل' : ''}
                </option>
              ))}
            </select>
            {selectedVaccineProduct && <small>
              برچسب بازار {selectedVaccineProduct.market_code || 'نامشخص'}؛ ثبت {selectedVaccineProduct.registration_number || 'بدون شماره ثبت'}؛
              مسیر {selectedVaccineProduct.vaccine_route || 'نامشخص'}؛ حداقل سن {selectedVaccineProduct.vaccine_age_min_days || 'نامشخص'} روز.
              این برچسب فقط مربوط به بازار ثبت‌شده است و به معنی مجوز عرضه در ایران نیست.
            </small>}
          </label>
          <label>انتخاب کیت سرولوژی (بانک مرجع)
            <select value={selectedAssayId} disabled={Boolean(selectedVaccineProductId)} onChange={(e) => {
              const selected = assayCatalog.find(kit => kit.id === e.target.value)
              setSelectedAssayId(e.target.value)
              setKitName(selected ? selected.manufacturer + ' — ' + selected.name + (selected.catalog ? ' (' + selected.catalog + ')' : '') : '')
              setMinimumSampleCount(String(selected?.minimumSampleCount || 23))
              setMinimumSampleCountSource(selected?.minimumSampleCountSource || '')
            }}>
              <option value="">انتخاب کیت…</option>
              {assayCatalog.filter((kit) => kit.disease === 'IBD').map((kit) => (
                <option key={kit.id} value={kit.id}>
                  {kit.manufacturer} — {kit.name}{kit.catalog ? ' (' + kit.catalog + ')' : ''}{kit.status !== 'documented' ? ' · مستندات ناکامل' : ''}
                </option>
              ))}
            </select>
            <input value={kitName} readOnly={Boolean(selectedVaccineProductId)} onChange={(e) => { setKitName(e.target.value); setSelectedAssayId(''); setMinimumSampleCount('23'); setMinimumSampleCountSource('') }} placeholder="یا نام دقیق کیت دیگر را دستی وارد کنید" />
            <small>کیت‌های غیرمستند تا ثبت IFU و تطبیق روش/واحد، محاسبه را باز نمی‌کنند.</small>
          </label>
          <label>نام دقیق واکسن / محصول
            <input value={vaccineName} readOnly={Boolean(selectedVaccineProductId)} onChange={(e) => { setVaccineName(e.target.value); setSelectedVaccineProductId(''); setBtt(''); setBttSource('') }} placeholder="نام تجاری، سویه و نوع واکسن" />
          </label>
          <label>BTT محصول (تیتر)
            <input inputMode="decimal" value={btt} readOnly={Boolean(selectedVaccineProductId)} onChange={(e) => setBtt(e.target.value)} placeholder="فقط از بروشور همان محصول" />
            {selectedVaccineProduct && <small>{selectedVaccineProduct.btt_definition} · واحد: {selectedVaccineProduct.breakthrough_unit}</small>}
            {selectedVaccineProduct?.deventer_sample_size_basis && <small>حداقل نمونه محصول: {selectedVaccineProduct.deventer_minimum_sample_count} · {selectedVaccineProduct.deventer_sample_size_basis}</small>}
          </label>
          <label>منبع دقیق BTT (بروشور/نسخه/صفحه/واحد)
            <input value={bttSource} readOnly={Boolean(selectedVaccineProductId)} onChange={(e) => setBttSource(e.target.value)} placeholder="نام محصول، نسخه برچسب، صفحه و مقیاس ELISA" />
          </label>
          <label>نیمه‌عمر آنتی‌بادی (روز)
            <input inputMode="decimal" value={halfLife} onChange={(e) => setHalfLife(e.target.value)} placeholder="بر اساس داده معتبر همین گله/جمعیت" />
          </label>
          <label>منبع نیمه‌عمر (مطالعه/گله/نوع پرنده)
            <input value={halfLifeSource} onChange={(e) => setHalfLifeSource(e.target.value)} placeholder="مرجع دقیق و جمعیت مورد مطالعه" />
          </label>
          <label>منبع اصلاح ۰ تا ۴ روز
            <input value={correctionSource} onChange={(e) => setCorrectionSource(e.target.value)} placeholder="برچسب محصول یا پروتکل اعتبارسنجی‌شده؛ اگر اصلاح صفر است علت را بنویسید" />
          </label>
          <label>حداقل تعداد نمونه در این تحلیل
            <input inputMode="numeric" value={minimumSampleCount} readOnly={Boolean(selectedVaccineProductId)} onChange={(e) => { setMinimumSampleCount(e.target.value); setMinimumSampleCountSource('') }} />
          </label>
          <label>منبع حداقل تعداد نمونه (IFU/برچسب همان محصول یا کیت)
            <input value={minimumSampleCountSource} readOnly={Boolean(selectedVaccineProductId)} onChange={(e) => setMinimumSampleCountSource(e.target.value)} placeholder="مثلاً VMD 2026 section 8 یا BioChek RevB 2025" />
          </label>
          <label>اصلاح سن نمونه‌گیری (روز؛ مطابق بروشور)
            <input inputMode="decimal" value={correctionDays} onChange={(e) => setCorrectionDays(e.target.value)} />
          </label>
          <label>درصد هدف پرندگان پاسخ‌پذیر مستقیم در زمان واکسیناسیون (٪)
            <input inputMode="decimal" value={susceptiblePercent} onChange={(e) => setSusceptiblePercent(e.target.value)} />
            <small>پیش‌فرض ۵٪ در راهنمای Elanco برای حداقل سهم پرندگانِ پاسخ‌پذیر اولیه و با فرض انتشار افقی واکسن زنده مطرح شده است؛ مقدار ثابت جهانی نیست. در قفس، بستر، فشار بیماری و تصمیم واکسیناسیون چندمرحله‌ای باید جداگانه سناریوسازی شود.</small>
          </label>
        </div>
        <label className="wide-label">تیترهای انفرادی ELISA
          <textarea value={titersText} onChange={(e) => setTitersText(e.target.value)} rows={4} placeholder="تیترها را با فاصله یا ویرگول وارد کنید؛ مثال: 3200، 2800، 4100، 1900 ..." />
          <small>راهنمای BioChek RevB 2025 برای baseline/profile و پیش‌بینی زمان واکسن ۲۳ نمونه را پیشنهاد می‌کند؛ برچسب UK Avishield IBD Plus (Revised June 2026; AN 00716/2026) حداقل ۱۸ جوجه را ذکر می‌کند. این اعداد محصول/روش‌محورند، نه cutoff جهانی؛ منبع انتخاب را ثبت کنید. فقط تیتر عددی معتبر از یک کیت و یک روش واحد. OD، S/P و تیترهای کیت‌های متفاوت را مخلوط نکنید.</small>
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
              <strong>{result.estimatedVaccinationAgeDays === null ? '—' : toPersianDigits(result.estimatedVaccinationAgeDays.toFixed(1))}</strong>
              <span>{result.estimatedVaccinationAgeDays === null ? 'زمان قابل‌برآورد نیست؛ آستانه در سن نمونه‌گیری یا قبل از آن رسیده است' : 'روزگی تخمینی'}</span>
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
                {sensitivity.map((point) => <div key={point.susceptiblePercent}><small>{toPersianDigits(point.susceptiblePercent)}٪ پاسخ‌پذیر</small><strong>{point.vaccinationAgeDays === null ? 'قبلاً رسیده/غیرقابل‌برآورد' : `${toPersianDigits(point.vaccinationAgeDays.toFixed(1))} روز`}</strong><small>تیتر {toPersianDigits(point.selectedTiter)} · رتبه {toPersianDigits(point.selectedRank)}</small></div>)}
              </div>
            </div>
            {result.thresholdAlreadyReachedAtSampling && <p className="error">آستانه ممکن است در زمان نمونه‌گیری قبلاً حاصل شده باشد؛ این عدد را زمان آینده تلقی نکنید.</p>}
            <p>هشدارها: {result.warnings.join(' ')}</p>
            <p>این عدد زمان قطعی واکسیناسیون نیست. تا زمانی که نسخه دقیق کیت و محصول، BTT، مقیاس تیتر و نیمه‌عمر مستند و تأیید نشده‌اند، خروجی فقط محاسبه ریاضی مقدماتی است.</p>
            {interpretation && <section className="interpretation-panel">
              <h4>تفسیر آموزشی نتیجه</h4>
              <div className="interpretation-farmer"><b>توضیح قابل ارائه به مرغدار</b><p>{interpretation.farmer}</p></div>
              <div><b>منطق علمی و محاسبات</b><ul>{interpretation.veterinarian.map((line, i) => <li key={i}>{line}</li>)}</ul></div>
              <div><b>فرض‌های لازم</b><ul>{interpretation.assumptions.map((line, i) => <li key={i}>{line}</li>)}</ul></div>
              <div><b>محدودیت‌های تفسیر</b><ul>{interpretation.limitations.map((line, i) => <li key={i}>{line}</li>)}</ul></div>
              <div><b>اقدام بعدی</b><ul>{interpretation.nextActions.map((line, i) => <li key={i}>{line}</li>)}</ul></div>
            </section>}
          </div>
        ) : (
          <div className="empty-result">{calculationError || 'برای محاسبه، تیترهای انفرادی، BTT، نیمه‌عمر و منبع مستند هر پارامتر را وارد و کنترل‌های کیفیت را تأیید کنید.'}</div>
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
                <small>{toPersianDigits(formatJalaliDate(item.placementDate))} · {item.estimatedVaccinationAgeDays === null ? 'غیرقابل‌برآورد' : `${toPersianDigits(item.estimatedVaccinationAgeDays.toFixed(1))} روز`} · {toPersianDigits(item.sampleCount)} نمونه</small>
                <button className="link-button" onClick={() => restoreAnalysis(item)}>بارگذاری</button>
                <button className="link-button" onClick={() => removeAnalysis(item.id)}>حذف</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <DiseaseMonitoring profiles={profiles} />

      <section className="panel roadmap">
        <div className="panel-heading"><div><span className="step">۳</span><h3>مسیر توسعه موتورهای بیماری</h3></div></div>
        <div className="disease-grid">
          <div className="disease active"><b>گامبورو (IBD)</b><small>نسخه اولیه در حال اعتبارسنجی</small></div>
          <div className="disease"><b>نیوکاسل (ND)</b><small>HI monitor آزمایشی فعال · بدون ادعای حفاظت</small></div>
          <div className="disease"><b>برونشیت (IBV)</b><small>روند سرولوژی آزمایشی فعال · assay-specific</small></div>
          <div className="disease"><b>آنفلوانزا (AIV)</b><small>Evidence gate فعال · ارجاع surveillance</small></div>
        </div>
      </section>

      <footer>نسخه توسعه‌ای · ذخیره محلی گله و تحلیل‌ها · تاریخ‌های ورودی با تقویم شمسی</footer>
    </main>
  )
}