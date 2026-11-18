# کنترل کیفیت و ورود داده‌های آزمایشگاهی IBD

این سند قرارداد داده و الزامات اعتبارسنجی برای ورود نتایج BioChek II و IDEXX xChekPlus را مشخص می‌کند. هیچ ستون CSV/Excel تا زمان دریافت نمونه واقعی از آزمایشگاه و تطبیق با نسخه نرم‌افزار به‌صورت قطعی map نمی‌شود.

## منابع نرم‌افزاری رسمی

- BioChek II: امکان Custom Export به CSV یا TXT برای LIMS؛ کاربر می‌تواند نوع خروجی (flock-based یا sample-based)، delimiter، وجود header، فیلدهای خروجی و ترتیب آن‌ها را تنظیم کند. بنابراین فایل‌های دو آزمایشگاه ممکن است schema متفاوت داشته باشند.
- xChekPlus: خروجی Case View به Excel یا TXT از مسیر File > Save As؛ متغیرهای قابل خروجی از طریق Variables انتخاب می‌شوند.
- xChekPlus Control Tracking: گزارش ردیابی کنترل مثبت و منفی بر اساس lot و زمان دارد. IDEXX توصیه می‌کند اختلاف کنترل‌های replicate بیش از ۲۰٪ نباشد. این معیار فقط در محدوده توصیه همان نرم‌افزار/کنترل است و نباید به‌عنوان حد عمومی CV نمونه‌ها یا معیار BioChek استفاده شود.

## داده‌های لازم برای هر plate/run

1. شناسه آزمایشگاه، شناسه run/plate، تاریخ انجام آزمون، تاریخ نمونه‌گیری، نام اپراتور.
2. سازنده، نام دقیق کیت، catalog/part number، lot، expiry، نسخه IFU و نسخه assay definition نرم‌افزار.
3. دستگاه خوانشگر، مدل، wavelength، نرم‌افزار و نسخه آن.
4. plate map: جایگاه کنترل‌ها و نمونه‌ها، تکرارها، blank و چیدمان.
5. OD خام همه wellها، OD کنترل مثبت/منفی، S/P یا S/N، تیتر نهایی، واحد، وضعیت qualitative، هر پرچم invalid/out-of-range.
6. Reference control و محدوده/گواهی lot مربوط، در صورت کاربرد و وجود.
7. روش رقیق‌سازی، ضریب رقت، تاریخ بازشدن/آماده‌سازی معرف‌ها در صورت ثبت آزمایشگاه.
8. نسخه الگوریتم تبدیل S/P یا S/N به titer (slope/intercept) که از IFU دقیق همان assay استخراج شده باشد.

## قواعد ورود و عدم‌قطعیت

- فایل خام هرگز overwrite نمی‌شود؛ فایل اصلی، checksum، زمان import و parser version ثبت می‌شود.
- اعداد به‌عنوان text/decimal با locale مشخص خوانده می‌شوند؛ comma ممکن است جداکننده ستون یا ممیز اعشاری باشد و باید از تنظیم export تشخیص داده شود.
- هر sample ID باید یکتا باشد در محدوده run؛ تکرارها و dilution repeats به‌عنوان رکوردهای مجزا با رابطه مشخص حفظ شوند.
- OD/S/P/S/N و titre چهار مفهوم جدا هستند. تبدیل خودکار میان آن‌ها فقط با فرمول assay versioned مجاز است.
- مقدار زیر LOD، بالاتر از محدوده، اشباع، suspect، invalid یا missing هرگز به صفر یا عدد مصنوعی تبدیل نمی‌شود؛ به‌صورت censored/flagged ذخیره می‌شود.
- هیچ رکوردی از plate با QC مردود یا نامشخص وارد محاسبه زمان واکسن نمی‌شود.
- BTT باید با همان assay scale و vaccine label/version pair شده باشد؛ تبدیل میان کیت‌ها فقط پس از مطالعه مقایسه‌ای و اعتبارسنجی مستقل مجاز است.

## منطق پذیرش plate

سیستم حدود عمومی برای OD کنترل مثبت/منفی، CV تکرارها یا reference controls جعل نمی‌کند. محدوده‌ها از IFU همان محصول، lot certificate، assay definition نرم‌افزار و SOP معتبر آزمایشگاه دریافت می‌شوند. در MVP اپراتور باید قبولی plate را با مشاهده گزارش نرم‌افزار/برگه آزمایش تأیید کند. این یک attestation است و به معنی اجرای خودکار QC توسط اپ نیست.

در نسخه بعدی، پس از دریافت نمونه‌های واقعی CSV/TXT/Excel از هر آزمایشگاه، parser اختصاصی با schema version، golden files، آزمون round-trip و گزارش اختلاف با خروجی نرم‌افزار سازنده ساخته خواهد شد.

## منابع

- BioChek Poultry ELISA Interpretation Manual RevB 2025: https://www.biochek.com/wp-content/uploads/2025/11/BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf
- BioChek II Custom Export to LIMS (CSV/TXT): https://www.biochek.com/wp-content/uploads/2018/07/What-is-new-in-BioChek-II-Software-version-2018.pdf
- BioChek II monitoring software: https://www.biochek.com/software/
- IDEXX xChekPlus Quick Guide (Excel/TXT export): https://www.idexx.es/files/xchekplus-quick-guide.pdf
- IDEXX Control Tracking technical guidance: https://www.idexx.com/en/livestock/resources-support/
- IDEXX IBD Ab Test product information: https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ibd-ab-test/
- IDEXX IBD Ab Test package insert 06-01129-18: https://s3.amazonaws.com/idexx-ws-web-documents/org/lpd-web-insert/idexx%20ibd%20ab%20test-06-01129-18.pdf
