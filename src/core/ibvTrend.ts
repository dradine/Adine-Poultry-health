/** IBV serology trend monitor. Never equates serum titer with mucosal protection/cross-protection. */
export type IbvObservation = { day: number; value: number }
export type IbvTrendInput = {
  observations: IbvObservation[]
  assay: string
  kitLot?: string
  vaccineStrain?: string
  route?: string
  unit: 'ELISA' | 'HI-log2' | 'VN'
}
export type IbvTrendOutput = {
  n: number
  firstDay: number
  lastDay: number
  firstValue: number
  lastValue: number
  absoluteChange: number
  foldChange: number | null
  direction: 'up' | 'down' | 'stable'
  slopePerDay: number
  warnings: string[]
}
export function analyzeIbvTrend(input: IbvTrendInput): IbvTrendOutput {
  const observations = [...input.observations].sort((a, b) => a.day - b.day)
  if (observations.length < 2) throw Error('برای تحلیل روند حداقل دو مشاهده در زمان‌های متفاوت لازم است.')
  if (observations.some(({ day, value }) =>
    !Number.isFinite(day) || day < 0 || !Number.isFinite(value) ||
    (input.unit === 'HI-log2' ? value < 0 : value <= 0)
  )) throw Error('روز و مقدار آزمون باید معتبر باشند؛ HI-log2 می‌تواند صفر باشد و سایر مقیاس‌های واردشده باید مثبت باشند.')
  if (new Set(observations.map(item => item.day)).size !== observations.length) {
    throw Error('برای هر روز فقط یک مقدار وارد کنید یا ابتدا نتایج تکراری را طبق SOP تجمیع کنید.')
  }
  if (!input.assay.trim()) throw Error('نام آزمون و کیت الزامی است.')
  const first = observations[0]
  const last = observations[observations.length - 1]
  const delta = last.value - first.value
  const meanX = observations.reduce((sum, item) => sum + item.day, 0) / observations.length
  const meanY = observations.reduce((sum, item) => sum + item.value, 0) / observations.length
  const denominator = observations.reduce((sum, item) => sum + (item.day - meanX) ** 2, 0)
  const slope = observations.reduce((sum, item) =>
    sum + (item.day - meanX) * (item.value - meanY), 0) / denominator
  const foldChange = input.unit === 'HI-log2'
    ? 2 ** delta
    : last.value / first.value
  return {
    n: observations.length,
    firstDay: first.day,
    lastDay: last.day,
    firstValue: first.value,
    lastValue: last.value,
    absoluteChange: delta,
    foldChange,
    direction: Math.abs(delta) <= Math.max(Math.abs(first.value), Math.abs(last.value)) * 0.05
      ? 'stable'
      : delta > 0 ? 'up' : 'down',
    slopePerDay: slope,
    warnings: [
      'روند سرمی به‌تنهایی حفاظت مخاطی، جلوگیری از دفع ویروس یا cross-protection را تعیین نمی‌کند.',
      'مقادیر فقط در assay/کیت/واحد همسان قابل مقایسه‌اند؛ تبدیل بین ELISA، HI و VN معتبر نیست.',
      input.unit === 'HI-log2'
        ? 'fold change از اختلاف log2 به‌صورت 2 به توان اختلاف محاسبه شده است؛ تقسیم مستقیم دو مقدار log2 معتبر نیست.'
        : 'نسبت آخر به اول فقط نسبت عددی در همین مقیاس است و به‌تنهایی معادل افزایش حفاظت یا fold-neutralization نیست.',
      'تفسیر بالینی به سویه واکسن/میدانی، route، علائم، PCR/typing و شواهد میدانی نیاز دارد.',
    ],
  }
}
