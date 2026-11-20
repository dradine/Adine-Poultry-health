# بسته تحویل ادامه توسعه — تصمیم‌یار واکسیناسیون طیور آدینه
تاریخ بررسی: ۲۰ نوامبر ۲۰۲۶

این سند برای انتقال بدون ابهام کار به نشست/اکانت توسعه بعدی تهیه شده است. هدف آن ثبت وضعیت واقعی GitHub و Supabase، کارهای انجام‌شده، محدودیت‌های تأییدشده و ترتیب پیشنهادی ادامه توسعه است. این سند به معنی تأیید بالینی یا مجوز انتشار نیست.

## 1. مخزن و شاخه‌ها

- مخزن مرجع: `dradine/Adine-Poultry-health`
- شاخه توسعه اصلی: `feature/ibd-first-mvp`
- آخرین head مشاهده‌شده شاخه توسعه: `f0cabfd87a4f3584df6881d3ce73680391d23a26`
- PR #1: https://github.com/dradine/Adine-Poultry-health/pull/1
  - base: `main`
  - head: `feature/ibd-first-mvp`
  - وضعیت: Open / Draft / Unmerged
  - آخرین بررسی: `mergeable=false`؛ پیش از هرگونه ادغام، وضعیت conflict و تغییرات base/head مجدداً بررسی شود.
  - اندازه گزارش‌شده: ۱۳۴ فایل، ۱۲٬۷۰۲ additions، ۱ deletion، ۸۸۳ commits. عدد commit غیرمعمول است؛ تاریخچه و merge-base باید پیش از merge/rebase بررسی شود.
- PR #2: https://github.com/dradine/Adine-Poultry-health/pull/2
  - base: `feature/ibd-first-mvp`
  - head: `feature/mda-provenance-validation-2026-11-20`
  - head SHA در زمان بررسی: `544ef5619d0d7d8616bbc0cc42c005ef6ac772a8`
  - وضعیت: Open / Draft / Unmerged / mergeable=true
  - ۹ فایل تغییر یافته؛ ۱۹۰ additions و ۳۰ deletions.
  - این PR را تا بررسی و تصمیم صریح مالک مخزن merge نکنید؛ `main` نباید مستقیماً تغییر کند.
- شاخه کمکی موجود: `research/mda-provenance-and-validation-2026-11-20`

## 2. CI و راستی‌آزمایی کد

GitHub Actions run شماره `44770256918` برای commit `544ef5619d0d7d8616bbc0cc42c005ef6ac772a8` بررسی شد:
https://github.com/dradine/Adine-Poultry-health/actions/runs/44770256918

Job `build` تکمیل‌شده و success بود. مراحل شامل production dependency audit، گزارش هشدارهای development dependency، تست‌ها، TypeScript/Vite build، GitHub Pages base-path build، Supabase smoke، Service Worker syntax و manifest JSON validation همگی موفق بودند. طبق نتیجه ثبت‌شده در PR #2، تست‌ها ۲۱۷/۲۱۷ در ۲۴ فایل بودند.

نکته: این CI فقط درستی تست‌های کد/ساخت را در دامنه fixtureها بررسی می‌کند؛ هیچ اعتبارسنجی مستقل زیستی، تشخیصی، آزمایشگاهی یا میدانی را اثبات نمی‌کند. وضعیت واقعی Pages روی دستگاه کاربر نیز از این run نتیجه نمی‌شود.

## 3. تغییرات قطعی انجام‌شده در PR #2

1. fallback عمومی حداقل ۲۳ نمونه از موتور IBD حذف شد. مقدار حداقل نمونه باید از IFU/برچسب همان محصول/کیت بیاید؛ در نبود منبع، موتور حدس نمی‌زند.
2. ذخیره/همگام‌سازی MDA به provenance کامل وابسته شد: assay/kit و antigen، measurement scale/unit، منبع مستقل half-life، منبع مستقل threshold، نسخه/صفحه/شناسه سند و نوع منبع.
3. مدل MDA به `mda-decay-exploratory-0.2.0` نسخه‌بندی شد؛ زمان اجرا، منابع، snapshot ورودی، منحنی پیش‌بینی نمونه‌ها و وضعیت عدم تأیید مستقل ثبت می‌شوند.
4. سقف عمومی و بدون پشتوانه ۱۰۰ روز برای half-life حذف شد؛ overflow/مقادیر غیرمتناهی کنترل می‌شوند.
5. تعداد نمونه‌هایی که عبور از threshold آن‌ها قابل برآورد است صریح گزارش می‌شود.
6. provenance هم در UI و هم در persistence service بررسی می‌شود؛ محاسبه preview ممکن است، اما ذخیره/همگام‌سازی بدون provenance کامل مجاز نیست.

