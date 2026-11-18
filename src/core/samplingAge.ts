/** Calculate chick age from hatch date to sampling date using calendar days (not placement date). */
export function calculateSamplingAgeFromHatch(hatchDate: string, sampleDate: string): number {
  const parse = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (!match) throw new Error('تاریخ باید با قالب YYYY-MM-DD ثبت شود.')
    const [, y, m, d] = match
    const timestamp = Date.UTC(Number(y), Number(m) - 1, Number(d))
    const check = new Date(timestamp)
    if (check.getUTCFullYear() !== Number(y) || check.getUTCMonth() !== Number(m) - 1 || check.getUTCDate() !== Number(d)) {
      throw new Error('تاریخ هچ یا نمونه‌گیری معتبر نیست.')
    }
    return timestamp
  }
  const hatch = parse(hatchDate)
  const sample = parse(sampleDate)
  const days = (sample - hatch) / 86400000
  if (days < 0) throw new Error('تاریخ نمونه‌گیری نمی‌تواند قبل از تاریخ هچ باشد.')
  return days
}
