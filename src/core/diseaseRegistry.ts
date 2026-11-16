export type PoultryDiseaseId = 'IBD' | 'ND' | 'IB' | 'AIV'
export type DiseaseModelStatus = 'experimental-available' | 'research-only' | 'not-implemented'
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
    status: 'research-only', scope: 'مدل اختصاصی زمان‌بندی/تداخل MDA و واکسن لازم است',
    reason: 'تبدیل مدل IBD به ND علمی نیست؛ مدل ND هنوز پیاده‌سازی نشده است.',
  },
  {
    id: 'IB', nameFa: 'برونشیت عفونی', nameEn: 'Infectious bronchitis',
    status: 'research-only', scope: 'سویه، واکسن، MDA، mucosal/cellular response و برنامه چندمرحله‌ای',
    reason: 'یک آستانه ELISA یا فرمول Deventer برای همه سویه‌ها معتبر نیست؛ مدل اختصاصی لازم است.',
  },
  {
    id: 'AIV', nameFa: 'آنفلوانزای پرندگان', nameEn: 'Avian influenza',
    status: 'not-implemented', scope: 'مدل وابسته به سیاست رسمی، نوع واکسن، پایش و مقررات منطقه',
    reason: 'هیچ محاسبه واکسیناسیون/زمان‌بندی در این برنامه ارائه نمی‌شود.',
  },
] as const
export function getDiseaseModel(id: PoultryDiseaseId): DiseaseModelDescriptor {
  const model = DISEASE_MODELS.find(item => item.id === id)
  if (!model) throw new Error('مدل بیماری شناخته‌شده نیست.')
  return model
}