جزئیات: `docs/IMPLEMENTATION_DELTA_2026-11-20_FA.md`

## 4. اتصال‌ها و پروژه‌های Supabase — بررسی ۲۰ نوامبر ۲۰۲۶

دو لینک Supabase متصل‌شده هر دو همان فهرست پروژه‌ها را نشان دادند. پروژه‌ها نباید با هم اشتباه گرفته شوند:

### پروژه هدف تصمیم‌یار واکسیناسیون
- نام: `Adine-Vaccine-Timing`
- Project ref: `aekuuqvgsqnjxkobxbur`
- Region: `eu-central-1`
- PostgreSQL: `17.12.0.000`
- وضعیت: `ACTIVE_HEALTHY`
- تاریخچه migrations: ۱۵ migration از `20261116162814` تا `20261116204534`
- جدول‌های public: `diseases`, `assay_kits`, `vaccine_products`, `flocks`, `model_runs`, `serology_batches`, `serology_results`
- هر ۷ جدول RLS روشن دارند و policyهای موجود بررسی شدند.
- policyهای مالکیت چهارگانه SELECT/INSERT/UPDATE/DELETE روی `flocks`, `model_runs`, `serology_batches`, `serology_results` وجود دارند؛ کاتالوگ‌های مرجع policyهای read دارند.
- توابع public با SECURITY DEFINER در این پروژه در query بررسی‌شده صفر بودند.
- شمارش رکوردها هنگام بررسی: `flocks=2`, `model_runs=15`, `serology_batches=0`, `serology_results=0`.
- Security Advisor: فقط هشدار `auth_leaked_password_protection` (Leaked Password Protection Disabled).
- Performance Advisor: ۸ unused indexes (INFO)؛ بدون حذف خودکار.
- Health Advisor: finding گزارش نکرد.
- هیچ داده‌ای insert/update/delete/migrate نشد؛ هیچ تنظیم Auth یا schema تغییر نکرد.

### بررسی اتصال در کد و GitHub Actions
- در `src/core/supabase.ts`، مقدار fallback آدرس Supabase به ref پروژه هدف `aekuuqvgsqnjxkobxbur` است و از publishable key عمومی استفاده می‌شود؛ هیچ service_role/secret key در این فایل دیده نشد.
- `.env.example` و `scripts/supabase-smoke.mjs` نیز به همان پروژه هدف اشاره می‌کنند. با این حال، مقادیر environment override شده در تنظیمات خصوصی GitHub Actions/Pages از طریق اتصال GitHub قابل خواندن نبودند؛ مالک/ادامه‌دهنده باید URL واقعی build/deploy را بدون چاپ هیچ secret بررسی کند.
- `.github/workflows/build.yml`: push روی `main` و `feature/**`، و pull_request فقط برای PRهایی که base آن‌ها `main` است. بنابراین PR #2 با base شاخه feature از مسیر push شاخه build می‌شود، نه از pull_request trigger.
- `.github/workflows/deploy-pages.yml`: push فقط روی `feature/ibd-first-mvp` و pull_request فقط برای base برابر `main`. پس PR #2 به‌تنهایی preview Pages را deploy نمی‌کند؛ PR #1 یا push روی شاخه اصلی توسعه می‌تواند آن workflow را فعال کند.
- اتصال GitHub دارای مجوز push/admin روی مخزن است؛ با این حال، PRها عمداً Draft نگه داشته شده‌اند و هیچ merge یا deploy دستی در این نشست انجام نشده است.

### پروژه قدیمی/مجزا
- Project ref: `vzcczkavlopznljnnehp`
- نام: `dradine's Project`
- Region: `ap-southeast-1`
- PostgreSQL: `17.6.1.155`
- این پروژه پایگاه قدیمی سامانه دیگری است و هدف فعلی تصمیم‌یار واکسیناسیون نیست. در آن هیچ تغییری انجام نشود مگر با درخواست/تأیید جداگانه مالک و طرح مهاجرت مستقل.
- Security Advisor در بررسی فعلی:
  - ۸۱ تابع `SECURITY DEFINER` قابل اجرا توسط role `authenticated` (WARN).
  - ۵ تابع با mutable `search_path` (WARN).
  - ۲ جدول دارای RLS روشن ولی بدون policy (INFO).
  - Leaked Password Protection غیرفعال (WARN).
- Performance Advisor:
  - ۵۸ foreign key بدون index پوششی (INFO).
  - ۱۲۰ policy با auth initplan inefficiency (WARN).
  - ۵۶ unused indexes (INFO).
  - ۷۵ مورد multiple permissive policies (WARN).
  - ۱۳ duplicate indexes (WARN).
