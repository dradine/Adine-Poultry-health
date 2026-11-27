/** IBV serology trend monitor. Serum trend does not equal mucosal protection/cross-protection. */
export type IbvObservation={day:number;value:number}
export type IbvTrendInput={observations:IbvObservation[];assay:string;measurementScale:string;kitLot?:string;vaccineStrain?:string;route?:string;unit:'ELISA'|'HI-log2'|'VN'}
export type IbvTrendOutput={n:number;assay:string;measurementScale:string;unit:'ELISA'|'HI-log2'|'VN';firstDay:number;lastDay:number;firstValue:number;lastValue:number;absoluteChange:number;lastToFirstRatio:number|null;direction:'up'|'down'|'stable';slopePerDay:number;mean:number;median:number;temporalSd:number;temporalCvPercent:number|null;rSquared:number|null;warnings:string[]}
const median=(v:number[])=>{const s=[...v].sort((a,b)=>a-b);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2}
export function analyzeIbvTrend(input:IbvTrendInput):IbvTrendOutput{
 const observations=[...input.observations].sort((a,b)=>a.day-b.day)
 if(observations.length<2)throw Error('برای تحلیل روند حداقل دو مشاهده در زمان‌های متفاوت لازم است.')
 if(observations.some(({day,value})=>!Number.isFinite(day)||day<0||day>365||!Number.isFinite(value)||(input.unit==='HI-log2'?(!Number.isInteger(value)||value<0):value<=0)))throw Error('روز باید ۰ تا ۳۶۵ و مقدار آزمون معتبر باشد؛ HI-log2 باید endpoint صحیح و گسسته (صفر یا بیشتر) باشد و سایر مقیاس‌ها باید مثبت باشند.')
 if(new Set(observations.map(o=>o.day)).size!==observations.length)throw Error('برای هر روز فقط یک مقدار وارد کنید یا نتایج تکراری را طبق SOP تجمیع کنید.')
 if(!input.assay.trim())throw Error('نام آزمون و کیت الزامی است.')
 if(!input.measurementScale.trim())throw Error('مقیاس دقیق عددی را مشخص کنید؛ برای ELISA بین OD، S/P و تیتر محاسبه‌شده تفاوت وجود دارد و این مقیاس‌ها نباید مخلوط شوند. برای VN نیز رقت معکوس یا log2 endpoint را صریح ثبت کنید.')
 const scale=input.measurementScale.trim().toLowerCase()
 const isLog2Scale=/log\\s*2/.test(scale)||scale.includes('log2')
 const isTitreScale=/(titer|titre|reciprocal|dilution)/i.test(scale)
 const mentionsRawScale=/\\bOD\\b|optical\\s*density|absorbance|S\\s*\\/\\s*[PN]|\\bS[PN]\\b|index|percent|%/i.test(scale)
 const isRawNonRatioScale=mentionsRawScale&&!isTitreScale&&!isLog2Scale
 if(input.unit==='HI-log2'&&!isLog2Scale)throw Error('برای HI-log2، مقیاس باید صریحاً log2 endpoint باشد؛ reciprocal titre را با log2 مخلوط نکنید.')
 if(input.unit==='VN'&&!isLog2Scale&&!isTitreScale)throw Error('برای VN، مقیاس باید صریحاً log2 endpoint یا reciprocal titre/dilution باشد.')
 if(input.unit==='ELISA'&&!isLog2Scale&&!isTitreScale&&!isRawNonRatioScale)throw Error('مقیاس ELISA باید OD، S/P، S/N یا تیتر محاسبه‌شده را صریحاً مشخص کند.')
 const first=observations[0],last=observations[observations.length-1],delta=last.value-first.value
 const meanX=observations.reduce((s,o)=>s+o.day,0)/observations.length,mean=observations.reduce((s,o)=>s+o.value,0)/observations.length
 const denom=observations.reduce((s,o)=>s+(o.day-meanX)**2,0)
 const slope=observations.reduce((s,o)=>s+(o.day-meanX)*(o.value-mean),0)/denom
 const ssTot=observations.reduce((s,o)=>s+(o.value-mean)**2,0),ssRes=observations.reduce((s,o)=>s+(o.value-(mean+slope*(o.day-meanX)))**2,0)
 const sd=Math.sqrt(ssTot/observations.length),r2=ssTot>0?Math.max(0,Math.min(1,1-ssRes/ssTot)):null
 const isRatioScale=isTitreScale&&!isLog2Scale&&!isRawNonRatioScale
 const lastToFirstRatio=isLog2Scale?2**delta:(isRatioScale&&first.value>0?last.value/first.value:null)
 const temporalCvPercent=isRatioScale&&mean!==0?100*sd/Math.abs(mean):null
 const direction=delta===0?'stable':delta>0?'up':'down'
 const foldWarning=isLog2Scale?'fold change از اختلاف log2 به‌صورت 2 به توان اختلاف محاسبه شده است؛ CV روی مقیاس log2 گزارش نمی‌شود.':isRatioScale?'نسبت آخر به اول فقط در همان مقیاس ratio/titre محاسبه شده است؛ این نسبت معادل افزایش حفاظت یا fold-neutralization نیست.':'برای مقیاس OD/S/P/SN یا index، fold ratio و temporal CV محاسبه نمی‌شود؛ این مقیاس‌ها ratio-scale نیستند.'
 return {n:observations.length,assay:input.assay,measurementScale:input.measurementScale,unit:input.unit,firstDay:first.day,lastDay:last.day,firstValue:first.value,lastValue:last.value,absoluteChange:delta,lastToFirstRatio,direction,slopePerDay:slope,mean,median:median(observations.map(o=>o.value)),temporalSd:sd,temporalCvPercent,rSquared:r2,warnings:[
 'روند سرمی به‌تنهایی حفاظت مخاطی، جلوگیری از دفع ویروس یا cross-protection را تعیین نمی‌کند.',
 'مقادیر فقط در assay/کیت/واحد همسان قابل مقایسه‌اند؛ تبدیل بین ELISA، HI و VN معتبر نیست.',
 foldWarning,
 'شیب و R² توصیف روند عددی هستند، نه معیار اعتبار آزمون یا اثبات پاسخ ایمنی؛ تفسیر بالینی به سویه واکسن/میدانی، route، علائم، PCR/typing و شواهد میدانی نیاز دارد.',
 ...(observations.length<3?['با کمتر از سه زمان نمونه‌گیری، R² برای قضاوت درباره برازش روند اطلاعات کافی ندارد؛ با دو نقطه برازش خطی معمولاً کامل است.']:[]),
 'SD این خروجی فقط پراکندگی مقادیر ثبت‌شده بین زمان‌های نمونه‌گیری است؛ نه SD تحلیلی کیت، نه CV بین پرندگان و نه شاخص یکنواختی گله.',
 'آستانه تغییر معنادار/پایدار بر پایه دقت‌پذیری (precision) و عدم‌قطعیت (uncertainty) همان آزمون در این نسخه تعریف نشده است؛ تغییرات کوچک را بدون داده تکرارپذیری آزمایشگاه معنادار تلقی نکنید.'
 ]}
}
