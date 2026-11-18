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
 sourceVersion:string|null; sourceUrl:string|null; numericRange:ReferenceBaseline['numericRange']|null
}
const norm=(s:string)=>s.trim().toLocaleLowerCase('en-US').replace(/\s+/g,' ')
const present=(s:string|undefined)=>Boolean(s&&s.trim())
const empty=(status:BaselineAssessment['status'],explanationFa:string,reasonsFa:string[]):BaselineAssessment=>({
 status,usableForNumericComparison:false,baselineId:null,explanationFa,reasonsFa,
 source:null,sourceVersion:null,sourceUrl:null,numericRange:null
})
function assess(disease:BaselineDisease,context:BaselineContext):BaselineAssessment {
 if(context.disease!==disease)return empty('no-match','کد بیماری انتخاب‌شده با موتور درخواست‌شده یکسان نیست؛ مقایسه متوقف شد.',['ناسازگاری شناسه بیماری بین ورودی و موتور.'])
 const refs=REFERENCE_BASELINES.filter(x=>x.disease===disease)
 if(!refs.length)return empty('no-match','برای این بیماری Baseline عددی تأییدشده‌ای در کتابخانه ثبت نشده است؛ هیچ محدوده‌ای برای مقایسه انتخاب نشد.',['نبود مرجع عددی تأییدشده برای این بیماری.'])
 const missing=(['vendor','assayOrKit','method','unit','population','ageWindow','vaccineProgram'] as const).filter(k=>!present(context[k]))
 if(missing.length)return empty('reference-only','اطلاعات لازم برای تطبیق کامل Baseline وارد نشده است؛ مرجع فقط برای مطالعه نمایش داده می‌شود و در تفسیر عددی استفاده نمی‌شود.',['اطلاعات تطبیق ناقص است: '+missing.join('، ')])
 const exact=refs.find(x=>{
  const m=x as ReferenceBaseline & {method?:string;catalog?:string;assayVersion?:string;unit?:string}
  return norm(x.vendor)===norm(context.vendor)&&norm(x.assayOrKit)===norm(context.assayOrKit)
   &&norm(m.method||'')===norm(context.method)&&norm(m.unit||x.numericRange?.unit||'')===norm(context.unit)
   &&norm(x.population)===norm(context.population)&&norm(x.ageWindow||'')===norm(context.ageWindow)
   &&norm(x.vaccineProgram||'')===norm(context.vaccineProgram)
   &&(present(m.catalog) ? present(context.catalog)&&norm(m.catalog!)===norm(context.catalog!) : !present(context.catalog))
   &&(present(m.assayVersion) ? present(context.assayVersion)&&norm(m.assayVersion!)===norm(context.assayVersion!) : !present(context.assayVersion))
 })
 if(!exact)return empty('reference-only','Baseline این بیماری در کتابخانه وجود دارد، اما تطابق دقیق سازنده، آزمون، روش، مقیاس، جمعیت، سن و برنامه واکسن احراز نشد. مقایسه عددی مسدود است.',['هیچ مرجعی تمام مشخصات این نمونه را صریح و کامل پوشش نمی‌دهد.','شباهت نام کیت یا بیماری برای تطبیق کافی نیست.'])
 const range=exact.numericRange
 const validRange=Boolean(range&&Number.isFinite(range.low)&&Number.isFinite(range.high)&&range.low<=range.high&&present(range.unit))
 const sourceComplete=present(exact.sourceTitle)&&present(exact.sourceVersion)&&present(exact.sourceUrl)
 if(exact.numericComparisonEligible!==true||!validRange||!sourceComplete)return {
  status:'reference-only',usableForNumericComparison:false,baselineId:exact.id,
  explanationFa:'مشخصات مرجع با ورودی منطبق است، اما مجوز مقایسه عددی فعال نیست یا محدوده/ردیابی منبع کامل و معتبر نیست؛ اعداد صرفاً برای مطالعه نمایش داده می‌شوند.',
  reasonsFa:['پرچم numericComparisonEligible، محدوده عددی معتبر (حد پایین ≤ حد بالا و واحد مشخص) و اطلاعات کامل منبع همگی باید برقرار باشند.','مثال سازنده را نمی‌توان بدون تأیید کیت، کالیبراسیون و کاربرد به مقایسه عددی تبدیل کرد.'],
  source:exact.sourceTitle,sourceVersion:exact.sourceVersion,sourceUrl:exact.sourceUrl,numericRange:null
 }
 return {status:'exact-match',usableForNumericComparison:true,baselineId:exact.id,
 explanationFa:'تطابق مشخصات با مرجع ثبت‌شده برقرار است. این مقایسه فقط توصیفی و در محدوده کاربرد سند است؛ Baseline به‌تنهایی معیار حفاظت یا تشخیص نیست.',
 reasonsFa:[],source:exact.sourceTitle,sourceVersion:exact.sourceVersion,sourceUrl:exact.sourceUrl,numericRange:range}
}
export const assessIbdBaseline=(c:BaselineContext)=>assess('IBD',c)
export const assessIbvBaseline=(c:BaselineContext)=>assess('IBV',c)
export const assessNdBaseline=(c:BaselineContext)=>assess('ND',c)
export const assessAivBaseline=(c:BaselineContext)=>assess('AIV',c)
