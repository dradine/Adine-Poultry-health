export type IbdInput = {
  samplingAgeDays: number
  breakthroughTiter: number
  halfLifeDays: number
  susceptiblePercent: number
  titers: number[]
}

export type IbdOutput = {
  log2PercentileTiter: number
  percentileTiter: number
  estimatedVaccinationAgeDays: number
  sampleCount: number
}

function quantile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) throw new Error('برای محاسبه، حداقل یک تیتر معتبر لازم است.')
  const position = (sorted.length - 1) * percentile / 100
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

/**
 * Preliminary Deventer-style calculation helper.
 * Inputs must be numeric titres from one documented assay/product combination.
 * This is deliberately not labelled as a validated vaccine recommendation.
 */
export function calculateIbdWindow(input: IbdInput): IbdOutput {
  const { samplingAgeDays, breakthroughTiter, halfLifeDays, susceptiblePercent, titers } = input
  if (!Number.isFinite(samplingAgeDays) || samplingAgeDays < 0) throw new Error('سن نمونه‌گیری معتبر نیست.')
  if (!Number.isFinite(breakthroughTiter) || breakthroughTiter <= 0) throw new Error('BTT باید عدد مثبت و مستند از بروشور همان واکسن باشد.')
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) throw new Error('نیمه‌عمر باید عدد مثبت و مستند باشد.')
  if (susceptiblePercent <= 0 || susceptiblePercent >= 100) throw new Error('درصد هدف باید بین صفر و صد باشد.')
  if (titers.length === 0 || titers.some((v) => !Number.isFinite(v) || v <= 0)) {
    throw new Error('تیترها باید اعداد مثبت باشند؛ نتایج زیر حد تشخیص یا نامعتبر را وارد نکنید.')
  }

  const log2Titers = titers.map((v) => Math.log2(v)).sort((a, b) => a - b)
  const log2PercentileTiter = quantile(log2Titers, susceptiblePercent)
  const estimatedVaccinationAgeDays =
    samplingAgeDays + (log2PercentileTiter - Math.log2(breakthroughTiter)) * halfLifeDays

  return {
    log2PercentileTiter,
    percentileTiter: 2 ** log2PercentileTiter,
    estimatedVaccinationAgeDays,
    sampleCount: titers.length,
  }
}

export function parseTiters(value: string): number[] {
  return value
    .split(/[\s,،;；]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0)
}