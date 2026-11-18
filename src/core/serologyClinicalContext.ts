export type VaccinationEvent={
 id:string;disease:string;ageDays:number|null;date:string|null;product:string;strain:string;platform:string;route:string;dose:string;coveragePercent:number|null;administrationQuality?:string;batch?:string;notes:string
}
export type ClinicalContext={
 signs:string;mortalityPercent:string;waterIntake:string;feedIntake:string;productionChange:string;necropsy:string;directTests:string;exposureRisks:string;clinicalCourse:string;
 status?:string;onsetDate?:string;morbidityPercent?:string;mortalityTrend?:string;houseNotes?:string
}
const digits=(v:string)=>v.replace(/[۰-۹٠-٩]/g,c=>{const a='۰۱۲۳۴۵۶۷۸۹'.indexOf(c);return String(a>=0?a:'٠١٢٣٤٥٦٧٨٩'.indexOf(c))})
const clean=(v:string)=>digits(v||'').trim()
export const emptyClinicalContext=():ClinicalContext=>({signs:'',mortalityPercent:'',waterIntake:'',feedIntake:'',productionChange:'',necropsy:'',directTests:'',exposureRisks:'',clinicalCourse:'',status:'unknown',onsetDate:'',morbidityPercent:'',mortalityTrend:'',houseNotes:''})
export function validateClinicalContext(c:ClinicalContext):string|null{
 for(const [key,label] of [['mortalityPercent','تلفات'],['morbidityPercent','ابتلا']] as const){const raw=c[key]||'';if(raw.trim()){const n=Number(clean(raw));if(!Number.isFinite(n)||n<0||n>100)return 'درصد '+label+' باید عددی بین صفر تا ۱۰۰ باشد.'}}
 return null
}
