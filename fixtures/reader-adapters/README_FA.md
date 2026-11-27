# بسته fixture برای adapterهای Reader

این فایل‌ها کاملاً synthetic هستند و از export واقعی هیچ آزمایشگاه یا شرکت کپی نشده‌اند. برای تست parser و mapping استفاده می‌شوند.

## فایل‌های موجود

- `biochek-ii-synthetic.csv` برای مسیر CSV خروجی BioChek II
- `xchekplus-synthetic.csv` برای تست schema اولیه xChekPlus
- `idsoft-synthetic.csv` برای تست schema اولیه IDsoft
- `manual-hi-synthetic.csv` برای HI reciprocal

## قواعد ورود فایل واقعی

1. فایل باید anonymized باشد و شامل نام، شماره تماس یا اطلاعات شناسایی غیرضروری نباشد.
2. نسخه نرم‌افزار، نسخه assay، kit lot، reader، IFU و نوع export همراه فایل ثبت شود.
3. فایل خام immutable نگهداری و SHA-256 آن ثبت شود.
4. قبل از فعال‌کردن adapter، preview ستون‌ها، duplicate detection، QC و وضعیت‌های LOD/ULOQ بررسی شود.
5. فایل SDF یا XML رمزگذاری‌شده xChekPlus و قالب‌های proprietary بدون schema و مجوز رسمی parser نمی‌شوند.
