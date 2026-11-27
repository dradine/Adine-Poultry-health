# گزارش تکمیل کاتالوگ علمی، پرونده گله و همگام‌سازی — ۲۷ نوامبر ۲۰۲۶

## وضعیت واقعی پرونده آدینه

- Supabase project: `Adine-Vaccine-Timing` / `aekuuqvgsqnjxkobxbur`
- Flock ID: `d0000000-0000-4000-8000-000000000056`
- پرونده با برچسب آموزشی/دمو ثبت شده است؛ تعداد ۱۵٬۰۰۰ قطعه، نوع گوشتی، تاریخ هچ ۲۶ نوامبر ۲۰۲۶ و جوجه‌ریزی ۲۷ نوامبر ۲۰۲۶.
- هیچ نتیجه آزمایش واقعی، تیتر MDA، فایل خام Reader، QC تأییدشده، تاریخچه واکسن واقعی، مشاهده بالینی یا سری زمانی عملکرد برای این پرونده ثبت نشده است.
- هیچ نوبت سرولوژی ساختگی به جدول `model_runs` یا `serology_batches/results` سوپابیس وارد نشده است. کد demo-local همچنان داده‌های ساختگی را فقط برای پیش‌نمایش نرم‌افزار تولید می‌کند و آن‌ها با `demo=true` مشخص شده‌اند.
- بنابراین برای این پرونده فعلاً روز واکسیناسیون واقعی/قطعی قابل محاسبه نیست. داده ساختگی، داده مرجع سازنده یا برنامه نمونه یک کشور دیگر جایگزین داده فارم و مجوز محلی نیست.

## داده‌های مرجع افزوده‌شده به Supabase

### BioChek ELISA

کاتالوگ رسمی برای چهار محصول مجزا تکمیل/اصلاح شد:

- CK113 IBD — BioChek IBD antibody ELISA
- CK116 NDV — BioChek Newcastle antibody ELISA
- CK119 IBV — BioChek Infectious Bronchitis antibody ELISA
- CK121 AI — BioChek Avian Influenza type A antibody ELISA

اطلاعات منتشرشده در صفحات رسمی محصول: indirect ELISA، سرم مرغ، رقت 1:500، خوانش 405 nm، توالی انکوباسیون 30-30-15 دقیقه، دمای اتاق، پنج پلیت و حداکثر 460 نمونه در هر کیت. جزئیات کنترل‌ها و فرمول عددی دقیق همچنان باید از IFU و COA همان Lot گرفته شود؛ این مشخصات صفحه محصول جایگزین IFU نیستند.

راهنمای BioChek Poultry ELISA Interpretation Manual RevB 2025:
- حداقل ۱۸ نمونه/گله برای برآورد کمی میانگین در چک‌لیست تفسیر.
- ۲۳ نمونه توصیه‌شده برای baseline/profile و پیش‌بینی روز واکسیناسیون.
- ۱۵ نمونه فقط برای مشاهده روند/گروه‌های تیتر پس از ایجاد baseline؛ نه تحلیل کمی دقیق.
- این تعداد نمونه یک قانون عمومی برای تمام برندها و تمام هدف‌های پایش نیست.

تفسیرهای اختصاصی:
- CK116 ELISA با HI همبستگی دارد، اما واحدهای عددی ELISA و HI قابل جایگزینی نیستند.
- CK119 آنتی‌بادی ضد IBV را در چارچوب کیت می‌سنجد؛ تیتر سرمی به‌تنهایی حفاظت مخاطی یا cross-protection سویه‌ای را ثابت نمی‌کند.
- CK121 آنتی‌بادی علیه influenza type A را می‌سنجد؛ آزمون HI زیرتیپی H5/H9 یا اثبات DIVA نیست.
- هیچ cutoff حفاظت عمومی به این رکوردها اضافه نشده است.

منابع:
- IBD: https://www.biochek.com/products/infectious-bursal-disease-virus-antibody-test-kit/
- ND: https://www.biochek.com/products/newcastle-disease-virus-antibody-test-kit/
- IBV: https://www.biochek.com/products/ibv-infectious-bronchitis-virus-antibody-test-kit/
- AIV: https://www.biochek.com/products/avian-influenza-antibody-test-kit/
- Manual RevB 2025: https://www.biochek.com/wp-content/uploads/2025/11/BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf

### Avishield IBD Plus

رکورد محصول از برچسب رسمی VMD بریتانیا، AN:00716/2026، بازنگری ژوئن ۲۰۲۶ تکمیل شد:
- سویه زنده intermediate-plus، strain G6.
- مسیر مصرف: آب آشامیدنی.
- حداقل سن مجاز: ۱۰ روز.
- Breakthrough titre: حداکثر ۵۰۰ واحد استاندارد IDEXX ELISA.
- شروع ایمنی درج‌شده: ۲ هفته پس از واکسیناسیون.
- مدت ایمنی درج‌شده: ۵ هفته پس از واکسیناسیون.
- کیت مرجع BTT به‌طور مشخص IDEXX IBD Ab Test است.
- ثبت بازار/مجوز این رکورد بریتانیاست (Vm 61812/3002)، نه اثبات ثبت یا مجاز بودن محصول در ایران.

