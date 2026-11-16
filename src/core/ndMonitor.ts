/** Newcastle serology monitor. Descriptive response metrics only; no protection inference. */
export type NdMonitorInput = {
  baselineHiLog2?: number[]
  postHiLog2: number[]
  assayAntigen: string
  vaccineProduct: string
  route: string
  samplingDaysAfterDose: number
  responseThresholdLog2?: number
}
export type NdMonitorOutput = {
  n: number; geometricMeanLog2: number; geometricMeanReciprocal: number
  medianLog2: number; minLog2: number; maxLog2: number
  responders: number; responderPercent: number
  baselineN: number | null; baselineGeometricMeanLog2: number | null
  meanLog2Rise: number | null; fourfoldRisePercent: number | null
  warnings: string[]
}
const median=(x:number[])=>{const a=[...x].sort((p,q)=>p-q);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2}
export function monitorNdHi(input:NdMonitorInput):NdMonitorOutput {
 const v=input.postHiLog2, b=input.baselineHiLog2
 if(!v.length||v.some(x=>!Number.isFinite(x)||x<0||x>20)) throw Error('HI پس از واکسن باید log2 رقت معتبر (۰ تا ۲۰) باشد.')
 if(b && (b.length!==v.length||b.some(x=>!Number.isFinite(x)||x<0||x>20))) throw Error('برای مقایسه paired، تیتر baseline باید هم‌اندازه و معتبر باشد.')
 if(!input.assayAntigen.trim()||!input.vaccineProduct.trim()||!input.route.trim()) throw Error('آنتی‌ژن آزمون، محصول واکسن و مسیر تجویز الزامی است.')
 if(!Number.isFinite(input.samplingDaysAfterDose)||input.samplingDaysAfterDose<0) throw Error('زمان نمونه‌گیری معتبر نیست.')
 const gm=v.reduce((s,x)=>s+x,0)/v.length, threshold=input.responseThresholdLog2
 if(threshold!==undefined&&(!Number.isFinite(threshold)||threshold<0||threshold>20))throw Error('آستانه پاسخ باید ۰ تا ۲۰ log2 و مستند به پروتکل باشد.')
 const responders=threshold===undefined?null:v.filter(x=>x>=threshold).length
 const rises=b? v.map((x,i)=>x-b[i]):null
 return {n:v.length,geometricMeanLog2:gm,geometricMeanReciprocal:2**gm,medianLog2:median(v),minLog2:Math.min(...v),maxLog2:Math.max(...v),
 responders:responders??0,responderPercent:responders===null?0:100*responders/v.length,
 baselineN:b?.length??null,baselineGeometricMeanLog2:b?b.reduce((s,x)=>s+x,0)/b.length:null,
 meanLog2Rise:rises?rises.reduce((s,x)=>s+x,0)/rises.length:null,
 fourfoldRisePercent:rises?100*rises.filter(x=>x>=2).length/rises.length:null,
 warnings:['این خروجی پایش سرولوژیک است؛ HI به‌تنهایی حفاظت، جلوگیری از دفع یا انتقال ویروس را اثبات نمی‌کند.',
 ...(threshold===undefined?['آستانه پاسخ تعریف نشده؛ درصد responder گزارش نشده است.']:['آستانه responder صرفاً ورودی پروتکل شماست و cutoff حفاظتی عمومی نیست.']),
 ...(!b?['نمونه baseline paired وجود ندارد؛ افزایش تیتر نسبت به قبل محاسبه نشد.']:[])]}
}
