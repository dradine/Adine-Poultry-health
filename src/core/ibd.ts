export type IbdInput = {
  samplingAgeDays: number
  breakthroughTiter: number
  halfLifeDays: number
  susceptiblePercent: number
  titers: number[]
  assayMethod?: string
  measurementScale?: string
  minimumVaccinationAgeDays?: number
  correctionDays?: number
  minimumSampleCount?: number
  minimumSampleCountSource?: string
}
export type IbdOutput = {
  log2PercentileTiter: number
  percentileTiter: number
  percentileRank: number
  rawCalculatedAgeDays: number
  estimatedVaccinationAgeDays: number | null
  minimumVaccinationAgeDays: number
  labelConstrainedVaccinationAgeDays: number
  labelMinimumApplied: boolean
  thresholdAlreadyReachedAtSampling: boolean
  sampleCount: number
  arithmeticMean: number
  medianTiter: number
  geometricMeanTiter: number
  log2StandardDeviation: number
  minimumTiter: number
  maximumTiter: number
  coefficientOfVariationPercent: number
  warnings: string[]
}
export type VaccinationTimingInput = {
  currentTiter: number
  samplingAgeDays: number
  minimumVaccinationAgeDays: number
  breakthroughTiter: number
  halfLifeDays: number
  sampledAt: string
  correctionHours?: number
}
export type VaccinationTimingOutput = {
  status: 'future-window' | 'label-minimum-floor' | 'threshold-already-reached'
  hoursUntilThreshold: number | null
  wholeHours: number | null
  remainingMinutes: number | null
  targetAt: string | null
  daysUntilThreshold: number | null
  warnings: string[]
}

/**
 * Estimates when the selected antibody titre reaches the product BTT on a
 * log2 decay curve. This is a mathematical timing window, not a vaccination
 * order or a claim of clinical protection.
 */
