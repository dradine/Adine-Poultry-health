import { ASSAY_CATALOG, type AssayCatalogEntry } from './assayRegistry'

export type AssayMatch = {
  exact: AssayCatalogEntry | null
  suggestions: AssayCatalogEntry[]
  calculationAllowed: false
  reason: string
}

/** Normalize identifiers only for lookup; never infer clinical equivalence from similar names. */
const norm = (value: string) => value.trim().toLocaleLowerCase('en-US').replace(/[\s_-]+/g, '')

export function matchAssay(input: { manufacturer?: string; catalog?: string; name?: string }): AssayMatch {
  const manufacturer = norm(input.manufacturer ?? '')
  const catalog = norm(input.catalog ?? '')
  const name = norm(input.name ?? '')

  const exact = ASSAY_CATALOG.find((entry) =>
    manufacturer && catalog &&
    norm(entry.manufacturer) === manufacturer &&
    norm(entry.catalog ?? '') === catalog,
  ) ?? null

  if (exact) {
    return {
      exact,
      suggestions: [],
      calculationAllowed: false,
      reason: exact.status === 'documented'
        ? 'شناسه کیت در کاتالوگ پیدا شد؛ این تطبیق به‌تنهایی مجوز محاسبه بالینی نیست. IFU، نسخه، روش و جفت واکسن باید تأیید شوند.'
        : 'کیت فقط در کاتالوگ ثبت شده؛ محاسبه تا بررسی IFU و اعتبارسنجی قفل است.',
    }
  }

  const suggestions = ASSAY_CATALOG.filter((entry) => {
    const sameManufacturer = manufacturer && norm(entry.manufacturer) === manufacturer
    const sameName = name && norm(entry.name).includes(name)
    const sameCatalog = catalog && norm(entry.catalog ?? '').includes(catalog)
    return Boolean(sameManufacturer && (sameName || sameCatalog))
  }).slice(0, 5)

  return {
    exact: null,
    suggestions,
    calculationAllowed: false,
    reason: 'تطبیق دقیق سازنده و شماره کاتالوگ انجام نشد؛ پیشنهادها صرفاً برای انتخاب دستی هستند و هیچ مدل محاسباتی فعال نمی‌شود.',
  }
}
