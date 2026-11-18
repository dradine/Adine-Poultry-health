export type MdaDecayInput={sampleAgeDays:number;sampleTiter:number;halfLifeDays:number;thresholdTiter:number}
export type MdaDecayOutput={estimatedHatchTiter:number;estimatedThresholdAgeDays:number|null;alreadyBelowThresholdAtHatch:boolean;predictedAtDays:Array<{day:number;titer:number}>;warnings:string[]}
/** Exploratory exponential decay estimator: titer(t)=titer0*2^(-t/halfLife). Assay scale and threshold must be assay-specific. */
export function estimateMaternalAntibodyDecay(input:MdaDecayInput):MdaDecayOutput{
 const {sampleAgeDays,sampleTiter,halfLifeDays,thresholdTiter}=input
 if(!Number.isFinite(sampleAgeDays)||sampleAgeDays<0||sampleAgeDays>4)throw Error('این برآورد بازسازی تیتر زمان هچ را فقط با نمونه روز ۰ تا ۴ انجام می‌دهد؛ سن نمونه خارج از دامنه است.')
 if(!Number.isFinite(sampleTiter)||sampleTiter<=0||sampleTiter>1e9)throw Error('تیتر نمونه باید مثبت و در محدوده معتبر آزمون باشد.')
 if(!Number.isFinite(halfLifeDays)||halfLifeDays<=0||halfLifeDays>100)throw Error('نیمه‌عمر باید مثبت و مستند به همان جمعیت و assay باشد.')
 if(!Number.isFinite(thresholdTiter)||thresholdTiter<=0||thresholdTiter>1e9)throw Error('آستانه تداخل باید مثبت و از مطالعه/بروشور همان آزمون باشد.')
 const hatch=sampleTiter*2**(sampleAgeDays/halfLifeDays)
 const below=hatch<thresholdTiter
 const crossing=below?null:halfLifeDays*Math.log2(hatch/thresholdTiter)
 return {estimatedHatchTiter:hatch,estimatedThresholdAgeDays:crossing,alreadyBelowThresholdAtHatch:below,
 predictedAtDays:[0,1,2,3,4,7,10,14,18,21,28].map(day=>({day,titer:hatch*2**(-day/halfLifeDays)})),
 warnings:[
 'این منحنی صرفاً مدل افت نمایی آنتی‌بادی است؛ نیمه‌عمر و threshold باید از داده معتبر همین پرنده/گله، آنتی‌ژن و آزمون تأمین شوند.',
 'ELISA OD، S/P، تیتر تبدیل‌شده، HI و VN مقیاس‌های قابل‌جایگزینی نیستند. فقط داده و threshold هم‌کیت/هم‌واحد را وارد کنید.',
 'آنتی‌بادی مادری علیه آنتی‌ژن هدف با آنتی‌بادی علیه وکتور یا پاسخ ایمنی سلولی یکی نیست؛ برای واکسن وکتوری/immune-complex این مدل به‌تنهایی قابل استفاده نیست.',
 ...(sampleAgeDays===0?[]:['نمونه روز صفر نیست؛ تیتر روز هچ با برون‌یابی نیمه‌عمر محاسبه شده و عدم‌قطعیت آن باید در تفسیر لحاظ شود.']),
 ...(below?['تیتر بازسازی‌شده روز هچ از threshold کمتر است؛ زمان عبور از threshold قابل برآورد نیست.']:[])
 ]}
}
