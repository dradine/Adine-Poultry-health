export type MdaParameterOrigin='manufacturer-ifu'|'peer-reviewed-study'|'local-longitudinal-data'|'expert-assumption'
export type MdaParameterProvenance={
 assayIdentity:string
 measurementScale:string
 halfLifeSource:string
 thresholdSource:string
 halfLifeSourceVersion:string
 thresholdSourceVersion:string
 halfLifeOrigin:MdaParameterOrigin
 thresholdOrigin:MdaParameterOrigin
}
export function validateMdaParameterProvenance(value:Partial<MdaParameterProvenance>):string[]{
 const errors:string[]=[]
 if(!value.assayIdentity?.trim())errors.push('نام دقیق کیت/آزمون و آنتی‌ژن هدف ثبت نشده است.')
 if(!value.measurementScale?.trim())errors.push('مقیاس و واحد دقیق تیتر ثبت نشده است.')
 else {
  const scale=value.measurementScale.trim()
  const ratioTitre=/(?:titer|titre|تیتر|reciprocal|معکوس)/i.test(scale)
  const nonRatio=/\bOD\b|optical\s*density|absorbance|S\s*\/\s*[PN]|\bS[PN]\b|percent|%|index/i.test(scale)
  if(!ratioTitre||nonRatio)errors.push('مدل افت نمایی فقط برای تیتر مثبتِ ratio-scale با واحد مشخص (مانند ELISA titre یا HI reciprocal titre) قابل استفاده است؛ OD، S/P، S/N، درصد و index مجاز نیستند.')
 }
 if(!value.halfLifeSource?.trim())errors.push('منبع اختصاصی نیمه‌عمر ثبت نشده است.')
 if(!value.thresholdSource?.trim())errors.push('منبع اختصاصی threshold ثبت نشده است.')
 if(!value.halfLifeSourceVersion?.trim())errors.push('نسخه/صفحه/شناسه منبع نیمه‌عمر ثبت نشده است.')
 if(!value.thresholdSourceVersion?.trim())errors.push('نسخه/صفحه/شناسه منبع threshold ثبت نشده است.')
 if(!['manufacturer-ifu','peer-reviewed-study','local-longitudinal-data','expert-assumption'].includes(String(value.halfLifeOrigin)))errors.push('نوع منبع نیمه‌عمر مشخص نشده است.')
 if(!['manufacturer-ifu','peer-reviewed-study','local-longitudinal-data','expert-assumption'].includes(String(value.thresholdOrigin)))errors.push('نوع منبع threshold مشخص نشده است.')
 return errors
}
export type MdaDecayInput={sampleAgeDays:number;sampleTiter:number;halfLifeDays:number;thresholdTiter:number}
export type MdaDecayOutput={estimatedHatchTiter:number;estimatedThresholdAgeDays:number|null;alreadyBelowThresholdAtHatch:boolean;predictedAtDays:Array<{day:number;titer:number}>;warnings:string[]}
/** Exploratory exponential decay estimator: titer(t)=titer0*2^(-t/halfLife). Assay scale and threshold must be assay-specific. */
export function estimateMaternalAntibodyDecay(input:MdaDecayInput):MdaDecayOutput{
 const {sampleAgeDays,sampleTiter,halfLifeDays,thresholdTiter}=input
 if(!Number.isFinite(sampleAgeDays)||sampleAgeDays<0||sampleAgeDays>4)throw Error('این برآورد بازسازی تیتر زمان هچ را فقط با نمونه روز ۰ تا ۴ انجام می‌دهد؛ سن نمونه خارج از دامنه است.')
 if(!Number.isFinite(sampleTiter)||sampleTiter<=0||sampleTiter>1e9)throw Error('تیتر نمونه باید مثبت و در محدوده معتبر آزمون باشد.')
 if(!Number.isFinite(halfLifeDays)||halfLifeDays<=0)throw Error('نیمه‌عمر باید عددی مثبت و مستند به همان جمعیت و assay باشد؛ مقدار عمومی فرض نمی‌شود.')
 if(!Number.isFinite(thresholdTiter)||thresholdTiter<=0||thresholdTiter>1e9)throw Error('آستانه تداخل باید مثبت و از مطالعه/بروشور همان آزمون باشد.')
 const hatch=sampleTiter*2**(sampleAgeDays/halfLifeDays)
 if(!Number.isFinite(hatch)||hatch<=0)throw Error('برون‌یابی تیتر روز هچ از محدوده عددی قابل محاسبه خارج شد؛ ورودی‌ها و نیمه‌عمر را بررسی کنید.')
 const below=hatch<=thresholdTiter
 const crossing=below?null:halfLifeDays*Math.log2(hatch/thresholdTiter)
 return {estimatedHatchTiter:hatch,estimatedThresholdAgeDays:crossing,alreadyBelowThresholdAtHatch:below,
 predictedAtDays:[0,1,2,3,4,7,10,14,18,21,28].map(day=>({day,titer:hatch*2**(-day/halfLifeDays)})),
 warnings:[
 'این منحنی صرفاً مدل افت نمایی آنتی‌بادی است؛ نیمه‌عمر و threshold باید از داده معتبر همین پرنده/گله، آنتی‌ژن و آزمون تأمین شوند.',
 'ELISA OD، S/P، تیتر تبدیل‌شده، HI و VN مقیاس‌های قابل‌جایگزینی نیستند. فقط داده و threshold هم‌کیت/هم‌واحد را وارد کنید.',
 'آنتی‌بادی مادری علیه آنتی‌ژن هدف با آنتی‌بادی علیه وکتور یا پاسخ ایمنی سلولی یکی نیست؛ برای واکسن وکتوری/immune-complex این مدل به‌تنهایی قابل استفاده نیست.',
 ...(sampleAgeDays===0?[]:['نمونه روز صفر نیست؛ تیتر روز هچ با برون‌یابی نیمه‌عمر محاسبه شده و عدم‌قطعیت آن باید در تفسیر لحاظ شود.']),
 ...(below?['تیتر بازسازی‌شده روز هچ از threshold کمتر است؛ زمان عبور از threshold قابل برآورد نیست.']:[]),
 ...(!below && crossing !== null && crossing <= sampleAgeDays ? ['بر اساس ورودی فعلی، تیتر در زمان نمونه‌گیری در سطح threshold یا پایین‌تر قرار دارد؛ سن عبور محاسبه‌شده مربوط به گذشته یا زمان نمونه‌گیری است، نه یک زمان آینده برای واکسیناسیون.']:[])
 ]}
}
