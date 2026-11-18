/** Newcastle HI monitor. Paired statistics require explicit bird identifiers. */
export type NdPairedObservation={birdId:string;baselineHiLog2:number;postHiLog2:number}
export type NdMonitorInput={
 baselineHiLog2?:number[]
 postHiLog2:number[]
 pairedObservations?:NdPairedObservation[]
 assayAntigen:string
 vaccineProduct:string
 route:string
 samplingDaysAfterDose:number
 responseThresholdLog2?:number
}
export type NdMonitorOutput={
 n:number;geometricMeanLog2:number;geometricMeanReciprocal:number;medianLog2:number
 minLog2:number;maxLog2:number;sdLog2:number;cvReciprocalPercent:number
 q1Log2:number;q3Log2:number;distribution:Array<{log2:number;count:number;percent:number}>
 responders:number|null;responderPercent:number|null;baselineN:number|null
 baselineGeometricMeanLog2:number|null;meanLog2Rise:number|null;fourfoldRisePercent:number|null
 pairedN:number;warnings:string[]
}
const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2}
const quantile=(values:number[],p:number)=>{const sorted=[...values].sort((a,b)=>a-b);const pos=(sorted.length-1)*p;const lo=Math.floor(pos),hi=Math.ceil(pos);return sorted[lo]+(sorted[hi]-sorted[lo])*(pos-lo)}
export function monitorNdHi(input:NdMonitorInput):NdMonitorOutput{
 const values=input.postHiLog2,baseline=input.baselineHiLog2,paired=input.pairedObservations||[]
 if(!values.length||values.some(x=>!Number.isInteger(x)||x<0||x>20))throw Error('هر نتیجه انفرادی HI باید endpoint صحیح و گسسته log2 بین ۰ تا ۲۰ باشد؛ میانگین گروهی را به‌عنوان تیتر انفرادی وارد نکنید.')
 if(baseline&&baseline.some(x=>!Number.isInteger(x)||x<0||x>20))throw Error('هر نتیجه انفرادی Baseline باید endpoint صحیح و گسسته HI log2 بین ۰ تا ۲۰ باشد.')
 if(paired.some(p=>!p.birdId.trim()||!Number.isInteger(p.baselineHiLog2)||p.baselineHiLog2<0||p.baselineHiLog2>20||!Number.isInteger(p.postHiLog2)||p.postHiLog2<0||p.postHiLog2>20))throw Error('داده paired باید شناسه پرنده و دو تیتر معتبر HI log2 داشته باشد.')
 if(new Set(paired.map(p=>p.birdId.trim())).size!==paired.length)throw Error('شناسه پرنده در داده paired تکراری است؛ هر پرنده فقط یک بار ثبت شود.')
 if(paired.length>values.length)throw Error('تعداد داده‌های paired از تعداد نتایج HI پس از واکسن بیشتر است؛ مجموعه داده‌ها را بازبینی کنید.')
 const availablePost=new Map<number,number>();values.forEach(value=>availablePost.set(value,(availablePost.get(value)||0)+1))
 for(const observation of paired){const remaining=availablePost.get(observation.postHiLog2)||0;if(remaining<1)throw Error('مقدار HI پس از واکسن در داده paired در مجموعه نتایج پس از واکسن وجود ندارد؛ دو مجموعه باید از یک گروه نمونه باشند.');availablePost.set(observation.postHiLog2,remaining-1)}
 if(!input.assayAntigen.trim()||!input.vaccineProduct.trim()||!input.route.trim())throw Error('آنتی‌ژن آزمون، محصول واکسن و مسیر تجویز الزامی است.')
 if(!Number.isFinite(input.samplingDaysAfterDose)||input.samplingDaysAfterDose<0||input.samplingDaysAfterDose>365)throw Error('روز نمونه‌گیری باید بین ۰ تا ۳۶۵ روز باشد.')
 const threshold=input.responseThresholdLog2
 if(threshold!==undefined&&(!Number.isInteger(threshold)||threshold<0||threshold>20))throw Error('آستانه پاسخ HI باید endpoint صحیح ۰ تا ۲۰ log2 و مستند به پروتکل باشد.')
 const mean=values.reduce((s,v)=>s+v,0)/values.length,sd=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length)
 const reciprocal=values.map(v=>2**v),recMean=reciprocal.reduce((s,v)=>s+v,0)/values.length,recSd=Math.sqrt(reciprocal.reduce((s,v)=>s+(v-recMean)**2,0)/values.length)
 const distributionMap=new Map<number,number>();values.forEach(v=>distributionMap.set(v,(distributionMap.get(v)||0)+1))
 const distribution=[...distributionMap.entries()].sort((a,b)=>a[0]-b[0]).map(([log2,count])=>({log2,count,percent:count*100/values.length}))
 const responders=threshold===undefined?null:values.filter(v=>v>=threshold).length
 const rises=paired.map(p=>p.postHiLog2-p.baselineHiLog2)
 const pairedBaselineMean=paired.length?paired.reduce((s,p)=>s+p.baselineHiLog2,0)/paired.length:null
 return {n:values.length,geometricMeanLog2:mean,geometricMeanReciprocal:2**mean,medianLog2:median(values),minLog2:Math.min(...values),maxLog2:Math.max(...values),sdLog2:sd,cvReciprocalPercent:recMean?100*recSd/recMean:0,q1Log2:quantile(values,.25),q3Log2:quantile(values,.75),distribution,
 responders,responderPercent:responders===null?null:100*responders/values.length,baselineN:baseline?.length??(paired.length||null),
 baselineGeometricMeanLog2:baseline?baseline.reduce((s,v)=>s+v,0)/baseline.length:pairedBaselineMean,
 meanLog2Rise:rises.length?rises.reduce((s,v)=>s+v,0)/rises.length:null,
 fourfoldRisePercent:rises.length?100*rises.filter(v=>v>=2).length/rises.length:null,pairedN:paired.length,
 warnings:[
 'HI به‌صورت endpoint انفرادی گسسته log2 توصیف شده است؛ آنتی‌ژن، HAU، RBC، SOP و آزمایشگاه باید ثبت شوند. میانگین‌های اعشاری گروهی ورودی تیتر انفرادی نیستند.',
 'این خروجی پایش سرولوژیک است؛ HI به‌تنهایی حفاظت، جلوگیری از دفع یا انتقال ویروس را اثبات نمی‌کند.',
 ...(threshold===undefined?['آستانه responder تعریف نشده؛ تعداد و درصد responder محاسبه نشده‌اند.']:['آستانه responder صرفاً ورودی پروتکل شماست و cutoff حفاظتی عمومی نیست.']),
 ...(baseline&&!paired.length?['Baseline جداگانه وارد شده است اما شناسه پرندگان و pairing واقعی ارائه نشده؛ شاخص‌های paired rise و چهاربرابرشدن محاسبه نشدند.']:[]),
 ...(paired.length?['تحلیل paired فقط برای شناسه‌هایی محاسبه شد که در ورودی صریح paired ثبت شده‌اند؛ بررسی صحت شناسه‌ها مسئولیت کاربر است.']:['داده paired با شناسه پرنده وارد نشده؛ افزایش تیتر و چهاربرابرشدن paired محاسبه نشد.'])
 ]}
}
