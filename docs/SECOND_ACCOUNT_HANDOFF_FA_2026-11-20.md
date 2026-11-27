# بسته تحویل به اکانت دوم — ۲۰ نوامبر ۲۰۲۶

## وضعیت تحویل

این شاخه از `feature/mda-provenance-validation-2026-11-20` ساخته شده و آخرین commit آن `29b967e` است. تغییرات هنوز push یا merge نشده‌اند. پروژه قدیمی Supabase با شناسه `vzcczkavlopznljnnehp` دست‌نخورده باقی مانده است.

## آنچه آماده است

- پرونده مرجع مستقل گله برای رویداد واکسیناسیون، مشاهده بالینی و سری‌زمانی آب، دان، وزن و تولید.
- provenance، audit event، outbox آفلاین، tombstone و کنترل تعارض پایه.
- نگهداری مقدار خام، فایل خام، SHA-256، حجم فایل و مقادیر censored مانند `below_lod` و `above_uloq`.
- adapterهای اولیه و preview برای BioChek II، IDEXX xChekPlus، IDsoft/ID Screen، HI دستی و قالب عمومی CSV/TSV.
- کنترل optimistic concurrency با revision و base revision برای گله و سه موجودیت مرجع، همراه با ثبت conflict در صف.
- tombstone محلی و ابری با مسیر restore و جلوگیری از حذف فیزیکی توسط کاربر عادی.
- RPC تراکنشی برای اعمال تغییر، بررسی مالکیت گله، قفل تراکنش والد و ثبت audit رویداد.
- نگهداری immutable فایل خام در IndexedDB و طرح آرشیو خصوصی Supabase برای مرحله اتصال حساب.
- fixtureهای synthetic برای تست مسیر import.
- ماتریس کیت و نرم‌افزار، بررسی شواهد علمی و فهرست verification بازار ایران.
- migration افزایشی Supabase برای جداول مرجع گله که هنوز روی پروژه هدف اعمال نشده است.

## کار اکانت دوم

1. اتصال رسمی GitHub و Supabase را برقرار کند و فقط repository و پروژه هدف `aekuuqvgsqnjxkobxbur` را انتخاب کند.
2. PR شماره ۱ و ۲ را قبل از هر merge دوباره بررسی کند. Mergeability ممکن است تغییر کرده باشد.
3. شاخه را روی commit `29b967e` بررسی کند، تست‌ها و build را اجرا کند و سپس در یک PR مستقل منتشر کند.
4. migrationهای `20261120193000_add_flock_reference_records.sql` و `20261120210000_add_tombstones_conflict_audit.sql` را فقط پس از backup، بازبینی SQL و اجرای staging اعمال کند. این migrationها برای حذف فیزیکی داده‌های قبلی طراحی نشده‌اند، اما trigger والد می‌تواند فرزندان فعال را archive کند.
5. برای هر vendor حداقل یک فایل واقعی ناشناس به‌همراه نسخه نرم‌افزار، assay، catalog number، lot، IFU، reader، matrix، unit و حدود QC تحویل بگیرد.
6. تا دریافت فایل واقعی، parser مستقیم BXP، SDF، XML رمزگذاری‌شده و Excel اختصاصی را فعال نکند. adapter فعلی برای preview و قرارداد mapping است.
7. fixtureهای synthetic را اجرا کند و سپس تست import واقعی را در محیط امن با SHA-256 و گزارش mapping انجام دهد.
8. سناریوی دو حساب، دو دستگاه، ویرایش هم‌زمان، حذف گله دارای فرزند، restore و قطع شبکه را در staging اجرا کند.
9. نتیجه را برای تأیید کارشناس بیماری‌های طیور و آمار زیستی ارسال کند. موفقیت CI به‌تنهایی اعتبارسنجی بالینی محسوب نمی‌شود.

## خروجی‌های اصلی

- `src/core/readerAdapters.ts`
- `src/core/readerImport.ts`
- `src/components/SerologyReaderImport.tsx`
- `fixtures/reader-adapters/`
- `docs/ASSAY_AND_READER_INTEROPERABILITY_MATRIX_FA_2026-11-20.md`
- `docs/SCIENTIFIC_RESEARCH_REVIEW_FA_2026-11-20.md`
- `supabase/migrations/20261120193000_add_flock_reference_records.sql`

## محدودیت علمی و فنی

مقیاس‌ها، cutoffها، تفسیر حفاظت و QC باید از IFU و validation همان assay و lot بیایند. نتایج BioChek، IDEXX، IDvet یا Proflok بدون comparability جداگانه در یک baseline مشترک ادغام نمی‌شوند. نام‌های بازار ایران نشانه استفاده یا عرضه در منابع بررسی‌شده‌اند و تأیید موجودی، نمایندگی، اصالت و قیمت روز نیستند.

این نسخه «سازگاری واقعی با Reader» را ادعا نمی‌کند. profileهای متنی برای preview و mapping اجرا می‌شوند. BXP، SDF، XML رمزگذاری‌شده و Excel اختصاصی تا دریافت فایل واقعی ناشناس و schema همان نسخه parser اختصاصی ندارند. وضعیت QC محاسبه‌شده نیز تأیید آزمایشگاه یا بازبین را جایگزین نمی‌کند.