BTT=500 IDEXX را نباید مستقیماً به BioChek CK113 یا کیت دیگر اعمال کرد. موتور باید همان assay مرجع را انتخاب کند یا تبدیل بین‌کیتی مستقل و معتبر داشته باشد.

منبع: https://www.vmd.defra.gov.uk/productinformationdatabase/files/QRD_Documents/QRD-Auth_2715448.PDF

## روش Deventer و زمان واکسن IBD

محاسبه Deventer تنها وقتی قابل ارائه است که این موارد هم‌زمان موجود باشند:
1. نمونه‌های MDA واقعی، تصادفی و نماینده گله؛
2. تاریخ/سن دقیق نمونه‌گیری و سن هچ؛
3. تیترهای انفرادی با شناسه نمونه و assay مشخص؛
4. BTT همان محصول و همان assay scale یا تبدیل معتبر؛
5. نیمه‌عمر مستند برای جمعیت و assay موردنظر؛
6. حداقل سن و شرایط مصرف از برچسب محصول؛
7. سابقه گله مادر و برنامه واکسن، وضعیت سلامت و ریسک فارم.

BioChek RevB 2025 مقدارهای راهنمای سازنده را به‌عنوان داده‌های زمینه‌ای ارائه می‌کند، اما نیمه‌عمر گله باید تا حد امکان با داده همان جمعیت و assay تعیین شود. عدد 3.8 روز یا 3 روز را نمی‌توان بدون provenance به هر گله گوشتی تعمیم داد.

منابع پژوهشی:
- Field study of IBDV optimal timing using Deventer: https://pubmed.ncbi.nlm.nih.gov/17899465/
- Review/field study on variable MDA half-life: https://pmc.ncbi.nlm.nih.gov/articles/PMC6238680/

## گزارش آمادگی گله و نمودارها

کامپوننت `FlockReadinessReport` به صفحه گزارش هر گله اضافه شد. این بخش:
- داده واقعی را از demo/synthetic جدا می‌کند.
- تعداد نوبت‌های غیرآزمایشی، QC ثبت‌شده، رویدادهای واکسن، مشاهدات بالینی و سری زمانی را جدا نشان می‌دهد.
- داده‌های ناقص را به‌صورت checklist نمایش می‌دهد.
- بدون داده واقعی، روز واکسن یا نمودار تیتر ساختگی تولید نمی‌کند.
- نقشه نمودارهای آینده را برای هر بیماری نشان می‌دهد:
  - IBD: هیستوگرام MDA، P50/P75/P90، GMT/CV، سناریوهای Deventer، پنجره زمانی و پاسخ پس از واکسن.
  - ND: توزیع HI در log2، GMT/CV، پاسخ جفت‌شده چهاربرابری فقط برای همان پرنده/آنتی‌ژن، و روند ELISA جداگانه.
  - IBV: توزیع و روند assay-specific، CV و overlay با رویداد واکسن و علائم تنفسی.
  - AIV: HI زیرتیپی جداگانه، ELISA نوع A مستقل، PCR/پایش ویروس و timeline واکسن.

## همگام‌سازی ابری و schema

در بررسی مستقیم Supabase مشخص شد جداول و RPC موردنیاز SyncService قبلاً در پروژه وجود نداشتند:
- `flock_vaccination_events`
- `flock_clinical_observations`
- `flock_time_series`
- `flock_audit_events`
- `apply_flock_change(text,uuid,text,uuid,text,jsonb)`

این schema و RPC اضافه شد؛ ستون‌های `revision` و `deleted_at` به `flocks` و `model_runs` افزوده شدند. RLS مالک‌محور، indexهای FK، audit و tombstone برای سه موجودیت مرجع ایجاد شد.

Smoke test در تراکنش rollback شده، با نقش authenticated و شناسه حساب مالک، مسیرهای create flock، create model_run، create vaccination event، delete و restore را اجرا کرد. تراکنش rollback شد و داده آزمایشی پایدار باقی نگذاشت. این آزمون هنوز جایگزین تست end-to-end از مرورگر واقعی، دو حساب مستقل، دو دستگاه و شبکه آفلاین/آنلاین نیست.

## وضعیت امنیت و انتشار

- Security Advisor: هشدار قبلی leaked-password protection غیرفعال همچنان باقی است؛ تنظیم Auth تغییر داده نشد.
- Health Advisor: finding نداشت.
- Performance Advisor پس از افزودن indexهای FK باید دوباره بررسی شود؛ هشدارهای unused-index اطلاعاتی‌اند و حذف کورکورانه انجام نمی‌شود.
- PR #4 همچنان Draft است؛ هیچ merge یا deployment انجام نشده است.
- تا سبز شدن CI برای آخرین commit و تست دستی در iOS، این شاخه را نسخه عملیاتی بالینی تلقی نکنید.
