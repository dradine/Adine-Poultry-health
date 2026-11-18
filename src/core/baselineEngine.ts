/**
 * Strict disease-specific reference-baseline compatibility engine.
 * Missing metadata is never a wildcard. No cross-disease/kit/method/unit inference.
 * Does not infer protection, infection, vaccine take, or diagnosis.
 */
import { REFERENCE_BASELINES, type ReferenceBaseline } from '../data/referenceBaselines'
export type BaselineDisease = 'IBD' | 'IBV' | 'ND' | 'AIV'
export type BaselineContext = {
 disease: BaselineDisease; vendor:string; assayOrKit:string; catalog?:string; assayVersion?:string;
 method:'ELISA'|'HI'|'VN'; unit:string; population:string; ageWindow:string; vaccineProgram:string
}
export type BaselineAssessment = {
 status:'exact-match'|'reference-only'|'no-match'; usableForNumericComparison:boolean;
 baselineId:string|null; explanationFa:string; reasonsFa:string[]; source:string|null;
 sourceVersion:string|null; numericRange:ReferenceBaseline['numericRange']|null
}
const norm=(s:string)=>s.trim().toLocaleLowerCase('en-US').replace(/\s+/g,' ')
const present=(s:string|undefined)=>Boolean(s&&s.trim())
function assess(disease:BaselineDisease,context:BaselineContext):BaselineAssessment {
 const refs=REFERENCE_BASELINES.filter(x=>x.disease===disease)
 if(!refs.length)return {status:'no-match',usableForNumericComparison:false,baselineId:null,
 explanationFa:'برای این بیماری Baseline عددی تأییدشده‌ای ثبت نشده است؛ هیچ محدوده‌ای برای مقایسه انتخاب نشد.',
 reasonsFa:['نبود مرجع عددی تأییدشده برای این بیماری.'],source:null,sourceVersion:null,numericRange:null}
 const missing=(['vendor','assayOrKit','method','unit','population','ageWindow','vaccineProgram'] as const).filter(k=>!present(context[k]))
 if(missing.length)return {status:'reference-only',usableForNumericComparison:false,baselineId:null,
 explanationFa:'اطلاعات لازم برای تطبیق کامل Baseline وارد نشده است؛ مرجع فقط برای مطالعه نمایش داده می‌شود و در تفسیر عددی استفاده نمی‌شود.',
 reasonsFa:['اطلاعات تطبیق ناقص است: '+missing.join('، ')],source:null,sourceVersion:null,numericRange:null}
 const exact=refs.find(x=>{
  const m=x as ReferenceBaseline & {method?:string;catalog?:string;assayVersion?:string;unit?:string}
  return norm(x.vendor)===norm(context.vendor)&&norm(x.assayOrKit)===norm(context.assayOrKit)
   &&norm(m.method||'')===norm(context.method)&&norm(m.unit||x.numericRange?.unit||'')===norm(context.unit)
   &&norm(x.population)===norm(context.population)&&norm(x.ageWindow||'')===norm(context.ageWindow)
   &&norm(x.vaccineProgram||'')===norm(context.vaccineProgram)
   &&(!context.catalog||norm(m.catalog||'')===norm(context.catalog))
   &&(!context.assayVersion||norm(m.assayVersion||'')===norm(context.assayVersion))
 })
 if(!exact)return {status:'reference-only',usableForNumericComparison:false,baselineId:null,
 explanationFa:'Baseline این بیماری در کتابخانه وجود دارد، اما تطابق دقیق سازنده، آزمون، روش، مقیاس، جمعیت، سن و برنامه واکسن احراز نشد. مقایسه عددی مسدود است.',
 reasonsFa:['هیچ مرجعی تمام مشخصات این نمونه را صریح و کامل پوشش نمی‌دهد.','شباهت نام کیت یا بیماری برای تطبیق کافی نیست.'],
 source:null,sourceVersion:null,numericRange:null}
 return {status:'exact-match',usableForNumericComparison:true,baselineId:exact.id,
 explanationFa:'تطابق مشخصات با مرجع ثبت‌شده برقرار است. این مقایسه فقط توصیفی و در محدوده کاربرد سند است؛ Baseline به‌تنهایی معیار حفاظت یا تشخیص نیست.',
 reasonsFa:[],source:exact.sourceTitle,sourceVersion:exact.sourceVersion,numericRange:exact.numericRange||null}
}
export const assessIbdBaseline=(c:BaselineContext)=>assess('IBD',c)
export const assessIbvBaseline=(c:BaselineContext)=>assess('IBV',c)
export const assessNdBaseline=(c:BaselineContext)=>assess('ND',c)
export const assessAivBaseline=(c:BaselineContext)=>assess('AIV',c)
