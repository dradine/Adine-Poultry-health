import { useEffect, useState } from 'react'
import SerologyAdvancedAnalysis from './SerologyAdvancedAnalysis'
import SerologyClinicalInterpretation from './SerologyClinicalInterpretation'
import { ASSAY_CATALOG } from '../core/assayRegistry'
import { areComparableAssayRounds } from '../core/serologyStats'
import { listLocalFlocks, listLocalModelRuns, listLocalReferenceRecords, type LocalFlock, type LocalModelRun, type LocalVaccinationEvent, type LocalClinicalObservation, type LocalFlockTimeSeries } from '../core/localFirstDb'
type O=Record<string,unknown>
const f=(v:unknown,d=2)=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('fa-IR',{maximumFractionDigits:d}):'—'
const s=(o:O,k:string)=>typeof o[k]==='string'?String(o[k]):''
const ns=(v:unknown)=>Array.isArray(v)?v.filter((x):x is number=>typeof x==='number'&&Number.isFinite(x)):[]
const date=(v:string)=>v?new Date(v+'T12:00:00').toLocaleDateString('fa-IR'):'—'
const avg=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0
const sd=(a:number[])=>a.length>1?Math.sqrt(a.reduce((z,x)=>z+(x-avg(a))**2,0)/(a.length-1)):0
const q=(a:number[],p:number)=>{if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y),i=(b.length-1)*p,l=Math.floor(i);return b[l]+(b[Math.ceil(i)]-b[l])*(i-l)}
const disease=(v:string)=>({IBD:'گامبورو (IBD)',ND:'نیوکاسل (ND)',IBV:'برونشیت عفونی (IBV)',AIV:'آنفلوانزا (AIV)'} as Record<string,string>)[v]||v
function Metric({title,value,sub}:{title:string;value:string;sub?:string}){return <div className="srs-metric"><small>{title}</small><b>{value}</b>{sub&&<span>{sub}</span>}</div>}
function Histogram({v}:{v:number[]}){if(!v.length)return null;const lo=Math.min(...v),hi=Math.max(...v),span=hi-lo||1,n=Math.min(8,Math.max(3,Math.ceil(Math.sqrt(v.length)))),bins=Array.from({length:n},()=>0);v.forEach(x=>bins[Math.min(n-1,Math.floor((x-lo)/span*n))]++);const peak=Math.max(...bins,1);return <svg className="srs-chart" viewBox="0 0 520 190" role="img" aria-label="هیستوگرام"><line x1="35" y1="155" x2="505" y2="155" stroke="currentColor" opacity=".3"/>{bins.map((c,i)=>{const w=440/n-5,h=120*c/peak;return <g key={i}><rect x={42+i*440/n} y={155-h} width={w} height={h} rx="4" fill="#287b55"/><text x={42+i*440/n+w/2} y={174} textAnchor="middle" fontSize="10" fill="currentColor">{f(lo+(i+.5)*span/n,0)}</text><text x={42+i*440/n+w/2} y={148-h} textAnchor="middle" fontSize="10" fill="currentColor">{c}</text></g>})}<text x="260" y="188" textAnchor="middle" fontSize="10" fill="currentColor">مقدار آزمون · فراوانی نمونه‌ها</text></svg>}
function Violin({v}:{v:number[]}){if(v.length<2)return null;const lo=Math.min(...v),hi=Math.max(...v),span=hi-lo||1,sigma=sd(v),h=Math.max(sigma?1.06*sigma*Math.pow(v.length,-.2):0,span/30,1e-6),samples=Array.from({length:64},(_,i)=>lo-span*.08+(span*1.16*i/63)),density=samples.map(x=>v.reduce((sum,z)=>sum+Math.exp(-.5*((x-z)/h)**2),0)/(v.length*h*Math.sqrt(2*Math.PI))),peak=Math.max(...density,1e-12),points=samples.map((x,i)=>({x:35+(x-lo)/span*450,w:3+density[i]/peak*42})),upper=points.map(p=>p.x+','+(65-p.w)),lower=[...points].reverse().map(p=>p.x+','+(65+p.w));return <svg className="srs-chart" viewBox="0 0 520 145" role="img" aria-label="نمودار چگالی ویولن"><line x1="35" y1="65" x2="485" y2="65" stroke="currentColor" opacity=".25"/><path d={'M'+upper.join(' L')+' L'+lower.join(' L')+' Z'} fill="#9bc8ad" fillOpacity=".65" stroke="#287b55" strokeWidth="1.5"/><line x1={35+(q(v,.5)-lo)/span*450} x2={35+(q(v,.5)-lo)/span*450} y1="25" y2="105" stroke="#174d35" strokeWidth="2.5"/><text x="260" y="132" textAnchor="middle" fontSize="10" fill="currentColor">مقدار نتیجه · پهنای شکل نشان‌دهنده چگالی نسبی است</text></svg>}
function BoxPlot({v}:{v:number[]}){if(!v.length)return null;const lo=Math.min(...v),hi=Math.max(...v),span=hi-lo||1,x=(z:number)=>35+(z-lo)/span*450,a=q(v,.25),m=q(v,.5),b=q(v,.75),iq=b-a,lf=Math.max(lo,a-1.5*iq),uf=Math.min(hi,b+1.5*iq);return <svg className="srs-chart" viewBox="0 0 520 130" role="img" aria-label="نمودار جعبه‌ای"><line x1={x(lo)} x2={x(hi)} y1="55" y2="55" stroke="currentColor" opacity=".3"/><line x1={x(lf)} x2={x(a)} y1="55" y2="55" stroke="#287b55" strokeWidth="2"/><line x1={x(b)} x2={x(uf)} y1="55" y2="55" stroke="#287b55" strokeWidth="2"/><rect x={x(a)} y="30" width={Math.max(2,x(b)-x(a))} height="50" rx="4" fill="#dceee3" stroke="#287b55"/><line x1={x(m)} x2={x(m)} y1="28" y2="82" stroke="#174d35" strokeWidth="3"/>{v.filter(z=>z<lf||z>uf).map((z,i)=><circle key={i} cx={x(z)} cy={55+(i%3-1)*9} r="4" fill="#c47a28"/>)}{[lo,a,m,b,hi].map((z,i)=><text key={i} x={x(z)} y="103" textAnchor="middle" fontSize="10" fill="currentColor">{f(z)}</text>)}</svg>}
function Ecdf({v}:{v:number[]}){if(!v.length)return null;const a=[...v].sort((x,y)=>x-y),lo=a[0],hi=a[a.length-1],span=hi-lo||1,x=(z:number)=>40+(z-lo)/span*440,y=(p:number)=>130-p*100;const pts:string[]=['40,130'];a.forEach((z,i)=>{pts.push(x(z)+','+y(i/a.length));pts.push(x(z)+','+y((i+1)/a.length))});return <svg className="srs-chart" viewBox="0 0 520 165" role="img" aria-label="تابع توزیع تجمعی تجربی"><line x1="40" y1="130" x2="490" y2="130" stroke="currentColor" opacity=".35"/><line x1="40" y1="25" x2="40" y2="130" stroke="currentColor" opacity=".35"/><polyline points={pts.join(' ')} fill="none" stroke="#287b55" strokeWidth="2.5"/>{[0,25,50,75,100].map(p=><g key={p}><line x1="36" x2="490" y1={y(p/100)} y2={y(p/100)} stroke="currentColor" opacity=".08"/><text x="30" y={y(p/100)+3} textAnchor="end" fontSize="9" fill="currentColor">{p}٪</text></g>)}<text x="260" y="158" textAnchor="middle" fontSize="10" fill="currentColor">مقدار نتیجه · درصد تجمعی</text></svg>}
type TimelineEvent = {
 id:string; date:string; ageDays:number|null; disease:string; product:string; platform:string;
 strain:string; route:string; dose:string; coveragePercent:number|null; administrationQuality:string;
 batch:string; notes:string; synthetic:boolean;
}
function dbTimelineEvent(e:LocalVaccinationEvent):TimelineEvent {
 return {
  id:e.id,date:e.event_date,ageDays:e.age_days??null,disease:e.disease_code,product:e.product_name,
  platform:e.platform,strain:e.strain||'',route:e.route,dose:e.dose||'',
  coveragePercent:e.coverage_percent??null,administrationQuality:e.administration_quality||'unknown',
  batch:e.batch_lot||'',notes:e.notes||'',
  synthetic:Boolean((e.source_reference||'').toLowerCase().includes('simulated')||(e.batch_lot||'').toUpperCase().includes('SYNTHETIC')),
 }
}
function snapshotTimelineEvents(runs:LocalModelRun[]):TimelineEvent[] {
 return runs.flatMap(r=>{
  const i=r.input_snapshot as O
  return Array.isArray(i.vaccinationEvents)?(i.vaccinationEvents as O[]).filter(e=>e&&typeof e==='object').map((e,k)=>({
   id:String(e.id||r.id+'-'+k),date:s(e,'date'),ageDays:typeof e.ageDays==='number'?e.ageDays:null,
   disease:s(e,'disease'),product:s(e,'product'),platform:s(e,'platform'),strain:s(e,'strain'),
   route:s(e,'route'),dose:s(e,'dose'),coveragePercent:typeof e.coveragePercent==='number'?e.coveragePercent:null,
   administrationQuality:s(e,'administrationQuality')||'unknown',batch:s(e,'batch'),notes:s(e,'notes'),
   synthetic:i.demo===true||i.synthetic===true,
  })): []
 })
}
function mergeTimelineEvents(dbEvents:LocalVaccinationEvent[],runs:LocalModelRun[]):TimelineEvent[] {
 const all=[...dbEvents.map(dbTimelineEvent),...snapshotTimelineEvents(runs)]
 return [...new Map(all.filter(e=>e.date||e.product).map(e=>[
  [e.date,e.disease,e.product,e.strain,e.route].join('|'),e
 ])).values()].sort((a,b)=>a.date.localeCompare(b.date))
}
function Trend({runs,selected,vaccinationEvents}:{runs:LocalModelRun[];selected:LocalModelRun;vaccinationEvents:LocalVaccinationEvent[]}) {
 const x=selected.input_snapshot as O
 const rs=runs.filter(r=>areComparableAssayRounds(
  {flockId:r.flock_id,diseaseCode:r.disease_code,input:r.input_snapshot},
  {flockId:selected.flock_id,diseaseCode:selected.disease_code,input:x}
 )).sort((a,b)=>String((a.input_snapshot as O).samplingDate).localeCompare(String((b.input_snapshot as O).samplingDate)))
 const events=mergeTimelineEvents(vaccinationEvents,runs.filter(r=>r.flock_id===selected.flock_id))
 const demoPair=rs.length>0&&rs.every(r=>(r.input_snapshot as O).demo===true&&(r.input_snapshot as O).demoVersion===x.demoVersion)
 const stats=rs.map(r=>{
  const i=r.input_snapshot as O,o=r.output_snapshot as O,values=ns(i.titers),m=avg(values),v=sd(values)
  const cv=typeof o.cvPercent==='number'?o.cvPercent:(m>0?v/m*100:null)
  const trend=Number(o.trendValue??o.log2Mean??o.arithmeticMean??m)
  return {run:r,date:s(i,'samplingDate'),age:Number(i.samplingAgeDays),n:values.length||Number(o.n||0),
   mean:Number(o.arithmeticMean??m),sd:Number(o.sampleSd??v),cv, gmt:typeof o.gmt==='number'?o.gmt:(typeof o.geometricMean==='number'?o.geometricMean:null),trend}
 })
 const validCv=stats.filter(z=>typeof z.cv==='number'&&Number.isFinite(z.cv))
 const cvLo=Math.min(...validCv.map(z=>z.cv as number)),cvHi=Math.max(...validCv.map(z=>z.cv as number)),cvSpan=cvHi-cvLo||1
 const cvPoints=validCv.map((z,k)=>({x:40+k*440/Math.max(1,validCv.length-1),y:125-((z.cv as number)-cvLo)/cvSpan*90}))
 const vals=stats.map(z=>z.trend),lo=Math.min(...vals),hi=Math.max(...vals),span=hi-lo||1
 const points=stats.map((z,k)=>({x:40+k*440/Math.max(1,stats.length-1),y:125-(z.trend-lo)/span*90}))
 const diseaseName=(v:string)=>({ND:'نیوکاسل',AIV:'آنفلوانزا',IBV:'برونشیت',IBD:'گامبورو'} as Record<string,string>)[v]||v
 return <div className="trend-context">
  <section className="srs-chart-card">
   <h4>روند توصیفی نوبت‌های هم‌آزمون</h4>
   {rs.length>=2?<>
    {demoPair&&<p className="srs-demo">این روند فقط برای داده‌های شبیه‌سازی‌شده همین مجموعه آموزشی مجاز شده است؛ مقایسه با داده واقعی یا استنباط بالینی مجاز نیست.</p>}
    <svg className="srs-chart" viewBox="0 0 520 165" role="img" aria-label="روند تیترها در نوبت‌های هم‌آزمون">
     <polyline points={points.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#287b55" strokeWidth="3"/>
     {points.map((p,k)=><g key={stats[k].run.id}><circle cx={p.x} cy={p.y} r="5" fill="#287b55"/><text x={p.x} y={p.y-10} textAnchor="middle" fontSize="10" fill="currentColor">{f(stats[k].trend)}</text><text x={p.x} y="151" textAnchor="middle" fontSize="9" fill="currentColor">{date(stats[k].date)}</text></g>)}
    </svg>
    <p className="srs-note">مقیاس روند از snapshot هر نوبت گرفته می‌شود (log₂ برای تیترهای ratio-scale یا میانگین حسابی برای مقیاس‌های دیگر). روند توصیفی به‌تنهایی اثر واکسن، حفاظت یا علت تغییر تیتر را اثبات نمی‌کند.</p>
   </>:<p className="srs-note">برای رسم روند تیتر، حداقل دو نوبت با همان گله، بیماری، روش، کیت، آنتی‌ژن، واحد، مقیاس و مشخصات فنی لازم است. QC مردود یا داده‌های غیرقابل‌مقایسه از نمودار کنار گذاشته می‌شوند.</p>}
  </section>
  <section className="srs-chart-card">
   <h4>روند CV بین نوبت‌ها</h4>
   {validCv.length>=2?<svg className="srs-chart" viewBox="0 0 520 165" role="img" aria-label="روند CV بین نوبت‌ها">
    <polyline points={cvPoints.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#b77928" strokeWidth="3"/>
    {cvPoints.map((p,k)=><g key={k}><circle cx={p.x} cy={p.y} r="5" fill="#b77928"/><text x={p.x} y={p.y-10} textAnchor="middle" fontSize="10" fill="currentColor">{f(validCv[k].cv as number)}٪</text><text x={p.x} y="151" textAnchor="middle" fontSize="9" fill="currentColor">{date(validCv[k].date)}</text></g>)}
   </svg>:<p className="srs-note">برای نمودار CV حداقل دو نوبت قابل‌مقایسه لازم است.</p>}
  </section>
  <section className="srs-chart-card">
   <h4>جدول آماری روند</h4>
   {stats.length?<div className="srs-table-wrap"><table className="srs-table"><thead><tr><th>تاریخ نمونه</th><th>سن</th><th>n</th><th>میانگین</th><th>SD</th><th>CV٪</th><th>GMT</th></tr></thead><tbody>{stats.map(z=><tr key={z.run.id}><td>{date(z.date)}</td><td>{f(z.age,0)}</td><td>{f(z.n,0)}</td><td>{f(z.mean)}</td><td>{f(z.sd)}</td><td>{z.cv===null?'—':f(z.cv)+'٪'}</td><td>{z.gmt===null?'—':f(z.gmt)}</td></tr>)}</tbody></table></div>:<p className="srs-note">هنوز دو نوبت هم‌آزمون برای جدول روند موجود نیست.</p>}
  </section>
  <section className="srs-chart-card">
   <h4>خط زمانی واکسیناسیون گله · {events.length} رویداد</h4>
   {events.length?<div className="context-timeline">{events.map((e,k)=><article key={e.id||k}>
    <span className="context-date">{e.date?date(e.date):'تاریخ نامشخص'}{e.ageDays!==null?' · روز '+f(e.ageDays,0):''}</span>
    <div><b>{diseaseName(e.disease)} · {e.product||'محصول ثبت نشده'}</b><p>{[e.platform,e.strain,e.route,e.dose].filter(Boolean).join(' · ')}</p>{e.synthetic&&<small>رویداد فرضی / شبیه‌سازی‌شده</small>}</div>
   </article>)}</div>:<p className="srs-note">رویداد واکسیناسیون ساختاریافته‌ای برای این گله ثبت نشده است.</p>}
  </section>
 </div>
}

function ReferenceMetricChart({rows,metric,label}:{rows:LocalFlockTimeSeries[];metric:LocalFlockTimeSeries['metric'];label:string}) {
 const values=rows.filter(x=>x.metric===metric).sort((a,b)=>a.observed_at.localeCompare(b.observed_at))
 if(values.length<2)return null
 const lo=Math.min(...values.map(x=>x.value)),hi=Math.max(...values.map(x=>x.value)),span=hi-lo||1
 const pts=values.map((x,k)=>({x:35+k*450/Math.max(1,values.length-1),y:112-(x.value-lo)/span*82}))
 return <section className="srs-chart-card"><h5>{label}</h5><svg className="srs-chart" viewBox="0 0 520 145" role="img" aria-label={label}>
  <polyline points={pts.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#287b55" strokeWidth="3"/>
  {pts.map((p,k)=><g key={values[k].id}><circle cx={p.x} cy={p.y} r="4" fill="#287b55"/><text x={p.x} y={p.y-9} textAnchor="middle" fontSize="10" fill="currentColor">{f(values[k].value)}</text><text x={p.x} y="135" textAnchor="middle" fontSize="9" fill="currentColor">{date(values[k].observed_at.slice(0,10))}</text></g>)}
 </svg><p className="srs-note">واحد: {values[0].unit} · فقط داده‌های ثبت‌شده تا تاریخ نمونه‌گیری</p></section>
}
function FlockContext({run,vaccinationEvents,relatedRuns,flock}:{run:LocalModelRun;vaccinationEvents:LocalVaccinationEvent[];relatedRuns:LocalModelRun[];flock:LocalFlock|undefined}) {
 const i=run.input_snapshot as O
 const [clinicalRecords,setClinicalRecords]=useState<LocalClinicalObservation[]>([])
 const [timeSeries,setTimeSeries]=useState<LocalFlockTimeSeries[]>([])
 useEffect(()=>{
  let active=true
  const load=async()=>{
   const [observations,series]=await Promise.all([
    listLocalReferenceRecords('flock_clinical_observations',run.flock_id),
    listLocalReferenceRecords('flock_time_series',run.flock_id),
   ])
   if(active){setClinicalRecords(observations);setTimeSeries(series)}
  }
  void load().catch(()=>{if(active){setClinicalRecords([]);setTimeSeries([])}})
  const refresh=()=>void load().catch(()=>undefined)
  window.addEventListener('adine-cloud-data-updated',refresh)
  window.addEventListener('adine-local-data-changed',refresh)
  return()=>{active=false;window.removeEventListener('adine-cloud-data-updated',refresh);window.removeEventListener('adine-local-data-changed',refresh)}
 },[run.flock_id])
 const embedded=snapshotTimelineEvents([run])
 const events=[...new Map([...vaccinationEvents.map(dbTimelineEvent),...embedded].map(e=>[[e.date,e.disease,e.product,e.strain,e.route].join('|'),e])).values()].sort((a,b)=>a.date.localeCompare(b.date))
 const ibdRun=relatedRuns.filter(x=>x.flock_id===run.flock_id&&x.disease_code==='IBD'&&x.model_family==='deventer-live-conventional').sort((a,b)=>b.created_at.localeCompare(a.created_at))[0]
 const ibdOutput=(ibdRun?.output_snapshot||{}) as O
 const ibdAgeRaw=ibdOutput.labelConstrainedVaccinationAgeDays??ibdOutput.estimatedVaccinationAgeDays
 const ibdAge=typeof ibdAgeRaw==='number'&&Number.isFinite(ibdAgeRaw)&&ibdAgeRaw>=0&&ibdAgeRaw<=500?ibdAgeRaw:null
 const ibdDate=ibdAge!==null&&flock?.hatch_date&&/^\d{4}-\d{2}-\d{2}$/.test(flock.hatch_date)?new Date(Date.parse(flock.hatch_date+'T00:00:00Z')+ibdAge*86400000).toISOString().slice(0,10):''
 const sampleDate=s(i,'samplingDate')
 const observation=clinicalRecords.filter(x=>x.observed_at.slice(0,10)<=sampleDate).sort((a,b)=>b.observed_at.localeCompare(a.observed_at))[0]
 const snapshot=i.clinicalContext&&typeof i.clinicalContext==='object'?i.clinicalContext as O:{}
 const hasSnapshot=(key:string)=>snapshot[key]!==undefined&&snapshot[key]!==null&&String(snapshot[key]).trim()!==''&&!(key==='status'&&snapshot[key]==='unknown')
 const pick=(key:string,fallback:unknown)=>hasSnapshot(key)?snapshot[key]:fallback
 const statusLabel=(v:unknown)=>({normal:'طبیعی / بدون علامت گزارش‌شده',suspected:'مشکوک',confirmed:'تأییدشده با آزمایش',recovered:'بهبودیافته','training-only':'سناریوی آموزشی؛ مشاهده واقعی ثبت نشده',problem:'افت عملکرد / مشکل گله',clinical:'دارای علائم بالینی',recovering:'در حال بهبود',unknown:'ثبت نشده'} as Record<string,string>)[String(v)]||String(v??'ثبت نشده')
 const label=(v:string)=>({ND:'نیوکاسل',AIV:'آنفلوانزا',IBV:'برونشیت',IBD:'گامبورو',other:'سایر'} as Record<string,string>)[v]||v
 const platform=(v:string)=>({'live-conventional':'زنده متعارف',inactivated:'غیرفعال/کشته','immune-complex':'ایمنی‌کمپلکس','recombinant-vector':'وکتور نوترکیب',unknown:'نامشخص',other:'سایر'} as Record<string,string>)[v]||v
 const fields:[string,unknown][]=[
  ['وضعیت گله',hasSnapshot('status')?statusLabel(snapshot.status):observation?statusLabel(observation.status):''],
  ['تاریخ آخرین مشاهده بالینی تا زمان نمونه‌گیری',observation?.observed_at?.slice(0,10)||''],
  ['شروع علائم',pick('onsetDate','')],['علائم',pick('signs',observation?.signs||'')],
  ['درصد ابتلا',pick('morbidityPercent',observation?.morbidity_percent==null?'':observation.morbidity_percent+'٪')],
  ['تلفات تجمعی',pick('mortalityPercent',observation?.mortality_percent==null?'':observation.mortality_percent+'٪')],
  ['روند تلفات',pick('mortalityTrend',observation?.mortality_trend||'')],
  ['مصرف دان',pick('feedIntake',observation?.feed_intake||'')],
  ['مصرف آب',pick('waterIntake',observation?.water_intake||'')],
  ['تغییر عملکرد',pick('productionChange',observation?.production_change||'')],
  ['ریسک مواجهه',pick('exposureRisks',observation?.exposure_risks||'')],
  ['سیر بالینی',pick('clinicalCourse',observation?.clinical_course||'')],
  ['کالبدگشایی',pick('necropsy',observation?.necropsy||'')],
  ['آزمون مستقیم',pick('directTests',observation?.direct_tests||'')],
  ['داروها / مداخلات',pick('medications',observation?.medications||'')],
  ['توضیحات سالن/اپیدمیولوژی',pick('houseNotes',observation?.notes||'')],
 ]
 const referenceSeries=timeSeries.filter(x=>x.observed_at.slice(0,10)<=sampleDate).sort((a,b)=>a.observed_at.localeCompare(b.observed_at))
 const latestByMetric=new Map<string,LocalFlockTimeSeries>()
 referenceSeries.forEach(x=>latestByMetric.set(x.metric,x))
 const metricNames:Record<string,string>={weight:'وزن بدن',feed:'مصرف دان',water:'مصرف آب',mortality:'تلفات',egg_production:'تولید تخم‌مرغ',temperature:'دما',humidity:'رطوبت'}
 const syntheticObservation=Boolean(observation?.source_reference?.toLowerCase().includes('simulated'))
 const syntheticSeries=referenceSeries.some(x=>x.source_reference?.toLowerCase().includes('simulated'))
 return <div className="flock-context-report">
  <section><h4>خط زمانی واکسیناسیون · {events.length} رویداد ثبت‌شده</h4>
   {events.length?<div className="context-timeline">{events.map((e,k)=><article key={e.id||k}>
    <span className="context-date">{e.date?date(e.date):'تاریخ نامشخص'}{e.ageDays!==null?' · روز '+f(e.ageDays,0):''}</span>
    <div><b>{label(e.disease)} · {e.product||'محصول ثبت نشده'}</b><p>{[platform(e.platform),e.strain,e.route,e.dose?'دوز '+e.dose:'',e.batch?'بچ '+e.batch:'',e.coveragePercent===null?'':'پوشش '+String(e.coveragePercent)+'٪'].filter(Boolean).join(' · ')||'جزئیات تکمیلی ثبت نشده'}</p>
     {e.synthetic&&<small>سناریوی فرضی آموزشی؛ سابقه واقعی فارم نیست.</small>}
     {!e.synthetic&&e.administrationQuality!=='unknown'&&<small>کیفیت اجرا: {e.administrationQuality}</small>}
     {e.notes&&<p>{e.notes}</p>}
    </div>
   </article>)}</div>:<p className="srs-note">تاریخچه ساختاریافته واکسیناسیون برای این گله ثبت نشده است.</p>}
  </section>
  <section><h4>وضعیت زمان‌بندی واکسیناسیون</h4>
   {i.demo===true?<p className="srs-note">این پرونده آموزشی است. رویدادهای بالا فقط برای آزمایش خط زمانی ساخته شده‌اند؛ هیچ تاریخ واکسن بعدی به‌عنوان توصیه دامپزشکی محاسبه نمی‌شود.</p>:
    <><div className="context-clinical-grid"><article><small>گامبورو (IBD)</small><b>{ibdRun&&ibdAge!==null?'سن برآوردی مدل: '+f(ibdAge,0)+' روزگی':'هنوز برآورد قابل نمایش ثبت نشده'}</b>{ibdDate&&<span>تاریخ تقویمی متناظر با تاریخ هچ: {date(ibdDate)}</span>}{ibdRun&&<small>وضعیت: {String(ibdOutput.timingStatus||ibdRun.decision_status||'نیازمند بازبینی دامپزشک')}</small>}</article>
     <article><small>نیوکاسل، برونشیت و آنفلوانزا</small><b>تاریخ خودکار تعیین نشده</b><span>این گزارش سرولوژی به‌تنهایی موتور معتبر تعیین روز واکسن برای این بیماری‌ها نیست.</span></article></div>
     <p className="srs-note">برآورد IBD فقط وقتی نمایش داده می‌شود که اجرای مدل اختصاصی Deventer برای همین گله ذخیره شده باشد. این مقدار تضمین حفاظت یا دستور قطعی نیست و باید با MDA واقعی، نمونه‌گیری نماینده، کیت/واحد منطبق با BTT، نسخه برچسب معتبر در بازار مربوط و حداقل سن محصول بازبینی شود. اگر تاریخ محاسبه‌شده گذشته باشد، آن را نوبت بعدی تلقی نکنید؛ مدل باید با داده تازه دوباره اجرا شود.</p></>}
  </section>
  <section><h4>وضعیت بالینی گله در زمان نمونه‌گیری</h4>
   <p className="srs-note">گزارش برای تاریخ {date(sampleDate)} تنظیم شده است؛ فقط آخرین مشاهده ثبت‌شده در همان تاریخ یا پیش از آن در این بخش استفاده می‌شود.</p>
   <div className="context-clinical-grid">{fields.filter(([,v])=>v!==undefined&&v!==null&&String(v).trim()!=='').map(([k,v])=><article key={k}><small>{k}</small><b>{String(v)}</b></article>)}</div>
   {fields.every(([,v])=>v===undefined||v===null||String(v).trim()==='')&&<p className="srs-note">برای این گله تا تاریخ نمونه‌گیری مشاهده بالینی ثبت نشده است؛ از اطلاعات آینده برای بازسازی گذشته استفاده نمی‌شود.</p>}
   {syntheticObservation&&<p className="srs-demo">این مشاهده از داده آموزشی شبیه‌سازی‌شده است؛ یافته بالینی واقعی محسوب نمی‌شود.</p>}
  </section>
  <section><h4>عملکرد کمی گله تا زمان نمونه‌گیری</h4>
   {latestByMetric.size?<div className="context-clinical-grid">{[...latestByMetric.values()].map(x=><article key={x.id}><small>{metricNames[x.metric]||x.metric}</small><b>{f(x.value)} {x.unit}</b><span>{date(x.observed_at.slice(0,10))} · {Math.max(0,Math.round((Date.parse(sampleDate+'T00:00:00Z')-Date.parse(x.observed_at.slice(0,10)+'T00:00:00Z'))/86400000))} روز پیش از نمونه‌گیری</span></article>)}</div>:<p className="srs-note">تا تاریخ نمونه‌گیری داده عددی عملکردی برای این گله ثبت نشده است.</p>}
   <div className="srs-chart-grid">
    <ReferenceMetricChart rows={referenceSeries} metric="weight" label="روند وزن بدن"/>
    <ReferenceMetricChart rows={referenceSeries} metric="feed" label="روند مصرف دان"/>
    <ReferenceMetricChart rows={referenceSeries} metric="water" label="روند مصرف آب"/>
    <ReferenceMetricChart rows={referenceSeries} metric="mortality" label="روند تلفات"/>
   </div>
   {syntheticSeries&&<p className="srs-demo">برخی یا همه نقاط عملکردی در این نمودارها شبیه‌سازی‌شده‌اند؛ برای ارزیابی فارم واقعی از آن‌ها استفاده نکنید.</p>}
  </section>
  <p className="srs-note">اطلاعات بالینی، عملکرد و کیفیت اجرای واکسن گزارش‌شده توسط فارم هستند و بدون مستندات مستقل تأیید نشده‌اند.</p>
 </div>
}
export default function SerologyReportStudio({initialRunId=''}:{initialRunId?:string}){const [runs,setRuns]=useState<LocalModelRun[]>([]),[allRuns,setAllRuns]=useState<LocalModelRun[]>([]),[flocks,setFlocks]=useState<LocalFlock[]>([]),[id,setId]=useState(initialRunId),[tab,setTab]=useState('summary'),[vaccinationEvents,setVaccinationEvents]=useState<LocalVaccinationEvent[]>([]);useEffect(()=>{let on=true;const load=async()=>{const [allRuns,allFlocks]=await Promise.all([listLocalModelRuns(),listLocalFlocks()]);const a=allRuns.filter(r=>r.model_family==='serology-longitudinal-round').sort((a,b)=>b.created_at.localeCompare(a.created_at));if(on){setRuns(a);setAllRuns(allRuns);setFlocks(allFlocks);setId(old=>a.some(r=>r.id===old)?old:(a[0]?.id||''))}};void load();const fn=()=>void load();window.addEventListener('adine-cloud-data-updated',fn);window.addEventListener('adine-local-data-changed',fn);return()=>{on=false;window.removeEventListener('adine-cloud-data-updated',fn);window.removeEventListener('adine-local-data-changed',fn)}},[]);const r=runs.find(x=>x.id===id);useEffect(()=>{let active=true;if(!r?.flock_id){setVaccinationEvents([]);return()=>{active=false}}void listLocalReferenceRecords('flock_vaccination_events',r.flock_id).then(rows=>{if(active)setVaccinationEvents(rows)}).catch(()=>{if(active)setVaccinationEvents([])});const onChange=()=>{void listLocalReferenceRecords('flock_vaccination_events',r.flock_id).then(rows=>{if(active)setVaccinationEvents(rows)}).catch(()=>undefined)};window.addEventListener('adine-cloud-data-updated',onChange);window.addEventListener('adine-local-data-changed',onChange);return()=>{active=false;window.removeEventListener('adine-cloud-data-updated',onChange);window.removeEventListener('adine-local-data-changed',onChange)}},[r?.flock_id]);const flock=flocks.find(x=>x.id===r?.flock_id),i=(r?.input_snapshot||{}) as O,o=(r?.output_snapshot||{}) as O,v=ns(i.titers),n=v.length,mean=avg(v),st=sd(v),q1=q(v,.25),q3=q(v,.75),iq=q3-q1,outs=v.filter(x=>x<q1-1.5*iq||x>q3+1.5*iq),isTitre=s(i,'scale')==='kit-titer'||s(i,'scale')==='hi-reciprocal',log2s=isTitre&&v.length>0&&v.every(x=>x>0)?v.map(Math.log2):[],gmt=log2s.length?2**avg(log2s):null,assay=ASSAY_CATALOG.find(a=>a.id===s(i,'assayId')),bioChekGuidance=(assay?.manufacturer==='BioChek'&&assay.status==='documented')||(!assay&&s(i,'kit').toLowerCase().includes('biochek')&&['CK113','CK116','CK119','CK121','CK401'].includes(s(i,'catalog').toUpperCase()));const importMeta=i.readerImportMeta&&typeof i.readerImportMeta==='object'?i.readerImportMeta as O:{},rawSampleRows=Array.isArray(importMeta.sampleRows)?importMeta.sampleRows as Record<string,string>[]:[],rawHeaders=Array.isArray(importMeta.headers)?importMeta.headers.map(String):[];const csv=()=>{const rows=[['Sample ID','Result','Unit','Date','Age'],...v.map((z,k)=>[String((i.sampleIds as unknown[]|undefined)?.[k]??('S'+(k+1))),String(z),s(i,'unit'),s(i,'samplingDate'),String(i.samplingAgeDays??'')])];const blob=new Blob(['\uFEFF'+rows.map(a=>a.map(z=>'"'+z.replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='adine-serology-samples.csv';a.click();URL.revokeObjectURL(url)};const rawCsv=()=>{const m=i.readerImportMeta&&typeof i.readerImportMeta==='object'?i.readerImportMeta as O:{},headers=Array.isArray(m.headers)?m.headers.map(String):[],rawRows=Array.isArray(m.rawRows)?m.rawRows as string[][]:[];if(!headers.length||!rawRows.length)return;const rows=[headers,...rawRows],blob=new Blob(['\uFEFF'+rows.map(a=>a.map(z=>'"'+String(z??'').replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='adine-reader-raw-table.csv';a.click();URL.revokeObjectURL(url)};return <section className="panel srs"><div className="panel-heading"><div><span className="step">تحلیل</span><h3>گزارش‌ساز تحلیلی سرولوژی</h3></div><span className="tag">نمای تخصصی</span></div>
<div className="srs-brand"><strong>مرکز تخصصی سلامت طیور آدینه</strong><span>دکتر سعید آدینه وند · گزارش تحلیلی پایش سرولوژی</span></div><p className="muted">نمای چندلایه نتایج، توزیع نمونه‌ها، روند و کیفیت داده؛ بدون ادغام مقیاس‌های ناهمسان.</p>{!r?<div className="empty-result">هنوز نوبت سرولوژی ثبت نشده است.</div>:<><div className="srs-selector"><label>انتخاب گزارش<select value={id} onChange={e=>setId(e.target.value)}>{runs.map(z=><option key={z.id} value={z.id}>{disease(z.disease_code)} · {s(z.input_snapshot as O,'kit')} · {date(s(z.input_snapshot as O,'samplingDate'))}</option>)}</select></label><b>{disease(r.disease_code)} · {s(i,'roundLabel')||'نوبت ثبت‌شده'}</b><span>{date(s(i,'samplingDate'))} · سن {f(i.samplingAgeDays)} روز · {s(i,'method')} · {s(i,'unit')}</span></div>{r&&<div className="srs-meta"><span>گله: {flock?.flock_name||r.flock_id}</span><span>نوع گله: {flock?.species||s(i,'population')||'ثبت نشده'}</span><span>تعداد پرنده: {flock?.bird_count?f(flock.bird_count,0):'ثبت نشده'}</span><span>محل/سالن: {flock?.location_label||'ثبت نشده'}</span><span>هدف نمونه‌گیری: {s(i,'samplingPurpose')||'ثبت نشده'}</span><span>واکسن: {s(i,'vaccine')||'ثبت نشده'}</span><span>تاریخ واکسن: {date(s(i,'vaccineDate'))}</span><span>سویه/پلتفرم: {s(i,'vaccineStrain')||'—'} / {s(i,'vaccinePlatform')||'—'}</span></div>}{(i.demo===true||s(i,'qcStatus')==='demo')&&<div className="srs-demo">داده شبیه‌سازی‌شده؛ نه نتیجه آزمایشگاهی، نه QC واقعی و نه مبنای تصمیم بالینی.</div>}<div className="srs-meta">{['kit','catalog','assayVersion','antigen','scale','kitLot','laboratory','readerModel','protocolVersion','population','samplingPurpose'].map(k=><span key={k}>{k}: {s(i,k)||'ثبت نشده'}</span>)}</div><nav className="srs-tabs">{[['summary','خلاصه'],['context','زمینه گله'],['interpretation','تفسیر تخصصی'],['distribution','توزیع'],['samples','داده‌های انفرادی'],['trend','روند'],['quality','QC و اعتبار'],['advanced','تحلیل آماری و مقایسه']].map(([k,l])=><button type="button" key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}</button>)}</nav>{tab==='context'&&<FlockContext run={r} vaccinationEvents={vaccinationEvents} relatedRuns={allRuns} flock={flock}/ >}{tab==='interpretation'&&<SerologyClinicalInterpretation run={r} flock={flock}/ >}{tab==='advanced'&&<SerologyAdvancedAnalysis run={r} runs={runs} flocks={flocks}/ >}{tab==='summary'&&<><div className="srs-metrics"><Metric title="تعداد نمونه" value={f(n,0)} sub={bioChekGuidance?(n<18?'کمتر از ۱۸؛ تفسیر کمی BioChek محدود است':n<23?'۱۸ تا ۲۲؛ کمتر از توصیه ۲۳ نمونه در راهنمای BioChek':'حجم نمونه با توصیه ۲۳ نمونه BioChek هم‌خوان است'):'حجم نمونه باید با هدف، واریانس و طرح نمونه‌گیری ارزیابی شود'}/><Metric title="میانگین حسابی" value={f(mean)} sub={s(i,'unit')}/><Metric title="میانه" value={f(q(v,.5))}/><Metric title="انحراف معیار نمونه" value={f(st)}/><Metric title="CV حسابی" value={f(mean?st/mean*100:0)+'٪'} sub="SD / AM × 100؛ مقیاس خام"/><Metric title="میانگین هندسی" value={gmt===null?'—':f(gmt)} sub="صرفاً مقادیر مثبت؛ معتبر فقط برای تیتر ratio-scale"/><Metric title="چارک اول / سوم" value={f(q1)+' / '+f(q3)}/><Metric title="IQR" value={f(iq)}/><Metric title="دامنه" value={f(Math.min(...v))+' – '+f(Math.max(...v))}/><Metric title="انحراف معیار log₂" value={isTitre&&o.log2Sd!=null?f(Number(o.log2Sd)):'برای این داده تعریف نشده'}/><Metric title="مقادیر پرچم‌دار IQR" value={f(outs.length,0)} sub="علامت آماری؛ حذف خودکار ممنوع"/><Metric title="BioChek VI" value={o.bioChekVI==null?'محاسبه نشده':f(Number(o.bioChekVI))} sub="فقط در صورت انطباق کیت و فرمول مستند"/></div><div className="srs-note">تفسیر اولیه: {bioChekGuidance?(n<18?'حجم نمونه کمتر از ۱۸ است و برای تفسیر کمی BioChek محدودیت دارد.':n<23?'حجم نمونه کمتر از ۲۳ نمونه توصیه‌شده در راهنمای BioChek است.':'حجم نمونه به توصیه ۲۳ نمونه BioChek رسیده؛ تصادفی‌بودن و پوشش سالن‌ها همچنان باید بررسی شود.'):'برای این آزمون آستانه عمومی BioChek اعمال نمی‌شود؛ حجم نمونه باید بر اساس هدف، پراکندگی و طرح نمونه‌گیری ارزیابی شود.'} {outs.length?'مقادیر پرچم‌دار ابتدا از نظر خطای ورود، کیفیت نمونه و علت زیستی بررسی شوند.':'مقدار خارج از دامنه ۱٫۵ برابر IQR دیده نشد.'}</div><div className="srs-actions"><button className="button secondary" onClick={csv}>خروجی CSV</button><button className="button secondary" onClick={()=>window.print()}>چاپ / PDF</button></div></>}{tab==='distribution'&&<><div className="srs-chart-card"><h4>هیستوگرام فراوانی</h4><Histogram v={v}/></div>{isTitre&&log2s.length>0&&<div className="srs-chart-card"><h4>توزیع تیتر در مقیاس لگاریتمی log₂</h4><Histogram v={log2s}/><BoxPlot v={log2s}/><small>برای تیترهای دوبرابری، مقیاس log₂ شکل توزیع و پراکندگی را خواناتر می‌کند؛ مقادیر خام در جدول نمونه‌ها حفظ شده‌اند.</small></div>}<div className="srs-chart-card"><h4>تابع توزیع تجمعی تجربی (ECDF)</h4><Ecdf v={v}/><small>برای هر مقدار، درصد نمونه‌هایی را نشان می‌دهد که نتیجه آن‌ها تا آن مقدار است.</small></div><div className="srs-chart-card"><h4>نمودار چگالی (Violin Plot)</h4><Violin v={v}/><small>پهنای هر بخش، تراکم نسبی نتایج را نشان می‌دهد؛ برای نمونه‌های کم، شکل چگالی صرفاً اکتشافی است.</small></div><div className="srs-chart-card"><h4>نمودار جعبه‌ای و نقاط پرت احتمالی</h4><BoxPlot v={v}/><small>نقاط نارنجی خارج از fences آماری Tukey هستند؛ این نقاط لزوماً خطا نیستند.</small></div><div className="srs-chart-card"><h4>نمودار نقطه‌ای نمونه‌ها</h4><div className="srs-dotplot">{v.map((z,k)=><span key={k} title={'نمونه '+(k+1)+': '+z} style={{left:((z-Math.min(...v))/(Math.max(...v)-Math.min(...v)||1)*96)+'%',top:(12+(k%5)*17)+'px'}}/>)}</div></div></>}{tab==='samples'&&<><div className="srs-table-wrap"><table className="srs-table"><thead><tr><th>ردیف</th><th>شناسه</th><th>نتیجه</th><th>واحد</th><th>پرچم آماری</th></tr></thead><tbody>{v.map((z,k)=><tr key={k}><td>{f(k+1,0)}</td><td>{String((i.sampleIds as unknown[]|undefined)?.[k]??('S'+(k+1)))}</td><td>{f(z)}</td><td>{s(i,'unit')}</td><td>{z<q1-1.5*iq||z>q3+1.5*iq?'بازبینی':'—'}</td></tr>)}</tbody></table></div>{rawSampleRows.length>0&&<details className="srs-raw-details"><summary>مشاهده ستون‌های خام هر نمونه · {f(rawSampleRows.length,0)} ردیف</summary><div className="srs-table-wrap"><table className="srs-table"><thead><tr>{rawHeaders.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rawSampleRows.map((row,k)=><tr key={k}>{rawHeaders.map(h=><td key={h}>{row[h]??''}</td>)}</tr>)}</tbody></table></div></details>}</>}{tab==='trend'&&<><h4>روند نوبت‌های هم‌شرایط</h4><Trend runs={runs} selected={r} vaccinationEvents={vaccinationEvents}/><FlockContext run={r} vaccinationEvents={vaccinationEvents} relatedRuns={allRuns} flock={flock}/></>}{tab==='quality'&&<><div className="srs-metrics"><Metric title="QC ثبت‌شده" value={i.rawFileImported===true?(s(i,'qcStatus')==='pass'?'قبول محاسبه‌شده':s(i,'qcStatus')==='fail'?'رد محاسبه‌شده':'در انتظار'):(s(i,'qcStatus')==='pass'?'قبول اظهاری':s(i,'qcStatus')||'نامشخص')}/><Metric title="شواهد QC" value={s(i,'qcEvidence')?'ثبت شده':'ثبت نشده'}/><Metric title="نسخه IFU" value={s(i,'assayVersion')||'ثبت نشده'}/><Metric title="Reader" value={s(i,'readerModel')||'ثبت نشده'}/><Metric title="پروتکل" value={s(i,'protocolVersion')||'ثبت نشده'}/></div><div className="srs-note">{i.rawFileImported===true?'QC این نوبت از ردیف‌های کنترل فایل خام و حدودی که کاربر از IFU وارد کرده محاسبه شده است. این محاسبه جایگزین اعتبارسنجی مستقل آزمایشگاه یا تأیید سازنده نیست.':'QC این نوبت فقط اظهاری است. بدون فایل خام و معیارهای همان IFU، برنامه نمی‌تواند کنترل پلیت را مستقل Pass/Fail کند.'}</div><p>منبع: {s(i,'source')||'ثبت نشده'} · توضیحات: {s(i,'notes')||'ثبت نشده'}</p>{i.rawFileImported===true&&<div className="srs-actions"><button className="button secondary" onClick={rawCsv} disabled={!Array.isArray((i.readerImportMeta as O|undefined)?.rawRows)}>دریافت جدول خام Reader (CSV)</button><small>ردیف‌های خام پارس‌شده، عنوان ستون‌ها و تفکیک نمونه/کنترل در پرونده نگهداری شده‌اند.</small></div>}</> }<p className="srs-footnote">این گزارش توصیفی است؛ تیتر به‌تنهایی تشخیص عفونت، اثبات حفاظت، موفقیت واکسن، DIVA یا توصیه قطعی واکسیناسیون نیست. GMT فقط در صورت مثبت‌بودن داده و ratio-scale بودن تیتر تفسیر می‌شود؛ برای OD و نسبت‌ها نباید به‌عنوان GMT استفاده شود.</p></>}</section>}
