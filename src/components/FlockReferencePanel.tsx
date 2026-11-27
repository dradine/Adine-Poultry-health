import { useEffect, useState } from 'react'
import PersianDateInput from './PersianDateInput'
import { todayIsoDateInTimeZone } from '../core/zonedTime'
import { listLocalReferenceRecords, markLocalReferenceDeleted, notifyLocalDataChanged, saveLocalReferenceRecord, type LocalClinicalObservation, type LocalFlockTimeSeries, type LocalVaccinationEvent } from '../core/localFirstDb'
import { confirmStrictDeletion } from '../core/strictDelete'

type Props = { flockId?: string; flockName?: string }
const today = () => todayIsoDateInTimeZone('Asia/Tehran')
const fa = (value: number) => value.toLocaleString('fa-IR')

export default function FlockReferencePanel({ flockId, flockName }: Props) {
  const [events, setEvents] = useState<LocalVaccinationEvent[]>([])
  const [observations, setObservations] = useState<LocalClinicalObservation[]>([])
  const [series, setSeries] = useState<LocalFlockTimeSeries[]>([])
  const [event, setEvent] = useState({ date: today(), disease: 'IBD', product: '', platform: 'live', route: 'drinking-water', age: '', coverage: '', lot: '' })
  const [observation, setObservation] = useState({ date: today(), status: 'normal', signs: '', mortality: '', morbidity: '' })
  const [metric, setMetric] = useState({ date: today(), metric: 'water' as LocalFlockTimeSeries['metric'], value: '', unit: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function refresh() {
    if (!flockId) return
    const [nextEvents, nextObservations, nextSeries] = await Promise.all([
      listLocalReferenceRecords('flock_vaccination_events', flockId),
      listLocalReferenceRecords('flock_clinical_observations', flockId),
      listLocalReferenceRecords('flock_time_series', flockId),
    ])
    setEvents(nextEvents); setObservations(nextObservations); setSeries(nextSeries)
  }
  useEffect(() => { void refresh().catch(() => undefined) }, [flockId])
  async function deleteReference(entity: 'flock_vaccination_events' | 'flock_clinical_observations' | 'flock_time_series', id: string, label: string) {
    if (!confirmStrictDeletion(label + ' از پرونده گله «' + (flockName || 'گله') + '»')) return
    try {
      await markLocalReferenceDeleted(entity, id)
      await refresh()
      notifyLocalDataChanged()
      setMessage('رکورد از فهرست فعال حذف و حذف آن در صف همگام‌سازی ثبت شد.')
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'حذف رکورد ناموفق بود.')
    }
  }
  async function addEvent() {
    if (!flockId) return
    try {
      await saveLocalReferenceRecord('flock_vaccination_events', {
        id: crypto.randomUUID(), flock_id: flockId, event_date: event.date, age_days: event.age ? Number(event.age) : null,
        disease_code: event.disease, product_name: event.product.trim(), platform: event.platform, route: event.route,
        coverage_percent: event.coverage ? Number(event.coverage) : null, batch_lot: event.lot.trim() || null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
      setEvent(current => ({ ...current, product: '', age: '', coverage: '', lot: '' })); setMessage('رویداد واکسیناسیون در پرونده محلی ثبت شد.'); setError(''); await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'ثبت رویداد واکسن ناموفق بود.') }
  }
  async function addObservation() {
    if (!flockId) return
    try {
      await saveLocalReferenceRecord('flock_clinical_observations', {
        id: crypto.randomUUID(), flock_id: flockId, observed_at: observation.date, status: observation.status,
        signs: observation.signs.trim() || null, mortality_percent: observation.mortality ? Number(observation.mortality) : null,
        morbidity_percent: observation.morbidity ? Number(observation.morbidity) : null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
      setObservation(current => ({ ...current, signs: '', mortality: '', morbidity: '' })); setMessage('مشاهده بالینی در پرونده محلی ثبت شد.'); setError(''); await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'ثبت مشاهده بالینی ناموفق بود.') }
  }
  async function addMetric() {
    if (!flockId) return
    try {
      await saveLocalReferenceRecord('flock_time_series', {
        id: crypto.randomUUID(), flock_id: flockId, observed_at: metric.date, metric: metric.metric,
        value: Number(metric.value), unit: metric.unit.trim(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
      setMetric(current => ({ ...current, value: '', unit: '' })); setMessage('داده سری‌زمانی در پرونده محلی ثبت شد.'); setError(''); await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'ثبت داده سری‌زمانی ناموفق بود.') }
  }
  if (!flockId) return <section className="flock-reference-panel"><div className="flock-reference-empty">برای ثبت پرونده مرجع، ابتدا یک گله را انتخاب یا ذخیره کنید.</div></section>
  return <section className="flock-reference-panel" aria-label="پرونده مرجع گله">
    <div className="flock-reference-header"><div><span className="section-kicker">پرونده مستقل گله</span><h3>زمینه واکسن، بالین و عملکرد</h3><p>این اطلاعات جدا از تیتر آزمایش ذخیره می‌شوند تا تحلیل‌ها سابقه زمانی قابل ممیزی داشته باشند.</p></div><span className="flock-reference-count">{flockName || 'گله'} · {fa(events.length + observations.length + series.length)} رکورد</span></div>
    {message && <p className="reference-message">{message}</p>}{error && <p className="error">{error}</p>}
    <div className="reference-grid">
      <details className="reference-card" open><summary>ثبت رویداد واکسیناسیون</summary><div className="reference-form"><label>تاریخ<PersianDateInput value={event.date} onChange={date => setEvent({ ...event, date })} /></label><label>بیماری<select value={event.disease} onChange={e => setEvent({ ...event, disease: e.target.value })}><option value="IBD">IBD</option><option value="ND">ND</option><option value="IBV">IBV</option><option value="AIV">AIV</option></select></label><label>محصول<input value={event.product} onChange={e => setEvent({ ...event, product: e.target.value })} placeholder="نام دقیق محصول"/></label><label>پلتفرم<input value={event.platform} onChange={e => setEvent({ ...event, platform: e.target.value })}/></label><label>مسیر<input value={event.route} onChange={e => setEvent({ ...event, route: e.target.value })}/></label><label>سن روز<input inputMode="numeric" value={event.age} onChange={e => setEvent({ ...event, age: e.target.value })}/></label><label>پوشش ٪<input inputMode="decimal" value={event.coverage} onChange={e => setEvent({ ...event, coverage: e.target.value })}/></label><label>بچ / Lot<input value={event.lot} onChange={e => setEvent({ ...event, lot: e.target.value })}/></label></div><button className="button primary" onClick={() => void addEvent()} disabled={!event.product.trim()}>ثبت رویداد</button></details>
      <details className="reference-card"><summary>ثبت مشاهده بالینی</summary><div className="reference-form"><label>تاریخ<PersianDateInput value={observation.date} onChange={date => setObservation({ ...observation, date })} /></label><label>وضعیت<select value={observation.status} onChange={e => setObservation({ ...observation, status: e.target.value })}><option value="normal">طبیعی</option><option value="suspected">مشکوک</option><option value="confirmed">تأییدشده توسط آزمایش</option><option value="recovered">بهبود‌یافته</option></select></label><label>ابتلا ٪<input inputMode="decimal" value={observation.morbidity} onChange={e => setObservation({ ...observation, morbidity: e.target.value })}/></label><label>تلفات ٪<input inputMode="decimal" value={observation.mortality} onChange={e => setObservation({ ...observation, mortality: e.target.value })}/></label><label className="wide-label">علائم / توضیحات<textarea rows={2} value={observation.signs} onChange={e => setObservation({ ...observation, signs: e.target.value })}/></label></div><button className="button primary" onClick={() => void addObservation()}>ثبت مشاهده</button></details>
      <details className="reference-card"><summary>ثبت سری‌زمانی عملکردی</summary><div className="reference-form"><label>تاریخ<PersianDateInput value={metric.date} onChange={date => setMetric({ ...metric, date })} /></label><label>شاخص<select value={metric.metric} onChange={e => setMetric({ ...metric, metric: e.target.value as LocalFlockTimeSeries['metric'] })}><option value="water">آب</option><option value="feed">دان</option><option value="weight">وزن</option><option value="egg_production">تولید تخم‌مرغ</option><option value="mortality">تلفات</option><option value="temperature">دما</option><option value="humidity">رطوبت</option></select></label><label>مقدار<input inputMode="decimal" value={metric.value} onChange={e => setMetric({ ...metric, value: e.target.value })}/></label><label>واحد<input value={metric.unit} onChange={e => setMetric({ ...metric, unit: e.target.value })} placeholder="مثلاً لیتر/روز"/></label></div><button className="button primary" onClick={() => void addMetric()} disabled={!metric.value || !metric.unit.trim()}>ثبت داده</button></details>
    </div>
    <div className="reference-summary"><div><b>{fa(events.length)}</b><small>رویداد واکسن</small></div><div><b>{fa(observations.length)}</b><small>مشاهده بالینی</small></div><div><b>{fa(series.length)}</b><small>داده عملکردی</small></div></div>
    <div className="reference-records">
      <h4>سوابق ثبت‌شده و حذف هر رکورد</h4>
      {events.map(row => <div className="reference-record-row" key={row.id}><span>{fa(row.age_days || 0)} روز · {row.disease_code} · {row.product_name}</span><button type="button" className="link-button" onClick={() => void deleteReference('flock_vaccination_events', row.id, 'رویداد واکسن ' + row.product_name)}>حذف</button></div>)}
      {observations.map(row => <div className="reference-record-row" key={row.id}><span>{row.observed_at} · مشاهده بالینی · {row.status}</span><button type="button" className="link-button" onClick={() => void deleteReference('flock_clinical_observations', row.id, 'مشاهده بالینی ' + row.observed_at)}>حذف</button></div>)}
      {series.map(row => <div className="reference-record-row" key={row.id}><span>{row.observed_at} · {row.metric} · {fa(row.value)} {row.unit}</span><button type="button" className="link-button" onClick={() => void deleteReference('flock_time_series', row.id, 'داده عملکردی ' + row.observed_at)}>حذف</button></div>)}
      {!events.length && !observations.length && !series.length && <p className="muted">هنوز رکوردی در پرونده مرجع ثبت نشده است.</p>}
    </div>
  </section>
}
