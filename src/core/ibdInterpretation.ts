import type { IbdOutput, IbdInput } from './ibd'

export type IbdInterpretation = {
  status: 'candidate-window' | 'already-reached'
  farmer: string
  veterinarian: string[]
  assumptions: string[]
  limitations: string[]
  nextActions: string[]
}

/** Educational interpretation generated only from the calculator's verified arithmetic and explicit inputs. */
export function interpretIbdResult(input: IbdInput, result: IbdOutput, context: {
  flockType?: string
  assay?: string
  vaccine?: string
  bttSource?: string
  halfLifeSource?: string
  correctionSource?: string
} = {}): IbdInterpretation {
  const p = input.susceptiblePercent
  const selected = result.percentileTiter
  const rank = result.percentileRank
  const date = result.estimatedVaccinationAgeDays
  const already = result.thresholdAlreadyReachedAtSampling
  const status = already ? 'already-reached' : 'candidate-window'
  const farmer = already
    ? `در نمونه‌گیری روز ${input.samplingAgeDays}، تیتر گروه انتخاب‌شده (${selected}) از آستانه عبور واکسن (${input.breakthroughTiter}) پایین‌تر/در حد آن بوده و مدل می‌گوید زمان محاسباتی ممکن است رسیده باشد. این به معنی الزام تزریق فوری یا اثبات حفاظت/عدم حفاظت گله نیست؛ برنامه واکسن و وضعیت فارم باید بررسی شود.`
    : `با فرض اینکه در ${p}٪ پرندگان هدف، تیتر MDA به BTT رسیده یا پایین‌تر آمده و از نظر آنتی‌بادی مستعد واکسن زنده شده باشند، مدل بر پایه تیتر انتخابی ${selected} از نمونه‌گیری روز ${input.samplingAgeDays}، روز ${date!.toFixed(1)} را به‌عنوان پنجره محاسباتی عبور از آستانه واکسن برآورد می‌کند. این روز، زمان قطعی یا تضمین‌کننده ایمنی گله نیست.`
  const veterinarian = [
    `آمار نمونه: n=${result.sampleCount}؛ صدک/هدف پاسخ‌پذیری=${p}٪؛ رتبه مشاهده‌ای انتخاب‌شده=${rank} از ${result.sampleCount}؛ تیتر متناظر=${selected}؛ log₂(titer)= ${result.log2PercentileTiter.toFixed(3)}.`,
    `محاسبه: سن نمونه‌گیری (${input.samplingAgeDays}) + [log₂ تیتر انتخابی − log₂ BTT (${input.breakthroughTiter})] × نیمه‌عمر (${input.halfLifeDays}) + اصلاح (${input.correctionDays ?? 0}) = ${result.rawCalculatedAgeDays.toFixed(2)} روز. ${already ? (selected <= input.breakthroughTiter ? 'تیتر مشاهده‌شده در زمان نمونه‌گیری از BTT بالاتر نیست؛ حتی اگر اصلاح روز، خروجی خام را جلو ببرد، وضعیت عبور از آستانه در نمونه‌گیری قبلاً برقرار بوده و تاریخ آینده گزارش نمی‌شود.' : 'خروجی خام از سن نمونه‌گیری جلوتر نیست؛ تاریخ آینده گزارش نمی‌شود.') : 'خروجی خام به‌عنوان سن تخمینی ثبت شده است.'}`,
    `توزیع: میانگین حسابی=${result.arithmeticMean.toFixed(1)}؛ میانه=${result.medianTiter.toFixed(1)}؛ GMT=${result.geometricMeanTiter.toFixed(1)}؛ SD در مقیاس log₂=${result.log2StandardDeviation.toFixed(2)}؛ CV حسابی=${result.coefficientOfVariationPercent.toFixed(1)}٪؛ دامنه=${result.minimumTiter} تا ${result.maximumTiter}.`,
    `تفسیر هدف: درصد ${p}، سهم هدف پرندگانی است که طبق مدل تیتر MDA آن‌ها به BTT رسیده یا پایین‌تر آمده است؛ این نه درصد take واکسن، نه درصد پاسخ ایمنی تضمینی و نه درصد حفاظت است. انتخاب ۵٪ و ۷۵٪ دو هدف متفاوت‌اند و قابل جایگزینی خودکار نیستند.`,
    `ردیابی پارامترها: کیت=${context.assay || 'ثبت نشده'}؛ واکسن=${context.vaccine || 'ثبت نشده'}؛ منبع BTT=${context.bttSource || 'ثبت نشده'}؛ منبع نیمه‌عمر=${context.halfLifeSource || 'ثبت نشده'}؛ منبع اصلاح=${context.correctionSource || 'ثبت نشده'}.`
  ]
  const assumptions = [
    'این برآورد فقط برای واکسن زنده متعارف IBD و در صورت هم‌مقیاس بودن تیتر آزمون با BTT همان محصول قابل تفسیر است؛ رسیدن MDA به BTT فقط شاخص حساسیت به واکسن است و vaccine take یا حفاظت را تضمین نمی‌کند. برای واکسن immune-complex یا HVT‑VP2 تعمیم ندهید.',
    'نیمه‌عمر، BTT و اصلاح روزهای نخست باید از منبع معتبر متناسب با محصول، جمعیت، روش و کیت اخذ شوند؛ واردکردن عدد به‌تنهایی آن را اعتبارسنجی نمی‌کند.',
    'نمونه‌ها باید تصادفی، نماینده و از پرندگان سالم باشند؛ کنترل‌های آزمایشگاه و تطابق کیت/واکسن مستقل از نرم‌افزار بررسی شده‌اند.'
  ]
  const limitations = [
    'ELISA تیتر آنتی‌بادی را اندازه می‌گیرد؛ این خروجی مستقیماً ایمنی خنثی‌کننده، ایمنی سلولی/موضعی، سلامت بورس، vaccine take، تطابق سویه، عفونت فعال یا احتمال وقوع بیماری را تعیین نمی‌کند.',
    'ناهمگنی تیتر و انتخاب صدک، خطای نمونه‌گیری، سن نمونه، نوع پرنده، برنامه واکسیناسیون، وضعیت فارم و فشار عفونت می‌توانند نتیجه عملی را تغییر دهند.',
    'تاریخ محاسباتی باید با برچسب واکسن، مسیر/روش تجویز، سلامت گله، آب و تجهیزات، زنجیره سرد و امکان اجرای صحیح تطبیق داده شود.'
  ]
  const nextActions = already
    ? ['تاریخچه واکسن و سن گله را فوراً با دامپزشک مسئول تطبیق دهید؛ از این خروجی به‌تنهایی دستور واکسیناسیون فوری نسازید.', 'تحلیل حساسیت درصدهای هدف را ببینید و تیترهای خام/نمونه‌گیری و منبع BTT را بازبینی کنید.', 'اگر علائم یا تلفات غیرعادی وجود دارد، بررسی تشخیصی و اپیدمیولوژیک جداگانه انجام دهید؛ این مدل تشخیص بیماری نیست.']
    : ['سناریوهای ۵، ۲۵، ۷۵ و ۹۰٪ از سهم هدفِ پرندگان زیر/در حد BTT را مقایسه کنید؛ اختلاف‌ها را به‌عنوان حساسیت مدل، نه چند توصیه قطعی، گزارش کنید.', 'اعتبار IFU، BTT و نیمه‌عمر و کیفیت نمونه‌گیری را قبل از تصمیم عملی بازبینی کنید.', 'زمان محاسباتی را با برنامه واکسن، سلامت گله، برچسب محصول و امکان اجرای صحیح تطبیق دهید.']
  return { status, farmer, veterinarian, assumptions, limitations, nextActions }
}
