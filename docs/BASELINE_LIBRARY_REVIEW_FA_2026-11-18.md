# کتابخانه Baseline سرولوژی طیور — بازبینی ۱۸ نوامبر ۲۰۲۶

## خلاصه وضعیت
در این نسخه یک کتابخانه مرجع قابل مشاهده در رابط برنامه اضافه شده است. دو محدوده عددی مثال‌محور BioChek از راهنمای رسمی RevB 2025 ثبت شده‌اند. سند IDvet با عنوان IDvet Poultry General Baselines در فهرست رسمی Pro Access به‌صورت نسخه June 2025 (انگلیسی doc16346، حجم 724 KB؛ روسی doc16347، حجم 819 KB) قابل مشاهده است. لینک فایل در پرتال وجود دارد، اما دریافت payload PDF در این نشست با خطای cache miss/دانلود ناموفق روبه‌رو شد؛ بنابراین اعداد آن عمداً وارد نشده‌اند. رکورد March 2026 که در بررسی قبلی ثبت شده بود، در فهرست فعلیِ قابل مشاهده پیدا نشد و فعلاً نسخه تأییدشده محسوب نمی‌شود. درج عدد بدون مشاهده جدول، عنوان ستون‌ها، پاورقی‌ها و جمعیت مرجع خطرناک است.

## 1. BioChek — قواعد نمونه‌گیری و baseline
منبع: BioChek, Poultry ELISA Interpretation Manual, RevB 2025.
https://www.biochek.com/download/biochek-poultry-elisa-interpretation-manual/?filename=BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf&ind=17830&refresh=692cdf76bb4941764548470&wpdmdl=17825

- برای تعیین میانگین کمی تیتر گله، سند ۲۳ نمونه در هر گله را اندازه عملی برای قابلیت تکرار و برآورد بهتر معرفی می‌کند.
- در بخش تفسیر، ۱۸ نمونه به‌عنوان حداقل نمونه ذکر شده، درحالی‌که ۲۳ نمونه مقدار بهینه/توصیه‌شده است. این دو عدد نباید به یک cutoff واحد تقلیل داده شوند.
- بعد از آنکه baseline موجود باشد، ۱۵ نمونه ممکن است برای مشاهده روند/گروه‌های تیتر کمک کند، اما برای تحلیل کمی کافی نیست.
- ساخت baseline بین‌گله‌ای: ۲۰ تا ۳۰ گله وقتی CV بین گله‌ها کمتر از ۴۰٪ باشد؛ اگر CV برابر یا بیشتر از ۴۰٪ باشد، تعداد بیشتر و در حالت ایده‌آل بیش از ۱۰۰ گله توصیه شده است.
- برای baseline طبیعی، گله‌های سالم/عادی (Normal; code N) باید از گله‌های مسئله‌دار (Problem; code P) جدا شوند.
- داده‌های لازم شامل نوع پرنده، سن نمونه‌گیری، برنامه واکسن (محصول، سن و روش تجویز)، دلیل آزمایش و در صورت امکان وضعیت عملکرد و علائم است.
- راهنمای پایش بیماری برای کشف شیوع‌های کم، طراحی نمونه‌گیری جداگانه می‌خواهد؛ مثال‌های متن: در گله ۵۰۰۰ تا ۱۰۰۰۰ قطعه، برای کشف آلودگی ۱۰٪ تعداد ۲۸ نمونه تصادفی و برای ۲٪ تعداد ۱۴۷ نمونه تصادفی ذکر شده است. این اعداد فقط مثال‌های جدول همان راهنما با هدف ۹۵٪ اطمینان‌اند.

## 2. مثال‌های عددی IBD که در برنامه ثبت شدند
شرایط مثال: گله گوشتی، سن نمونه‌گیری ۳۵ تا ۴۵ روز، برنامه واکسیناسیون نمونه 123 Broilers، کد گله N (سالم/نرمال)، مقیاس تیتر BioChek.
- روش ۱: میانگین ± ۱٫۹۶ SD به‌عنوان بازه ۹۵٪؛ مثال عددی سند ۷۰۰۰ تا ۱۴۰۰۰ (گرد شده از محاسبه ۷۲۹۴ تا ۱۳۶۲۸).
- روش ۲: مثال جایگزین باریک‌تر که کران پایین را Mean − 1 SD و کران بالا را Mean + 1.96 SD می‌گیرد؛ بازه مثال ۸۵۰۰ تا ۱۴۰۰۰.
- این دو روش متفاوت‌اند؛ برنامه آن‌ها را دو رکورد مجزا نگه می‌دارد.
- اعداد فوق target جهانی IBD، حد حفاظت، BTT یا توصیه واکسن نیستند. برای استفاده باید سن، تیپ پرنده، وضعیت سلامت، زمان پس از واکسن و کیت/کالیبراسیون دقیق منطبق باشد.
- راهنمای سازنده هشدار می‌دهد baselineها بسته به سن، نوع پرنده، نوع واکسن، برنامه واکسیناسیون و شرایط فارم تغییر می‌کنند؛ مشتریان باید baseline محلی خود را بسازند.

