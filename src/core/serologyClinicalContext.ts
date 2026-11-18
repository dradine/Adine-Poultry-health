export type VaccinationEvent={
 id:string;disease:string;ageDays:number|null;date:string|null;product:string;strain:string;platform:string;route:string;dose:string;coveragePercent:number|null;notes:string
}
export type ClinicalContext={
 signs:string;mortalityPercent:string;waterIntake:string;feedIntake:string;productionChange:string;necropsy:string;directTests:string;exposureRisks:string;clinicalCourse:string
}
const digits=(v:string)=>v.replace(/[۰-۹٠-٩]/g,c=>{const a='۰۱۲۳۴۵۶۷۸۹'.indexOf(c);return String(a>=0?a:'٠١٢٣٤٥٦٧٨٩'.indexOf(c))})
const clean=(v:string)=>digits(v||'').trim()
export function parseVaccinationTimeline(raw:string,hatchDate=''):VaccinationEvent[]{
 const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'))
 return lines.map((line,index)=>{
  const p=line.split('|').map(clean)
  if(p.length<7)throw new Error('سطر واکسیناسیون '+(index+1)+' باید ۷ ستون داشته باشد: سن روز | تاریخ YYYY-MM-DD | بیماری | محصول | پلتفرم | مسیر | پوشش٪')
  const [ageRaw,dateRaw,disease,product,platform,route,coverageRaw,dose='',strain='',notes='']=p
  const age=ageRaw?Number(ageRaw):null,coverage=coverageRaw?Number(coverageRaw.replace('%','')):null
  const date=dateRaw||null
  if(ageRaw&&(!Number.isInteger(age)||Number(age)<0||Number(age)>500))throw new Error('سن واکسیناسیون در سطر '+(index+1)+' معتبر نیست.')
  if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))))throw new Error('تاریخ واکسیناسیون در سطر '+(index+1)+' باید YYYY-MM-DD باشد.')
  if(!date&&age===null)throw new Error('در سطر '+(index+1)+' سن روز یا تاریخ واکسیناسیون لازم است.')
  if(!disease||!product||!platform||!route)throw new Error('بیماری، محصول، پلتفرم و مسیر در سطر '+(index+1)+' را تکمیل کنید.')
  if(coverage!==null&&(!Number.isFinite(coverage)||coverage<0||coverage>100))throw new Error('درصد پوشش در سطر '+(index+1)+' باید بین صفر تا ۱۰۰ باشد.')
  const computedDate=!date&&hatchDate&&age!==null?new Date(Date.parse(hatchDate+'T00:00:00Z')+age*86400000).toISOString().slice(0,10):date
  const computedAge=date&&hatchDate?Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(hatchDate+'T00:00:00Z'))/86400000):age
  return {id:'vax-'+index+'-'+(computedDate||age),disease,ageDays:computedAge,date:computedDate,product,strain,platform,route,dose,coveragePercent:coverage,notes}
 })
}
export function formatVaccinationTimeline(events:VaccinationEvent[]):string{
 return events.map(e=>[e.ageDays??'',e.date??'',e.disease,e.product,e.platform,e.route,e.coveragePercent??'',e.dose,e.strain,e.notes].join(' | ')).join('\n')
}
export const emptyClinicalContext=():ClinicalContext=>({signs:'',mortalityPercent:'',waterIntake:'',feedIntake:'',productionChange:'',necropsy:'',directTests:'',exposureRisks:'',clinicalCourse:''})
export function validateClinicalContext(c:ClinicalContext):string|null{
 if(c.mortalityPercent.trim()){const n=Number(clean(c.mortalityPercent));if(!Number.isFinite(n)||n<0||n>100)return 'درصد تلفات باید عددی بین صفر تا ۱۰۰ باشد.'}
 return null
}
