/** IBV serology trend monitor. Never equates serum titer with mucosal protection/cross-protection. */
export type IbvObservation={day:number;value:number}
export type IbvTrendInput={observations:IbvObservation[];assay:string;kitLot?:string;vaccineStrain?:string;route?:string;unit:'ELISA'|'HI-log2'|'VN'}
export type IbvTrendOutput={n:number;firstDay:number;lastDay:number;firstValue:number;lastValue:number;absoluteChange:number;foldChange:number|null;direction:'up'|'down'|'stable';slopePerDay:number;warnings:string[]}
export function analyzeIbvTrend(input:IbvTrendInput):IbvTrendOutput{
 const o=[...input.observations].sort((a,b)=>a.day-b.day)
 if(o.length<2)throw Error('برای تحلیل روند حداقل دو مشاهده در زمان‌های متفاوت لازم است.')
 if(o.some(x=>!Number.isFinite(x.day)||x.day<0||!Number.isFinite(x.value)||x.value<=0))throw Error('روز و مقدار آزمون باید معتبر و مثبت باشند.')
 if(new Set(o.map(x=>x.day)).size!==o.length)throw Error('برای هر روز فقط یک مقدار وارد کنید یا ابتدا نتایج تکراری را طبق SOP تجمیع کنید.')
 if(!input.assay.trim())throw Error('نام آزمون و کیت الزامی است.')
 const f=o[0],l=o[o.length-1],delta=l.value-f.value
 const meanX=o.reduce((s,x)=>s+x.day,0)/o.length,meanY=o.reduce((s,x)=>s+x.value,0)/o.length
 const slope=o.reduce((s,x)=>s+(x.day-meanX)*(x.value-meanY),0)/o.reduce((s,x)=>s+(x.day-meanX)**2,0)
 return {n:o.length,firstDay:f.day,lastDay:l.day,firstValue:f.value,lastValue:l.value,absoluteChange:delta,foldChange:l.value/f.value,direction:Math.abs(delta)<=Math.max(f.value,l.value)*.05?'stable':delta>0?'up':'down',slopePerDay:slope,
 warnings:['روند سرمی به‌تنهایی حفاظت مخاطی، جلوگیری از دفع ویروس یا cross-protection را تعیین نمی‌کند.',
 'مقادیر فقط در assay/کیت/واحد همسان قابل مقایسه‌اند؛ تبدیل بین ELISA، HI و VN معتبر نیست.',
 'تفسیر بالینی به سویه واکسن/میدانی، route، علائم، PCR/typing و شواهد میدانی نیاز دارد.']}
}
