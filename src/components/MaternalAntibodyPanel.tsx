import {useEffect,useMemo,useState} from 'react'
import {estimateMaternalAntibodyDecay} from '../core/maternalAntibody'
import type {StrainDisease} from '../core/strainRegistry'
type Props={sampleAgeDays:number;disease:StrainDisease}
type Run=ReturnType<typeof estimateMaternalAntibodyDecay>
type SavedMda={id:string;createdAt:string;disease:string;sampleAge:number;sampleTiters:number[];halfLife:number;threshold:number;meanHatch:number;medianHatch:number;geometricHatch:number;medianCrossing:number|null;belowCount:number;strainSelections?:Record<string,string>}
const digits=(v:string)=>v.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٫/g,'.')
const fa=(n:number)=>n.toLocaleString('fa-IR',{maximumFractionDigits:1})
function median(v:number[]){const s=[...v].sort((a,b)=>a-b);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2}
export default function MaternalAntibodyPanel({sampleAgeDays,disease}:Props){
 const [age,setAge]=useState(String(sampleAgeDays));const [titersText,setTitersText]=useState('');const [halfLife,setHalfLife]=useState('');const [threshold,setThreshold]=useState('');const [unit,setUnit]=useState('');const [source,setSource]=useState('');const [results,setResults]=useState<Run[]|null>(null);const [error,setError]=useState('')
 const [history,setHistory]=useState<SavedMda[]>(()=>{try{return JSON.parse(localStorage.getItem('adine-mda-history-v1')||'[]')}catch{return []}})
 useEffect(()=>setAge(String(sampleAgeDays)),[sampleAgeDays])
 const parsedTiters=useMemo(()=>titersText.split(/[\s,،;]+/).map(x=>x.trim()).filter(Boolean).map(x=>Number(digits(x))),[titersText])
 const hatchValues=results?.map(r=>r.estimatedHatchTiter)||[]
 const meanHatch=hatchValues.length?hatchValues.reduce((s,v)=>s+v,0)/hatchValues.length:0
 const medianHatch=hatchValues.length?median(hatchValues):0
 const geometricHatch=hatchValues.length?Math.exp(hatchValues.reduce((s,v)=>s+Math.log(v),0)/hatchValues.length):0
 const crossingAges=results?.map(r=>r.estimatedThresholdAgeDays).filter((v):v is number=>v!==null)||[]; const medianCrossing=crossingAges.length?median(crossingAges):null
 const belowCount=results?.filter(r=>r.alreadyBelowThresholdAtHatch).length||0
 const avgCurve=results?.[0]?.predictedAtDays.map((p,i)=>({day:p.day,titer:results.reduce((s,r)=>s+r.predictedAtDays[i].titer,0)/results.length}))||[]
 const maxTiter=Math.max(1,...avgCurve.map(p=>p.titer))
 const chartPoints=avgCurve.map(p=>(30+p.day*8)+','+(150-Math.min(120,p.titer/maxTiter*120))).join(' ')
 function run(){setError('');setResults(null);try{if(!parsedTiters.length||parsedTiters.some(t=>!Number.isFinite(t)||t<=0))throw Error('فهرست تیترها باید شامل اعداد مثبت معتبر باشد.');const r=parsedTiters.map(sampleTiter=>estimateMaternalAntibodyDecay({sampleAgeDays:Number(digits(age)),sampleTiter,halfLifeDays:Number(digits(halfLife)),thresholdTiter:Number(digits(threshold))}));setResults(r)}catch(e){setError(e instanceof Error?e.message:'ورودی نامعتبر')}}
 function save(){if(!results)return;const record:SavedMda={id:crypto.randomUUID(),createdAt:new Date().toISOString(),disease,sampleAge:Number(digits(age)),sampleTiters:parsedTiters,halfLife:Number(digits(halfLife)),threshold:Number(digits(threshold)),meanHatch,medianHatch,geometricHatch,medianCrossing,belowCount,strainSelections:(()=>{try{return JSON.parse(localStorage.getItem('adine-strain-selections-v1-'+disease)||'{}')}catch{return {}}})()};const next=[record,...history].slice(0,30);try{localStorage.setItem('adine-mda-history-v1',JSON.stringify(next));setHistory(next);setError('')}catch{setError('ذخیره سوابق MDA در مرورگر انجام نشد.')}}
 return <section className="panel mda-panel"><div className="panel-heading"><div><span className="step">MDA</span><h3>برآورد آنتی‌بادی مادری در جوجه‌های روز صفر تا ۴</h3></div><span className="tag">مدل اکتشافی افت آنتی‌بادی</span></div>
 <p className="muted">برای ارزیابی آنتی‌بادی منتقل‌شده از مادر. سن نمونه‌گیری ۰، ۱، ۲، ۳ یا ۴ روز مجاز است؛ روز هچ با روز نمونه‌گیری یکی فرض نمی‌شود. تیتر چند جوجه را وارد کنید؛ این بخش مستقل از موتور زمان‌بندی واکسن IBD است.</p>
 <details className="custom-kit-accordion"><summary>＋ پارامترها و منبع آزمون</summary><div className="form-grid">
 <label>بیماری / آنتی‌ژن هدف<input readOnly value={disease}/></label><label>سن نمونه‌گیری (روز ۰ تا ۴)<input inputMode="decimal" value={age} onChange={e=>setAge(e.target.value)}/></label>
 <label className="wide-label">تیترهای انفرادی (یک تیتر در هر خط یا جداشده با ویرگول)<textarea rows={4} value={titersText} onChange={e=>setTitersText(e.target.value)} placeholder="مثلاً ۱۵۰۰، ۱۲۸۰، ۱۶۰۰، ۹۸۰…؛ فقط همان مقیاس کیت"/></label>
 <label>نیمه‌عمر آنتی‌بادی (روز)<input inputMode="decimal" value={halfLife} onChange={e=>setHalfLife(e.target.value)} placeholder="منبع/گله/مطالعه"/></label>
 <label>Threshold تداخل (هم‌مقیاس)<input inputMode="decimal" value={threshold} onChange={e=>setThreshold(e.target.value)} placeholder="آستانه مستند"/></label>
 <label>کیت، واحد و هدف آنتی‌ژن<input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="مثلاً kit + ELISA titer scale"/></label>
 <label>منبع نیمه‌عمر و threshold<input value={source} onChange={e=>setSource(e.target.value)} placeholder="IFU، مقاله، داده فارم؛ صفحه/نسخه"/></label>
 </div></details>
 <div className="data-summary"><span>تعداد تیترهای ورودی</span><strong>{fa(parsedTiters.length)}</strong></div>
 <button className="button primary" onClick={run}>محاسبه منحنی MDA</button>{error&&<p className="error">{error}</p>}
 {results&&<div className="mda-result"><div className="result-details"><div><small>تعداد نمونه</small><b>{fa(results.length)}</b></div><div><small>میانگین تیتر روز هچ</small><b>{fa(meanHatch)}</b></div><div><small>GMT روز هچ</small><b>{fa(geometricHatch)}</b></div><div><small>میانه روز هچ</small><b>{fa(medianHatch)}</b></div><div><small>دامنه روز هچ</small><b>{fa(Math.min(...hatchValues))}–{fa(Math.max(...hatchValues))}</b></div><div><small>میانه سن عبور از threshold</small><b>{medianCrossing===null?'زیر threshold':fa(medianCrossing)+' روز'}</b></div><div><small>کمتر از threshold در روز هچ</small><b>{fa(results.length?100*belowCount/results.length:0)}٪</b></div></div>
 <svg viewBox="0 0 300 170" role="img" aria-label="منحنی میانگین افت نمایی تخمینی آنتی‌بادی مادری" className="mda-chart"><line x1="30" y1="150" x2="280" y2="150" stroke="currentColor" strokeOpacity=".3"/><line x1="30" y1="15" x2="30" y2="150" stroke="currentColor" strokeOpacity=".3"/><polyline points={chartPoints} fill="none" stroke="#27835b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/><text x="28" y="165" fontSize="9">۰</text><text x="260" y="165" fontSize="9">روز ۲۸</text><text x="36" y="12" fontSize="9">تیتر میانگین (نسبی)</text></svg>
 <details className="custom-kit-accordion"><summary>＋ نتایج نمونه‌به‌نمونه</summary><div className="mda-points">{results.map((r,i)=><span key={i}>نمونه {fa(i+1)} · هچ {fa(r.estimatedHatchTiter)} · عبور {r.estimatedThresholdAgeDays===null?'زیر threshold':fa(r.estimatedThresholdAgeDays)+' روز'}</span>)}</div></details>
 <ul className="mda-warnings">{results[0].warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>{(!unit.trim()||!source.trim())&&<p className="error">مقیاس آزمون و منبع پارامترها ثبت نشده؛ خروجی صرفاً محاسبه ریاضی است و برای تصمیم بالینی قابل اتکا نیست.</p>}
 <button className="button secondary" onClick={save}>ذخیره نتیجه در سوابق MDA محلی</button></div>}
 <details className="custom-kit-accordion mda-history"><summary>＋ سوابق MDA ذخیره‌شده ({history.length})</summary>{history.length===0?<p className="muted">نتیجه‌ای ذخیره نشده است.</p>:history.slice(0,10).map(r=><div className="saved-row" key={r.id}><span>{r.disease} · n={fa(r.sampleTiters.length)} · GMT روز هچ {fa(r.geometricHatch||r.meanHatch)}</span><small>{new Date(r.createdAt).toLocaleDateString('fa-IR')}</small><button className="link-button" onClick={()=>{const next=history.filter(x=>x.id!==r.id);localStorage.setItem('adine-mda-history-v1',JSON.stringify(next));setHistory(next)}}>حذف</button></div>)}</details>
 </section>
}
