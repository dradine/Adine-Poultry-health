# تکمیل بانک سویه و پایش MDA — بازبینی ۱۸ نوامبر ۲۰۲۶

## تغییرات افزوده‌شده
- `src/core/strainRegistry.ts`: بانک سویه/ژنوتیپ/پلتفرم بر اساس بیماری، با roleهای جداگانه vaccine، assay-antigen و field-reference.
- `src/components/StrainSelector.tsx`: پنل مرحله ۳؛ انتخاب از پیشنهادهای بیماری و ورود نام دستی برای هر نقش. ذخیره محلی جداگانه بر اساس بیماری.
- `src/core/maternalAntibody.ts`: مدل ریاضی افت نمایی؛ نمونه روز ۰ تا ۴ را می‌پذیرد، تیتر روز هچ را برآورد می‌کند و منحنی/سن عبور از threshold می‌دهد.
- `src/components/MaternalAntibodyPanel.tsx`: پنل stage 4 با گراف، مقادیر روزهای منتخب و ورودی دستی سن/تیتر/نیمه‌عمر/threshold/منبع.
- تست‌های واحد برای ورودی day 0، day 1–4، سن خارج از دامنه، threshold و strain registry.

## منطق MDA
`T(0)=T(sample) × 2^(sampleAge / halfLife)` و `T(t)=T(0) × 2^(-t/halfLife)`. سن تخمینی رسیدن به threshold در صورتی که تیتر روز هچ بالاتر باشد: `t=halfLife × log2(T(0)/threshold)`.

این مدل فقط ریاضی افت نمایی است و half-life و threshold را خودکار از مقاله/کیت استخراج نمی‌کند. کاربر باید آن‌ها را با منبع و مقیاس همان assay وارد کند. استفاده از OD، S/P یا مقیاس تیتر غیرهمسان و تعمیم threshold ممنوع است. آنتی‌بادی علیه آنتی‌ژن هدف و ضد وکتور با هم یکی نیستند. برای واکسن HVT-VP2 یا immune-complex، این محاسبه به‌تنهایی مدل زمان واکسیناسیون معتبر نیست.

## فهرست سویه‌ها و احتیاط
نام‌های ثبت‌شده برای شروع انتخاب‌اند، نه تأیید عرضه در ایران یا یکسانی آنتی‌ژنی. نام isolate، ژنوتیپ، lineage، clade، سال، منبع و target آنتی‌ژن باید در قسمت اطلاعات تکمیلی درج شود. سویه vaccine، antigen assay و field isolate مستقل ثبت می‌شوند.

### منابع علمی/مرجع برای بانک اولیه
- IBV vaccine strain overview/recombination review: https://doi.org/10.3390/ani10112058
- USDA APHIS chicken product summaries (ND vaccine products and strain composition): https://www.aphis.usda.gov/product-summaries-animal-species-chicken
- Malaysian DVS approved-vaccine list 2025 (product-specific strain compositions; not Iranian registration): https://www.dvs.gov.my/dvs/resources/user_1/2025/BKAV/COMBINE.pdf
- IBDV vaccine review, including conventional live, immune-complex, vector platforms and variant products: https://www.mdpi.com/2076-2607/13/12/2801

## محدودیت‌های باقی‌مانده
1. سویه‌های منتخب در این پنل فعلاً به محاسبات موتور متصل نیستند؛ صرفاً به‌عنوان metadata ثبت می‌شوند و هیچ cross-protection یا protection score تولید نمی‌کنند.
2. مدل MDA جدید یک برآورد اکتشافی مستقل است؛ فعلاً در سوابق پایش/analysis-run ذخیره یا sync نمی‌شود.
3. منحنی فقط بر اساس یک half-life ثابت کاربر است؛ مدل عدم‌قطعیت، confidence interval، تخمین half-life از چند زمان نمونه، clustering سالن، ELISA calibration و validation با داده میدانی هنوز وجود ندارد.
4. گزارش تحلیلی کامل مانند BioChek/IDEXX، import خودکار Excel/CSV دستگاه، QC parser و داشبورد چندگله هنوز تکمیل نشده‌اند.
5. بانک سویه برای نام‌های variant و subtype، رکورد دقیق isolate را لازم دارد؛ H5/H9 یا QX-like به‌تنهایی designation کامل نیست.

## گام‌های بعدی که نیاز به ادامه توسعه دارند
- اتصال metadata سویه‌ها به snapshot نتایج و history
- توسعه موتور MDA برای multiple samples / log-linear regression با confidence intervals و شروط کیفیت
- گزارش تحلیلی شامل histograms، scatter/trend charts، percentile/GMT/CV، paired response، QC gates و تحلیل تفکیک سالن
- import ساختاریافته فایل خروجی BioChek II و IDEXX xChekPlus پس از دریافت نمونه واقعی export
- پروفایل vaccine platform و مدل‌های disease-specific مستقل؛ در مرحله فعلی هیچ مدل پیش‌بینی حفاظت برای ND/IBV/AIV ایجاد نشده است.
