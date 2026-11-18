import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { listLocalFlocks, listLocalModelRuns, type LocalFlock, type LocalModelRun } from '../core/localFirstDb'
import { saveSerologyRound } from '../core/serologyRunService'
import { ASSAY_CATALOG } from '../core/assayRegistry'
import { REFERENCE_BASELINES, UNPARSED_REFERENCE_DOCUMENTS } from '../data/referenceBaselines'
import { normalizeDigits } from '../core/ibd'

type Profile={id:string;flockName:string;placementDate:string;hatchDate?:string;savedAt:string;flockType?:string;flockSize?:string;houseName?:string;hatchery?:string;vaccinationHistory?:string}
type Disease='IBD'|'ND'|'IBV'|'AIV'
const diseases:{code:Disease;title:string;methods:string[]}[]=[
 {code:'IBD',title:'گامبورو (IBD)',methods:['ELISA']},
 {code:'ND',title:'نیوکاسل (ND)',methods:['ELISA','HI']},
 {code:'IBV',title:'برونشیت عفونی (IBV)',methods:['ELISA']},
 {code:'AIV',title:'آنفلوانزا (AIV)',methods:['ELISA','HI']},
]
const faDate=(s:string)=>s?new Date(s+'T12:00:00').toLocaleDateString('fa-IR'):'—'
const fa=(n:number)=>n.toLocaleString('fa-IR',{maximumFractionDigits:1})
const parseNums=(s:string)=>s.split(/[\s,،;؛]+/).map(x=>Number(x.replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/٬/g,''))).filter(x=>Number.isFinite(x)&&x>0)
function summarize(v:number[],method:string,unit:string){
 const a=[...v].sort((x,y)=>x-y),n=v.length,mean=v.reduce((s,x)=>s+x,0)/n
 const median=n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2
 const sd=n>1?Math.sqrt(v.reduce((s,x)=>s+(x-mean)**2,0)/(n-1)):0
 const log2Mean=v.reduce((s,x)=>s+Math.log2(x),0)/n
 const useGmt=method==='HI'||/titre|titer/i.test(unit)
 const gmt=useGmt?Math.exp(v.reduce((s,x)=>s+Math.log(x),0)/n):null
 return {n,mean,median,sd,cv:mean?sd/mean*100:0,gmt,log2Mean,min:a[0],max:a[n-1],trendValue:method==='HI'?log2Mean:(gmt??mean),trendLabel:method==='HI'?'میانگین log₂ تیتر HI':useGmt?'GMT تیتر کیت':'میانگین حسابی '+unit,metric:method==='HI'?'reciprocal HI GMT/log₂':useGmt?'kit-specific ELISA GMT':'arithmetic mean; non-titer unit'}
}
const val=(o:Record<string,unknown>,k:string)=>typeof o[k]==='string'?String(o[k]):''
export default function LongitudinalReports({profiles}:{profiles:Profile[]}){
 const [flocks,setFlocks]=useState<LocalFlock[]>([]),[runs,setRuns]=useState<LocalModelRun[]>([])
 const [disease,setDisease]=useState<Disease>('ND'),[flockId,setFlockId]=useState('')
 const [form,setForm]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[openId,setOpenId]=useState('')
 const [method,setMethod]=useState('HI'),[date,setDate]=useState(new Date().toISOString().slice(0,10)),[age,setAge]=useState('')
 const [round,setRound]=useState(''),[kit,setKit]=useState(''),[catalog,setCatalog]=useState(''),[antigen,setAntigen]=useState('')
 const [unit,setUnit]=useState('reciprocal HI titre'),[vaccine,setVaccine]=useState(''),[vaccineDate,setVaccineDate]=useState('')
 const [strain,setStrain]=useState(''),[count,setCount]=useState('23'),[values,setValues]=useState(''),[qc,setQc]=useState('pending')
 const [lab,setLab]=useState(''),[source,setSource]=useState(''),[notes,setNotes]=useState('')
 async function refresh(){const x=await Promise.all([listLocalFlocks(),listLocalModelRuns()]);setFlocks(x[0]);setRuns(x[1])}
 useEffect(()=>{void refresh();const fn=()=>void refresh();window.addEventListener('adine-cloud-data-updated',fn);window.addEventListener('adine-local-data-changed',fn);return()=>{window.removeEventListener('adine-cloud-data-updated',fn);window.removeEventListener('adine-local-data-changed',fn)}},[])
 useEffect(()=>{if(!flockId&&profiles[0])setFlockId(profiles[0].id)},[profiles,flockId])
 useEffect(()=>{setMethod(diseases.find(x=>x.code===disease)?.methods[0]||'ELISA');setKit('');setCatalog('');setAntigen('');setUnit(disease==='ND'?'reciprocal HI titre':'kit-specific titre')},[disease])
 const fl=useMemo(()=>{const m=new Map<string,{id:string;name:string;placement:string}>();flocks.forEach(x=>m.set(x.id,{id:x.id,name:x.flock_name,placement:x.placement_date}));profiles.forEach(x=>{if(!m.has(x.id))m.set(x.id,{id:x.id,name:x.flockName,placement:x.placementDate})});return [...m.values()]},[flocks,profiles])
 const rows=runs.filter(x=>x.disease_code===disease&&(!flockId||x.flock_id===flockId)).sort((a,b)=>String(a.input_snapshot.samplingDate||a.created_at).localeCompare(String(b.input_snapshot.samplingDate||b.created_at)))
 const selected=rows.find(x=>x.id===openId)
 const compatible=(a:LocalModelRun,b:LocalModelRun)=>a.flock_id===b.flock_id&&['method','kit','catalog','antigen','unit'].every(k=>a.input_snapshot[k]===b.input_snapshot[k])
 const trendRows=rows.filter(x=>x.model_family==='serology-longitudinal-round').sort((a,b)=>String(a.input_snapshot.samplingDate).localeCompare(String(b.input_snapshot.samplingDate)))
 const chartRows=trendRows.length?trendRows.filter(x=>compatible(x,trendRows[0])):[]
 const chartValues=chartRows.map(x=>Number(x.output_snapshot.trendValue??x.output_snapshot.gmt??x.output_snapshot.mean??0))
 const chartMin=Math.min(...chartValues),chartMax=Math.max(...chartValues),chartSpan=chartMax-chartMin||1
 const chartPoints=chartValues.map((v,i)=>({x:28+(i*Math.max(1,220/(chartValues.length-1||1))),y:126-((v-chartMin)/chartSpan)*92}))
 const options=ASSAY_CATALOG.filter(x=>x.disease===disease&&x.method===method)
 async function submit(e:FormEvent){
  e.preventDefault();setMessage('')
  const v=parseNums(values),n=Number(normalizeDigits(count)),f=fl.find(x=>x.id===flockId)
  if(!f||!date||!kit.trim()||!unit.trim()||v.length<2||!Number.isInteger(n)||n!==v.length){setMessage('گله، تاریخ، کیت، واحد، تعداد نمونه و تیترهای عددی را کنترل کنید؛ تعداد تیترها باید با تعداد نمونه برابر باشد.');return}
  if(method==='HI'&&disease!=='ND'&&disease!=='AIV'){setMessage('روش HI برای این بیماری در این فرم فعال نیست.');return}
  setBusy(true)
  try{
   const s=summarize(v,method,unit),p=profiles.find(x=>x.id===flockId)
   await saveSerologyRound({flock:{id:f.id,flockName:f.name,placementDate:f.placement,hatchDate:p?.hatchDate,flockType:p?.flockType,flockSize:p?.flockSize,houseName:p?.houseName,hatchery:p?.hatchery,vaccinationHistory:p?.vaccinationHistory},diseaseCode:disease,input:{recordType:'serology-longitudinal-round',roundLabel:round.trim()||('نوبت '+(runs.filter(x=>x.flock_id===f.id&&x.disease_code===disease&&x.model_family==='serology-longitudinal-round').length+1)),samplingDate:date,samplingAgeDays:age?Number(normalizeDigits(age)):null,method,kit:kit.trim(),catalog:catalog.trim(),antigen:antigen.trim(),unit:unit.trim(),vaccine:vaccine.trim(),vaccineDate:vaccineDate||null,vaccineStrain:strain.trim(),sampleCount:n,titers:v,qcStatus:qc,laboratory:lab.trim(),source:source.trim(),notes:notes.trim(),comparisonRule:'same flock + disease + method + kit/catalog + antigen + unit; unpaired group-level summaries only'},output:{...s,interpretation:'خلاصه آماری توصیفی؛ بدون استنباط حفاظت یا تشخیص',qcStatus:qc,comparisonEligible:false,limitations:['مقایسه روند فقط با روش، کیت/نسخه، آنتی‌ژن و واحد یکسان انجام می‌شود.','بدون شناسه پرنده، مقایسه گروهی است و paired response محسوب نمی‌شود.','OD، S/P، تیتر ELISA، HI reciprocal و HI log₂ با هم ادغام یا تبدیل نمی‌شوند.','هیچ حدی به‌تنهایی اثبات‌کننده حفاظت، عفونت یا موفقیت واکسن نیست.']}})
   await refresh();setForm(false);setValues('');setMessage('نوبت ذخیره شد؛ در صورت ورود به حساب و اتصال اینترنت، در صف همگام‌سازی ابری قرار می‌گیرد.')
  }catch(err){setMessage(err instanceof Error?err.message:'ذخیره انجام نشد.')}finally{setBusy(false)}
 }
 const title=diseases.find(x=>x.code===disease)?.title||disease
 return <section className="panel" aria-label="پرونده‌های پایش سرولوژیک">
  <div className="panel-heading"><div><span className="step">۵</span><h3>پرونده‌های پایش و گزارش‌های دوره‌ای</h3></div><span className="tag">ذخیره حساب + آفلاین</span></div>
  <p className="muted">هر نوبت یک گزارش مستقل دارد. پس از ورود به حساب و همگام‌سازی، سوابق در حساب کاربری ذخیره و روی دستگاه‌های دیگر بازیابی می‌شوند.</p>
  <div className="disease-grid">{diseases.map(x=><button type="button" key={x.code} className={disease===x.code?'disease active':'disease'} onClick={()=>{setDisease(x.code);setOpenId('')}}><b>{x.title}</b><small>{runs.filter(r=>r.disease_code===x.code).length.toLocaleString('fa-IR')} گزارش</small></button>)}</div>
  <div className="form-grid"><label>گله<select value={flockId} onChange={e=>{setFlockId(e.target.value);setOpenId('')}}><option value="">همه گله‌ها</option>{fl.map(x=><option key={x.id} value={x.id}>{x.name} · {faDate(x.placement)}</option>)}</select></label><label>پرونده فعال<input value={title} readOnly/></label></div>
  <div className="wizard-nav"><button type="button" className="button primary" onClick={()=>setForm(!form)}>{form?'بستن فرم':'＋ ثبت نوبت جدید'}</button><button type="button" className="button secondary" onClick={()=>void refresh()}>به‌روزرسانی</button></div>
  {message&&<p className="muted" role="status">{message}</p>}
  {form&&<form className="custom-kit-accordion" onSubmit={submit}><h4>ثبت نوبت جدید · {title}</h4><div className="form-grid">
   <label>تاریخ نمونه‌گیری<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label>
   <label>سن گله هنگام نمونه‌گیری (روز)<input value={age} onChange={e=>setAge(e.target.value)} inputMode="decimal"/></label>
   <label>شماره نوبت / عنوان<input value={round} onChange={e=>setRound(e.target.value)} placeholder="مثلاً نوبت اول / روز دهم"/></label>
   <label>روش آزمون<select value={method} onChange={e=>{setMethod(e.target.value);setKit('');setCatalog('');setUnit(e.target.value==='HI'?'reciprocal HI titre':'kit-specific titre')}}>{(diseases.find(x=>x.code===disease)?.methods||[]).map(x=><option key={x}>{x}</option>)}</select></label>
   <label>کیت / آزمون<input list="serology-kit-list" value={kit} onChange={e=>setKit(e.target.value)} placeholder="نام دقیق طبق IFU" required/><datalist id="serology-kit-list">{options.map(x=><option key={x.id} value={x.manufacturer+' — '+x.name}/>)}</datalist></label>
   <label>کد کاتالوگ / نسخه<input value={catalog} onChange={e=>setCatalog(e.target.value)} placeholder="مثلاً CK116 / IFU version"/></label>
   <label>آنتی‌ژن / سویه آزمون<input value={antigen} onChange={e=>setAntigen(e.target.value)} placeholder="برای HI زیرتیپ/سویه را دقیق بنویسید"/></label>
   <label>واحد دقیق تیتر<input value={unit} onChange={e=>setUnit(e.target.value)} required/></label>
   <label>واکسن / محصول<input value={vaccine} onChange={e=>setVaccine(e.target.value)}/></label>
   <label>تاریخ واکسیناسیون<input type="date" value={vaccineDate} onChange={e=>setVaccineDate(e.target.value)}/></label>
   <label>سویه واکسن<input value={strain} onChange={e=>setStrain(e.target.value)}/></label>
   <label>تعداد نمونه<input value={count} onChange={e=>setCount(e.target.value)} inputMode="numeric"/></label>
   <label>آزمایشگاه<input value={lab} onChange={e=>setLab(e.target.value)}/></label>
   <label>کنترل کیفیت<select value={qc} onChange={e=>setQc(e.target.value)}><option value="pending">بررسی نشده</option><option value="pass">طبق IFU قابل قبول</option><option value="review">نیازمند بازبینی</option><option value="fail">رد شده</option></select></label>
   <label className="wide-label">تیترهای انفرادی<textarea rows={4} value={values} onChange={e=>setValues(e.target.value)} placeholder="مثال HI: 16, 32, 16, 64, 32" required/><small>برای HI، عدد را به شکل reciprocal dilution وارد کنید؛ مثلاً 16 برای 1:16. داده خام حفظ می‌شود و log₂ فقط برای خلاصه آماری HI است.</small></label>
   <label className="wide-label">منبع IFU / گزارش سازنده / صفحه<input value={source} onChange={e=>setSource(e.target.value)}/></label>
   <label className="wide-label">یادداشت<textarea rows={2} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
  </div><p className="muted">مقایسه فقط در صورت یکسان بودن روش، کیت/نسخه، آنتی‌ژن و واحد معتبر است. این فرم نمونه‌ها را بین نوبت‌ها جفت نمی‌کند.</p><button className="button primary" disabled={busy}>{busy?'در حال ذخیره…':'ذخیره نوبت و ساخت گزارش'}</button></form>}
  <div className="saved-list"><div className="saved-title">گزارش‌های ثبت‌شده · {title}</div>{rows.length===0?<p className="muted">هنوز گزارشی برای این بیماری ثبت نشده است.</p>:rows.map((r,i)=><button type="button" className="saved-row" key={r.id} onClick={()=>setOpenId(openId===r.id?'':r.id)}><span>{val(r.input_snapshot,'roundLabel')||'گزارش '+(i+1)} · {val(r.input_snapshot,'kit')||r.model_family}</span><small>{faDate(val(r.input_snapshot,'samplingDate')||r.created_at.slice(0,10))} · {fa(Number(r.output_snapshot.n||0))} نمونه · {val(r.input_snapshot,'method')}</small><b>{openId===r.id?'بستن':'مشاهده گزارش'}</b></button>)}</div>
  {selected&&<div className="result-card"><div className="result-heading"><b>گزارش {val(selected.input_snapshot,'roundLabel')}</b><span className="tag warning">توصیفی · نیازمند بازبینی</span></div><div className="result-details"><div><small>تاریخ نمونه</small><b>{faDate(val(selected.input_snapshot,'samplingDate'))}</b></div><div><small>روش / کیت</small><b>{val(selected.input_snapshot,'method')} · {val(selected.input_snapshot,'kit')}</b></div><div><small>تعداد نمونه</small><b>{fa(Number(selected.output_snapshot.n||0))}</b></div><div><small>میانگین هندسی / شاخص اصلی</small><b>{selected.output_snapshot.gmt==null?fa(Number(selected.output_snapshot.trendValue||selected.output_snapshot.mean||0)):fa(Number(selected.output_snapshot.gmt))}</b></div><div><small>میانه</small><b>{fa(Number(selected.output_snapshot.median||0))}</b></div><div><small>CV</small><b>{fa(Number(selected.output_snapshot.cv||0))}٪</b></div><div><small>دامنه</small><b>{fa(Number(selected.output_snapshot.min||0))} – {fa(Number(selected.output_snapshot.max||0))}</b></div><div><small>میانگین log₂ (HI)</small><b>{fa(Number(selected.output_snapshot.log2Mean||0))}</b></div></div><p>QC: {val(selected.input_snapshot,'qcStatus')} · آنتی‌ژن: {val(selected.input_snapshot,'antigen')||'ثبت نشده'} · واکسن: {val(selected.input_snapshot,'vaccine')||'ثبت نشده'}</p><p className="muted">این خروجی آماری است؛ نه تشخیص و نه اثبات حفاظت.</p></div>}
  {trendRows.length>0&&<div className="result-card"><h4>مقایسه روند نوبت‌ها</h4><p className="muted">روند گروهی؛ هر خط فقط برای روش، کیت، کد، آنتی‌ژن و واحد کاملاً یکسان است. HI با میانگین log₂، تیتر ELISA با GMT و واحدهای OD/S:P با میانگین حسابی نمایش داده می‌شوند.</p>{chartRows.length>0&&<svg viewBox="0 0 280 150" role="img" aria-label="نمودار روند تیترهای هم‌روش"><line x1="20" y1="126" x2="260" y2="126" stroke="currentColor" opacity=".3"/><line x1="20" y1="20" x2="20" y2="126" stroke="currentColor" opacity=".3"/><polyline points={chartPoints.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#187a52" strokeWidth="2.5"/>{chartPoints.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="4" fill="#187a52"/>)}<text x="24" y="14" fontSize="9" fill="currentColor">{fa(chartMax)}</text><text x="24" y="145" fontSize="9" fill="currentColor">{fa(chartMin)}</text></svg>}{trendRows.map(r=>{const prev=trendRows.filter(x=>String(x.input_snapshot.samplingDate)<String(r.input_snapshot.samplingDate)&&compatible(x,r)).at(-1);const now=Number(r.output_snapshot.gmt??r.output_snapshot.mean??0),old=Number(prev?.output_snapshot.gmt??prev?.output_snapshot.mean??0);return <div className="saved-row" key={r.id}><span>{val(r.input_snapshot,'roundLabel')} · {fa(now)}</span><small>{faDate(val(r.input_snapshot,'samplingDate'))}{prev&&compatible(prev,r)?' · تغییر نسبت به نوبت قبلی: '+fa(old?(now-old)/old*100:0)+'٪':' · مبنای هم‌روش قبلی موجود نیست'}</small></div>})}</div>}
  <details className="custom-kit-accordion"><summary>کاتالوگ آزمون‌ها، منابع مرجع و وضعیت اعتبار عددی</summary><p className="muted">کاتالوگ فقط شناسایی آزمون است؛ وجود نام کیت به‌تنهایی مجوز محاسبه یا مقایسه ایجاد نمی‌کند.</p>{ASSAY_CATALOG.filter(x=>x.disease===disease).map(x=><div className="saved-row" key={x.id}><span>{x.manufacturer} · {x.name} {x.catalog?'('+x.catalog+')':''}</span><small>{x.method} · {x.status==='documented'?'مستند؛ تطبیق IFU لازم':x.status==='catalog-only'?'کاتالوگی؛ داده عددی/IFU ناکامل':'نیازمند اعتبارسنجی محلی'} · {x.note} · منبع: {x.source}</small></div>)}<p className="muted">مرجع سازنده به‌تنهایی آستانه حفاظت نیست؛ فقط تطبیق کامل کیت، نسخه، روش، واحد، سن و جمعیت اجازه مقایسه عددی می‌دهد.</p>{REFERENCE_BASELINES.filter(x=>x.disease===disease).map(x=><div className="saved-row" key={x.id}><span>{x.sourceTitle}</span><small>{x.sourceVersion} · {x.numericComparisonEligible?'مقایسه مشروط':'مثال/مرجع مطالعاتی؛ مقایسه عددی غیرفعال'}</small><a href={x.sourceUrl} target="_blank" rel="noreferrer">منبع</a></div>)}{REFERENCE_BASELINES.filter(x=>x.disease===disease).length===0&&<p className="muted">در حال حاضر برای این بیماری Baseline عددی استخراج‌شده و واجد تطبیق کامل در کتابخانه فعال نیست؛ تا دریافت و بازبینی IFU/ماتریس رسمی، مقایسه با مرجع سازنده غیرفعال می‌ماند.</p>}{UNPARSED_REFERENCE_DOCUMENTS.map(x=><div className="saved-row" key={x.id}><span>{x.title}</span><small>سند فهرست شده؛ اعداد هنوز استخراج و تأیید نشده‌اند</small><a href={x.sourceUrl} target="_blank" rel="noreferrer">منبع</a></div>)}</details>
 </section>
}