- این findings اثبات آسیب‌پذیری/سوءاستفاده نیستند. توابع SECURITY DEFINER باید تابع‌به‌تابع از نظر identity checks، مالکیت، ورودی قابل‌دستکاری، search_path و سطح دسترسی بررسی شوند. به‌هیچ‌وجه همه توابع را کورکورانه revoke یا به INVOKER تبدیل نکنید؛ بعضی RPCها ممکن است عمداً عملیات privileged انجام دهند.
- دو جدول بدون policy را نیز از نظر grants و نیاز واقعی به دسترسی بررسی کنید؛ RLS روشن و بدون policy معمولاً باعث deny-by-default برای نقش‌های API می‌شود، اما باید مجوزهای مؤثر بررسی شوند.

### اقدامات Auth باز
- هشدار leaked-password protection در هر دو پروژه وجود دارد.
- ابزارهای اتصال موجود در این نشست امکان تغییر Auth password-security setting را ارائه نکردند؛ این مورد از Supabase Dashboard > Authentication > Settings / Password Security باید توسط مالک پروژه بررسی و فعال شود.
- تنظیمات Auth پروژه جدید را با پروژه قدیمی یکی فرض نکنید.

## 5. تغییرات علمی/محاسباتی که نباید عقب‌گرد کنند

- IBD Deventer فقط برای واکسن زنده متعارف و محصول/کیت/BTT دقیق و مستند فعال است؛ immune-complex و HVT-VP2 خارج از دامنه‌اند.
- MDA decay مستقل از Deventer است؛ half-life و threshold باید با جمعیت، آنتی‌ژن، assay، scale و منبع مشخص شوند.
- ND-HI، IBV و AIV در وضعیت فعلی پایش/تفسیر توصیفی یا evidence triage هستند؛ خروجی آن‌ها را به مدل حفاظت، تشخیص عفونت یا زمان‌بندی قطعی تبدیل نکنید.
- تیتر منفرد، میانگین گروهی یا مثبت ELISA به‌تنهایی معادل حفاظت، شکست واکسن یا عفونت فعال نیست.
- هیچ baseline سازنده یا حد QC را بین کیت‌ها/نسخه‌ها/ماتریس‌ها تعمیم ندهید.
- رکوردهای demo/synthetic نباید وارد validation یا توصیه بالینی شوند.

## 6. ترتیب پیشنهادی کار برای نشست بعدی Pro

### اولویت صفر — اتصال و مرزبندی محیط
1. شاخه و commit فعلی را از GitHub دوباره بخوانید؛ صرفاً به این handoff اکتفا نکنید.
2. بررسی کنید `VITE_SUPABASE_URL` و سایر envهای build به ref جدید `aekuuqvgsqnjxkobxbur` اشاره می‌کنند؛ مقادیر secret را چاپ یا commit نکنید.
3. بررسی کنید GitHub Actions secrets و GitHub Pages preview به همان پروژه جدید متصل‌اند.
4. PR #1 به‌علت `mergeable=false` و تعداد commit غیرمعمول نیازمند بررسی merge-base/conflict است. PR #2 فعلاً Draft بماند تا بازبینی مستقل انجام شود.
5. پروژه قدیمی `vzcczkavlopznljnnehp` را از عملیات توسعه این اپ جدا نگه دارید.

### اولویت یک — مدل داده مرجع در سطح گله
در حال حاضر سابقه واکسیناسیون و وضعیت بالینی عمدتاً در snapshot هر نوبت سرولوژی حمل می‌شود. این الگو منبع حقیقت واحد ایجاد نمی‌کند. طراحی و سپس پیاده‌سازی مرحله‌ای موجودیت‌های مستقل و نسخه‌دار لازم است:
- رویدادهای واکسیناسیون گله (تاریخ/سن، بیماری، محصول، پلتفرم، سویه، route، دوز، بچ/lot، پوشش/روش اجرا، اپراتور، منبع و سطح اطمینان).
- مشاهدات بالینی گله (علائم، تاریخ شروع/پایان، morbidity/mortality، کالبدگشایی، PCR/نتیجه مستقیم، ریسک مواجهه، درمان و نتیجه).
- داده‌های سری‌زمانی روزانه/هفتگی (آب، دان، تلفات، وزن، تولید تخم‌مرغ، دما/رطوبت و metadata).
- رابطه روشن با `flocks`، مالکیت `owner_id`، provenance، audit history، حذف/بازیابی و sync state.
- ابتدا schema/ERD و migration plan؛ سپس migration سازگار و backfill فقط با preview و تأیید مالک. snapshotهای قبلی نباید بی‌صدا overwrite شوند.

