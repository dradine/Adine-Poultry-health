import type { LocalFlock,LocalModelRun } from '../core/localFirstDb'
import SerologyFlockComparison from './SerologyFlockComparison'
import SerologyControlTracking from './SerologyControlTracking'
import { areComparableAssayRounds, areComparableSerologyRounds } from '../core/serologyStats'
import { analyzePairedRounds, bootstrapGeometricMeanConfidenceInterval, bootstrapMeanConfidenceInterval, calculateSeropositivity, compareIndependentRounds, geometricMeanConfidenceInterval, meanConfidenceInterval } from '../core/serologyAdvancedStats'
type O=Record<string,unknown>
const str=(o:O,k:string)=>typeof o[k]==='string'?String(o[k]):''
const nums=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='number'&&Number.isFinite(x))?v as number[]:[]
const ids=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='string')?v as string[]:[]
const fa=(v:number,d=2)=>v.toLocaleString('fa-IR',{maximumFractionDigits:d})
const pct=(v:number)=>fa(v)+'٪'
function Metric({label,value,detail}:{label:string;value:string;detail?:string}){return <div className="srs-metric"><small>{label}</small><b>{value}</b>{detail&&<span>{detail}</span>}</div>}
export default function SerologyAdvancedAnalysis({run,runs,flocks}:{run:LocalModelRun;runs:LocalModelRun[];flocks:LocalFlock[]}){
 const input=run.input_snapshot,values=nums(input.titers),scale=str(input,'scale')
 const isTitre=scale==='kit-titer'||scale==='hi-reciprocal',hasPositiveTitre=isTitre&&values.length>0&&values.every(v=>v>0)
 const demo=input.demo===true&&input.synthetic===true&&input.samplingPurpose==='training-only'&&input.qcStatus==='not-run-synthetic'
 const ci=hasPositiveTitre?geometricMeanConfidenceInterval(values):meanConfidenceInterval(values)
 const bootstrapCi=hasPositiveTitre?bootstrapGeometricMeanConfidenceInterval(values,run.id):bootstrapMeanConfidenceInterval(values,run.id)
 const comparable=runs.filter(x=>x.id!==run.id&&x.flock_id===run.flock_id&&x.disease_code===run.disease_code&&x.model_family==='serology-longitudinal-round'&&(demo
  ? areComparableAssayRounds({flockId:x.flock_id,diseaseCode:x.disease_code,input:x.input_snapshot},{flockId:run.flock_id,diseaseCode:run.disease_code,input})
  : areComparableSerologyRounds({flockId:x.flock_id,diseaseCode:x.disease_code,input:x.input_snapshot},{flockId:run.flock_id,diseaseCode:run.disease_code,input}))&&String(x.input_snapshot.samplingDate||'')<String(input.samplingDate||'')).sort((a,b)=>String(b.input_snapshot.samplingDate||'').localeCompare(String(a.input_snapshot.samplingDate||'')))
 const previous=comparable[0],old=previous?.input_snapshot
 const independent=demo&&previous?compareIndependentRounds(nums(old?.titers),values,isTitre?'titre':'continuous'):null
 const sorted=[...values].sort((a,b)=>a-b),quantile=(p:number)=>{if(!sorted.length)return 0;const i=(sorted.length-1)*p,l=Math.floor(i);return sorted[l]+(sorted[Math.ceil(i)]-sorted[l])*(i-l)}
 const sampleMean=values.length?values.reduce((a,b)=>a+b,0)/values.length:0
 const sampleSd=values.length>1?Math.sqrt(values.reduce((a,v)=>a+(v-sampleMean)**2,0)/(values.length-1)):0
 const cv=sampleMean>0?sampleSd/sampleMean*100:null
 const iqr=quantile(.75)-quantile(.25)
 const outlierCount=values.filter(v=>v<quantile(.25)-1.5*iqr||v>quantile(.75)+1.5*iqr).length
 const gmt=hasPositiveTitre?2**(values.reduce((s,v)=>s+Math.log2(v),0)/values.length):null
 const fourFoldEnabled=input.method==='HI'||(input.method==='ELISA'&&Boolean(str(input,'fourFoldComparisonSource').trim()))
 const paired=previous?analyzePairedRounds(nums(old?.titers),ids(old?.sampleIds),values,ids(input.sampleIds),isTitre?'titre':'continuous',fourFoldEnabled):null
 const cutoff=typeof input.seropositivityCutoff==='number'?input.seropositivityCutoff:typeof input.seropositivityCutoff==='string'&&input.seropositivityCutoff.trim()?Number(input.seropositivityCutoff):NaN
 const readerMeta=input.readerImportMeta&&typeof input.readerImportMeta==='object'?input.readerImportMeta as O:{}
 const controlSummary=Array.isArray(readerMeta.controlSummary)?readerMeta.controlSummary as {label:string;n:number;mean:number;sd:number|null;cvPercent:number|null;minimum:number;maximum:number;lowerLimit:number|null;upperLimit:number|null;maxReplicateCvPercent:number|null;percentDifference:number|null;maxReplicatePercentDifference:number|null;withinLimits:boolean|null}[]:[]
 const plateQcStatus=typeof readerMeta.qcStatus==='string'?readerMeta.qcStatus:'pending'
 const positivity=calculateSeropositivity(values,cutoff,input.cutoffDirection==='below'?'below':'above',str(input,'cutoffSource'))
 return <section className="srs-chart-card srs-advanced" aria-label="تحلیل آماری پیشرفته">
  <h4>تحلیل آماری و عدم‌قطعیت</h4>
  <section className="srs-chart-card"><h4>کنترل کیفیت پلیت و ردیابی داده خام</h4>
   {input.rawFileImported===true?<><p className="srs-note">خروجی فایل واردشده: {str(readerMeta,'fileName')||'نام فایل ثبت نشده'} · QC محاسبه‌شده: {plateQcStatus==='pass'?'قبول':plateQcStatus==='fail'?'رد':'در انتظار'} · وضعیت نهایی پرونده: {str(input,'qcStatus')==='pass'?'قبول':str(input,'qcStatus')==='fail'?'رد':'بررسی‌نشده'}</p><p className="srs-footnote">SHA-256 فایل: {str(readerMeta,'fileSha256')||'ثبت نشده'} · اندازه: {typeof readerMeta.fileSize==='number'?fa(readerMeta.fileSize,0)+' بایت':'ثبت نشده'} · داده سانسورشده واردشده: {Array.isArray(readerMeta.censoredRows)?fa(readerMeta.censoredRows.length,0):'ثبت نشده'}</p>
   {controlSummary.length>0?<div className="srs-table-wrap"><table className="srs-table"><thead><tr><th>کنترل</th><th>تعداد</th><th>میانگین</th><th>SD</th><th>CV٪</th><th>دامنه</th><th>حدود IFU</th></tr></thead><tbody>{controlSummary.map((x,j)=><tr key={j}><td>{x.label==='positive'?'مثبت':x.label==='negative'?'منفی':'مرجع'}</td><td>{fa(x.n,0)}</td><td>{fa(x.mean)}</td><td>{x.sd===null?'—':fa(x.sd)}</td><td>{x.cvPercent===null?'—':fa(x.cvPercent)+'٪'}</td><td>{fa(x.minimum)} تا {fa(x.maximum)}</td><td>{x.lowerLimit!==null&&x.upperLimit!==null?fa(x.lowerLimit)+'–'+fa(x.upperLimit):x.upperLimit!==null?'≤ '+fa(x.upperLimit):'—'}{x.maxReplicateCvPercent!==null&&<> · CV≤{fa(x.maxReplicateCvPercent)}٪</>}{x.maxReplicatePercentDifference!==null&&<> · Δ%≤{fa(x.maxReplicatePercentDifference)}٪</>}<br/>{x.percentDifference===null?'':'Δ% فعلی '+fa(x.percentDifference)+'٪'}<br/>{x.withinLimits===null?'بررسی نشده':x.withinLimits?'قبول':'رد'}</td></tr>)}</tbody></table></div>:<p className="srs-note">کنترل‌ها از فایل استخراج شده‌اند، اما معیارهای مثبت/منفی و منبع IFU کامل نیست؛ QC به‌صورت قبول علامت‌گذاری نشده است.</p>}
   <p className="srs-footnote">{str(readerMeta,'qcEvidence')}</p></>:<p className="srs-note">فایل خام دستگاه وارد نشده است؛ وضعیت QC این نوبت صرفاً بر اساس ثبت اپراتور است و کنترل پلیت به‌طور خودکار ارزیابی نشده است.</p>}
  </section>
  <SerologyControlTracking run={run} runs={runs}/>

  <h4>خلاصه آماری نمونه‌ها</h4>
  <div className="srs-metrics">
   <Metric label="میانگین حسابی" value={values.length?fa(sampleMean):'—'} detail={str(input,'unit')}/>
   <Metric label="میانه" value={values.length?fa(quantile(.5)):'—'}/>
   <Metric label="SD نمونه" value={values.length>1?fa(sampleSd):'—'}/>
   <Metric label="CV" value={cv===null?'—':pct(cv)} detail="SD / میانگین حسابی × ۱۰۰"/>
   <Metric label="GMT" value={gmt===null?'—':fa(gmt)} detail={hasPositiveTitre?'فقط برای تیتر مثبت ratio-scale':'برای این مقیاس تعریف نشده'}/>
   <Metric label="P5 / P90" value={values.length?fa(quantile(.05))+' / '+fa(quantile(.90)):'—'}/>
   <Metric label="IQR" value={values.length?fa(iqr):'—'}/>
   <Metric label="پرچم IQR" value={fa(outlierCount,0)} detail="موارد نیازمند بازبینی؛ حذف خودکار نمی‌شوند"/>
  </div>
  <p className="srs-note">فاصله اطمینان ۹۵٪ برای توصیف عدم‌قطعیت برآورد میانگین همین نمونه‌هاست؛ محدوده حفاظت یا حد تشخیص بیماری نیست.</p>
  <div className="srs-metrics">
   <Metric label="فاصله اطمینان پارامتریک ۹۵٪" value={ci?fa(ci.lower)+' تا '+fa(ci.upper):'قابل محاسبه نیست'} detail={hasPositiveTitre?'GMT؛ برآورد در مقیاس log₂ و بازتبدیل‌شده':isTitre?'GMT محاسبه نشده؛ CI میانگین حسابی به‌علت وجود تیتر صفر':'میانگین حسابی در مقیاس ثبت‌شده'}/>
   <Metric label="فاصله اطمینان Bootstrap ۹۵٪" value={bootstrapCi?fa(bootstrapCi.lower)+' تا '+fa(bootstrapCi.upper):'قابل محاسبه نیست'} detail={'۲۰۰۰ بازنمونه‌گیری؛ seed ثابت '+run.id.slice(0,8)+(hasPositiveTitre?' · GMT در مقیاس log₂':' · میانگین حسابی')}/>
   <Metric label="حجم نمونه" value={fa(values.length,0)} detail={values.length<2?'برای CI حداقل دو نتیجه لازم است':'نتایج معتبر واردشده'}/>
   <Metric label="مثبت سرولوژیک" value={positivity?pct(positivity.percent):'تعریف نشده'} detail={positivity?fa(positivity.positive,0)+' از '+fa(positivity.total,0)+'؛ CI ویلسون ۹۵٪':'فقط با cutoff و منبع معتبر همان IFU'}/>
   {positivity&&<Metric label="CI درصد مثبت‌ها" value={pct(positivity.interval.lower)+' تا '+pct(positivity.interval.upper)} detail="Wilson score interval"/>}
  </div>
  {demo&&previous&&independent?<><h4>مقایسه دو نوبت مستقل آموزشی (Welch)</h4>
   <p className="srs-note">این مقایسه فقط برای مجموعه آموزشی شبیه‌سازی‌شده و با فرض مستقل بودن نمونه‌های دو نوبت نمایش داده می‌شود؛ تحلیل جفت‌شده پرنده نیست و هیچ استنباط بالینی ندارد.</p>
   <div className="srs-metrics">
    <Metric label="حجم نمونه قبلی / فعلی" value={fa(independent.nPrevious,0)+' / '+fa(independent.nCurrent,0)}/>
    {isTitre?<><Metric label="GMT نوبت قبلی / فعلی" value={fa(independent.geometricMeanPrevious||0)+' / '+fa(independent.geometricMeanCurrent||0)}/><Metric label="نسبت هندسی فعلی به قبلی" value={fa(independent.geometricMeanFoldChange||0)+'×'}/><Metric label="CI ۹۵٪ نسبت هندسی" value={fa(independent.foldChangeLower||0)+' تا '+fa(independent.foldChangeUpper||0)+'×'}/></>:<><Metric label="اختلاف میانگین فعلی − قبلی" value={fa(independent.meanDifference)+' '+str(input,'unit')}/><Metric label="CI ۹۵٪ اختلاف" value={fa(independent.lower)+' تا '+fa(independent.upper)}/></>}
    <Metric label="اندازه اثر Hedges g" value={independent.hedgesG===null?'قابل محاسبه نیست':fa(independent.hedgesG)} detail="بر مقیاس تحلیل‌شده؛ توصیفی"/>
    <Metric label="درجه آزادی Welch" value={fa(independent.degreesFreedom)}/>
   </div>
   <p className="srs-note">CI شامل صفر (یا نسبت ۱ برای تیترها) با نبود اختلاف روشن سازگار است؛ این خروجی آزمون حفاظت، اثر واکسن یا اهمیت بالینی نیست.</p></>:previous&&paired&&!demo?<><h4>تحلیل جفت‌شده با شناسه پایدار پرنده</h4><p className="srs-note">مقایسه با نوبت {str(old as O,'roundLabel')||str(old as O,'samplingDate')}؛ فقط پرندگانی وارد شده‌اند که شناسه‌شان در هر دو نوبت یکسان و یکتا بوده است.</p><div className="srs-metrics">
   <Metric label="پرندگان جفت‌شده" value={fa(paired.n,0)} detail={'بدون جفت: نوبت قبل '+fa(paired.unmatchedPrevious,0)+'؛ نوبت فعلی '+fa(paired.unmatchedCurrent,0)}/>
   <Metric label="افزایش / کاهش / ثابت" value={fa(paired.increased,0)+' / '+fa(paired.decreased,0)+' / '+fa(paired.unchanged,0)}/>
   {isTitre?<><Metric label="میانگین نسبت تیتر پس/پیش" value={paired.geometricMeanFoldChange===null?'—':fa(paired.geometricMeanFoldChange)+'×'}/><Metric label="CI ۹۵٪ نسبت هندسی" value={paired.foldChangeInterval?fa(paired.foldChangeInterval.lower)+' تا '+fa(paired.foldChangeInterval.upper)+'×':'—'}/><Metric label="افزایش حداقل ۴ برابری" value={paired.fourFoldOrGreater===null?'نیازمند تأیید روش':fa(paired.fourFoldOrGreater,0)+' / '+fa(paired.n,0)} detail={paired.fourFoldOrGreater===null?'برای ELISA، منبع/تأیید IFU لازم است.':''}/><Metric label="کاهش حداقل ۴ برابری" value={paired.quarterOrLess===null?'نیازمند تأیید روش':fa(paired.quarterOrLess,0)+' / '+fa(paired.n,0)}/></>:<Metric label="میانگین تغییر جفت‌شده" value={paired.meanDifference===null?'—':fa(paired.meanDifference)+' '+str(input,'unit')} detail={paired.differenceInterval?'CI ۹۵٪: '+fa(paired.differenceInterval.lower)+' تا '+fa(paired.differenceInterval.upper):''}/>}
  </div><p className="srs-note">این تحلیل تغییر در پرندگان جفت‌شده را توصیف می‌کند؛ به‌تنهایی پاسخ محافظتی، اثربخشی واکسن یا معنی‌داری بالینی را اثبات نمی‌کند.</p></>:<p className="srs-note">{demo?'تحلیل جفت‌شده برای داده نمایشی غیرفعال است.':previous?'شناسه‌های پایدار معتبر و مشترک برای جفت‌سازی کافی نیستند.':'نوبت قبلی هم‌شرایط و قابل‌مقایسه برای تحلیل جفت‌شده پیدا نشد.'}</p>}
  <SerologyFlockComparison run={run} runs={runs} flocks={flocks}/>
  <p className="srs-footnote">درصد مثبت فقط در صورت ثبت آستانه، جهت تفسیر و منبع معتبر همان کیت/IFU نمایش داده می‌شود. هیچ cutoff عمومی بین کیت‌ها فرض نشده است.</p>
 </section>
}
