import {useState} from 'react'
import {monitorNdHi} from './core/ndMonitor'
import {analyzeIbvTrend} from './core/ibvTrend'
import {assessAivEvidence} from './core/aivEvidence'
type Mode='ND'|'IBV'|'AIV'
export default function DiseaseMonitoring(){
 const [mode,setMode]=useState<Mode>('ND')
 const [baseline,setBaseline]=useState('2,3,4,3,2')
 const [post,setPost]=useState('5,6,4,5,3')
 const [threshold,setThreshold]=useState('4')
 const [assay,setAssay]=useState('HI – antigen/strain')
 const [product,setProduct]=useState('واکسن ND')
 const [route,setRoute]=useState('قطره چشمی')
 const [days,setDays]=useState('14')
 const [ibData,setIbData]=useState('0:300\n14:650\n28:900')
 const [ibAssay,setIbAssay]=useState('ELISA نام کیت')
 const [unit,setUnit]=useState<'ELISA'|'HI-log2'|'VN'>('ELISA')
 const [aiv,setAiv]=useState({vaccinationStatus:'unknown' as 'vaccinated'|'unvaccinated'|'unknown',vaccinePlatform:'unknown' as 'inactivated'|'vector'|'other'|'unknown',subtype:'H5',antigenMatch:'uncertain' as 'documented'|'uncertain'|'not-assessed',serologyResult:'not-tested' as 'positive'|'negative'|'inconclusive'|'not-tested',divaValidated:false,rtPcrResult:'not-tested' as 'positive'|'negative'|'not-tested',clinicalSigns:false,mortalityIncrease:false,officialProgramConfirmed:false})
 const [out,setOut]=useState<unknown>(null),[err,setErr]=useState('')
 const nums=(s:string)=>s.split(/[،,;\s]+/).filter(Boolean).map(x=>Number(x.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d))))
 function run(){setErr('');setOut(null);try{
 if(mode==='ND'){const b=baseline.trim()?nums(baseline):undefined;setOut(monitorNdHi({baselineHiLog2:b,postHiLog2:nums(post),assayAntigen:assay,vaccineProduct:product,route,samplingDaysAfterDose:Number(days),responseThresholdLog2:threshold===''?undefined:Number(threshold)}))}
 if(mode==='IBV'){const observations=ibData.split(/\n/).filter(Boolean).map(line=>{const [day,value]=line.split(/[:;,]/);return {day:Number(day),value:Number(value)}});setOut(analyzeIbvTrend({observations,assay:ibAssay,unit}))}
 if(mode==='AIV')setOut(assessAivEvidence(aiv))
 }catch(e){setErr(e instanceof Error?e.message:'خطا در ورودی')} }
 return <section className="panel">
 <div className="panel-heading"><div><span className="step">۴</span><h3>موتورهای مستقل پایش بیماری</h3></div><span className="tag">Research / Monitor</span></div>
 <div className="form-grid"><label>انتخاب موتور<select value={mode} onChange={e=>{setMode(e.target.value as Mode);setOut(null);setErr('')}}><option value="ND">نیوکاسل · HI monitor</option><option value="IBV">برونشیت · Serology trend</option><option value="AIV">آنفلوانزا · Evidence gate</option></select></label></div>
 {mode==='ND'&&<><p>ورودی HI بر حسب log2 endpoint (رقت ۱:۲ = ۱، ۱:۴ = ۲ و ...). فقط تحلیل پاسخ سرولوژیک، نه protection.</p><div className="form-grid"><label>Baseline (paired، اختیاری)<input value={baseline} onChange={e=>setBaseline(e.target.value}/></label><label>HI پس از واکسن<input value={post} onChange={e=>setPost(e.target.value}/></label><label>آنتی‌ژن/سویه آزمون<input value={assay} onChange={e=>setAssay(e.target.value}/></label><label>محصول واکسن<input value={product} onChange={e=>setProduct(e.target.value}/></label><label>مسیر تجویز<input value={route} onChange={e=>setRoute(e.target.value}/></label><label>روز پس از واکسن<input value={days} onChange={e=>setDays(e.target.value}/></label><label>آستانه responder (اختیاری، log2)<input value={threshold} onChange={e=>setThreshold(e.target.value}/></label></div></>}
 {mode==='IBV'&&<><p>هر خط: روز:مقدار. فقط مقادیر یک assay و واحد یکسان وارد شود.</p><div className="form-grid"><label>نام آزمون/کیت<input value={ibAssay} onChange={e=>setIbAssay(e.target.value}/></label><label>واحد<select value={unit} onChange={e=>setUnit(e.target.value as typeof unit)}><option value="ELISA">ELISA</option><option value="HI-log2">HI log2</option><option value="VN">VN</option></select></label><label>مشاهدات (day:value)<textarea rows={4} value={ibData} onChange={e=>setIbData(e.target.value}/></label></div></>}
 {mode==='AIV'&&<div className="form-grid">
 <label>وضع واکسیناسیون<select value={aiv.vaccinationStatus} onChange={e=>setAiv({...aiv,vaccinationStatus:e.target.value as typeof aiv.vaccinationStatus})}><option value="unknown">نامعلوم</option><option value="vaccinated">واکسینه</option><option value="unvaccinated">غیرواکسینه</option></select></label>
 <label>پلتفرم واکسن<select value={aiv.vaccinePlatform} onChange={e=>setAiv({...aiv,vaccinePlatform:e.target.value as typeof aiv.vaccinePlatform})}><option value="unknown">نامعلوم</option><option value="inactivated">غیرفعال</option><option value="vector">وکتور</option><option value="other">سایر</option></select></label>
 <label>زیرتیپ/آنتی‌ژن<input value={aiv.subtype} onChange={e=>setAiv({...aiv,subtype:e.target.value})}/></label>
 <label>تطابق آنتی‌ژنی<select value={aiv.antigenMatch} onChange={e=>setAiv({...aiv,antigenMatch:e.target.value as typeof aiv.antigenMatch})}><option value="uncertain">نامشخص</option><option value="documented">مستند</option><option value="not-assessed">ارزیابی نشده</option></select></label>
 <label>سرولوژی<select value={aiv.serologyResult} onChange={e=>setAiv({...aiv,serologyResult:e.target.value as typeof aiv.serologyResult})}><option value="not-tested">انجام نشده</option><option value="positive">مثبت</option><option value="negative">منفی</option><option value="inconclusive">نامشخص</option></select></label>
 <label>RT-PCR<select value={aiv.rtPcrResult} onChange={e=>setAiv({...aiv,rtPcrResult:e.target.value as typeof aiv.rtPcrResult})}><option value="not-tested">انجام نشده</option><option value="positive">مثبت</option><option value="negative">منفی</option></select></label>
 <label><input type="checkbox" checked={aiv.clinicalSigns} onChange={e=>setAiv({...aiv,clinicalSigns:e.target.checked})}/> علائم بالینی</label><label><input type="checkbox" checked={aiv.mortalityIncrease} onChange={e=>setAiv({...aiv,mortalityIncrease:e.target.checked})}/> افزایش تلفات</label><label><input type="checkbox" checked={aiv.divaValidated} onChange={e=>setAiv({...aiv,divaValidated:e.target.checked})}/> روش DIVA معتبر شده</label><label><input type="checkbox" checked={aiv.officialProgramConfirmed} onChange={e=>setAiv({...aiv,officialProgramConfirmed:e.target.checked})}/> برنامه رسمی تأیید شده</label></div>}
 <button className="button" onClick={run}>اجرای موتور پایش</button>{err&&<p className="error">{err}</p>}{out&&<pre className="monitor-output">{JSON.stringify(out,null,2)}</pre>}
 </section>
}
