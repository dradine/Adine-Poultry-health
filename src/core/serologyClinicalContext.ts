export type VaccinationEvent={
 id:string
 date:string
 ageDays:number|null
 disease:string
 product:string
 platform:string
 strain:string
 route:string
 dose:string
 coveragePercent:number|null
 administrationQuality:string
 batch:string
 notes:string
}
export type ClinicalContext={
 status:string
 onsetDate:string
 signs:string
 morbidityPercent:string
 mortalityPercent:string
 mortalityTrend:string
 feedIntake:string
 waterIntake:string
 productionChange:string
 necropsy:string
 directTests:string
 medications:string
 exposureRisks:string
 clinicalCourse:string
 houseNotes:string
}
export const emptyClinicalContext=():ClinicalContext=>({
 status:'unknown',onsetDate:'',signs:'',morbidityPercent:'',mortalityPercent:'',mortalityTrend:'',
 feedIntake:'',waterIntake:'',productionChange:'',necropsy:'',directTests:'',medications:'',
 exposureRisks:'',clinicalCourse:'',houseNotes:''
})
const normalize=(v:string)=>v.replace(/[۰-۹٠-٩]/g,c=>{const p='۰۱۲۳۴۵۶۷۸۹'.indexOf(c);return String(p>=0?p:'٠١٢٣٤٥٦٧٨٩'.indexOf(c))}).replace(/[٬،]/g,'').replace(/٪/g,'%').trim()
export function validateClinicalContext(c:ClinicalContext):string|null{
 for(const [key,label] of [['mortalityPercent','تلفات'],['morbidityPercent','ابتلا']] as const){
  const raw=normalize(c[key]||'').replace('%','')
  if(raw){const n=Number(raw);if(!Number.isFinite(n)||n<0||n>100)return 'درصد '+label+' باید عددی بین صفر تا ۱۰۰ باشد.'}
 }
 return null
}

export function resolveVaccinationEvents(events:VaccinationEvent[],hatchDate:string,samplingDate:string,samplingAge:number|null):VaccinationEvent[]{
 const entered=events.filter(e=>Boolean(e.date||e.ageDays!==null||e.product.trim()||e.strain.trim()||e.route.trim()))
 return entered.map((event,index)=>{
  const ageDays=event.ageDays===null?null:Number(event.ageDays)
  if(ageDays!==null&&(!Number.isInteger(ageDays)||ageDays<0||ageDays>500))throw new Error('سن نوبت واکسن '+(index+1)+' باید عدد صحیح بین صفر تا ۵۰۰ روز باشد.')
  if(event.coveragePercent!==null&&(!Number.isFinite(event.coveragePercent)||event.coveragePercent<0||event.coveragePercent>100))throw new Error('پوشش نوبت واکسن '+(index+1)+' باید بین صفر تا ۱۰۰ درصد باشد.')
  const fromHatch=hatchDate&&ageDays!==null?new Date(Date.parse(hatchDate+'T00:00:00Z')+ageDays*86400000).toISOString().slice(0,10):null
  const fromSample=ageDays!==null&&samplingAge!==null?new Date(Date.parse(samplingDate+'T00:00:00Z')+(ageDays-samplingAge)*86400000).toISOString().slice(0,10):null
  const date=event.date||fromHatch||fromSample||null
  if(!date)throw new Error('برای نوبت واکسن '+(index+1)+' تاریخ را وارد کنید یا سن روز را همراه با تاریخ هچ/سن نمونه‌گیری ثبت کنید.')
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z')))throw new Error('تاریخ نوبت واکسن '+(index+1)+' معتبر نیست.')
  if(date>samplingDate)throw new Error('تاریخ نوبت واکسن '+(index+1)+' بعد از تاریخ نمونه‌گیری است.')
  if(!event.disease||!event.product.trim()||!event.platform||!event.route.trim())throw new Error('برای نوبت واکسن '+(index+1)+' بیماری، محصول، پلتفرم و مسیر تجویز را تکمیل کنید.')
  const ageFromHatch=hatchDate?Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(hatchDate+'T00:00:00Z'))/86400000):null
  const ageFromSample=samplingAge!==null?samplingAge-Math.round((Date.parse(samplingDate+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/86400000):null
  const inferredAge=ageFromHatch??ageFromSample
  if(ageDays!==null&&inferredAge!==null&&Math.abs(ageDays-inferredAge)>1)throw new Error('سن و تاریخ نوبت واکسن '+(index+1)+' با یکدیگر سازگار نیستند؛ تاریخ هچ و سن نمونه‌گیری را بررسی کنید.')
  const computedAge=ageDays??inferredAge
  return {...event,ageDays:computedAge,date}
 })
}
