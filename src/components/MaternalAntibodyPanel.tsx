import {useEffect,useMemo,useState} from 'react'
import {estimateMaternalAntibodyDecay} from '../core/maternalAntibody'
import type {StrainDisease} from '../core/strainRegistry'
type Props={sampleAgeDays:number;disease:StrainDisease}
const digits=(v:string)=>v.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٫/g,'.')
const fa=(n:number)=>n.toLocaleString('fa-IR',{maximumFractionDigits:1})
export default function MaternalAntibodyPanel({sampleAgeDays,disease}:Props){
 const [age,setAge]=useState(String(sampleAgeDays));const [titer,setTiter]=useState('');const [halfLife,setHalfLife]=useState('');const [threshold,setThreshold]=useState('');const [unit,setUnit]=useState('');const [source,setSource]=useState('');const [result,setResult]=useState<ReturnType<typeof estimateMaternalAntibodyDecay>|null>(null);const [error,setError]=useState('')
 useEffect(()=>setAge(String(sampleAgeDays)),[sampleAgeDays])
 const maxTiter=result?Math.max(...result.predictedAtDays.map(p=>p.titer)):1
 const chartPoints=useMemo(()=>result?.predictedAtDays.map(p=>(30+p.day*8)+','+(150-Math.min(120,p.titer/maxTiter*120))).join(' '),[result,maxTiter])
 function run(){setError('');setResult(null);try{const r=estimateMaternalAntibodyDecay({sampleAgeDays:Number(digits(age)),sampleTiter:Number(digits(titer)),halfLifeDays:Number(digits(halfLife)),thresholdTiter:Number(digits(threshold))});setResult(r)}catch(e){setError(e instanceof Error?e.message:'ورودی نامعتبر')}}
 return <section className="panel mda-panel"><div className="panel-heading"><div><span className="step">MDA</span><h3>برآورد آنتی‌بادی مادری در جوجه‌های روز صفر تا ۴</h3></div><span className="tag">مدل اکتشافی افت آنتی‌بادی</span></div>
 <p className="muted">برای ارزیابی آنتی‌بادی منتقل‌شده از مادر. سن نمونه‌گیری ۰، ۱، ۲، ۳ یا ۴ روز مجاز است؛ روز هچ با روز نمونه‌گیری یکی فرض نمی‌شود. این بخش مستقل از موتور زمان‌بندی واکسن IBD است.</p>
 <details className="custom-kit-accordion"><summary>＋ پارامترها و منبع آزمون</summary><div className="form-grid">
 <label>بیماری / آنتی‌ژن هدف<input readOnly value={disease} /></label><label>سن نمونه‌گیری (روز ۰ تا ۴)<input inputMode="decimal" value={age} onChange={e=>setAge(e.target.value)} /></label>
 <label>تیتر نمونه (مقیاس کیت)<input inputMode="decimal" value={titer} onChange={e=>setTiter(e.target.value)} placeholder="عدد در همان مقیاس آزمون"/></label>
 <label>نیمه‌عمر آنتی‌بادی (روز)<input inputMode="decimal" value={halfLife} onChange={e=>setHalfLife(e.target.value)} placeholder="منبع/گله/مطالعه"/></label>
 <label>Threshold تداخل (هم‌مقیاس)<input inputMode="decimal" value={threshold} onChange={e=>setThreshold(e.target.value)} placeholder="آستانه مستند"/></label>
 <label>کیت، واحد و هدف آنتی‌ژن<input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="مثلاً kit + ELISA titer scale"/></label>
 <label>منبع نیمه‌عمر و threshold<input value={source} onChange={e=>setSource(e.target.value)} placeholder="IFU، مقاله، داده فارم؛ صفحه/نسخه"/></label>
 </div></details>
 <button className="button primary" onClick={run}>محاسبه منحنی MDA</button>{error&&<p className="error">{error}</p>}
 {result&&<div className="mda-result"><div className="result-details"><div><small>تیتر تخمینی روز هچ</small><b>{fa(result.estimatedHatchTiter)}</b></div><div><small>زمان عبور از threshold</small><b>{result.estimatedThresholdAgeDays===null?'زیر threshold':fa(result.estimatedThresholdAgeDays)+' روز'}</b></div><div><small>سن نمونه</small><b>{fa(Number(digits(age)))} روز</b></div></div>
 <svg viewBox="0 0 300 170" role="img" aria-label="منحنی افت نمایی تخمینی آنتی‌بادی مادری" className="mda-chart"><line x1="30" y1="150" x2="280" y2="150" stroke="currentColor" strokeOpacity=".3"/><line x1="30" y1="15" x2="30" y2="150" stroke="currentColor" strokeOpacity=".3"/>{chartPoints&&<polyline points={chartPoints} fill="none" stroke="#27835b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>}<text x="28" y="165" fontSize="9">۰</text><text x="260" y="165" fontSize="9">روز ۲۸</text><text x="36" y="12" fontSize="9">تیتر (نسبی)</text></svg>
 <details className="custom-kit-accordion"><summary>＋ مقادیر پیش‌بینی‌شده</summary><div className="mda-points">{result.predictedAtDays.map(p=><span key={p.day}>روز {fa(p.day)}: {fa(p.titer)}</span>)}</div></details>
 <ul className="mda-warnings">{result.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>{(!unit.trim()||!source.trim())&&<p className="error">مقیاس آزمون و منبع پارامترها ثبت نشده؛ خروجی صرفاً محاسبه ریاضی است و برای تصمیم بالینی قابل اتکا نیست.</p>}</div>}
 </section>
}
