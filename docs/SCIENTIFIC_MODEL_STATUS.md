# وضعیت علمی موتورهای تصمیم‌یار

## IBD — نسخه ۰.۱ آزمایشی
این نسخه یک محاسبه‌گر مقدماتی Deventer-style دارد:

vaccination_age = sampling_age + (log2(percentile_titer) - log2(BTT)) × half_life_days

ورودی‌ها باید از یک کیت و پروتکل واحد و یک محصول واکسن مشخص باشند. انتخاب صدک هدف، BTT و نیمه‌عمر باید با روش مرجع و محصول دقیق تطبیق داده شوند. هیچ BTT یا نیمه‌عمر تأییدنشده‌ای به‌صورت پیش‌فرض در برنامه قرار نگرفته است.

### موارد لازم پیش از انتشار بالینی
1. تطبیق کامل فرمول و تعریف درصد هدف با مرجع اصلی Deventer و راهنمای معتبر محصول.
2. ثبت سازنده، شماره کاتالوگ، نسخه بروشور و روش آزمون برای هر کیت.
3. ثبت BTT محصول به‌صورت اختصاصی؛ جلوگیری از انتقال BTT بین برندها/محصولات.
4. مدیریت نتایج زیر LOD، بالای ULOQ، نامعتبر و تکرار آزمایش به‌صورت داده سانسورشده، نه عدد ساختگی.
5. ارزیابی تعداد نمونه، توزیع تیتر، CV و کیفیت نمونه‌گیری.
6. اعتبارسنجی آینده‌نگر با پاسخ واکسن و شواهد بورس/مولکولی و عملکرد گله.
7. بازبینی دامپزشک پیش از تبدیل خروجی به برنامه اجرایی.

## ND / IBV / AIV
برای هر بیماری موتور مستقل لازم است. Deventer یا فرمول IBD به آن‌ها تعمیم داده نمی‌شود.

 
## وضعیت پیاده‌سازی تفسیر آموزشی — 2026-11-16
- موتور `src/core/ibdInterpretation.ts` خروجی محاسبه را به دو سطح توضیح مرغدار و دامپزشک تبدیل می‌کند؛ فرض‌ها، محدودیت‌ها و اقدام بعدی را نیز نشان می‌دهد.
- آزمون تفسیر: `src/core/ibdInterpretation.test.ts` (۲ تست سناریویی).
- آزمون عددی و مرزی IBD و پشتیبان محلی توسعه یافته؛ CI باید در آخرین commit سبز باشد.
- این متن و خروجی فعلی، بازبینی مستقل علمی/آزمایشگاهی یا اعتبارسنجی میدانی محسوب نمی‌شود.
- نسخه جاری هنوز confidence score ندارد؛ عمداً امتیاز اطمینان ساختگی تولید نمی‌کند. تا تعریف rubric و داده اعتبارسنجی، سطح شواهد و کیفیت داده باید به‌صورت وضعیت‌های کیفی مستند نمایش داده شود.


## Product-specific Deventer constraints — Avishield IBD Plus (UK label, June 2026)
- Product label: BTT ≤500 IDEXX ELISA units; minimum vaccination age 10 days; at least 18 chick sera; use the highest titre within the selected Bird% after ranking low-to-high.
- Other ELISA kit titres must be corrected to the IDEXX standard. The current app blocks non-linked assay kits because no validated cross-kit conversion adapter is available.
- Correction 0–4 days applies only when sampling was performed at 0–4 days of age. A non-zero correction after day 4 is rejected.
- When high titres are expected, the label says later sampling (e.g. day 7) gives a more reliable vaccination-age estimate than day 0.
- Label onset of immunity is 14 days after vaccination and stated duration is 5 weeks; these are product-label claims, not a model prediction of flock-level protection.
- These values are specific to the cited UK product label and must not be copied to other products, markets or vaccine platforms.
