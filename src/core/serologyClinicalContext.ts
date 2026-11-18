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