### اولویت دو — ورودی واقعی آزمایشگاه و QC
- parserهای adapter-based برای CSV/TSV و پس از دریافت فایل‌های واقعی ناشناس‌شده برای BioChek II و IDEXX xChekPlus؛ XLSX/XML اختصاصی را فقط با نمونه و schema واقعی اضافه کنید.
- فایل خام اصلی را immutable نگه دارید، SHA-256، نام/نوع/اندازه، زمان import، mapping و parser version را ثبت کنید.
- OD خام، ردیف کنترل، نمونه، تکرار، dilution، LOD/ULOQ، below-LOD/above-ULOQ و invalid را جدا حفظ کنید؛ هیچ censored value را به صفر یا حد عددی تبدیل نکنید.
- QC باید با IFU دقیق kit/version/lot و SOP آزمایشگاه قابل پیکربندی و قابل ممیزی باشد؛ QC عمومی به‌عنوان QC اختصاصی سازنده معرفی نشود.
- تکمیل workflow واقعی `serology_batches` و `serology_results` و storage خصوصی فایل‌ها با RLS مناسب.

### اولویت سه — موتورهای علمی
- IBD: تست مرجع مستقل، sensitivity analysis، عدم‌قطعیت ورودی/پارامتر، تحلیل نمونه‌گیری و بازبینی متخصص/آمارزیست.
- MDA: اعتبارسنجی prospective با داده طولی همان پرندگان، مدل عدم‌قطعیت و ارزیابی خطای prediction؛ مدل فعلی exploratory باقی بماند.
- ND/IBV/AIV: هر بیماری موتور جداگانه با ورودی‌ها، محدودیت‌ها و منابع خاص خود؛ تا زمان validation، توصیفی/evidence-gated باقی بمانند.
- عدم تولید probability/cutoff/claim محافظتی بدون داده و پروتکل معتبر.

### اولویت چهار — گزارش، امنیت و عملیات
- PDF/CSV قابل ممیزی با داده خام، mapping، QC، حذف/سانسور و علت، provenance، مدل/نسخه و audit trail.
- بررسی policyها با تست دو حساب واقعی و اثبات عدم دسترسی متقاطع؛ تست RLS برای SELECT/INSERT/UPDATE/DELETE.
- تست واقعی iOS Safari و Android Chrome: نصب PWA، شروع آفلاین، ورود/ثبت محلی، refresh، خروج/ورود، backup/restore، دو دستگاه، conflict/retry و محدودیت storage.
- رفع هشدار Auth leaked-password protection در Dashboard توسط مالک.
- dependency audit کامل development، رفع هشدارهای غیرproduction، code splitting و اندازه bundle.
- تست عملکرد با latency و log واقعی؛ از تغییر معماری/کش بدون benchmark پرهیز شود.

## 7. قوانین ایمنی و کیفیت برای ادامه‌دهنده

1. هیچ‌وقت به `main` push نکنید و PRهای Draft را بدون اجازه merge نکنید.
2. قبل از هر migration، backup/rollback plan و migration متناظر در repository آماده شود.
3. قبل از هر write روی Supabase، project ref را در خروجی tool دوباره verify کنید.
4. هیچ داده واقعی فارم/آزمایشگاه را پاک، seed، overwrite یا anonymize-in-place نکنید.
5. fixtureهای synthetic را با برچسب demo نگه دارید و از validation واقعی جدا کنید.
6. هیچ IFU، threshold، sample count، half-life، BTT یا cutoff را حدس نزنید.
7. هر تغییر با تست unit/integration، build، Supabase smoke و review امنیتی متناسب همراه باشد.
8. گزارش پایان کار باید دقیقاً تفکیک کند: کد تغییرکرده، تست خودکار، تست واقعی انجام‌شده، و کارهایی که هنوز نیازمند فایل/دستگاه/تأیید کاربرند.

## 8. اسناد مرجع موجود در repo

- `docs/FULL_APP_AUDIT_FA_2026-11-18.md`
- `docs/SEROLOGY_ENGINE_AUDIT_FA_2026-11-18.md`
- `docs/CLINICAL_SEROLOGY_INTERPRETATION_EVIDENCE_FA_2026-11-18.md`
- `docs/FLOCK_CONTEXT_AND_SOFTWARE_REVIEW_FA_2026-11-18.md`
- `docs/IMPLEMENTATION_DELTA_2026-11-20_FA.md`
- `docs/TEST_GUIDE_FA.md`

## وضعیت نهایی در زمان تحویل

اتصال GitHub و Supabase قابل استفاده و پروژه هدف فعال است. PR #2 تغییرات حفاظتی مشخصی دارد و CI آن موفق است. PR #1 و PR #2 هر دو Draft و merge نشده‌اند؛ `main` تغییر نکرده است. پایگاه داده هدف هیچ تغییری در این بررسی دریافت نکرد. نسخه همچنان Research/Beta است و برای توصیه بالینی یا انتشار عمومی نهایی آماده اعلام نمی‌شود.
