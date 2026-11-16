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
  n: number
  geometricMeanLog2: number
  geometricMeanReciprocal: number
  medianLog2: number
  minLog2: number
  maxLog2: number
  responders: number | null
  responderPercent: number | null
  baselineN: number | null
  baselineGeometricMeanLog2: number | null
  meanLog2Rise: number | null
  fourfoldRisePercent: number | null
  warnings: string[]
}
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
}
export function monitorNdHi(input: NdMonitorInput): NdMonitorOutput {
  const values = input.postHiLog2
  const baseline = input.baselineHiLog2
  if (!values.length || values.some(x => !Number.isFinite(x) || x < 0 || x > 20)) {
    throw Error('HI پس از واکسن باید log2 رقت معتبر (۰ تا ۲۰) باشد.')
  }
  if (baseline && (baseline.length !== values.length || baseline.some(x => !Number.isFinite(x) || x < 0 || x > 20))) {
    throw Error('برای مقایسه paired، تیتر baseline باید هم‌اندازه و معتبر باشد.')
  }
  if (!input.assayAntigen.trim() || !input.vaccineProduct.trim() || !input.route.trim()) {
    throw Error('آنتی‌ژن آزمون، محصول واکسن و مسیر تجویز الزامی است.')
  }
  if (!Number.isFinite(input.samplingDaysAfterDose) || input.samplingDaysAfterDose < 0) {
    throw Error('زمان نمونه‌گیری معتبر نیست.')
  }
  const meanLog2 = values.reduce((sum, value) => sum + value, 0) / values.length
  const threshold = input.responseThresholdLog2
  if (threshold !== undefined && (!Number.isFinite(threshold) || threshold < 0 || threshold > 20)) {
    throw Error('آستانه پاسخ باید ۰ تا ۲۰ log2 و مستند به پروتکل باشد.')
  }
  const responders = threshold === undefined ? null : values.filter(value => value >= threshold).length
  const rises = baseline ? values.map((value, index) => value - baseline[index]) : null
  return {
    n: values.length,
    geometricMeanLog2: meanLog2,
    geometricMeanReciprocal: 2 ** meanLog2,
    medianLog2: median(values),
    minLog2: Math.min(...values),
    maxLog2: Math.max(...values),
    responders,
    responderPercent: responders === null ? null : (100 * responders) / values.length,
    baselineN: baseline?.length ?? null,
    baselineGeometricMeanLog2: baseline
      ? baseline.reduce((sum, value) => sum + value, 0) / baseline.length
      : null,
    meanLog2Rise: rises ? rises.reduce((sum, value) => sum + value, 0) / rises.length : null,
    fourfoldRisePercent: rises ? (100 * rises.filter(value => value >= 2).length) / rises.length : null,
    warnings: [
      'این خروجی پایش سرولوژیک است؛ HI به‌تنهایی حفاظت، جلوگیری از دفع یا انتقال ویروس را اثبات نمی‌کند.',
      ...(threshold === undefined
        ? ['آستانه پاسخ تعریف نشده؛ تعداد و درصد responder محاسبه نشده‌اند.']
        : ['آستانه responder صرفاً ورودی پروتکل شماست و cutoff حفاظتی عمومی نیست.']),
      ...(!baseline
        ? ['نمونه baseline paired وجود ندارد؛ افزایش تیتر نسبت به قبل محاسبه نشد.']
        : ['محاسبه افزایش paired فرض می‌کند baseline و post متعلق به همان پرندگان و دقیقاً با همان ترتیب هستند؛ بدون شناسه/تطبیق فردی، درصد افزایش چهاربرابری قابل اتکا نیست.']),
    ],
  }
}
