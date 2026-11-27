# ماتریس کیت، Reader و بازار ایران — ۲۰ نوامبر ۲۰۲۶

## نتیجه بررسی

برای BioChek II، xChekPlus و IDsoft قابلیت‌های رسمی ورود/خروجی و مدیریت داده بررسی شد. هیچ فایل proprietary واقعی در این محیط وجود ندارد، بنابراین parser کامل ادعا نمی‌شود. بسته فعلی adapter profile، mapping preview، fixture synthetic و قرارداد دریافت فایل واقعی را فراهم می‌کند.

## ماتریس فنی

| خانواده | روش‌های محتمل | قالب قابل مشاهده در منابع رسمی | وضعیت adapter در پروژه | ورودی لازم برای تکمیل |
|---|---|---|---|---|
| BioChek II | ELISA، برخی workflowهای PCR | CSV و BXP در manual، پایگاه آنلاین و LIMS | CSV/TSV preview آماده؛ BXP مستقیم فعال نیست | export ناشناس CSV/BXP، نسخه نرم‌افزار، assay، lot و IFU |
| IDEXX xChekPlus | ELISA و assayهای اختصاصی | SDF database export، XML assay/reader و exportهای قابل تنظیم | schema-gated، CSV/TSV اولیه | نمونه SDF/XML/CSV ناشناس، نسخه xChekPlus و assay XML |
| IDsoft / ID Screen | ELISA | ورود Reader/Excel/manual و خروجی Excel | schema-gated، CSV/TSV اولیه | Excel/CSV واقعی، نسخه IDsoft، assay insert و matrix |
| HI دستی | HI reciprocal/log2 | CSV/TSV آزمایشگاه | آماده برای mapping | HAU، RBC، آنتی‌ژن، SOP و endpoint convention |
| سایر ELISAها | ELISA kit-specific | CSV/TSV یا Excel | generic adapter | IFU، formula، cutoffها، QC و sample matrix |

## کیت‌ها و assayهای قابل ردیابی

کاتالوگ فعلی برنامه خانواده‌های IBD، ND، IBV و AIV را جدا نگه می‌دارد. مواردی مثل IBD conventional و IBDVP2، NDV ELISA و ND-HI، IBV broad ELISA و آزمون‌های subtype-specific influenza نباید در یک مقیاس یا یک موتور ادغام شوند.

## شواهد مربوط به بازار ایران

در منابع فارسی و مطالعات منتشرشده، استفاده از BioChek، IDEXX و IDvet در مطالعات طیور ایران دیده می‌شود. یک مطالعه ایرانی اختلاف معنی‌دار بین نتایج دو کیت تجاری IDEXX و BioChek گزارش کرده است. این موضوع نشان می‌دهد که تیترهای این کیت‌ها نباید بدون مطالعه comparability و تطبیق IFU در یک baseline مشترک ترکیب شوند. genui{"citation":{"ref":"turn789814331search1"}}

منابع بازار و صفحات فروش ممکن است موجودی، نمایندگی و نسخه محصول را تغییر دهند. در این مرحله آن‌ها فقط به‌عنوان نشانه بازار ثبت می‌شوند، نه تأیید موجودی فعلی یا اعتبارسنجی محصول. برای هر کیت ایرانی یا وارداتی باید نام سازنده، کد، lot، نسخه IFU، آنتی‌ژن، ماتریس نمونه، واحد، حدود QC و تاریخ اعتبار به‌صورت جداگانه ثبت شود.

نام‌هایی که در منابع فارسی/مطالعات ایرانی برای پایش طیور دیده شدند و باید در مرحله catalog verification بررسی شوند:

- BioChek برای IBD، IBV، NDV و برخی آزمون‌های دیگر؛
- IDEXX برای ELISAهای طیور؛
- IDvet / ID Screen برای مسیرهای IBD، IBV، ND و influenza؛
- Proflok در مقایسه‌های پژوهشی کیت‌های IBV؛
- کیت‌های rapid داخلی برای NDV antigen که مسیر آن‌ها با سرولوژی ELISA یا HI یکی نیست.

این فهرست به معنی تأیید نمایندگی، اصالت، موجودی یا مناسب‌بودن یک محصول برای تصمیم‌یار نیست. قیمت و موجودی بازار ایران باید جداگانه از تأمین‌کننده رسمی و با lot/IFU همان زمان تأیید شود.

## خروجی‌های نرم‌افزاری قابل اقتباس

- BioChek قابلیت‌هایی مانند histogram، trend، control tracking، گزارش چند نتیجه، barcode و اتصال LIMS را معرفی می‌کند. genui{"citation":{"refs":["turn770704915search1","turn770704915search3"]}}
- xChekPlus در منابع رسمی export پایگاه داده، assay XML، reader XML و گزارش‌های control tracking را مستند کرده است. genui{"citation":{"refs":["turn770704915search0","turn770704915search59"]}}
- IDsoft ورود از reader، Excel یا ورود دستی و خروجی OD به Excel را معرفی می‌کند. genui{"citation":{"ref":"turn770704915search57"}}

## قرارداد فایل واقعی برای اکانت دوم

برای هر فایل واقعی این metadata باید همراه آن تحویل شود:

- `vendor` و `software_name`
- `software_version`
- `export_format`
- `assay_name` و `catalog_number`
- `kit_lot` و `IFU_version`
- `reader_model` و `reader_software_version`
- `sample_matrix`
- `result_scale` و `unit`
- `control_roles` و حدود QC از IFU
- `anonymization_status`
- `sha256`

فایل‌های واقعی نباید در repository عمومی commit شوند. ابتدا باید در محیط امن، با شناسه‌های ناشناس و همراه metadata وارد شوند.

## وضعیت تکمیل

- adapter profiles و fixtureهای synthetic پیاده‌سازی شده‌اند.
- CSV/TSV preview و mapping آماده است.
- SHA-256 و داده‌های censored در import حفظ می‌شوند.
- parser مستقیم BXP، SDF، XML رمزگذاری‌شده و Excel واقعی هنوز فعال نشده است.
- هیچ ادعای سازگاری کامل با BioChek II، xChekPlus یا IDsoft تا دریافت و تست فایل واقعی همان نسخه قابل قبول نیست.