## 3. شاخص‌ها و محدودیت‌های تفسیر BioChek
- OD، S/P و S/N و تیتر محاسبه‌شده سطوح متفاوت‌اند. برای indirect ELISA، S/P از OD نمونه و میانگین کنترل مثبت/منفی محاسبه می‌شود؛ برای competitive ELISA، S/N از OD نمونه تقسیم بر میانگین کنترل منفی است.
- فرمول تیتر به شیب و عرض از مبدأ اختصاصی آزمون وابسته است: log10 titre = x × log10(S/P یا S/N) + y. مقادیر x و y باید از IFU همان آزمون گرفته شوند.
- مقادیر cutoff و گروه‌های تیتر باید از IFU همان کیت استخراج شوند؛ هیچ slope/intercept عمومی در برنامه hard-code نشده است.
- VI = Mean Titer / %CV در راهنمای BioChek تعریف شده، اما VI بالا یا تغییر آن به‌تنهایی تشخیص عفونت یا اثبات موفقیت حفاظتی نیست.
- راهنمای سازنده حدود ۳ تا ۵ هفته پس از واکسن زنده و ۴ تا ۶ هفته پس از واکسن غیرفعال را به‌عنوان بازه عمومی پایش ذکر می‌کند؛ این توصیه جایگزین زمان‌بندی اختصاصی محصول/هدف آزمون نیست.

## 4. IDvet / Innovative Diagnostics — سند General Baselines
در صفحه Pro Access که در این بررسی باز شد، این فایل‌ها در دسته Validation documents دیده می‌شوند:
- IDvet Poultry General Baselines June2025 EN doc16346.pdf (724 KB)
- نسخه روسی: IDvet Poultry General Baselines June2025 RU doc16347.pdf (819 KB)
- پرتال رسمی: https://www.innovative-diagnostics.com/pro-access-en/

لینک PDF انگلیسی از صفحه رسمی به مسیر زیر می‌رسد، اما دریافت مستقیم آن در این نشست با Cache miss/خطای دانلود روبه‌رو شد:
https://www.innovative-diagnostics.com/documentation/en/Validation-documents/IDvet_Poultry_General%20Baselines_June2025_EN_doc16346.pdf

بنابراین عنوان/نسخه/حجم از فهرست رسمی قابل مشاهده‌اند، اما payload سند و محتوای عددی، ردیف‌ها، ستون‌ها، footnoteها، جمعیت مرجع، نوع پرنده، سن، برنامه واکسن، زمان نمونه‌گیری، کیت و واحد هنوز استخراج و مستقلاً بررسی نشده‌اند. هیچ عدد IDvet حدس زده نشده است. رکورد سند در UI «در انتظار استخراج عددی» است و در هیچ تحلیل/هشدار محاسباتی دخالت ندارد.

یک رکورد March 2026 با شناسه‌های doc17201/doc17202 در بررسی قبلی ثبت شده بود، اما در فهرست رسمی قابل مشاهده در این نشست پیدا نشد؛ تا زمان دریافت و تأیید مستقیم، آن نسخه را verified تلقی نمی‌کنیم.

برای تکمیل، نسخه انگلیسی اصلی باید از IDvet یا توزیع‌کننده دریافت شود؛ سپس همه صفحات/جدول‌ها دو بار مستقل استخراج و با PDF تطبیق داده شوند. نسخه روسی فقط برای cross-check و پس از تطبیق شماره نسخه/محتوا استفاده شود.

## 5. ماتریس‌های Excel اختصاصی IDvet که در پرتال فهرست شده‌اند
- IBDS — Matrice_IBDS_ver0416_EN_protected_doc13346.xlsx
- IBDVP2 — Matrice_IBDVP2 ver0916_EN_protected_doc13260.xlsx
- IBVS — Matrice_IBVS ver0416 EN_protected_doc8643.xlsx
- IBVC — Matrice_IBVC_ver0217_EN_protected_doc13841.xlsx
- NDVC — Matrice_NDVC_ver0417_EN_protected_doc12390.xlsx
- NDVS — Matrice_NDVS ver0416_protected_doc8920.xlsx
- NDVS-CV — Matrice_NDVS-CV ver0416_EN_protected_doc13844.xlsx
- FLUACA — Matrice_FLUACA_ver0917_EN_protected_doc13730.xls
- FLUACH5 — Matrice_FLUACH5_ver0215_EN_protected_doc8919.xls
- FLUACH9 — Matrice_FLUACH9_ver0616_EN_protected_doc7662.xls
- FLUH9S — Matrice_FLUH9S ver0620_EN_protected_doc10874.xls
- FLUNPS — Matrice_FLUNPS ver0620_EN_protected_doc17106.xls