export function calculateVaccinationTiming(input: VaccinationTimingInput): VaccinationTimingOutput {
  const { currentTiter, breakthroughTiter, halfLifeDays, sampledAt, correctionHours = 0, samplingAgeDays, minimumVaccinationAgeDays } = input
  if (!Number.isFinite(currentTiter) || currentTiter <= 0) throw new Error('تیتر فعلی باید عدد مثبت باشد.')
  if (!Number.isFinite(breakthroughTiter) || breakthroughTiter <= 0) throw new Error('BTT باید عدد مثبت باشد.')
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) throw new Error('نیمه‌عمر باید عددی مثبت باشد.')
  if (!Number.isFinite(samplingAgeDays) || samplingAgeDays < 0 || samplingAgeDays > 365) throw new Error('سن نمونه‌گیری برای محاسبه حداقل سن برچسب معتبر نیست.')
  if (!Number.isFinite(minimumVaccinationAgeDays) || minimumVaccinationAgeDays < 0 || minimumVaccinationAgeDays > 365) throw new Error('حداقل سن مجاز باید از برچسب دقیق محصول واکسن ثبت شود.')
  if (!Number.isFinite(correctionHours) || correctionHours < 0 || correctionHours > 96) throw new Error('اصلاح زمانی باید بین صفر تا ۹۶ ساعت باشد.')
  if (correctionHours > 0 && samplingAgeDays > 4) throw new Error('اصلاح ۰ تا ۴ روز فقط برای نمونه‌گیری در سن ۰ تا ۴ روز مجاز است؛ برای نمونه‌گیری پس از روز چهارم، اصلاح باید صفر باشد.')
  const sampledTimestamp = Date.parse(sampledAt)
  if (!Number.isFinite(sampledTimestamp)) throw new Error('تاریخ و ساعت نمونه‌گیری معتبر نیست.')
  const warnings = [
    'این زمان، رسیدن مدل افت آنتی‌بادی به BTT را نشان می‌دهد و به‌تنهایی دستور واکسیناسیون یا تضمین حفاظت نیست.',
    'حداقل سن مجاز برچسب محصول یک کف اجباری است و هرگز با برآورد زودتر مدل کنار گذاشته نمی‌شود.',
    'پیش از اجرا، IFU واکسن و کیت، وضعیت بالینی گله، زنجیره سرد، مسیر اجرا و نظر دامپزشک بررسی شود.',
  ]
  const modelHours = currentTiter <= breakthroughTiter
    ? 0
    : halfLifeDays * 24 * Math.log2(currentTiter / breakthroughTiter) + correctionHours
  const labelMinimumHours = Math.max(0, (minimumVaccinationAgeDays - samplingAgeDays) * 24)
  const hoursUntilThreshold = Math.max(modelHours, labelMinimumHours)
  if (!Number.isFinite(hoursUntilThreshold)) throw new Error('زمان برآوردی خارج از محدوده عددی قابل محاسبه است؛ ورودی‌ها و نیمه‌عمر را بازبینی کنید.')
  if (hoursUntilThreshold <= 0) {
    return { status: 'threshold-already-reached', hoursUntilThreshold: null, wholeHours: null, remainingMinutes: null, targetAt: null, daysUntilThreshold: null, warnings: [...warnings, 'BTT در زمان نمونه‌گیری حاصل شده و حداقل سن برچسب نیز سپری شده است؛ این مدل تاریخ آینده‌ای تولید نمی‌کند.'] }
  }
  const labelMinimumApplied = labelMinimumHours > modelHours
  let wholeHours = Math.floor(hoursUntilThreshold)
  let remainingMinutes = Math.round((hoursUntilThreshold - wholeHours) * 60)
  if (remainingMinutes === 60) { wholeHours += 1; remainingMinutes = 0 }
  const targetAt = new Date(sampledTimestamp + hoursUntilThreshold * 60 * 60 * 1000).toISOString()
  if (labelMinimumApplied) warnings.push('حداقل سن برچسب محصول (' + minimumVaccinationAgeDays + ' روز) از زمان خام مدل دیرتر است؛ تاریخ نمایش‌داده‌شده زودترین زمان مجاز طبق برچسب است، نه تاریخ خام رسیدن تیتر به BTT.')
  return { status: labelMinimumApplied ? 'label-minimum-floor' : 'future-window', hoursUntilThreshold, wholeHours, remainingMinutes, targetAt, daysUntilThreshold: hoursUntilThreshold / 24, warnings }
}
export type IbdDeventerProductGateInput = {
  diseaseCode: string
  platform: string
  modelFamily: string | null
  validationStatus: string
  bttAssayKitId: string | null
  selectedAssayKitId: string
}
/** Only documented conventional-live IBD products paired to their exact BTT assay may enter this Deventer MVP. */
export function validateIbdDeventerProductGate(input: IbdDeventerProductGateInput): string[] {
  const errors: string[] = []
  if (input.diseaseCode !== 'IBD') errors.push('محصول انتخاب‌شده برای بیماری IBD نیست.')
  if (input.platform !== 'live' || input.modelFamily !== 'deventer_live') errors.push('مدل Deventer فقط برای واکسن زنده متعارف IBD با model_family=deventer_live قابل بررسی است؛ immune-complex و HVT-VP2 مجاز نیستند.')
  if (input.validationStatus !== 'documented') errors.push('برچسب محصول در سطح مستند و تأییدشده ثبت نشده است.')
  if (!input.bttAssayKitId || input.bttAssayKitId !== input.selectedAssayKitId) errors.push('کیت انتخاب‌شده با کیت دقیق تعریف BTT این محصول یکسان نیست.')
  return errors
}
export type IbdRunGateInput = {
  plateControlsAccepted: boolean
  representativeRandomSampling: boolean
  assayVaccinePairingVerified: boolean
}
export function validateIbdRunGate(input: IbdRunGateInput): string[] {
  const errors: string[] = []
  if (!input.plateControlsAccepted) errors.push('اعتبار کنترل‌های مثبت/منفی و کنترل مرجعِ قابل‌اعمال باید طبق IFU همان کیت و SOP آزمایشگاه تأیید شود.')
  if (!input.representativeRandomSampling) errors.push('نمونه‌گیری تصادفی و نماینده از نقاط مختلف سالن هنوز تأیید نشده است.')
  if (!input.assayVaccinePairingVerified) errors.push('تطابق دقیق BTT واکسن با سازنده، شماره کیت، نسخه روش و واحد تیتر تأیید نشده است.')
  return errors
}
function nearestRank(sorted: number[], percentile: number): { value: number; rank: number } {
  if (!sorted.length) throw new Error('برای محاسبه، تیتر معتبر لازم است.')
  const rank = Math.max(1, Math.ceil((percentile / 100) * sorted.length))
  return { value: sorted[Math.max(0, Math.min(sorted.length - 1, rank - 1))], rank }
}
/** Mathematical Deventer-style estimator for conventional live IBD vaccines only.
 * Does not validate assay, product BTT, half-life, sampling or field protection. */
