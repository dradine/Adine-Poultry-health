export type VaccinationEvent={id:string;date:string;disease:string;product:string;platform:string;strain:string;route:string;dose:string;batch:string;administrationQuality:string;notes:string}
export type ClinicalContext={status:string;onsetDate:string;signs:string; morbidityPercent:string;mortalityPercent:string;mortalityTrend:string;feedChangePercent:string;waterChangePercent:string;productionChangePercent:string;necropsy:string;directTests:string;medications:string;houseNotes:string}
export const emptyClinicalContext:ClinicalContext={status:'unknown',onsetDate:'',signs:'',morbidityPercent:'',mortalityPercent:'',mortalityTrend:'',feedChangePercent:'',waterChangePercent:'',productionChangePercent:'',necropsy:'',directTests:'',medications:'',houseNotes:''}
const blankEvent=():VaccinationEvent=>({id:globalThis.crypto?.randomUUID?.()||String(Date.now()+Math.random()),date:'',disease:'ND',product:'',platform:'unknown',strain:'',route:'',dose:'',batch:'',administrationQuality:'unknown',notes:''})
const diseases=[['ND','نیوکاسل'],['AIV','آنفلوانزا'],['IBV','برونشیت'],['IBD','گامبورو'],['other','سایر']]
export default function ClinicalContextEditor({events,onEventsChange,clinical,onClinicalChange}:{events:VaccinationEvent[];onEventsChange:(v:VaccinationEvent[])=>void;clinical:ClinicalContext;onClinicalChange:(v:ClinicalContext)=>void}){
 const patchEvent=(id:string,key:keyof VaccinationEvent,value:string)=>onEventsChange(events.map(e=>e.id===id?{...e,[key]:value}:e))
 const patchClinical=(key:keyof ClinicalContext,value:string)=>onClinicalChange({...clinical,[key]:value})
 const input=(label:string,key:keyof ClinicalContext,placeholder='')=><label>{label}<input value={clinical[key]} onChange={e=>patchClinical(key,e.target.value)} placeholder={placeholder}/></label>
 return <div className="clinical-context-editor">
  <section className="context-editor-section"><header><div><h4>تاریخچه واکسیناسیون گله</h4><p>هر نوبت واکسن را جداگانه ثبت کنید؛ تاریخ، بیماری، نوع واکسن و روش تجویز برای تحلیل روند استفاده می‌شود.</p></div><button type="button" className="button secondary" onClick={()=>onEventsChange([...events,blankEvent()])}>+ افزودن نوبت واکسن</button></header>
   {events.length===0&&<p className="context-empty">هنوز نوبتی ثبت نشده؛ می‌توانید این بخش را خالی بگذارید و بعداً تکمیل کنید.</p>}
   {events.map((event,index)=><article className="vaccine-event-card" key={event.id}><header><b>نوبت واکسن {index+1}</b><button type="button" className="button danger small" onClick={()=>onEventsChange(events.filter(x=>x.id!==event.id))}>حذف</button></header><div className="form-grid">
    <label>تاریخ تجویز<input type="date" value={event.date} onChange={e=>patchEvent(event.id,'date',e.target.value)}/></label>
    <label>بیماری<select value={event.disease} onChange={e=>patchEvent(event.id,'disease',e.target.value)}>{diseases.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
    <label>نام واکسن / محصول<input value={event.product} onChange={e=>patchEvent(event.id,'product',e.target.value)} placeholder="نام تجاری یا سازنده"/></label>
    <label>پلتفرم واکسن<select value={event.platform} onChange={e=>patchEvent(event.id,'platform',e.target.value)}><option value="unknown">نامشخص</option><option value="live-conventional">زنده متعارف</option><option value="inactivated">غیرفعال / کشته</option><option value="immune-complex">Immune-complex</option><option value="recombinant-vector">وکتور نوترکیب</option><option value="other">سایر</option></select></label>
    <label>سویه / آنتی‌ژن<input value={event.strain} onChange={e=>patchEvent(event.id,'strain',e.target.value)} placeholder="مثلاً LaSota / H9"/></label>
    <label>مسیر تجویز<input value={event.route} onChange={e=>patchEvent(event.id,'route',e.target.value)} placeholder="اسپری، آب آشامیدنی، تزریقی…"/></label>
    <label>دوز / رقت / حجم<input value={event.dose} onChange={e=>patchEvent(event.id,'dose',e.target.value)}/></label>
    <label>شماره بچ / سری ساخت<input value={event.batch} onChange={e=>patchEvent(event.id,'batch',e.target.value)}/></label>
    <label>کیفیت اجرای واکسن<select value={event.administrationQuality} onChange={e=>patchEvent(event.id,'administrationQuality',e.target.value)}><option value="unknown">ارزیابی نشده</option><option value="good">مناسب / تأییدشده</option><option value="uncertain">نامطمئن</option><option value="poor">مشکل‌دار</option></select></label>
    <label className="wide-label">توضیح اجرای واکسن<input value={event.notes} onChange={e=>patchEvent(event.id,'notes',e.target.value)} placeholder="مثلاً قطعی آب، فشار اسپری، پوشش تزریق، زنجیره سرد…"/></label>
   </div></article>)}
  </section>
  <section className="context-editor-section"><header><div><h4>وضعیت بالینی و عملکرد گله</h4><p>اطلاعاتی که به تفکیک سناریوهای واکسیناسیون، مواجهه میدانی و بیماری کمک می‌کنند.</p></div></header>
   <div className="form-grid">
    <label>وضعیت فعلی گله<select value={clinical.status} onChange={e=>patchClinical('status',e.target.value)}><option value="unknown">ثبت نشده</option><option value="normal">طبیعی / بدون علامت</option><option value="clinical">دارای علائم بالینی</option><option value="recovering">در حال بهبود</option><option value="problem">افت عملکرد / مشکل گله</option></select></label>
    <label>تاریخ شروع علائم<input type="date" value={clinical.onsetDate} onChange={e=>patchClinical('onsetDate',e.target.value)}/></label>
    <label className="wide-label">علائم بالینی<input value={clinical.signs} onChange={e=>patchClinical('signs',e.target.value)} placeholder="تنفسی، عصبی، اسهال، افسردگی، افت تخم‌گذاری…"/></label>
    {input('درصد ابتلا / Morbidity','morbidityPercent','مثلاً 8')}
    {input('درصد تلفات تجمعی / Mortality','mortalityPercent','مثلاً 2.5')}
    <label>روند تلفات<select value={clinical.mortalityTrend} onChange={e=>patchClinical('mortalityTrend',e.target.value)}><option value="">نامشخص</option><option value="stable">ثابت</option><option value="increasing">افزایشی</option><option value="decreasing">کاهشی</option></select></label>
    {input('تغییر مصرف دان (%)','feedChangePercent','مثلاً -8')}
    {input('تغییر مصرف آب (%)','waterChangePercent','مثلاً -12')}
    {input('تغییر تولید / وزن / عملکرد (%)','productionChangePercent','مثلاً -5')}
    <label className="wide-label">یافته‌های کالبدگشایی<input value={clinical.necropsy} onChange={e=>patchClinical('necropsy',e.target.value)} placeholder="ضایعات نای، کیسه‌های هوایی، بورس، کلیه، روده…"/></label>
    <label className="wide-label">آزمایش‌های مستقیم / مولکولی<input value={clinical.directTests} onChange={e=>patchClinical('directTests',e.target.value)} placeholder="PCR، سویه‌یابی، بافت‌شناسی، کشت…"/></label>
    <label className="wide-label">داروها و مداخلات اخیر<input value={clinical.medications} onChange={e=>patchClinical('medications',e.target.value)} placeholder="دارو، تاریخ شروع، مدت و پاسخ…"/></label>
    <label className="wide-label">تفکیک سالن و توضیحات اپیدمیولوژیک<input value={clinical.houseNotes} onChange={e=>patchClinical('houseNotes',e.target.value)} placeholder="سالن درگیر، تماس با فارم دیگر، خودرو، پرندگان وحشی…"/></label>
   </div>
  </section>
 </div>
}