نام‌ها و نسخه‌ها از فهرست رسمی پرتال ثبت شده‌اند؛ محتوای Workbookها هنوز در برنامه import نشده است. فایل‌های Excel باید همراه IFU نسخه مربوطه بازبینی شوند؛ فرمول‌های پنهان/محافظت‌شده و نام sheetها نیز باید بررسی شوند.

## 6. IFUهای انگلیسی مرتبط IDvet
- IBDS: Insert_IBDS_ver0416_EN-001-V1.1.0.pdf
- IBDVP2: Insert_IBDVP2_ver0823_EN_doc14595.pdf و نسخه قدیمی‌تر ver0916
- IBVS: Insert_IBVS_ver0416_EN_doc12606.pdf
- NDVC: Insert_NDVC_ver0417+egg-yolk_EN_doc13507.pdf
- NDVNP: Insert_NDVNP_ver1016+egg yolk_EN_doc16158.pdf
- NDVS-CV: Insert_NDVS-CV_ver0416+egg yolk_EN_doc16181.pdf
- NDVS: Insert_NDVS_ver0416_EN_doc12626.pdf
- FLUH5S: نسخه جاری فهرست‌شده Insert_FLUH5S_ver0726_EN-002-V1.0.0.pdf
- FLUH9S: Insert_FLUH9S_ver1221_EN_doc13007.pdf
- FLUNPS: Insert_FLUNPS_ver0416_EN-001-V2.0.0.pdf
- FLUACA: Insert_FLUACA_ver0425_EN-001-V2.1.0.pdf

## 7. نتیجه برای طراحی مدل
- IBD conventional (IBDS) و recombinant VP2 (IBDVP2) دو مسیر مستقل‌اند.
- NDVC، NDVS، NDVS-CV و NDVNP نباید به‌عنوان یک آزمون واحد ادغام شوند.
- FLUACA (competitive), FLUNPS (NP), FLUH5S (H5 HA), FLUH9S (H9) و HI زیرتیپ‌محور، هدف آنتی‌ژنی/قالب یکسان ندارند.
- IBVS indirect و IBVC competitive مجزا هستند.
- وجود فایل ماتریس یا IFU به‌تنهایی اجازه نمی‌دهد خروجی یک نرم‌افزار vendor را بازسازی کنیم؛ فرمول، cutoff، QC، intended use و validation باید بررسی شوند.

## 8. قواعدی که در UI اضافه شده‌اند
- baseline شرکت سازنده و baseline محلی در دو طبقه جدا نمایش داده شوند.
- baseline عددی فقط وقتی پیشنهاد شود که بیماری، تیپ پرنده، سن، کیت و نسخه، روش و واحد، برنامه واکسن و زمان نمونه‌گیری همخوان باشند.
- عدم تطبیق به معنی «baseline ناموجود/غیرقابل اعمال» است، نه اینکه برنامه یک baseline نزدیک را حدس بزند.
- OD، S/P، S/N، kit titre، HI log2، reciprocal HI و VN هرگز بدون اعتبارسنجی هم‌ارزی تبدیل یا ترکیب نمی‌شوند.
- گله‌های سالم برای ساخت baseline طبیعی از گله‌های بیمار/مسئله‌دار جدا می‌شوند.
- تغییر lot، reader، protocol یا laboratory نیازمند بررسی comparability/lot bridging است.

## منابع
- BioChek RevB 2025 manual: لینک بالا.
- IDvet Pro Access official document index: https://www.innovative-diagnostics.com/pro-access-en/
- IDvet IBDS: https://www.innovative-diagnostics.com/produit/id-screen-ibd-indirect/
- IDvet IBDVP2: https://www.innovative-diagnostics.com/produit/id-screen-ibd-vp2/
- IDvet NDVS-CV: https://www.innovative-diagnostics.com/produit/id-screen-newcastle-disease-indirect-conventional-vaccines/
- IDvet NDVS: https://www.innovative-diagnostics.com/produit/id-screen-newcastle-disease-indirect/
- IDvet NDVNP: https://www.innovative-diagnostics.com/produit/id-screen-newcastle-disease-nucleoprotein-indirect/
- IDvet NDVC: https://www.innovative-diagnostics.com/produit/id-screen-newcastle-disease-competition/
- IDvet IBV: https://www.innovative-diagnostics.com/produit/id-screen-infectious-bronchitis-indirect-2-0/
- IDvet FLUNPS: https://www.innovative-diagnostics.com/produit/id-screen-influenza-a-nucleoprotein-indirect/
- IDvet FLUH5S: https://www.innovative-diagnostics.com/produit/id-screen-influenza-h5-indirect/
