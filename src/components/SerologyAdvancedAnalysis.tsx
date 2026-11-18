import type { LocalFlock,LocalModelRun } from '../core/localFirstDb'
import SerologyFlockComparison from './SerologyFlockComparison'
import { areComparableSerologyRounds } from '../core/serologyStats'
import { analyzePairedRounds, calculateSeropositivity, geometricMeanConfidenceInterval, meanConfidenceInterval } from '../core/serologyAdvancedStats'
type O=Record<string,unknown>
const str=(o:O,k:string)=>typeof o[k]==='string'?String(o[k]):''
const nums=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='number'&&Number.isFinite(x))?v as number[]:[]
const ids=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='string')?v as string[]:[]
const fa=(v:number,d=2)=>v.toLocaleString('fa-IR',{maximumFractionDigits:d})
const pct=(v:number)=>fa(v)+'٪'
function Metric({label,value,detail}:{label:string;value:string;detail?:string}){return <div className="srs-metric"><small>{label}</small><b>{value}</b>{detail&&<span>{detail}</span>}</div>}
export default function SerologyAdvancedAnalysis({run,runs,flocks}:{run:LocalModelRun;runs:LocalModelRun[];flocks:LocalFlock[]}){
 const input=run.input_snapshot,values=nums(input.titers),scale=str(input,'scale')
 const isTitre=scale==='kit-titer'||scale==='hi-reciprocal'
 const ci=isTitre?geometricMeanConfidenceInterval(values):meanConfidenceInterval(values)
 const comparable=runs.filter(x=>x.id!==run.id&&x.flock_id===run.flock_id&&x.disease_code===run.disease_code&&x.model_family==='serology-longitudinal-round'&&areComparableSerologyRounds({flockId:x.flock_id,diseaseCode:x.disease_code,input:x.input_snapshot},{flockId:run.flock_id,diseaseCode:run.disease_code,input})&&String(x.input_snapshot.samplingDate||'')<String(input.samplingDate||'')).sort((a,b)=>String(b.input_snapshot.samplingDate||'').localeCompare(String(a.input_snapshot.samplingDate||'')))
 const previous=comparable[0],old=previous?.input_snapshot
 const paired=previous?analyzePairedRounds(nums(old?.titers),ids(old?.sampleIds),values,ids(input.sampleIds),isTitre?'titre':'continuous'):null
 const cutoff=typeof input.seropositivityCutoff==='number'?input.seropositivityCutoff:typeof input.seropositivityCutoff==='string'&&input.seropositivityCutoff.trim()?Number(input.seropositivityCutoff):NaN
 const readerMeta=input.readerImportMeta&&typeof input.readerImportMeta==='object'?input.readerImportMeta as O:{}
 const controlSummary=Array.isArray(readerMeta.controlSummary)?readerMeta.controlSummary as {label:string;n:number;mean:number;sd:number|null;cvPercent:number|null;minimum:number;maximum:number;withinLimits:boolean|null}[]:[]
 const plateQcStatus=typeof readerMeta.qcStatus==='string'?readerMeta.qcStatus:'pending'
 const positivity=calculateSeropositivity(values,cutoff,input.cutoffDirection==='below'?'below':'above',str(input,'cutoffSource'))
 const demo=input.demo===true||input.qcStatus==='demo'
 return <section className="srs-chart-card srs-advanced" aria-label="تحلیل آماری پیشرفته">
  <h4>تحلیل آماری و عدم‌قطعیت</h4>
  <section className="srs-chart-card"><h4>کنترل کیفیت پلیت و ردیابی داده خام</h4>
   {input.rawFileImported===true?<><p className="srs-note">خروجی فایل واردشده: {str(readerMeta,'fileName')||'نام فایل ثبت نشده'} · وضعیت QC: {plateQcStatus==='pass'?'قبول محاسبه‌شده از کنترل‌های فایل':plateQcStatus==='fail'?'رد محاسبه‌شده':'در انتظار معیارهای کامل IFU'}</p>
   {controlSummary.length>0?<div className="srs-table-wrap"><table className="srs-table"><thead><tr><th>کنترل</th><th>تعداد</th><th>میانگین</th><th>SD</th><th>CV٪</th><th>دامنه</th><th>حدود IFU</th></tr></thead><tbody>{controlSummary.map((x,j)=><tr key={j}><td>{x.label==='positive'?'مثبت':x.label==='negative'?'منفی':'مرجع'}</td><td>{fa(x.n,0)}</td><td>{fa(x.mean)}</td><td>{x.sd===null?'—':fa(x.sd)}</td><td>{x.cvPercent===null?'—':fa(x.cvPercent)+'٪'}</td><td>{fa(x.minimum)} تا {fa(x.maximum)}</td><td>{x.withinLimits===null?'بررسی نشده':x.withinLimits?'قبول':'رد'}</td></tr>)}</tbody></table></div>:<p className="srs-note">کنترل‌ها از فایل استخراج شده‌اند، اما معیارهای مثبت/منفی و منبع IFU کامل نیست؛ QC به‌صورت قبول علامت‌گذاری نشده است.</p>}
   <p className="srs-footnote">{str(readerMeta,'qcEvidence')}</p></>:<p className="srs-note">فایل خام دستگاه وارد نشده است؛ وضعیت QC این نوبت صرفاً بر اساس ثبت اپراتور است و کنترل پلیت به‌طور خودکار ارزیابی نشده است.</p>}
  </section>

  <p className="srs-note">فاصله اطمینان ۹۵٪ برای توصیف عدم‌قطعیت برآورد میانگین همین نمونه‌هاست؛ محدوده حفاظت یا حد تشخیص بیماری نیست.</p>
  <div className="srs-metrics">
   <Metric label="فاصله اطمینان ۹۵٪" value={ci?fa(ci.lower)+' تا '+fa(ci.upper):'قابل محاسبه نیست'} detail={isTitre?'GMT؛ برآورد در مقیاس log₂ و بازتبدیل‌شده':'میانگین حسابی در مقیاس ثبت‌شده'}/>
   <Metric label="حجم نمونه" value={fa(values.length,0)} detail={values.length<2?'برای CI حداقل دو نتیجه لازم است':'نتایج معتبر واردشده'}/>
   <Metric label="مثبت سرولوژیک" value={positivity?pct(positivity.percent):'تعریف نشده'} detail={positivity?fa(positivity.positive,0)+' از '+fa(positivity.total,0)+'؛ CI ویلسون ۹۵٪':'فقط با cutoff و منبع معتبر همان IFU'}/>
   {positivity&&<Metric label="CI درصد مثبت‌ها" value={pct(positivity.interval.lower)+' تا '+pct(positivity.interval.upper)} detail="Wilson score interval"/>}
  </div>
  {previous&&paired&&!demo?<><h4>تحلیل جفت‌شده با شناسه پایدار پرنده</h4><p className="srs-note">مقایسه با نوبت {str(old as O,'roundLabel')||str(old as O,'samplingDate')}؛ فقط پرندگانی وارد شده‌اند که شناسه‌شان در هر دو نوبت یکسان و یکتا بوده است.</p><div className="srs-metrics">
   <Metric label="پرندگان جفت‌شده" value={fa(paired.n,0)} detail={'بدون جفت: نوبت قبل '+fa(paired.unmatchedPrevious,0)+'؛ نوبت فعلی '+fa(paired.unmatchedCurrent,0)}/>
   <Metric label="افزایش / کاهش / ثابت" value={fa(paired.increased,0)+' / '+fa(paired.decreased,0)+' / '+fa(paired.unchanged,0)}/>
   {isTitre?<><Metric label="میانگین نسبت تیتر پس/پیش" value={paired.geometricMeanFoldChange===null?'—':fa(paired.geometricMeanFoldChange)+'×'}/><Metric label="CI ۹۵٪ نسبت هندسی" value={paired.foldChangeInterval?fa(paired.foldChangeInterval.lower)+' تا '+fa(paired.foldChangeInterval.upper)+'×':'—'}/><Metric label="افزایش حداقل ۴ برابری" value={paired.fourFoldOrGreater===null?'—':fa(paired.fourFoldOrGreater,0)+' / '+fa(paired.n,0)}/><Metric label="کاهش حداقل ۴ برابری" value={paired.quarterOrLess===null?'—':fa(paired.quarterOrLess,0)+' / '+fa(paired.n,0)}/></>:<Metric label="میانگین تغییر جفت‌شده" value={paired.meanDifference===null?'—':fa(paired.meanDifference)+' '+str(input,'unit')} detail={paired.differenceInterval?'CI ۹۵٪: '+fa(paired.differenceInterval.lower)+' تا '+fa(paired.differenceInterval.upper):''}/>}
  </div><p className="srs-note">این تحلیل تغییر در پرندگان جفت‌شده را توصیف می‌کند؛ به‌تنهایی پاسخ محافظتی، اثربخشی واکسن یا معنی‌داری بالینی را اثبات نمی‌کند.</p></>:<p className="srs-note">{demo?'تحلیل جفت‌شده برای داده نمایشی غیرفعال است.':previous?'شناسه‌های پایدار معتبر و مشترک برای جفت‌سازی کافی نیستند.':'نوبت قبلی هم‌شرایط و قابل‌مقایسه برای تحلیل جفت‌شده پیدا نشد.'}</p>}
  <SerologyFlockComparison run={run} runs={runs} flocks={flocks}/>
  <p className="srs-footnote">درصد مثبت فقط در صورت ثبت آستانه، جهت تفسیر و منبع معتبر همان کیت/IFU نمایش داده می‌شود. هیچ cutoff عمومی بین کیت‌ها فرض نشده است.</p>
 </section>
}
