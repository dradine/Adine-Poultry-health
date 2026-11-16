export type PoultryDiseaseId = 'IBD' | 'ND' | 'IB' | 'AIV'
export type DiseaseModelStatus = 'experimental-available' | 'monitor-available' | 'research-only' | 'not-implemented'
export type DiseaseModelDescriptor = {
  id: PoultryDiseaseId
  nameFa: string
  nameEn: string
  status: DiseaseModelStatus
  method?: string
  scope: string
  reason: string
}
export const DISEASE_MODELS: readonly DiseaseModelDescriptor[] = [
  {
    id: 'IBD', nameFa: 'گامبورو', nameEn: 'Infectious bursal disease',
    status: 'experimental-available', method: 'Deventer-style',
    scope: 'فقط واکسن زنده متعارف؛ MDA/ELISA و BTT هم‌مقیاس و مستند',
    reason: 'محاسبه مقدماتی در MVP موجود است؛ اعتبارسنجی مستقل و میدانی هنوز کامل نیست.',
  },
  {
    id: 'ND', nameFa: 'نیوکاسل', nameEn: 'Newcastle disease',
    status: 'monitor-available', method: 'HI serology response monitor',
    scope: 'پایش توصیفی HI قبل/بعد واکسن؛ بدون زمان‌بندی MDA یا استنتاج protection',
    reason: 'موتور پایش HI اضافه شده؛ مدل مستقل زمان‌بندی واکسن و حفاظت هنوز پیاده‌سازی/اعتبارسنجی نشده است.',
  },
  {
    id: 'IB', nameFa: 'برونشیت عفونی', nameEn: 'Infectious bronchitis',
    status: 'monitor-available', method: 'assay-specific serology trend',
    scope: 'روند مقادیر هم‌کیت/هم‌واحد در زمان؛ بدون protection/cross-protection',
    reason: 'موتور روند سرولوژی مستقل اضافه شده؛ مدل حفاظت مخاطی یا cross-protection هنوز وجود ندارد.',
  },
  {
    id: 'AIV', nameFa: 'آنفلوانزای پرندگان', nameEn: 'Avian influenza',
    status: 'monitor-available', method: 'surveillance evidence gate',
    scope: 'دسته‌بندی سیگنال‌ها و ارجاع؛ نه تشخیص، DIVA خودکار یا حفاظت',
    reason: 'ماژول evidence gate برای اولویت پیگیری اضافه شده؛ تشخیص و برنامه رسمی در اختیار دامپزشک/مرجع است.',
  },
] as const
export function getDiseaseModel(id: PoultryDiseaseId): DiseaseModelDescriptor {
  const model = DISEASE_MODELS.find(item => item.id === id)
  if (!model) throw new Error('مدل بیماری شناخته‌شده نیست.')
  return model
}