export function calculateIbdWindow(input: IbdInput): IbdOutput {
  const { samplingAgeDays, breakthroughTiter, halfLifeDays, susceptiblePercent, titers,
    correctionDays = 0, minimumSampleCount, minimumVaccinationAgeDays } = input
  if (input.assayMethod !== 'ELISA') throw new Error('مدل Deventer فقط برای آزمون ELISA قابل استفاده است؛ HI، VN و روش‌های دیگر مجاز نیستند.')
  if (input.measurementScale !== 'elisa-titer') throw new Error('ورودی باید تیتر محاسبه‌شده با فرمول/نرم‌افزار همان کیت باشد؛ OD، S/P و S/N خام قابل استفاده نیستند.')
  if (!Number.isFinite(samplingAgeDays) || samplingAgeDays < 0 || samplingAgeDays > 365) throw new Error('سن نمونه‌گیری معتبر نیست.')
  if (!Number.isFinite(breakthroughTiter) || breakthroughTiter <= 0) throw new Error('BTT باید مثبت و مستند به همان محصول و مقیاس آزمون باشد.')
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) throw new Error('نیمه‌عمر باید مثبت و مستند به جمعیت و روش آزمون باشد.')
  if (!Number.isFinite(minimumVaccinationAgeDays) || minimumVaccinationAgeDays! < 0 || minimumVaccinationAgeDays! > 365) throw new Error('حداقل سن مجاز واکسن باید از برچسب دقیق همان محصول ثبت شود؛ بدون آن زمان‌بندی فعال نمی‌شود.')
  if (!Number.isFinite(susceptiblePercent) || susceptiblePercent <= 0 || susceptiblePercent >= 100) throw new Error('درصد هدف باید بین صفر و صد باشد.')
  if (minimumSampleCount !== undefined && (!Number.isInteger(minimumSampleCount) || minimumSampleCount < 2)) throw new Error('حداقل تعداد نمونه باید یک عدد صحیح حداقل ۲ باشد؛ در غیر این صورت آن را خالی بگذارید و از فرض عمومی استفاده نکنید.')
  if (!Number.isFinite(correctionDays) || correctionDays < 0 || correctionDays > 4) throw new Error('اصلاح سن نمونه‌گیری باید بین صفر تا چهار روز باشد.')
  if (samplingAgeDays > 4 && correctionDays !== 0) throw new Error('اصلاح ۰ تا ۴ روز فقط برای نمونه‌گیری در سن ۰ تا ۴ روز مجاز است؛ بروشور همان محصول ملاک نهایی است.')
  if (!Array.isArray(titers) || titers.length < 2) throw new Error('برای محاسبه توصیفی حداقل دو تیتر معتبر لازم است؛ با یک نمونه تحلیل پراکندگی/صدک انجام نمی‌شود.')
  if (titers.some(v => !Number.isFinite(v) || v <= 0 || v > 1e9)) throw new Error('همه تیترها باید عدد مثبت باشند. نتایج زیر حد تشخیص، بالاتر از محدوده، نامعتبر یا مفقود را عددگذاری نکنید.')
  const sorted = [...titers].sort((a,b) => a-b)
  const selected = nearestRank(sorted, susceptiblePercent)
  const percentileTiter = selected.value
  const percentileRank = selected.rank
  const log2PercentileTiter = Math.log2(percentileTiter)
  const rawCalculatedAgeDays = samplingAgeDays + (log2PercentileTiter - Math.log2(breakthroughTiter)) * halfLifeDays + correctionDays
  // An observed selected titre already at/below the product BTT cannot be made "not yet susceptible" by a positive age-correction term.
  const thresholdAlreadyReachedAtSampling = percentileTiter <= breakthroughTiter || rawCalculatedAgeDays <= samplingAgeDays
  const estimatedVaccinationAgeDays = thresholdAlreadyReachedAtSampling ? null : rawCalculatedAgeDays
  const labelConstrainedVaccinationAgeDays = thresholdAlreadyReachedAtSampling
    ? Math.max(samplingAgeDays, minimumVaccinationAgeDays!)
    : Math.max(rawCalculatedAgeDays, minimumVaccinationAgeDays!)
  const labelMinimumApplied = thresholdAlreadyReachedAtSampling
    ? minimumVaccinationAgeDays! > samplingAgeDays
    : minimumVaccinationAgeDays! > rawCalculatedAgeDays
  const arithmeticMean = titers.reduce((s,v)=>s+v,0)/titers.length
  const medianTiter = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  const geometricMeanTiter = Math.exp(titers.reduce((s,v)=>s+Math.log(v),0)/titers.length)
  const variance = titers.reduce((s,v)=>s+(v-arithmeticMean)**2,0)/(titers.length-1)
  const log2Values = titers.map(v=>Math.log2(v))
  const log2Mean = log2Values.reduce((s,v)=>s+v,0)/log2Values.length
  const log2Variance = log2Values.reduce((s,v)=>s+(v-log2Mean)**2,0)/(log2Values.length-1)
  const log2StandardDeviation = Math.sqrt(log2Variance)
  const minimumTiter = sorted[0]
  const maximumTiter = sorted[sorted.length-1]
  const coefficientOfVariationPercent = titers.length>1 && arithmeticMean>0 ? Math.sqrt(variance)/arithmeticMean*100 : 0
  const warnings = []
  if (minimumSampleCount !== undefined && titers.length < minimumSampleCount) warnings.push(`تعداد نمونه (${titers.length}) کمتر از راهنمای/حداقل ثبت‌شده این تحلیل (${minimumSampleCount}) است؛ خروجی صرفاً اکتشافی و توصیفی محسوب شود و برای تعمیم به کل گله یا تصمیم قطعی استفاده نشود.`)
  if (minimumSampleCount === undefined) warnings.push('حداقل تعداد نمونه اختصاصی این محصول/کیت وارد نشده است؛ کفایت حجم نمونه قابل ارزیابی نیست، محاسبه صرفاً اکتشافی است و هیچ مقدار عمومی جایگزین نشده است.')
  if (titers.length < 10) warnings.push('حجم نمونه بسیار کم (n<10): صدک پایین و زمان برآوردی به چند مشاهده وابسته است؛ ناپایداری و عدم‌قطعیت زیاد است. تحلیل فقط اکتشافی است.')
  else if (titers.length < 18) warnings.push('حجم نمونه محدود (n<18): برآورد تیتر و زمان واکسیناسیون ممکن است ناپایدار باشد؛ نمونه‌گیری تکمیلی توصیه می‌شود.')
  if (percentileRank <= 3) warnings.push(`صدک انتخاب‌شده به ${percentileRank} مشاهده از انتهای پایین توزیع متکی است؛ در نمونه ${titers.length}تایی این برآورد ناپایدار است. تحلیل حساسیت ۵٪، ۲۵٪، ۷۵٪ و ۹۰٪ را هم بررسی کنید.`)
  if (minimumSampleCount !== undefined && !input.minimumSampleCountSource?.trim()) warnings.push('منبع حداقل تعداد نمونه ثبت نشده است؛ عدد واردشده هنوز به IFU/برچسب همان محصول و کیت متصل نشده است.')
  else if (minimumSampleCount !== undefined && input.minimumSampleCountSource?.trim()) warnings.push('مبنای حداقل تعداد نمونه: ' + input.minimumSampleCountSource.trim() + '.')
  if (thresholdAlreadyReachedAtSampling) warnings.push(percentileTiter <= breakthroughTiter ? 'تیتر صدک انتخابی در زمان نمونه‌گیری برابر یا پایین‌تر از BTT مستند محصول است؛ اصلاح سن نمی‌تواند این مشاهده را به یک پنجره آینده تبدیل کند و آستانه در زمان نمونه‌گیری قبلاً حاصل شده است.' : 'برآورد خام به سن نمونه‌گیری یا قبل از آن رسیده است؛ ممکن است آستانه در زمان نمونه‌گیری قبلاً حاصل شده باشد.')
  if (labelMinimumApplied) warnings.push('حداقل سن برچسب محصول (' + minimumVaccinationAgeDays + ' روز) از برآورد خام مدل دیرتر است؛ سن قابل اجرا پیش از این حداقل نخواهد بود.')
  warnings.push('CV توصیفی است و به‌تنهایی حد پذیرش یا رد جهانی برای زمان‌بندی واکسن نیست.')
  warnings.push('این محاسبه فقط برای واکسن زنده متعارف IBD و در صورت تطابق دقیق روش، کیت، BTT و نیمه‌عمر قابل بررسی است؛ برای immune-complex یا HVT-VP2 استفاده نشود مگر مدل اختصاصی و اعتبارسنجی شده باشد.')
  return { log2PercentileTiter, percentileTiter, percentileRank, rawCalculatedAgeDays, estimatedVaccinationAgeDays,
    minimumVaccinationAgeDays: minimumVaccinationAgeDays!, labelConstrainedVaccinationAgeDays, labelMinimumApplied,
    thresholdAlreadyReachedAtSampling, sampleCount:titers.length, arithmeticMean, medianTiter,
    geometricMeanTiter, log2StandardDeviation, minimumTiter, maximumTiter,
    coefficientOfVariationPercent, warnings }
}

export type IbdSensitivityPoint = { susceptiblePercent: number; vaccinationAgeDays: number | null; labelConstrainedVaccinationAgeDays: number; labelMinimumApplied: boolean; selectedTiter: number; selectedRank: number }
export function calculateIbdSensitivity(input: IbdInput, percentages: number[] = [5, 25, 75, 90]): IbdSensitivityPoint[] {
  return percentages.map(susceptiblePercent => {
    const result = calculateIbdWindow({ ...input, susceptiblePercent })
    return { susceptiblePercent, vaccinationAgeDays: result.estimatedVaccinationAgeDays, labelConstrainedVaccinationAgeDays: result.labelConstrainedVaccinationAgeDays, labelMinimumApplied: result.labelMinimumApplied, selectedTiter: result.percentileTiter, selectedRank: result.percentileRank }
  })
}
export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٫/g,'.').replace(/٬/g,'')
}
export function parseTiters(value: string): number[] {
  return value.split(/[\s,،;；]+/).map(item=>item.trim()).filter(Boolean).map(item=>Number(normalizeDigits(item)))
}
