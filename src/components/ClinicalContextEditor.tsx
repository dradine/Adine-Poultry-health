import type { ClinicalContext, VaccinationEvent } from '../core/serologyClinicalContext'
import PersianDateInput from './PersianDateInput'
const blankEvent=():VaccinationEvent=>({id:globalThis.crypto?.randomUUID?.()||String(Date.now()),date:'',ageDays:null,disease:'ND',product:'',platform:'unknown',strain:'',route:'',dose:'',coveragePercent:null,administrationQuality:'unknown',batch:'',notes:''})
const diseases=[['ND','نیوکاسل'],['AIV','آنفلوانزا'],['IBV','برونشیت'],['IBD','گامبورو'],['other','سایر']]
export default function ClinicalContextEditor({events,onEventsChange,clinical,onClinicalChange}:{events:VaccinationEvent[];onEventsChange:(v:VaccinationEvent[])=>void;clinical:ClinicalContext;onClinicalChange:(v:ClinicalContext)=>void}){
 const patchEvent=(id:string,key:keyof VaccinationEvent,value:string)=>{const parsed=(key==='ageDays'||key==='coveragePercent')?(value.trim()?Number(value):null):value;onEventsChange(events.map(e=>e.id===id?({...e,[key]:parsed} as VaccinationEvent):e))}
 const patchClinical=(key:keyof ClinicalContext,value:string)=>onClinicalChange({...clinical,[key]:value})
 const input=(label:string,key:keyof ClinicalContext,placeholder='')=><label>{label}<input value={String(clinical[key]??'')} onChange={e=>patchClinical(key,e.target.value)} placeholder={placeholder}/></label>
 return <div className="clinical-context-editor">
  <section className="context-editor-section"><header><div><h4>تاریخچه واکسیناسیون گله</h4><p>هر نوبت واکسن را جداگانه ثبت کنید؛ تاریخ یا سن، بیماری، محصول، پلتفرم و مسیر تجویز برای تفسیر و روند استفاده می‌شود.</p></div><button type="button" className="button secondary" onClick={()=>onEventsChange([...events,blankEvent()])}>+ افزودن نوبت واکسن</button></header>
   {events.length===0&&<p className="context-empty">هنوز نوبتی ثبت نشده؛ این بخش اختیاری است و می‌توانید بعداً تکمیلش کنید.</p>}
   {events.map((event,index)=><article className="vaccine-event-card" key={event.id}><header><b>نوبت واکسن {index+1}</b><button type="button" className="button danger small" onClick={()=>onEventsChange(events.filter(x=>x.id!==event.id))}>حذف</button></header><div className="form-grid">
    <label>تاریخ تجویز<PersianDateInput value={event.date||''} onChange={value=>patchEvent(event.id,'date',value)} /></label>
    <label>سن هنگام تجویز (روز)<input inputMode="numeric" value={event.ageDays??''} onChange={e=>patchEvent(event.id,'ageDays',e.target.value)}/></label>
    <label>بیماری<select value={event.disease} onChange={e=>patchEvent(event.id,'disease',e.target.value)}>{diseases.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
    <label>نام واکسن / محصول<input value={event.product} onChange={e=>patchEvent(event.id,'product',e.target.value)}/></label>
    <label>پلتفرم واکسن<select value={event.platform} onChange={e=>patchEvent(event.id,'platform',e.target.value)}><option value="unknown">نامشخص</option><option value="live-conventional">زنده متعارف</option><option value="inactivated">غیرفعال / کشته</option><option value="immune-complex">Immune-complex</option><option value="recombinant-vector">وکتور نوترکیب</option><option value="other">سایر</option></select></label>
    <label>سویه / آنتی‌ژن<input value={event.strain} onChange={e=>patchEvent(event.id,'strain',e.target.value)}/></label>
    <label>مسیر تجویز<input value={event.route} onChange={e=>patchEvent(event.id,'route',e.target.value)} placeholder="اسپری، آب آشامیدنی، تزریقی…"/></label>
    <label>دوز / رقت<input value={event.dose} onChange={e=>patchEvent(event.id,'dose',e.target.value)}/></label>
    <label>پوشش واکسیناسیون (%)<input inputMode="decimal" value={event.coveragePercent??''} onChange={e=>patchEvent(event.id,'coveragePercent',e.target.value)}/></label>
    <label>کیفیت اجرا<select value={event.administrationQuality||'unknown'} onChange={e=>patchEvent(event.id,'administrationQuality',e.target.value)}><option value="unknown">ارزیابی نشده</option><option value="good">مناسب / تأییدشده</option><option value="uncertain">نامطمئن</option><option value="poor">مشکل‌دار</option></select></label>
    <label>شماره بچ<input value={event.batch||''} onChange={e=>patchEvent(event.id,'batch',e.target.value)}/></label>
    <label className="wide-label">توضیح اجرا<input value={event.notes} onChange={e=>patchEvent(event.id,'notes',e.target.value)} placeholder="قطعی آب، فشار اسپری، پوشش تزریق، زنجیره سرد…"/></label>
   </div></article>)}
  </section>
  <section className="context-editor-section"><header><div><h4>وضعیت بالینی و عملکرد گله</h4><p>اطلاعات گزارش‌شده از سوی فارم با یافته آزمایشگاهی قطعی اشتباه گرفته نمی‌شود.</p></div></header>
   <div className="form-grid">
    <label>وضعیت فعلی گله<select value={clinical.status||'unknown'} onChange={e=>patchClinical('status',e.target.value)}><option value="unknown">ثبت نشده</option><option value="normal">طبیعی / بدون علامت</option><option value="clinical">دارای علائم بالینی</option><option value="recovering">در حال بهبود</option><option value="problem">افت عملکرد / مشکل گله</option></select></label>
    <label>تاریخ شروع علائم<PersianDateInput value={clinical.onsetDate||''} onChange={value=>patchClinical('onsetDate',value)} /></label>
    <label className="wide-label">علائم بالینی<input value={clinical.signs} onChange={e=>patchClinical('signs',e.target.value)} placeholder="تنفسی، عصبی، اسهال، افسردگی، افت تخم‌گذاری…"/></label>
    {input('درصد ابتلا / Morbidity','morbidityPercent','مثلاً 8')}
    {input('درصد تلفات تجمعی / Mortality','mortalityPercent','مثلاً 2.5')}
    <label>روند تلفات<select value={clinical.mortalityTrend||''} onChange={e=>patchClinical('mortalityTrend',e.target.value)}><option value="">نامشخص</option><option value="stable">ثابت</option><option value="increasing">افزایشی</option><option value="decreasing">کاهشی</option></select></label>
    {input('تغییر مصرف دان / Feed intake','feedIntake','مثلاً کاهش ۸٪ نسبت به خط پایه')}
    {input('تغییر مصرف آب / Water intake','waterIntake','مثلاً کاهش ۱۲٪ نسبت به خط پایه')}
    {input('تغییر تولید / وزن / عملکرد','productionChange','مثلاً افت ۵٪')}
    <label className="wide-label">یافته‌های کالبدگشایی<input value={clinical.necropsy} onChange={e=>patchClinical('necropsy',e.target.value)}/></label>
    <label className="wide-label">آزمایش‌های مستقیم / مولکولی<input value={clinical.directTests} onChange={e=>patchClinical('directTests',e.target.value)} placeholder="PCR، سویه‌یابی، بافت‌شناسی، کشت…"/></label>
    <label className="wide-label">ریسک‌های مواجهه / اپیدمیولوژی<input value={clinical.exposureRisks} onChange={e=>patchClinical('exposureRisks',e.target.value)} placeholder="تماس فارم، خودرو، پرندگان وحشی، آب مشترک…"/></label>
    <label className="wide-label">سیر بیماری و مداخلات<input value={clinical.clinicalCourse} onChange={e=>patchClinical('clinicalCourse',e.target.value)} placeholder="تاریخ شروع، درمان، پاسخ، بهبود یا تشدید…"/></label>
    <label className="wide-label">توضیحات سالن‌ها<input value={clinical.houseNotes||''} onChange={e=>patchClinical('houseNotes',e.target.value)}/></label>
   </div>
  </section>
 </div>
}
