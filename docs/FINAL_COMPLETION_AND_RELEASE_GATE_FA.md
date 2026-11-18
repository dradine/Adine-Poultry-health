# وضعیت تکمیل و Gate انتشار — بازبینی ۱۸ نوامبر ۲۰۲۶

## وضعیت واقعی نسخه توسعه
- چهارمرحله‌ای: اطلاعات گله → بیماری → کیت/روش → داده و تحلیل.
- کاتالوگ کیت‌ها و ورود دستی metadata.
- بانک سویه برای واکسن، آنتی‌ژن آزمون و field reference با انتخاب دستی.
- MDA روز ۰ تا ۴، برآورد روز هچ و منحنی افت اکتشافی؛ منبع و واحد در سوابق MDA ذخیره می‌شوند.
- موتور IBD Deventer-style آزمایشی برای شرایط مستند و محدود.
- ND-HI توصیفی؛ paired rise فقط از رکوردهای دارای bird ID صریح محاسبه می‌شود. baseline فهرستی بدون ID دیگر paired تلقی نمی‌شود.
- IBV روند توصیفی در همان assay/unit.
- AIV evidence/surveillance triage، نه تشخیص قطعی.
- ذخیره Local-first، IndexedDB/outbox و Supabase sync؛ UI ورود داده خام آزمایشگاه و parser واقعی vendor هنوز کامل نیست.
- نمودارها: MDA curve، ND histogram، IBV trend؛ dashboards هنوز به report-builder حرفه‌ای و مقایسه چندگله نیاز دارند.

## آخرین تغییرات
- Fix تست بانک سویه: الگوی CR88 از تطبیق اشتباه CR88121 جلوگیری می‌کند.
- ND paired data ورودی جدید با قالب هر خط `birdID:baseline:post` اضافه شده است. داده بدون ID فقط توصیفی است و paired metrics تولید نمی‌کند.
- سوابق MDA اکنون مقیاس آزمون و منبع پارامتر را هم نگهداری می‌کند.
- Roadmap کامل در `docs/ROADMAP_SEROLOGY_MONITORING_ENGINE_FA_2026-11-18.md`.

## CI
آخرین اجرای CI باید از روی head شاخه در GitHub Actions بررسی شود. تست سبز به‌تنهایی اثبات validation علمی، تست موبایل، یا همگام‌سازی چنددستگاه نیست.

## Gateهای باقی‌مانده (انتشار بالینی/علمی ممنوع تا رفع)
1. بازبینی مستقل فرمول، واحدها، تعریف paired، کنترل کیفیت، داده‌های censored/LOD/ULOQ.
2. ورود/import فایل واقعی anonymized از BioChek II و xChekPlus با preview/mapping/validation.
3. ذخیره کامل provenance/QC/raw results در data model و گزارش PDF/CSV.
4. نمودارهای توزیع و trend پیشرفته، baseline محلی و مقایسه flock/house با کنترل assay/unit.
5. مدل MDA uncertainty/sensitivity و validation با چند زمان نمونه همان پرندگان.
6. مدل‌های اختصاصی معتبر برای ND/IBV/AIV و سایر بیماری‌ها؛ بانک کیت یا سویه به‌تنهایی مدل محسوب نمی‌شود.
7. تست واقعی iOS Safari، Android Chrome و desktop؛ تست آفلاین، refresh، backup/restore، login، دو حساب و دو دستگاه.
8. تأیید URL میزبانی و preview؛ هیچ deploy زنده بدون تأیید واقعی اعلام نشود.

## تصمیم انتشار
PR #1 Draft و merge نشده باقی بماند. نسخه فعلی Research / Beta است؛ خروجی‌ها برای کمک به بررسی علمی/دامپزشکی هستند و توصیه قطعی واکسیناسیون یا تشخیص محسوب نمی‌شوند. Merge، انتشار عمومی/بالینی یا تغییر زیرساخت/داده واقعی بدون اجازه مالک پروژه انجام نشود.
